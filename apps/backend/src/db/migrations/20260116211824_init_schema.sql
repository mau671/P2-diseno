-- Enable extensions if needed
set search_path = public, extensions;

create extension if not exists "uuid-ossp";

-- 1) Profiles (link auth.users -> public.profiles)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- 2) Dietary restrictions
create table if not exists public.dietary_restrictions (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  type text not null, -- e.g. 'allergen' | 'diet'
  created_at timestamptz not null default now()
);

-- M:N users <-> restrictions
create table if not exists public.user_dietary_restrictions (
  user_id uuid not null references public.profiles(id) on delete cascade,
  restriction_id uuid not null references public.dietary_restrictions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, restriction_id)
);

-- 3) Ingredients
create table if not exists public.ingredients (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  category text not null, -- protein/vegetal/sauce/etc
  unit_price numeric(10,2) not null check (unit_price >= 0),
  stock integer not null default 0 check (stock >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_ingredients_updated_at on public.ingredients;
create trigger trg_ingredients_updated_at
before update on public.ingredients
for each row execute function public.set_updated_at();

-- 4) Meal bases
create table if not exists public.meal_bases (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  description text,
  image_url text,
  base_price numeric(10,2) not null check (base_price >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_meal_bases_updated_at on public.meal_bases;
create trigger trg_meal_bases_updated_at
before update on public.meal_bases
for each row execute function public.set_updated_at();

-- Base recipe composition (M:N)
create table if not exists public.base_ingredients (
  base_id uuid not null references public.meal_bases(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete restrict,
  default_qty integer not null default 1 check (default_qty > 0),
  is_removable boolean not null default true,
  is_essential boolean not null default false,
  primary key (base_id, ingredient_id)
);

-- 5) Orders
create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending', -- pending/paid/preparing/delivering/completed/cancelled
  delivery_address text not null,
  payment_method text,
  scheduled_for timestamptz,
  subtotal numeric(10,2) not null default 0 check (subtotal >= 0),
  tax numeric(10,2) not null default 0 check (tax >= 0),
  total numeric(10,2) not null default 0 check (total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

-- Order items
create table if not exists public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  base_id uuid not null references public.meal_bases(id) on delete restrict,
  quantity integer not null default 1 check (quantity > 0),
  unit_price numeric(10,2) not null check (unit_price >= 0),
  subtotal numeric(10,2) not null check (subtotal >= 0)
);

-- Item customizations
create table if not exists public.item_customizations (
  id uuid primary key default uuid_generate_v4(),
  order_item_id uuid not null references public.order_items(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete restrict,
  action text not null, -- 'add' | 'remove'
  qty integer not null default 1 check (qty > 0),
  delta_price numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

-- Helper: is_admin
create or replace function public.is_admin()
returns boolean language sql stable as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- =====================
-- RLS
-- =====================
alter table public.profiles enable row level security;
alter table public.dietary_restrictions enable row level security;
alter table public.user_dietary_restrictions enable row level security;
alter table public.ingredients enable row level security;
alter table public.meal_bases enable row level security;
alter table public.base_ingredients enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.item_customizations enable row level security;

-- Profiles: user can read/update own profile
create policy "profiles_select_own"
on public.profiles for select
using (id = auth.uid());

create policy "profiles_update_own"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

-- Dietary restrictions: readable by all authenticated (or public if you want)
create policy "restrictions_select_all"
on public.dietary_restrictions for select
using (true);

-- User restrictions: user manages own
create policy "user_restrictions_select_own"
on public.user_dietary_restrictions for select
using (user_id = auth.uid());

create policy "user_restrictions_insert_own"
on public.user_dietary_restrictions for insert
with check (user_id = auth.uid());

create policy "user_restrictions_delete_own"
on public.user_dietary_restrictions for delete
using (user_id = auth.uid());

-- Catalog (ingredients/meal_bases/base_ingredients): everyone can read active; only admin can write
create policy "ingredients_select_active"
on public.ingredients for select
using (is_active = true or public.is_admin());

create policy "ingredients_admin_write"
on public.ingredients for insert
with check (public.is_admin());

create policy "ingredients_admin_update"
on public.ingredients for update
using (public.is_admin())
with check (public.is_admin());

create policy "ingredients_admin_delete"
on public.ingredients for delete
using (public.is_admin());

create policy "meal_bases_select_active"
on public.meal_bases for select
using (is_active = true or public.is_admin());

create policy "meal_bases_admin_write"
on public.meal_bases for insert
with check (public.is_admin());

create policy "meal_bases_admin_update"
on public.meal_bases for update
using (public.is_admin())
with check (public.is_admin());

create policy "meal_bases_admin_delete"
on public.meal_bases for delete
using (public.is_admin());

create policy "base_ingredients_select"
on public.base_ingredients for select
using (true);

create policy "base_ingredients_admin_write"
on public.base_ingredients for insert
with check (public.is_admin());

create policy "base_ingredients_admin_update"
on public.base_ingredients for update
using (public.is_admin())
with check (public.is_admin());

create policy "base_ingredients_admin_delete"
on public.base_ingredients for delete
using (public.is_admin());

-- Orders: user sees/creates own; admin sees all
create policy "orders_select_own_or_admin"
on public.orders for select
using (user_id = auth.uid() or public.is_admin());

create policy "orders_insert_own"
on public.orders for insert
with check (user_id = auth.uid());

create policy "orders_update_own_or_admin"
on public.orders for update
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

-- Order items: access through parent order
create policy "order_items_select_via_order"
on public.order_items for select
using (
  exists (
    select 1 from public.orders o
    where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())
  )
);

create policy "order_items_insert_via_order"
on public.order_items for insert
with check (
  exists (
    select 1 from public.orders o
    where o.id = order_id and o.user_id = auth.uid()
  )
);

create policy "order_items_update_via_order"
on public.order_items for update
using (
  exists (
    select 1 from public.orders o
    where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())
  )
)
with check (
  exists (
    select 1 from public.orders o
    where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())
  )
);

create policy "order_items_delete_via_order"
on public.order_items for delete
using (
  exists (
    select 1 from public.orders o
    where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())
  )
);

-- Customizations: access through order_item -> order
create policy "customizations_select_via_order"
on public.item_customizations for select
using (
  exists (
    select 1
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where oi.id = order_item_id
      and (o.user_id = auth.uid() or public.is_admin())
  )
);

create policy "customizations_insert_via_order"
on public.item_customizations for insert
with check (
  exists (
    select 1
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where oi.id = order_item_id
      and o.user_id = auth.uid()
  )
);

create policy "customizations_admin_or_owner_update"
on public.item_customizations for update
using (
  exists (
    select 1
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where oi.id = order_item_id
      and (o.user_id = auth.uid() or public.is_admin())
  )
)
with check (
  exists (
    select 1
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where oi.id = order_item_id
      and (o.user_id = auth.uid() or public.is_admin())
  )
);

create policy "customizations_admin_or_owner_delete"
on public.item_customizations for delete
using (
  exists (
    select 1
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where oi.id = order_item_id
      and (o.user_id = auth.uid() or public.is_admin())
  )
);
