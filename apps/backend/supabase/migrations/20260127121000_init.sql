-- Base schema and tables
set search_path = public, extensions;

create extension if not exists "uuid-ossp";

-- 1) Profiles (link auth.users -> public.profiles)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  date_of_birth date,
  preferred_language text default 'es-419',
  notification_preferences jsonb default '{}'::jsonb,
  preferred_currency_code text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'User profile linked to auth.users.';
comment on column public.profiles.id is 'Primary key, references auth.users.id.';
comment on column public.profiles.full_name is 'User display name.';
comment on column public.profiles.phone is 'User phone number.';
comment on column public.profiles.avatar_url is 'Avatar image URL.';
comment on column public.profiles.date_of_birth is 'User date of birth.';
comment on column public.profiles.preferred_language is 'Preferred language code.';
comment on column public.profiles.notification_preferences is 'Notification preferences as JSON.';
comment on column public.profiles.preferred_currency_code is 'Preferred currency code.';
comment on column public.profiles.is_admin is 'Admin flag for elevated access.';
comment on column public.profiles.created_at is 'Profile creation timestamp.';
comment on column public.profiles.updated_at is 'Profile update timestamp.';

-- 2) Restaurants
create table if not exists public.restaurants (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  legal_name text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.restaurants is 'Affiliated restaurants.';
comment on column public.restaurants.id is 'Primary key.';
comment on column public.restaurants.name is 'Display name.';
comment on column public.restaurants.legal_name is 'Legal business name.';
comment on column public.restaurants.status is 'Operational status.';
comment on column public.restaurants.created_at is 'Creation timestamp.';
comment on column public.restaurants.updated_at is 'Last update timestamp.';

-- 3) Currencies
create table if not exists public.currencies (
  code text primary key,
  name text not null,
  symbol text not null,
  precision integer not null default 2 check (precision >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.currencies is 'Supported currencies.';
comment on column public.currencies.code is 'Currency code (ISO 4217).';
comment on column public.currencies.name is 'Currency name.';
comment on column public.currencies.symbol is 'Currency symbol.';
comment on column public.currencies.precision is 'Decimal precision for currency.';
comment on column public.currencies.is_active is 'Whether the currency is active.';
comment on column public.currencies.created_at is 'Creation timestamp.';

create table if not exists public.restaurant_currencies (
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  currency_code text not null references public.currencies(code) on delete restrict,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (restaurant_id, currency_code)
);

comment on table public.restaurant_currencies is 'Currencies accepted by restaurant.';
comment on column public.restaurant_currencies.restaurant_id is 'Restaurant id.';
comment on column public.restaurant_currencies.currency_code is 'Currency code.';
comment on column public.restaurant_currencies.is_default is 'Default currency for pricing.';
comment on column public.restaurant_currencies.created_at is 'Creation timestamp.';

-- 4) Countries and regions
create table if not exists public.countries (
  id uuid primary key default uuid_generate_v4(),
  iso2 text not null unique,
  iso3 text not null unique,
  name_es text not null,
  name_en text not null,
  created_at timestamptz not null default now()
);

comment on table public.countries is 'Countries reference data.';
comment on column public.countries.id is 'Primary key.';
comment on column public.countries.iso2 is 'ISO 3166-1 alpha-2 code.';
comment on column public.countries.iso3 is 'ISO 3166-1 alpha-3 code.';
comment on column public.countries.name_es is 'Spanish name.';
comment on column public.countries.name_en is 'English name.';
comment on column public.countries.created_at is 'Creation timestamp.';

create table if not exists public.regions (
  id uuid primary key default uuid_generate_v4(),
  country_id uuid not null references public.countries(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (country_id, name)
);

comment on table public.regions is 'Regions or provinces for a country.';
comment on column public.regions.id is 'Primary key.';
comment on column public.regions.country_id is 'Country id.';
comment on column public.regions.name is 'Region name.';
comment on column public.regions.created_at is 'Creation timestamp.';

create table if not exists public.cities (
  id uuid primary key default uuid_generate_v4(),
  region_id uuid not null references public.regions(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (region_id, name)
);

comment on table public.cities is 'Cities or cantons for a region.';
comment on column public.cities.id is 'Primary key.';
comment on column public.cities.region_id is 'Region id.';
comment on column public.cities.name is 'City name.';
comment on column public.cities.created_at is 'Creation timestamp.';

-- 5) Addresses
create table if not exists public.addresses (
  id uuid primary key default uuid_generate_v4(),
  line1 text not null,
  line2 text,
  city_id uuid not null references public.cities(id) on delete restrict,
  region_id uuid not null references public.regions(id) on delete restrict,
  country_id uuid not null references public.countries(id) on delete restrict,
  postal_code text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.addresses is 'Normalized addresses for users, orders, and kitchens.';
comment on column public.addresses.id is 'Primary key.';
comment on column public.addresses.line1 is 'Primary address line.';
comment on column public.addresses.line2 is 'Secondary address line.';
comment on column public.addresses.city_id is 'City id.';
comment on column public.addresses.region_id is 'Region id.';
comment on column public.addresses.country_id is 'Country id.';
comment on column public.addresses.postal_code is 'Postal code.';
comment on column public.addresses.notes is 'Delivery notes or references.';
comment on column public.addresses.created_at is 'Creation timestamp.';
comment on column public.addresses.updated_at is 'Last update timestamp.';

-- 6) Kitchens
create table if not exists public.kitchens (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  address_id uuid references public.addresses(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, name)
);

comment on table public.kitchens is 'Restaurant kitchens or branches.';
comment on column public.kitchens.id is 'Primary key.';
comment on column public.kitchens.restaurant_id is 'Restaurant owner id.';
comment on column public.kitchens.name is 'Kitchen name.';
comment on column public.kitchens.address_id is 'Address id for the kitchen.';
comment on column public.kitchens.status is 'Operational status.';
comment on column public.kitchens.created_at is 'Creation timestamp.';
comment on column public.kitchens.updated_at is 'Last update timestamp.';

-- 7) Restaurant members
create table if not exists public.restaurant_users (
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'staff')),
  created_at timestamptz not null default now(),
  primary key (restaurant_id, user_id)
);

comment on table public.restaurant_users is 'Restaurant membership and roles.';
comment on column public.restaurant_users.restaurant_id is 'Restaurant id.';
comment on column public.restaurant_users.user_id is 'Profile id.';
comment on column public.restaurant_users.role is 'Role within the restaurant.';
comment on column public.restaurant_users.created_at is 'Creation timestamp.';

-- 8) Dietary restriction types
create table if not exists public.dietary_restriction_types (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  created_at timestamptz not null default now()
);

comment on table public.dietary_restriction_types is 'Types of dietary restrictions.';
comment on column public.dietary_restriction_types.id is 'Primary key.';
comment on column public.dietary_restriction_types.name is 'Restriction type name.';
comment on column public.dietary_restriction_types.created_at is 'Creation timestamp.';

-- 9) Dietary restrictions
create table if not exists public.dietary_restrictions (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  restriction_type_id uuid not null references public.dietary_restriction_types(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (restriction_type_id, name)
);

comment on table public.dietary_restrictions is 'Catalog of dietary restrictions.';
comment on column public.dietary_restrictions.id is 'Primary key.';
comment on column public.dietary_restrictions.name is 'Restriction name.';
comment on column public.dietary_restrictions.restriction_type_id is 'Restriction type id.';
comment on column public.dietary_restrictions.created_at is 'Creation timestamp.';

-- 10) User restrictions
create table if not exists public.user_dietary_restrictions (
  user_id uuid not null references public.profiles(id) on delete cascade,
  restriction_id uuid not null references public.dietary_restrictions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, restriction_id)
);

comment on table public.user_dietary_restrictions is 'User to dietary restriction mapping.';
comment on column public.user_dietary_restrictions.user_id is 'Profile id that owns the restriction.';
comment on column public.user_dietary_restrictions.restriction_id is 'Restriction id.';
comment on column public.user_dietary_restrictions.created_at is 'Creation timestamp.';

-- 11) Nutrition goals
create table if not exists public.nutrition_goals (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  created_at timestamptz not null default now()
);

comment on table public.nutrition_goals is 'Nutrition goals catalog.';
comment on column public.nutrition_goals.id is 'Primary key.';
comment on column public.nutrition_goals.name is 'Goal name.';
comment on column public.nutrition_goals.created_at is 'Creation timestamp.';

create table if not exists public.user_nutrition_goals (
  user_id uuid not null references public.profiles(id) on delete cascade,
  goal_id uuid not null references public.nutrition_goals(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, goal_id)
);

comment on table public.user_nutrition_goals is 'User to nutrition goal mapping.';
comment on column public.user_nutrition_goals.user_id is 'Profile id.';
comment on column public.user_nutrition_goals.goal_id is 'Nutrition goal id.';
comment on column public.user_nutrition_goals.created_at is 'Creation timestamp.';

-- 12) Ingredient categories
create table if not exists public.ingredient_categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  created_at timestamptz not null default now()
);

comment on table public.ingredient_categories is 'Ingredient categories.';
comment on column public.ingredient_categories.id is 'Primary key.';
comment on column public.ingredient_categories.name is 'Category name.';
comment on column public.ingredient_categories.created_at is 'Creation timestamp.';

-- 13) Ingredients
create table if not exists public.ingredients (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  category_id uuid not null references public.ingredient_categories(id) on delete restrict,
  name text not null,
  unit_price numeric(10,2) not null check (unit_price >= 0),
  stock integer not null default 0 check (stock >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, name)
);

comment on table public.ingredients is 'Catalog of ingredients per restaurant.';
comment on column public.ingredients.id is 'Primary key.';
comment on column public.ingredients.restaurant_id is 'Restaurant owner id.';
comment on column public.ingredients.category_id is 'Ingredient category id.';
comment on column public.ingredients.name is 'Ingredient name.';
comment on column public.ingredients.unit_price is 'Unit price for ingredient.';
comment on column public.ingredients.stock is 'Available stock units.';
comment on column public.ingredients.is_active is 'Whether the ingredient is active.';
comment on column public.ingredients.created_at is 'Creation timestamp.';
comment on column public.ingredients.updated_at is 'Last update timestamp.';

create table if not exists public.ingredient_restrictions (
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  restriction_id uuid not null references public.dietary_restrictions(id) on delete cascade,
  primary key (ingredient_id, restriction_id)
);

comment on table public.ingredient_restrictions is 'Ingredient to restriction mapping.';
comment on column public.ingredient_restrictions.ingredient_id is 'Ingredient id.';
comment on column public.ingredient_restrictions.restriction_id is 'Restriction id.';

create table if not exists public.ingredient_stock_movements (
  id uuid primary key default uuid_generate_v4(),
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  delta integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);

comment on table public.ingredient_stock_movements is 'Inventory adjustments per ingredient.';
comment on column public.ingredient_stock_movements.id is 'Primary key.';
comment on column public.ingredient_stock_movements.ingredient_id is 'Ingredient id.';
comment on column public.ingredient_stock_movements.delta is 'Stock change delta.';
comment on column public.ingredient_stock_movements.reason is 'Reason for movement.';
comment on column public.ingredient_stock_movements.created_at is 'Creation timestamp.';

create table if not exists public.ingredient_price_history (
  id uuid primary key default uuid_generate_v4(),
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  unit_price numeric(10,2) not null check (unit_price >= 0),
  effective_from timestamptz not null default now()
);

comment on table public.ingredient_price_history is 'Ingredient price history.';
comment on column public.ingredient_price_history.id is 'Primary key.';
comment on column public.ingredient_price_history.ingredient_id is 'Ingredient id.';
comment on column public.ingredient_price_history.unit_price is 'Unit price at the time.';
comment on column public.ingredient_price_history.effective_from is 'Effective timestamp.';

-- 14) Meal base categories
create table if not exists public.meal_base_categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  created_at timestamptz not null default now()
);

comment on table public.meal_base_categories is 'Categories for meal bases.';
comment on column public.meal_base_categories.id is 'Primary key.';
comment on column public.meal_base_categories.name is 'Category name.';
comment on column public.meal_base_categories.created_at is 'Creation timestamp.';

-- 15) Assets
create table if not exists public.assets (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  bucket_id text not null,
  path text not null,
  title text,
  content_type text,
  size_bytes integer not null default 0 check (size_bytes >= 0),
  created_at timestamptz not null default now(),
  unique (bucket_id, path)
);

comment on table public.assets is 'Media assets stored in Supabase Storage.';
comment on column public.assets.id is 'Primary key.';
comment on column public.assets.restaurant_id is 'Restaurant owner id.';
comment on column public.assets.bucket_id is 'Storage bucket id.';
comment on column public.assets.path is 'Object path in storage.';
comment on column public.assets.title is 'Asset title or label.';
comment on column public.assets.content_type is 'MIME content type.';
comment on column public.assets.size_bytes is 'Size in bytes.';
comment on column public.assets.created_at is 'Creation timestamp.';

-- 16) Meal bases
create table if not exists public.meal_bases (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  description text,
  image_asset_id uuid references public.assets(id) on delete set null,
  base_price numeric(10,2) not null check (base_price >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, name)
);

comment on table public.meal_bases is 'Catalog of meal bases per restaurant.';
comment on column public.meal_bases.id is 'Primary key.';
comment on column public.meal_bases.restaurant_id is 'Restaurant owner id.';
comment on column public.meal_bases.name is 'Base name.';
comment on column public.meal_bases.description is 'Base description.';
comment on column public.meal_bases.image_asset_id is 'Image asset id.';
comment on column public.meal_bases.base_price is 'Base price.';
comment on column public.meal_bases.is_active is 'Whether the base is active.';
comment on column public.meal_bases.created_at is 'Creation timestamp.';
comment on column public.meal_bases.updated_at is 'Last update timestamp.';

create table if not exists public.meal_base_category_map (
  base_id uuid not null references public.meal_bases(id) on delete cascade,
  category_id uuid not null references public.meal_base_categories(id) on delete cascade,
  primary key (base_id, category_id)
);

comment on table public.meal_base_category_map is 'Meal base to category mapping.';
comment on column public.meal_base_category_map.base_id is 'Meal base id.';
comment on column public.meal_base_category_map.category_id is 'Category id.';

create table if not exists public.cooking_methods (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  price_delta numeric(10,2) not null default 0 check (price_delta >= 0),
  created_at timestamptz not null default now()
);

comment on table public.cooking_methods is 'Cooking methods available for bases.';
comment on column public.cooking_methods.id is 'Primary key.';
comment on column public.cooking_methods.name is 'Method name.';
comment on column public.cooking_methods.price_delta is 'Additional price for the method.';
comment on column public.cooking_methods.created_at is 'Creation timestamp.';

create table if not exists public.base_cooking_methods (
  base_id uuid not null references public.meal_bases(id) on delete cascade,
  method_id uuid not null references public.cooking_methods(id) on delete restrict,
  primary key (base_id, method_id)
);

comment on table public.base_cooking_methods is 'Allowed cooking methods per base.';
comment on column public.base_cooking_methods.base_id is 'Meal base id.';
comment on column public.base_cooking_methods.method_id is 'Cooking method id.';

create table if not exists public.meal_base_kitchens (
  base_id uuid not null references public.meal_bases(id) on delete cascade,
  kitchen_id uuid not null references public.kitchens(id) on delete cascade,
  is_available boolean not null default true,
  primary key (base_id, kitchen_id)
);

comment on table public.meal_base_kitchens is 'Availability of bases by kitchen.';
comment on column public.meal_base_kitchens.base_id is 'Meal base id.';
comment on column public.meal_base_kitchens.kitchen_id is 'Kitchen id.';
comment on column public.meal_base_kitchens.is_available is 'Availability flag.';

-- Base recipe composition (M:N)
create table if not exists public.base_ingredients (
  base_id uuid not null references public.meal_bases(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete restrict,
  default_qty integer not null default 1 check (default_qty > 0),
  is_removable boolean not null default true,
  is_essential boolean not null default false,
  primary key (base_id, ingredient_id)
);

comment on table public.base_ingredients is 'Default ingredient composition for a base.';
comment on column public.base_ingredients.base_id is 'Meal base id.';
comment on column public.base_ingredients.ingredient_id is 'Ingredient id.';
comment on column public.base_ingredients.default_qty is 'Default quantity for ingredient.';
comment on column public.base_ingredients.is_removable is 'Whether the ingredient can be removed.';
comment on column public.base_ingredients.is_essential is 'Whether the ingredient is essential.';

-- 17) Payment methods (moved before orders due to FK dependency)
create table if not exists public.payment_methods (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  name text not null,
  last_four text,
  expiry_month integer,
  expiry_year integer,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.payment_methods is 'Saved payment methods for user (placeholder only).';
comment on column public.payment_methods.id is 'Primary key.';
comment on column public.payment_methods.user_id is 'Profile id that owns the payment method.';
comment on column public.payment_methods.type is 'Payment method type (placeholder).';
comment on column public.payment_methods.name is 'Display name for the payment method.';
comment on column public.payment_methods.last_four is 'Last 4 digits of card (placeholder).';
comment on column public.payment_methods.expiry_month is 'Expiry month (placeholder).';
comment on column public.payment_methods.expiry_year is 'Expiry year (placeholder).';
comment on column public.payment_methods.is_default is 'Whether this is the default payment method.';
comment on column public.payment_methods.created_at is 'Creation timestamp.';
comment on column public.payment_methods.updated_at is 'Last update timestamp.';

-- 18) Orders
create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete restrict,
  kitchen_id uuid references public.kitchens(id) on delete set null,
  delivery_address_id uuid references public.addresses(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'preparing', 'delivering', 'completed', 'cancelled')),
  currency_code text not null references public.currencies(code) on delete restrict,
  exchange_rate numeric(12,6) check (exchange_rate is null or exchange_rate > 0),
  payment_method text,
  payment_method_id uuid references public.payment_methods(id) on delete set null,
  scheduled_for timestamptz,
  subtotal numeric(10,2) not null default 0 check (subtotal >= 0),
  tax numeric(10,2) not null default 0 check (tax >= 0),
  total numeric(10,2) not null default 0 check (total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.orders is 'Customer orders.';
comment on column public.orders.id is 'Primary key.';
comment on column public.orders.user_id is 'Profile id that owns the order.';
comment on column public.orders.restaurant_id is 'Restaurant id for the order.';
comment on column public.orders.kitchen_id is 'Kitchen id for preparation.';
comment on column public.orders.delivery_address_id is 'Delivery address id.';
comment on column public.orders.status is 'Order status.';
comment on column public.orders.currency_code is 'Currency code for the order.';
comment on column public.orders.exchange_rate is 'Exchange rate applied when needed.';
comment on column public.orders.payment_method is 'Payment method label.';
comment on column public.orders.payment_method_id is 'Saved payment method id.';
comment on column public.orders.scheduled_for is 'Optional scheduled time for delivery.';
comment on column public.orders.subtotal is 'Order subtotal before tax.';
comment on column public.orders.tax is 'Order tax amount.';
comment on column public.orders.total is 'Order total.';
comment on column public.orders.created_at is 'Creation timestamp.';
comment on column public.orders.updated_at is 'Last update timestamp.';

-- Order items
create table if not exists public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  base_id uuid not null references public.meal_bases(id) on delete restrict,
  quantity integer not null default 1 check (quantity > 0),
  unit_price numeric(10,2) not null check (unit_price >= 0),
  subtotal numeric(10,2) not null check (subtotal >= 0),
  cooking_method_id uuid references public.cooking_methods(id)
);

comment on table public.order_items is 'Items within an order.';
comment on column public.order_items.id is 'Primary key.';
comment on column public.order_items.order_id is 'Order id.';
comment on column public.order_items.base_id is 'Meal base id.';
comment on column public.order_items.quantity is 'Item quantity.';
comment on column public.order_items.unit_price is 'Price per unit at time of order.';
comment on column public.order_items.subtotal is 'Item subtotal.';
comment on column public.order_items.cooking_method_id is 'Selected cooking method id.';

-- Item customizations
create table if not exists public.item_customizations (
  id uuid primary key default uuid_generate_v4(),
  order_item_id uuid not null references public.order_items(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete restrict,
  action text not null check (action in ('add', 'remove')),
  qty integer not null default 1 check (qty > 0),
  delta_price numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.item_customizations is 'Ingredient changes for an order item.';
comment on column public.item_customizations.id is 'Primary key.';
comment on column public.item_customizations.order_item_id is 'Order item id.';
comment on column public.item_customizations.ingredient_id is 'Ingredient id.';
comment on column public.item_customizations.action is 'Customization action: add or remove.';
comment on column public.item_customizations.qty is 'Quantity of ingredient affected.';
comment on column public.item_customizations.delta_price is 'Price delta for the customization.';
comment on column public.item_customizations.created_at is 'Creation timestamp.';

-- 19) Carts
create table if not exists public.carts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'converted', 'abandoned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.carts is 'User carts for pending orders.';
comment on column public.carts.id is 'Primary key.';
comment on column public.carts.user_id is 'Profile id.';
comment on column public.carts.restaurant_id is 'Restaurant id.';
comment on column public.carts.status is 'Cart status.';
comment on column public.carts.created_at is 'Creation timestamp.';
comment on column public.carts.updated_at is 'Last update timestamp.';

create table if not exists public.cart_items (
  id uuid primary key default uuid_generate_v4(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  base_id uuid not null references public.meal_bases(id) on delete restrict,
  quantity integer not null default 1 check (quantity > 0),
  unit_price numeric(10,2) not null check (unit_price >= 0),
  subtotal numeric(10,2) not null check (subtotal >= 0),
  cooking_method_id uuid references public.cooking_methods(id)
);

comment on table public.cart_items is 'Items within a cart.';
comment on column public.cart_items.id is 'Primary key.';
comment on column public.cart_items.cart_id is 'Cart id.';
comment on column public.cart_items.base_id is 'Meal base id.';
comment on column public.cart_items.quantity is 'Item quantity.';
comment on column public.cart_items.unit_price is 'Price per unit at time of add.';
comment on column public.cart_items.subtotal is 'Item subtotal.';
comment on column public.cart_items.cooking_method_id is 'Selected cooking method id.';

create table if not exists public.cart_item_customizations (
  id uuid primary key default uuid_generate_v4(),
  cart_item_id uuid not null references public.cart_items(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete restrict,
  action text not null check (action in ('add', 'remove')),
  qty integer not null default 1 check (qty > 0),
  delta_price numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.cart_item_customizations is 'Ingredient changes for a cart item.';
comment on column public.cart_item_customizations.id is 'Primary key.';
comment on column public.cart_item_customizations.cart_item_id is 'Cart item id.';
comment on column public.cart_item_customizations.ingredient_id is 'Ingredient id.';
comment on column public.cart_item_customizations.action is 'Customization action: add or remove.';
comment on column public.cart_item_customizations.qty is 'Quantity of ingredient affected.';
comment on column public.cart_item_customizations.delta_price is 'Price delta for the customization.';
comment on column public.cart_item_customizations.created_at is 'Creation timestamp.';

-- 20) Saved meals
create table if not exists public.saved_meals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  base_id uuid not null references public.meal_bases(id) on delete cascade,
  name text not null,
  cooking_method_id uuid references public.cooking_methods(id),
  created_at timestamptz not null default now()
);

comment on table public.saved_meals is 'Saved custom meals for quick reorder.';
comment on column public.saved_meals.id is 'Primary key.';
comment on column public.saved_meals.user_id is 'Profile id.';
comment on column public.saved_meals.base_id is 'Meal base id.';
comment on column public.saved_meals.name is 'Saved meal name.';
comment on column public.saved_meals.cooking_method_id is 'Preferred cooking method id.';
comment on column public.saved_meals.created_at is 'Creation timestamp.';

create table if not exists public.saved_meal_customizations (
  id uuid primary key default uuid_generate_v4(),
  saved_meal_id uuid not null references public.saved_meals(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete restrict,
  action text not null check (action in ('add', 'remove')),
  qty integer not null default 1 check (qty > 0),
  delta_price numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.saved_meal_customizations is 'Ingredient changes for a saved meal.';
comment on column public.saved_meal_customizations.id is 'Primary key.';
comment on column public.saved_meal_customizations.saved_meal_id is 'Saved meal id.';
comment on column public.saved_meal_customizations.ingredient_id is 'Ingredient id.';
comment on column public.saved_meal_customizations.action is 'Customization action: add or remove.';
comment on column public.saved_meal_customizations.qty is 'Quantity of ingredient affected.';
comment on column public.saved_meal_customizations.delta_price is 'Price delta for the customization.';
comment on column public.saved_meal_customizations.created_at is 'Creation timestamp.';

-- 21) Recurring orders
create table if not exists public.recurring_orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete restrict,
  status text not null default 'active' check (status in ('active', 'paused', 'cancelled')),
  frequency text not null check (frequency in ('weekly', 'biweekly', 'monthly')),
  next_run_at timestamptz not null,
  delivery_address_id uuid references public.addresses(id) on delete set null,
  payment_method_id uuid references public.payment_methods(id) on delete set null,
  currency_code text not null references public.currencies(code) on delete restrict,
  exchange_rate numeric(12,6) check (exchange_rate is null or exchange_rate > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.recurring_orders is 'Recurring subscription orders.';
comment on column public.recurring_orders.id is 'Primary key.';
comment on column public.recurring_orders.user_id is 'Profile id that owns the subscription.';
comment on column public.recurring_orders.restaurant_id is 'Restaurant id for the subscription.';
comment on column public.recurring_orders.status is 'Subscription status.';
comment on column public.recurring_orders.frequency is 'Order frequency (weekly, biweekly, monthly).';
comment on column public.recurring_orders.next_run_at is 'Next scheduled delivery date.';
comment on column public.recurring_orders.delivery_address_id is 'Delivery address id.';
comment on column public.recurring_orders.payment_method_id is 'Saved payment method id.';
comment on column public.recurring_orders.currency_code is 'Currency code for the subscription.';
comment on column public.recurring_orders.exchange_rate is 'Exchange rate applied when needed.';
comment on column public.recurring_orders.created_at is 'Creation timestamp.';
comment on column public.recurring_orders.updated_at is 'Last update timestamp.';

create table if not exists public.recurring_order_items (
  id uuid primary key default uuid_generate_v4(),
  recurring_order_id uuid not null references public.recurring_orders(id) on delete cascade,
  base_id uuid not null references public.meal_bases(id) on delete restrict,
  quantity integer not null default 1 check (quantity > 0),
  unit_price numeric(10,2) not null check (unit_price >= 0),
  subtotal numeric(10,2) not null check (subtotal >= 0),
  cooking_method_id uuid references public.cooking_methods(id)
);

comment on table public.recurring_order_items is 'Items within a recurring order.';
comment on column public.recurring_order_items.id is 'Primary key.';
comment on column public.recurring_order_items.recurring_order_id is 'Recurring order id.';
comment on column public.recurring_order_items.base_id is 'Meal base id.';
comment on column public.recurring_order_items.quantity is 'Item quantity.';
comment on column public.recurring_order_items.unit_price is 'Price per unit at time of subscription.';
comment on column public.recurring_order_items.subtotal is 'Item subtotal.';
comment on column public.recurring_order_items.cooking_method_id is 'Selected cooking method id.';

create table if not exists public.recurring_order_customizations (
  id uuid primary key default uuid_generate_v4(),
  recurring_order_item_id uuid not null references public.recurring_order_items(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete restrict,
  action text not null check (action in ('add', 'remove')),
  qty integer not null default 1 check (qty > 0),
  delta_price numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.recurring_order_customizations is 'Ingredient changes for a recurring order item.';
comment on column public.recurring_order_customizations.id is 'Primary key.';
comment on column public.recurring_order_customizations.recurring_order_item_id is 'Recurring order item id.';
comment on column public.recurring_order_customizations.ingredient_id is 'Ingredient id.';
comment on column public.recurring_order_customizations.action is 'Customization action: add or remove.';
comment on column public.recurring_order_customizations.qty is 'Quantity of ingredient affected.';
comment on column public.recurring_order_customizations.delta_price is 'Price delta for the customization.';
comment on column public.recurring_order_customizations.created_at is 'Creation timestamp.';

-- 23) Payments and order history
create table if not exists public.payments (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null,
  status text not null check (status in ('pending', 'paid', 'failed', 'refunded')),
  currency_code text not null references public.currencies(code) on delete restrict,
  amount numeric(10,2) not null check (amount >= 0),
  transaction_ref text,
  created_at timestamptz not null default now()
);

comment on table public.payments is 'Payments linked to orders.';
comment on column public.payments.id is 'Primary key.';
comment on column public.payments.order_id is 'Order id.';
comment on column public.payments.provider is 'Payment provider.';
comment on column public.payments.status is 'Payment status.';
comment on column public.payments.currency_code is 'Currency code for the payment.';
comment on column public.payments.amount is 'Payment amount.';
comment on column public.payments.transaction_ref is 'External transaction reference.';
comment on column public.payments.created_at is 'Creation timestamp.';

create table if not exists public.order_status_history (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null,
  changed_at timestamptz not null default now(),
  changed_by uuid references public.profiles(id) on delete set null
);

comment on table public.order_status_history is 'Order status timeline.';
comment on column public.order_status_history.id is 'Primary key.';
comment on column public.order_status_history.order_id is 'Order id.';
comment on column public.order_status_history.status is 'Status value at the time.';
comment on column public.order_status_history.changed_at is 'Timestamp of change.';
comment on column public.order_status_history.changed_by is 'Profile id that changed the status.';

-- 22) User addresses
create table if not exists public.user_addresses (
  user_id uuid not null references public.profiles(id) on delete cascade,
  address_id uuid not null references public.addresses(id) on delete cascade,
  label text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (user_id, address_id)
);

comment on table public.user_addresses is 'User saved addresses.';
comment on column public.user_addresses.user_id is 'Profile id.';
comment on column public.user_addresses.address_id is 'Address id.';
comment on column public.user_addresses.label is 'Address label.';
comment on column public.user_addresses.is_default is 'Default address flag.';
comment on column public.user_addresses.created_at is 'Creation timestamp.';

-- 24) Data integrity
create unique index if not exists restaurant_currencies_default_idx
  on public.restaurant_currencies (restaurant_id)
  where is_default = true;

-- Indexes (FKs and common filters)
create index if not exists restaurant_currencies_restaurant_id_idx on public.restaurant_currencies (restaurant_id);
create index if not exists restaurant_currencies_currency_code_idx on public.restaurant_currencies (currency_code);

create index if not exists regions_country_id_idx on public.regions (country_id);
create index if not exists cities_region_id_idx on public.cities (region_id);

create index if not exists addresses_city_id_idx on public.addresses (city_id);
create index if not exists addresses_region_id_idx on public.addresses (region_id);
create index if not exists addresses_country_id_idx on public.addresses (country_id);

create index if not exists kitchens_restaurant_id_idx on public.kitchens (restaurant_id);
create index if not exists kitchens_address_id_idx on public.kitchens (address_id);

create index if not exists restaurant_users_user_id_idx on public.restaurant_users (user_id);

create index if not exists dietary_restrictions_type_id_idx on public.dietary_restrictions (restriction_type_id);

create index if not exists user_dietary_restrictions_user_id_idx on public.user_dietary_restrictions (user_id);
create index if not exists user_dietary_restrictions_restriction_id_idx on public.user_dietary_restrictions (restriction_id);

create index if not exists user_nutrition_goals_user_id_idx on public.user_nutrition_goals (user_id);
create index if not exists user_nutrition_goals_goal_id_idx on public.user_nutrition_goals (goal_id);

create index if not exists ingredients_restaurant_id_idx on public.ingredients (restaurant_id);
create index if not exists ingredients_category_id_idx on public.ingredients (category_id);

create index if not exists ingredient_restrictions_ingredient_id_idx on public.ingredient_restrictions (ingredient_id);
create index if not exists ingredient_restrictions_restriction_id_idx on public.ingredient_restrictions (restriction_id);

create index if not exists ingredient_stock_movements_ingredient_id_idx on public.ingredient_stock_movements (ingredient_id);
create index if not exists ingredient_price_history_ingredient_id_idx on public.ingredient_price_history (ingredient_id);

create index if not exists meal_bases_restaurant_id_idx on public.meal_bases (restaurant_id);
create index if not exists assets_restaurant_id_idx on public.assets (restaurant_id);
create index if not exists assets_bucket_id_idx on public.assets (bucket_id);
create index if not exists meal_base_category_map_base_id_idx on public.meal_base_category_map (base_id);
create index if not exists meal_base_category_map_category_id_idx on public.meal_base_category_map (category_id);

create index if not exists base_cooking_methods_base_id_idx on public.base_cooking_methods (base_id);
create index if not exists base_cooking_methods_method_id_idx on public.base_cooking_methods (method_id);

create index if not exists meal_base_kitchens_base_id_idx on public.meal_base_kitchens (base_id);
create index if not exists meal_base_kitchens_kitchen_id_idx on public.meal_base_kitchens (kitchen_id);

create index if not exists base_ingredients_base_id_idx on public.base_ingredients (base_id);
create index if not exists base_ingredients_ingredient_id_idx on public.base_ingredients (ingredient_id);

create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_restaurant_id_idx on public.orders (restaurant_id);
create index if not exists orders_kitchen_id_idx on public.orders (kitchen_id);
create index if not exists orders_delivery_address_id_idx on public.orders (delivery_address_id);
create index if not exists orders_currency_code_idx on public.orders (currency_code);

create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists order_items_base_id_idx on public.order_items (base_id);

create index if not exists item_customizations_order_item_id_idx on public.item_customizations (order_item_id);
create index if not exists item_customizations_ingredient_id_idx on public.item_customizations (ingredient_id);

create index if not exists carts_user_id_idx on public.carts (user_id);
create index if not exists carts_restaurant_id_idx on public.carts (restaurant_id);

create index if not exists cart_items_cart_id_idx on public.cart_items (cart_id);
create index if not exists cart_items_base_id_idx on public.cart_items (base_id);

create index if not exists cart_item_customizations_cart_item_id_idx on public.cart_item_customizations (cart_item_id);
create index if not exists cart_item_customizations_ingredient_id_idx on public.cart_item_customizations (ingredient_id);

create index if not exists saved_meals_user_id_idx on public.saved_meals (user_id);
create index if not exists saved_meals_base_id_idx on public.saved_meals (base_id);

create index if not exists saved_meal_customizations_saved_meal_id_idx on public.saved_meal_customizations (saved_meal_id);
create index if not exists saved_meal_customizations_ingredient_id_idx on public.saved_meal_customizations (ingredient_id);

create index if not exists payments_order_id_idx on public.payments (order_id);
create index if not exists payments_currency_code_idx on public.payments (currency_code);

create index if not exists order_status_history_order_id_idx on public.order_status_history (order_id);
create index if not exists order_status_history_changed_by_idx on public.order_status_history (changed_by);

create index if not exists user_addresses_address_id_idx on public.user_addresses (address_id);

create index if not exists payment_methods_user_id_idx on public.payment_methods (user_id);
create unique index if not exists payment_methods_default_idx
  on public.payment_methods (user_id)
  where is_default = true;

create index if not exists recurring_orders_user_id_idx on public.recurring_orders (user_id);
create index if not exists recurring_orders_restaurant_id_idx on public.recurring_orders (restaurant_id);
create index if not exists recurring_orders_next_run_at_idx on public.recurring_orders (next_run_at);
create index if not exists recurring_order_items_recurring_order_id_idx
  on public.recurring_order_items (recurring_order_id);
create index if not exists recurring_order_customizations_item_id_idx
  on public.recurring_order_customizations (recurring_order_item_id);

create index if not exists orders_payment_method_id_idx on public.orders (payment_method_id);
