-- =========================================================
-- DASHBOARD: status history + trigger + RPC dashboard
-- =========================================================

-- 0) Tabla de historial (si ya existe, no la rompe)
create table if not exists public.order_status_history (
  id bigserial primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null,
  changed_by uuid null,
  changed_at timestamptz not null default now()
);

-- Asegurar columnas por si la tabla existía con otra forma
alter table public.order_status_history
  add column if not exists changed_by uuid;

alter table public.order_status_history
  add column if not exists changed_at timestamptz default now();

-- Indexes útiles
create index if not exists idx_order_status_history_order_id
  on public.order_status_history(order_id);

create index if not exists idx_order_status_history_changed_at
  on public.order_status_history(changed_at desc);

create index if not exists idx_order_status_history_order_id_changed_at
  on public.order_status_history(order_id, changed_at desc);

-- 1) Trigger function: registrar cambios de estado en order_status_history
create or replace function public.log_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- INSERT: registrar el estado inicial
  if (tg_op = 'INSERT') then
    insert into public.order_status_history (order_id, status, changed_by)
    values (new.id, new.status::text, auth.uid());
    return new;
  end if;

  -- UPDATE: registrar SOLO si cambia status
  if (tg_op = 'UPDATE') then
    if new.status is distinct from old.status then
      insert into public.order_status_history (order_id, status, changed_by)
      values (new.id, new.status::text, auth.uid());
    end if;
    return new;
  end if;

  return new;
end;
$$;

-- Triggers (recrearlos)
drop trigger if exists trg_orders_status_history_insert on public.orders;
create trigger trg_orders_status_history_insert
after insert on public.orders
for each row
execute function public.log_order_status_change();

drop trigger if exists trg_orders_status_history_update on public.orders;
create trigger trg_orders_status_history_update
after update of status on public.orders
for each row
execute function public.log_order_status_change();


-- 2) RPC: Dashboard por restaurante (hoy vs ayer)
create or replace function public.get_restaurant_dashboard(
  target_restaurant_id uuid,
  target_tz text default 'America/Costa_Rica'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  today_start timestamptz;
  tomorrow_start timestamptz;
  yesterday_start timestamptz;

  currency_code text;
  currency_symbol text;
  currency_precision int;

  orders_today int;
  orders_yesterday int;

  revenue_today numeric;
  revenue_yesterday numeric;

  customers_today int;
  customers_yesterday int;

  avg_prep_today numeric;
  avg_prep_yesterday numeric;

  orders_pct numeric;
  revenue_pct numeric;
  customers_pct numeric;
  prep_pct numeric;

  active_orders jsonb;
  popular_dishes jsonb;
begin
  -- Guard: solo admin/owner del restaurante
  if not public.is_restaurant_admin(target_restaurant_id) then
    raise exception 'Not authorized for this restaurant'
      using errcode = '42501';
  end if;

  -- Rango de "hoy" usando timezone (timestamptz, listo para comparar con created_at)
  today_start := (date_trunc('day', (now() at time zone target_tz)) at time zone target_tz);
  tomorrow_start := today_start + interval '1 day';
  yesterday_start := today_start - interval '1 day';

  -- Moneda default del restaurante (si existe)
  select rc.currency_code, c.symbol, c.precision
    into currency_code, currency_symbol, currency_precision
  from public.restaurant_currencies rc
  join public.currencies c on c.code = rc.currency_code
  where rc.restaurant_id = target_restaurant_id
    and rc.is_default = true
  limit 1;

  currency_code := coalesce(currency_code, 'USD');
  currency_symbol := coalesce(currency_symbol, '$');
  currency_precision := coalesce(currency_precision, 2);

  -- Órdenes hoy / ayer
  select count(*)::int
    into orders_today
  from public.orders o
  where o.restaurant_id = target_restaurant_id
    and o.created_at >= today_start
    and o.created_at < tomorrow_start;

  select count(*)::int
    into orders_yesterday
  from public.orders o
  where o.restaurant_id = target_restaurant_id
    and o.created_at >= yesterday_start
    and o.created_at < today_start;

  -- Ingresos hoy / ayer (payments 'paid' via orders)
  select coalesce(sum(p.amount), 0)
    into revenue_today
  from public.payments p
  join public.orders o on o.id = p.order_id
  where o.restaurant_id = target_restaurant_id
    and p.status = 'paid'
    and p.created_at >= today_start
    and p.created_at < tomorrow_start;

  select coalesce(sum(p.amount), 0)
    into revenue_yesterday
  from public.payments p
  join public.orders o on o.id = p.order_id
  where o.restaurant_id = target_restaurant_id
    and p.status = 'paid'
    and p.created_at >= yesterday_start
    and p.created_at < today_start;

  -- Clientes activos hoy / ayer (usuarios únicos con órdenes activas del día)
  select count(distinct o.user_id)::int
    into customers_today
  from public.orders o
  where o.restaurant_id = target_restaurant_id
    and o.status in ('pending', 'paid', 'preparing', 'delivering')
    and o.created_at >= today_start
    and o.created_at < tomorrow_start;

  select count(distinct o.user_id)::int
    into customers_yesterday
  from public.orders o
  where o.restaurant_id = target_restaurant_id
    and o.status in ('pending', 'paid', 'preparing', 'delivering')
    and o.created_at >= yesterday_start
    and o.created_at < today_start;

  -- Tiempo promedio de preparación (min): preparing -> delivering/completed (por órdenes creadas hoy/ayer)
  with times as (
    select
      o.id,
      min(case when h.status = 'preparing' then h.changed_at end) as preparing_at,
      min(case when h.status in ('delivering', 'completed') then h.changed_at end) as done_at
    from public.orders o
    join public.order_status_history h on h.order_id = o.id
    where o.restaurant_id = target_restaurant_id
      and o.created_at >= today_start
      and o.created_at < tomorrow_start
    group by o.id
  )
  select avg(extract(epoch from (done_at - preparing_at)) / 60.0)
    into avg_prep_today
  from times
  where preparing_at is not null
    and done_at is not null
    and done_at > preparing_at;

  with times as (
    select
      o.id,
      min(case when h.status = 'preparing' then h.changed_at end) as preparing_at,
      min(case when h.status in ('delivering', 'completed') then h.changed_at end) as done_at
    from public.orders o
    join public.order_status_history h on h.order_id = o.id
    where o.restaurant_id = target_restaurant_id
      and o.created_at >= yesterday_start
      and o.created_at < today_start
    group by o.id
  )
  select avg(extract(epoch from (done_at - preparing_at)) / 60.0)
    into avg_prep_yesterday
  from times
  where preparing_at is not null
    and done_at is not null
    and done_at > preparing_at;

  -- % vs ayer (null si ayer=0 / null)
  orders_pct := case when orders_yesterday = 0 then null
    else round(((orders_today - orders_yesterday)::numeric / orders_yesterday::numeric) * 100, 0) end;

  revenue_pct := case when revenue_yesterday = 0 then null
    else round(((revenue_today - revenue_yesterday) / revenue_yesterday) * 100, 0) end;

  customers_pct := case when customers_yesterday = 0 then null
    else round(((customers_today - customers_yesterday)::numeric / customers_yesterday::numeric) * 100, 0) end;

  prep_pct := case when avg_prep_yesterday is null or avg_prep_yesterday = 0 then null
    else round(((avg_prep_today - avg_prep_yesterday) / avg_prep_yesterday) * 100, 0) end;

  -- Órdenes activas (tabla, top 10)
  select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb)
    into active_orders
  from (
    select
      o.id,
      o.status,
      o.total,
      o.currency_code,
      o.created_at,
      coalesce(p.full_name, '') as customer_name,
      coalesce(sum(oi.quantity), 0)::int as items_count
    from public.orders o
    join public.profiles p on p.id = o.user_id
    left join public.order_items oi on oi.order_id = o.id
    where o.restaurant_id = target_restaurant_id
      and o.status in ('pending', 'paid', 'preparing', 'delivering')
    group by o.id, p.full_name
    order by o.updated_at desc
    limit 10
  ) as t;

  -- Platillos populares hoy (top 5)
  select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb)
    into popular_dishes
  from (
    select
      mb.id as base_id,
      mb.name as base_name,
      coalesce(sum(oi.quantity), 0)::int as orders_count,
      coalesce(sum(oi.subtotal), 0) as revenue
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    join public.meal_bases mb on mb.id = oi.base_id
    where o.restaurant_id = target_restaurant_id
      and o.created_at >= today_start
      and o.created_at < tomorrow_start
    group by mb.id, mb.name
    order by orders_count desc, revenue desc
    limit 5
  ) as t;

  return jsonb_build_object(
    'restaurant_id', target_restaurant_id,
    'timezone', target_tz,
    'currency', jsonb_build_object(
      'code', currency_code,
      'symbol', currency_symbol,
      'precision', currency_precision
    ),
    'today', jsonb_build_object(
      'orders', orders_today,
      'revenue', revenue_today,
      'active_customers', customers_today,
      'avg_prep_minutes', avg_prep_today
    ),
    'yesterday', jsonb_build_object(
      'orders', orders_yesterday,
      'revenue', revenue_yesterday,
      'active_customers', customers_yesterday,
      'avg_prep_minutes', avg_prep_yesterday
    ),
    'deltas', jsonb_build_object(
      'orders_pct', orders_pct,
      'revenue_pct', revenue_pct,
      'customers_pct', customers_pct,
      'prep_pct', prep_pct
    ),
    'active_orders', active_orders,
    'popular_dishes', popular_dishes
  );
end;
$$;

-- Permitir RPC a usuarios autenticados (PostgREST)
grant execute on function public.get_restaurant_dashboard(uuid, text) to authenticated;
