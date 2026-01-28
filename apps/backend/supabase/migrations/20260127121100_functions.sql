-- Functions
create or replace function public.set_updated_at()
returns trigger language plpgsql
set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end; $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = public, auth, extensions as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end; $$;

create or replace function public.is_admin()
returns boolean language sql stable
set search_path = public, auth as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.is_restaurant_member(target_restaurant_id uuid)
returns boolean language sql stable security definer
set search_path = public as $$
  select exists (
    select 1
    from public.restaurant_users ru
    where ru.restaurant_id = target_restaurant_id
      and ru.user_id = auth.uid()
  );
$$;

create or replace function public.is_restaurant_admin(target_restaurant_id uuid)
returns boolean language sql stable security definer
set search_path = public as $$
  select exists (
    select 1
    from public.restaurant_users ru
    where ru.restaurant_id = target_restaurant_id
      and ru.user_id = auth.uid()
      and ru.role in ('owner', 'admin')
  );
$$;

create or replace function public.storage_restaurant_id(object_name text)
returns uuid language sql immutable
set search_path = public as $$
  select case
    when split_part(object_name, '/', 1) = 'restaurants'
      and split_part(object_name, '/', 2) ~* '^[0-9a-f-]{36}$'
    then split_part(object_name, '/', 2)::uuid
    else null
  end;
$$;

-- Triggers
drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_restaurants_updated_at on public.restaurants;
create trigger trg_restaurants_updated_at
before update on public.restaurants
for each row execute function public.set_updated_at();

drop trigger if exists trg_addresses_updated_at on public.addresses;
create trigger trg_addresses_updated_at
before update on public.addresses
for each row execute function public.set_updated_at();

drop trigger if exists trg_kitchens_updated_at on public.kitchens;
create trigger trg_kitchens_updated_at
before update on public.kitchens
for each row execute function public.set_updated_at();

drop trigger if exists trg_ingredients_updated_at on public.ingredients;
create trigger trg_ingredients_updated_at
before update on public.ingredients
for each row execute function public.set_updated_at();

drop trigger if exists trg_meal_bases_updated_at on public.meal_bases;
create trigger trg_meal_bases_updated_at
before update on public.meal_bases
for each row execute function public.set_updated_at();

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

drop trigger if exists trg_carts_updated_at on public.carts;
create trigger trg_carts_updated_at
before update on public.carts
for each row execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

drop trigger if exists trg_payment_methods_updated_at on public.payment_methods;
create trigger trg_payment_methods_updated_at
before update on public.payment_methods
for each row execute function public.set_updated_at();

drop trigger if exists trg_recurring_orders_updated_at on public.recurring_orders;
create trigger trg_recurring_orders_updated_at
before update on public.recurring_orders
for each row execute function public.set_updated_at();
