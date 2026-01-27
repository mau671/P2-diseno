-- 1) Agregar categoría/tipo de cocina a meal_bases
alter table public.meal_bases
  add column if not exists cuisine_type text not null default 'general';

create index if not exists idx_meal_bases_cuisine_type
  on public.meal_bases (cuisine_type);

-- 2) Tabla puente: ingrediente -> restricción
create table if not exists public.ingredient_restrictions (
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  restriction_id uuid not null references public.dietary_restrictions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (ingredient_id, restriction_id)
);

create index if not exists idx_ingredient_restrictions_restriction
  on public.ingredient_restrictions (restriction_id);

-- 3) RPC: catálogo con filtro por usuario + búsqueda + paginación
create or replace function public.get_catalog_bases(
  p_user_id uuid default null,
  p_q text default null,
  p_cuisine text default null,
  p_limit int default 10,
  p_page int default 1
)
returns table (
  id uuid,
  name text,
  description text,
  image_url text,
  base_price numeric,
  cuisine_type text,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz,
  total_count bigint
)
language sql
stable
as $$
  with params as (
    select
      greatest(1, least(p_limit, 50)) as lim,
      greatest(1, p_page) as pg,
      nullif(trim(p_q), '') as q,
      nullif(trim(p_cuisine), '') as cuisine
  ),
  user_restr as (
    select udr.restriction_id
    from public.user_dietary_restrictions udr
    where udr.user_id = p_user_id
  ),
  blocked_bases as (
    select distinct bi.base_id
    from public.base_ingredients bi
    join public.ingredient_restrictions ir
      on ir.ingredient_id = bi.ingredient_id
    join user_restr ur
      on ur.restriction_id = ir.restriction_id
  ),
  filtered as (
    select mb.*
    from public.meal_bases mb
    cross join params p
    where mb.is_active = true
      and (p_user_id is null or mb.id not in (select base_id from blocked_bases))
      and (
        p.q is null
        or mb.name ilike ('%' || p.q || '%')
        or mb.cuisine_type ilike ('%' || p.q || '%')
      )
      and (p.cuisine is null or mb.cuisine_type = p.cuisine)
  )
  select
    f.id, f.name, f.description, f.image_url, f.base_price, f.cuisine_type,
    f.is_active, f.created_at, f.updated_at,
    count(*) over() as total_count
  from filtered f
  cross join params p
  order by f.name asc
  limit (select lim from params)
  offset ((select pg from params) - 1) * (select lim from params);
$$;
