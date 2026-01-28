-- =====================
-- RLS
-- =====================
alter table public.profiles enable row level security;
alter table public.restaurants enable row level security;
alter table public.currencies enable row level security;
alter table public.restaurant_currencies enable row level security;
alter table public.countries enable row level security;
alter table public.regions enable row level security;
alter table public.cities enable row level security;
alter table public.addresses enable row level security;
alter table public.kitchens enable row level security;
alter table public.restaurant_users enable row level security;
alter table public.dietary_restriction_types enable row level security;
alter table public.dietary_restrictions enable row level security;
alter table public.user_dietary_restrictions enable row level security;
alter table public.nutrition_goals enable row level security;
alter table public.user_nutrition_goals enable row level security;
alter table public.ingredient_categories enable row level security;
alter table public.ingredients enable row level security;
alter table public.ingredient_restrictions enable row level security;
alter table public.ingredient_stock_movements enable row level security;
alter table public.ingredient_price_history enable row level security;
alter table public.meal_base_categories enable row level security;
alter table public.assets enable row level security;
alter table public.meal_bases enable row level security;
alter table public.meal_base_category_map enable row level security;
alter table public.cooking_methods enable row level security;
alter table public.base_cooking_methods enable row level security;
alter table public.meal_base_kitchens enable row level security;
alter table public.base_ingredients enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.item_customizations enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.cart_item_customizations enable row level security;
alter table public.saved_meals enable row level security;
alter table public.saved_meal_customizations enable row level security;
alter table public.payments enable row level security;
alter table public.order_status_history enable row level security;
alter table public.user_addresses enable row level security;
alter table public.payment_methods enable row level security;
alter table public.recurring_orders enable row level security;
alter table public.recurring_order_items enable row level security;
alter table public.recurring_order_customizations enable row level security;

-- Profiles: user can read/update own profile
create policy "profiles_select_own"
on public.profiles for select
using (id = (select auth.uid()));

create policy "profiles_update_own"
on public.profiles for update
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

-- Restaurants
create policy "restaurants_select_active_or_member"
on public.restaurants for select
using (
  status = 'active'
  or (select public.is_restaurant_member(id))
  or (select public.is_admin())
);

create policy "restaurants_admin_insert"
on public.restaurants for insert
with check ((select public.is_admin()));

create policy "restaurants_admin_update"
on public.restaurants for update
using ((select public.is_admin()) or (select public.is_restaurant_admin(id)))
with check ((select public.is_admin()) or (select public.is_restaurant_admin(id)));

create policy "restaurants_admin_delete"
on public.restaurants for delete
using ((select public.is_admin()));

-- Currencies
create policy "currencies_select"
on public.currencies for select
using (true);

create policy "currencies_admin_write"
on public.currencies for insert
with check ((select public.is_admin()));

create policy "currencies_admin_update"
on public.currencies for update
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "currencies_admin_delete"
on public.currencies for delete
using ((select public.is_admin()));

-- Restaurant currencies
create policy "restaurant_currencies_select"
on public.restaurant_currencies for select
using (true);

create policy "restaurant_currencies_admin_write"
on public.restaurant_currencies for insert
with check (
  (select public.is_admin())
  or (select public.is_restaurant_admin(restaurant_id))
);

create policy "restaurant_currencies_admin_update"
on public.restaurant_currencies for update
using (
  (select public.is_admin())
  or (select public.is_restaurant_admin(restaurant_id))
)
with check (
  (select public.is_admin())
  or (select public.is_restaurant_admin(restaurant_id))
);

create policy "restaurant_currencies_admin_delete"
on public.restaurant_currencies for delete
using (
  (select public.is_admin())
  or (select public.is_restaurant_admin(restaurant_id))
);

-- Countries, regions, cities
create policy "countries_select"
on public.countries for select
using (true);

create policy "countries_admin_write"
on public.countries for insert
with check ((select public.is_admin()));

create policy "countries_admin_update"
on public.countries for update
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "countries_admin_delete"
on public.countries for delete
using ((select public.is_admin()));

create policy "regions_select"
on public.regions for select
using (true);

create policy "regions_admin_write"
on public.regions for insert
with check ((select public.is_admin()));

create policy "regions_admin_update"
on public.regions for update
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "regions_admin_delete"
on public.regions for delete
using ((select public.is_admin()));

create policy "cities_select"
on public.cities for select
using (true);

create policy "cities_admin_write"
on public.cities for insert
with check ((select public.is_admin()));

create policy "cities_admin_update"
on public.cities for update
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "cities_admin_delete"
on public.cities for delete
using ((select public.is_admin()));

-- Addresses
create policy "addresses_select_owned_or_linked"
on public.addresses for select
using (
  exists (
    select 1 from public.user_addresses ua
    where ua.address_id = id and ua.user_id = (select auth.uid())
  )
  or exists (
    select 1 from public.orders o
    where o.delivery_address_id = id
      and (o.user_id = (select auth.uid()) or (select public.is_restaurant_member(o.restaurant_id)))
  )
  or exists (
    select 1 from public.kitchens k
    where k.address_id = id and (select public.is_restaurant_member(k.restaurant_id))
  )
  or (select public.is_admin())
);

create policy "addresses_insert_authenticated"
on public.addresses for insert
with check ((select auth.uid()) is not null);

create policy "addresses_update_owned_or_linked"
on public.addresses for update
using (
  exists (
    select 1 from public.user_addresses ua
    where ua.address_id = id and ua.user_id = (select auth.uid())
  )
  or exists (
    select 1 from public.kitchens k
    where k.address_id = id and (select public.is_restaurant_admin(k.restaurant_id))
  )
  or (select public.is_admin())
)
with check (
  exists (
    select 1 from public.user_addresses ua
    where ua.address_id = id and ua.user_id = (select auth.uid())
  )
  or exists (
    select 1 from public.kitchens k
    where k.address_id = id and (select public.is_restaurant_admin(k.restaurant_id))
  )
  or (select public.is_admin())
);

create policy "addresses_delete_owned_or_linked"
on public.addresses for delete
using (
  exists (
    select 1 from public.user_addresses ua
    where ua.address_id = id and ua.user_id = (select auth.uid())
  )
  or exists (
    select 1 from public.kitchens k
    where k.address_id = id and (select public.is_restaurant_admin(k.restaurant_id))
  )
  or (select public.is_admin())
);

-- Kitchens
create policy "kitchens_select_active_or_member"
on public.kitchens for select
using (
  status = 'active'
  or (select public.is_restaurant_member(restaurant_id))
  or (select public.is_admin())
);

create policy "kitchens_admin_write"
on public.kitchens for insert
with check ((select public.is_restaurant_admin(restaurant_id)) or (select public.is_admin()));

create policy "kitchens_admin_update"
on public.kitchens for update
using ((select public.is_restaurant_admin(restaurant_id)) or (select public.is_admin()))
with check ((select public.is_restaurant_admin(restaurant_id)) or (select public.is_admin()));

create policy "kitchens_admin_delete"
on public.kitchens for delete
using ((select public.is_restaurant_admin(restaurant_id)) or (select public.is_admin()));

-- Restaurant users
create policy "restaurant_users_select"
on public.restaurant_users for select
using (
  user_id = (select auth.uid())
  or (select public.is_restaurant_admin(restaurant_id))
  or (select public.is_admin())
);

create policy "restaurant_users_admin_write"
on public.restaurant_users for insert
with check ((select public.is_restaurant_admin(restaurant_id)) or (select public.is_admin()));

create policy "restaurant_users_admin_update"
on public.restaurant_users for update
using ((select public.is_restaurant_admin(restaurant_id)) or (select public.is_admin()))
with check ((select public.is_restaurant_admin(restaurant_id)) or (select public.is_admin()));

create policy "restaurant_users_admin_delete"
on public.restaurant_users for delete
using ((select public.is_restaurant_admin(restaurant_id)) or (select public.is_admin()));

-- Dietary restriction types and restrictions
create policy "restriction_types_select"
on public.dietary_restriction_types for select
using (true);

create policy "restriction_types_admin_write"
on public.dietary_restriction_types for insert
with check ((select public.is_admin()));

create policy "restriction_types_admin_update"
on public.dietary_restriction_types for update
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "restriction_types_admin_delete"
on public.dietary_restriction_types for delete
using ((select public.is_admin()));

create policy "restrictions_select_all"
on public.dietary_restrictions for select
using (true);

create policy "restrictions_admin_write"
on public.dietary_restrictions for insert
with check ((select public.is_admin()));

create policy "restrictions_admin_update"
on public.dietary_restrictions for update
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "restrictions_admin_delete"
on public.dietary_restrictions for delete
using ((select public.is_admin()));

-- User restrictions
create policy "user_restrictions_select_own"
on public.user_dietary_restrictions for select
using (user_id = (select auth.uid()));

create policy "user_restrictions_insert_own"
on public.user_dietary_restrictions for insert
with check (user_id = (select auth.uid()));

create policy "user_restrictions_delete_own"
on public.user_dietary_restrictions for delete
using (user_id = (select auth.uid()));

-- Nutrition goals
create policy "nutrition_goals_select"
on public.nutrition_goals for select
using (true);

create policy "nutrition_goals_admin_write"
on public.nutrition_goals for insert
with check ((select public.is_admin()));

create policy "nutrition_goals_admin_update"
on public.nutrition_goals for update
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "nutrition_goals_admin_delete"
on public.nutrition_goals for delete
using ((select public.is_admin()));

create policy "user_nutrition_goals_select_own"
on public.user_nutrition_goals for select
using (user_id = (select auth.uid()));

create policy "user_nutrition_goals_insert_own"
on public.user_nutrition_goals for insert
with check (user_id = (select auth.uid()));

create policy "user_nutrition_goals_delete_own"
on public.user_nutrition_goals for delete
using (user_id = (select auth.uid()));

-- Ingredient categories
create policy "ingredient_categories_select"
on public.ingredient_categories for select
using (true);

create policy "ingredient_categories_admin_write"
on public.ingredient_categories for insert
with check ((select public.is_admin()));

create policy "ingredient_categories_admin_update"
on public.ingredient_categories for update
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "ingredient_categories_admin_delete"
on public.ingredient_categories for delete
using ((select public.is_admin()));

-- Ingredients
create policy "ingredients_select_active"
on public.ingredients for select
using (
  (is_active = true and exists (
    select 1 from public.restaurants r
    where r.id = restaurant_id and r.status = 'active'
  ))
  or (select public.is_restaurant_member(restaurant_id))
  or (select public.is_admin())
);

create policy "ingredients_admin_write"
on public.ingredients for insert
with check ((select public.is_restaurant_admin(restaurant_id)) or (select public.is_admin()));

create policy "ingredients_admin_update"
on public.ingredients for update
using ((select public.is_restaurant_admin(restaurant_id)) or (select public.is_admin()))
with check ((select public.is_restaurant_admin(restaurant_id)) or (select public.is_admin()));

create policy "ingredients_admin_delete"
on public.ingredients for delete
using ((select public.is_restaurant_admin(restaurant_id)) or (select public.is_admin()));

-- Ingredient restrictions
create policy "ingredient_restrictions_select"
on public.ingredient_restrictions for select
using (true);

create policy "ingredient_restrictions_admin_write"
on public.ingredient_restrictions for insert
with check (
  (select public.is_admin())
  or exists (
    select 1 from public.ingredients i
    where i.id = ingredient_id
      and (select public.is_restaurant_admin(i.restaurant_id))
  )
);

create policy "ingredient_restrictions_admin_update"
on public.ingredient_restrictions for update
using (
  (select public.is_admin())
  or exists (
    select 1 from public.ingredients i
    where i.id = ingredient_id
      and (select public.is_restaurant_admin(i.restaurant_id))
  )
)
with check (
  (select public.is_admin())
  or exists (
    select 1 from public.ingredients i
    where i.id = ingredient_id
      and (select public.is_restaurant_admin(i.restaurant_id))
  )
);

create policy "ingredient_restrictions_admin_delete"
on public.ingredient_restrictions for delete
using (
  (select public.is_admin())
  or exists (
    select 1 from public.ingredients i
    where i.id = ingredient_id
      and (select public.is_restaurant_admin(i.restaurant_id))
  )
);

-- Ingredient stock movements
create policy "ingredient_stock_select"
on public.ingredient_stock_movements for select
using (
  (select public.is_admin())
  or exists (
    select 1 from public.ingredients i
    where i.id = ingredient_id
      and (select public.is_restaurant_member(i.restaurant_id))
  )
);

create policy "ingredient_stock_admin_write"
on public.ingredient_stock_movements for insert
with check (
  (select public.is_admin())
  or exists (
    select 1 from public.ingredients i
    where i.id = ingredient_id
      and (select public.is_restaurant_admin(i.restaurant_id))
  )
);

-- Ingredient price history
create policy "ingredient_price_select"
on public.ingredient_price_history for select
using (
  (select public.is_admin())
  or exists (
    select 1 from public.ingredients i
    where i.id = ingredient_id
      and (select public.is_restaurant_member(i.restaurant_id))
  )
);

create policy "ingredient_price_admin_write"
on public.ingredient_price_history for insert
with check (
  (select public.is_admin())
  or exists (
    select 1 from public.ingredients i
    where i.id = ingredient_id
      and (select public.is_restaurant_admin(i.restaurant_id))
  )
);

-- Meal base categories
create policy "meal_base_categories_select"
on public.meal_base_categories for select
using (true);

create policy "meal_base_categories_admin_write"
on public.meal_base_categories for insert
with check ((select public.is_admin()));

create policy "meal_base_categories_admin_update"
on public.meal_base_categories for update
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "meal_base_categories_admin_delete"
on public.meal_base_categories for delete
using ((select public.is_admin()));

-- Meal bases
create policy "meal_bases_select_active"
on public.meal_bases for select
using (
  (is_active = true and exists (
    select 1 from public.restaurants r
    where r.id = restaurant_id and r.status = 'active'
  ))
  or (select public.is_restaurant_member(restaurant_id))
  or (select public.is_admin())
);

create policy "meal_bases_admin_write"
on public.meal_bases for insert
with check ((select public.is_restaurant_admin(restaurant_id)) or (select public.is_admin()));

create policy "meal_bases_admin_update"
on public.meal_bases for update
using ((select public.is_restaurant_admin(restaurant_id)) or (select public.is_admin()))
with check ((select public.is_restaurant_admin(restaurant_id)) or (select public.is_admin()));

create policy "meal_bases_admin_delete"
on public.meal_bases for delete
using ((select public.is_restaurant_admin(restaurant_id)) or (select public.is_admin()));

-- Assets
create policy "assets_select_active_or_member"
on public.assets for select
using (
  exists (
    select 1 from public.restaurants r
    where r.id = restaurant_id and r.status = 'active'
  )
  or (select public.is_restaurant_member(restaurant_id))
  or (select public.is_admin())
);

create policy "assets_admin_write"
on public.assets for insert
with check ((select public.is_restaurant_admin(restaurant_id)) or (select public.is_admin()));

create policy "assets_admin_update"
on public.assets for update
using ((select public.is_restaurant_admin(restaurant_id)) or (select public.is_admin()))
with check ((select public.is_restaurant_admin(restaurant_id)) or (select public.is_admin()));

create policy "assets_admin_delete"
on public.assets for delete
using ((select public.is_restaurant_admin(restaurant_id)) or (select public.is_admin()));

-- Meal base categories map
create policy "meal_base_category_map_select"
on public.meal_base_category_map for select
using (true);

create policy "meal_base_category_map_admin_write"
on public.meal_base_category_map for insert
with check (
  (select public.is_admin())
  or exists (
    select 1 from public.meal_bases b
    where b.id = base_id and (select public.is_restaurant_admin(b.restaurant_id))
  )
);

create policy "meal_base_category_map_admin_update"
on public.meal_base_category_map for update
using (
  (select public.is_admin())
  or exists (
    select 1 from public.meal_bases b
    where b.id = base_id and (select public.is_restaurant_admin(b.restaurant_id))
  )
)
with check (
  (select public.is_admin())
  or exists (
    select 1 from public.meal_bases b
    where b.id = base_id and (select public.is_restaurant_admin(b.restaurant_id))
  )
);

create policy "meal_base_category_map_admin_delete"
on public.meal_base_category_map for delete
using (
  (select public.is_admin())
  or exists (
    select 1 from public.meal_bases b
    where b.id = base_id and (select public.is_restaurant_admin(b.restaurant_id))
  )
);

-- Cooking methods
create policy "cooking_methods_select"
on public.cooking_methods for select
using (true);

create policy "cooking_methods_admin_write"
on public.cooking_methods for insert
with check ((select public.is_admin()));

create policy "cooking_methods_admin_update"
on public.cooking_methods for update
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "cooking_methods_admin_delete"
on public.cooking_methods for delete
using ((select public.is_admin()));

-- Base cooking methods
create policy "base_cooking_methods_select"
on public.base_cooking_methods for select
using (true);

create policy "base_cooking_methods_admin_write"
on public.base_cooking_methods for insert
with check (
  (select public.is_admin())
  or exists (
    select 1 from public.meal_bases b
    where b.id = base_id and (select public.is_restaurant_admin(b.restaurant_id))
  )
);

create policy "base_cooking_methods_admin_update"
on public.base_cooking_methods for update
using (
  (select public.is_admin())
  or exists (
    select 1 from public.meal_bases b
    where b.id = base_id and (select public.is_restaurant_admin(b.restaurant_id))
  )
)
with check (
  (select public.is_admin())
  or exists (
    select 1 from public.meal_bases b
    where b.id = base_id and (select public.is_restaurant_admin(b.restaurant_id))
  )
);

create policy "base_cooking_methods_admin_delete"
on public.base_cooking_methods for delete
using (
  (select public.is_admin())
  or exists (
    select 1 from public.meal_bases b
    where b.id = base_id and (select public.is_restaurant_admin(b.restaurant_id))
  )
);

-- Meal base kitchens
create policy "meal_base_kitchens_select"
on public.meal_base_kitchens for select
using (
  (is_available = true and exists (
    select 1
    from public.meal_bases b
    join public.restaurants r on r.id = b.restaurant_id
    where b.id = base_id and r.status = 'active'
  ))
  or exists (
    select 1 from public.meal_bases b
    where b.id = base_id and (select public.is_restaurant_member(b.restaurant_id))
  )
  or (select public.is_admin())
);

create policy "meal_base_kitchens_admin_write"
on public.meal_base_kitchens for insert
with check (
  (select public.is_admin())
  or exists (
    select 1 from public.meal_bases b
    where b.id = base_id and (select public.is_restaurant_admin(b.restaurant_id))
  )
);

create policy "meal_base_kitchens_admin_update"
on public.meal_base_kitchens for update
using (
  (select public.is_admin())
  or exists (
    select 1 from public.meal_bases b
    where b.id = base_id and (select public.is_restaurant_admin(b.restaurant_id))
  )
)
with check (
  (select public.is_admin())
  or exists (
    select 1 from public.meal_bases b
    where b.id = base_id and (select public.is_restaurant_admin(b.restaurant_id))
  )
);

create policy "meal_base_kitchens_admin_delete"
on public.meal_base_kitchens for delete
using (
  (select public.is_admin())
  or exists (
    select 1 from public.meal_bases b
    where b.id = base_id and (select public.is_restaurant_admin(b.restaurant_id))
  )
);

-- Base ingredients
create policy "base_ingredients_select"
on public.base_ingredients for select
using (true);

create policy "base_ingredients_admin_write"
on public.base_ingredients for insert
with check (
  (select public.is_admin())
  or exists (
    select 1 from public.meal_bases b
    where b.id = base_id and (select public.is_restaurant_admin(b.restaurant_id))
  )
);

create policy "base_ingredients_admin_update"
on public.base_ingredients for update
using (
  (select public.is_admin())
  or exists (
    select 1 from public.meal_bases b
    where b.id = base_id and (select public.is_restaurant_admin(b.restaurant_id))
  )
)
with check (
  (select public.is_admin())
  or exists (
    select 1 from public.meal_bases b
    where b.id = base_id and (select public.is_restaurant_admin(b.restaurant_id))
  )
);

create policy "base_ingredients_admin_delete"
on public.base_ingredients for delete
using (
  (select public.is_admin())
  or exists (
    select 1 from public.meal_bases b
    where b.id = base_id and (select public.is_restaurant_admin(b.restaurant_id))
  )
);

-- Orders
create policy "orders_select_own_or_restaurant"
on public.orders for select
using (
  user_id = (select auth.uid())
  or (select public.is_restaurant_member(restaurant_id))
  or (select public.is_admin())
);

create policy "orders_insert_own_or_admin"
on public.orders for insert
with check (
  user_id = (select auth.uid())
  or (select public.is_restaurant_admin(restaurant_id))
  or (select public.is_admin())
);

create policy "orders_update_own_or_admin"
on public.orders for update
using (
  user_id = (select auth.uid())
  or (select public.is_restaurant_admin(restaurant_id))
  or (select public.is_admin())
)
with check (
  user_id = (select auth.uid())
  or (select public.is_restaurant_admin(restaurant_id))
  or (select public.is_admin())
);

create policy "orders_delete_admin"
on public.orders for delete
using ((select public.is_admin()));

-- Order items
create policy "order_items_select_via_order"
on public.order_items for select
using (
  exists (
    select 1 from public.orders o
    where o.id = order_id
      and (o.user_id = (select auth.uid())
        or (select public.is_restaurant_member(o.restaurant_id))
        or (select public.is_admin()))
  )
);

create policy "order_items_insert_via_order"
on public.order_items for insert
with check (
  exists (
    select 1 from public.orders o
    where o.id = order_id
      and (o.user_id = (select auth.uid())
        or (select public.is_restaurant_admin(o.restaurant_id))
        or (select public.is_admin()))
  )
);

create policy "order_items_update_via_order"
on public.order_items for update
using (
  exists (
    select 1 from public.orders o
    where o.id = order_id
      and (o.user_id = (select auth.uid())
        or (select public.is_restaurant_admin(o.restaurant_id))
        or (select public.is_admin()))
  )
)
with check (
  exists (
    select 1 from public.orders o
    where o.id = order_id
      and (o.user_id = (select auth.uid())
        or (select public.is_restaurant_admin(o.restaurant_id))
        or (select public.is_admin()))
  )
);

create policy "order_items_delete_via_order"
on public.order_items for delete
using (
  exists (
    select 1 from public.orders o
    where o.id = order_id
      and (o.user_id = (select auth.uid())
        or (select public.is_restaurant_admin(o.restaurant_id))
        or (select public.is_admin()))
  )
);

-- Item customizations
create policy "customizations_select_via_order"
on public.item_customizations for select
using (
  exists (
    select 1
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where oi.id = order_item_id
      and (o.user_id = (select auth.uid())
        or (select public.is_restaurant_member(o.restaurant_id))
        or (select public.is_admin()))
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
      and (o.user_id = (select auth.uid())
        or (select public.is_restaurant_admin(o.restaurant_id))
        or (select public.is_admin()))
  )
);

create policy "customizations_update_via_order"
on public.item_customizations for update
using (
  exists (
    select 1
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where oi.id = order_item_id
      and (o.user_id = (select auth.uid())
        or (select public.is_restaurant_admin(o.restaurant_id))
        or (select public.is_admin()))
  )
)
with check (
  exists (
    select 1
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where oi.id = order_item_id
      and (o.user_id = (select auth.uid())
        or (select public.is_restaurant_admin(o.restaurant_id))
        or (select public.is_admin()))
  )
);

create policy "customizations_delete_via_order"
on public.item_customizations for delete
using (
  exists (
    select 1
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where oi.id = order_item_id
      and (o.user_id = (select auth.uid())
        or (select public.is_restaurant_admin(o.restaurant_id))
        or (select public.is_admin()))
  )
);

-- Carts
create policy "carts_select_own"
on public.carts for select
using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "carts_insert_own"
on public.carts for insert
with check (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "carts_update_own"
on public.carts for update
using (user_id = (select auth.uid()) or (select public.is_admin()))
with check (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "carts_delete_own"
on public.carts for delete
using (user_id = (select auth.uid()) or (select public.is_admin()));

-- Cart items
create policy "cart_items_select_via_cart"
on public.cart_items for select
using (
  exists (
    select 1 from public.carts c
    where c.id = cart_id and (c.user_id = (select auth.uid()) or (select public.is_admin()))
  )
);

create policy "cart_items_insert_via_cart"
on public.cart_items for insert
with check (
  exists (
    select 1 from public.carts c
    where c.id = cart_id and (c.user_id = (select auth.uid()) or (select public.is_admin()))
  )
);

create policy "cart_items_update_via_cart"
on public.cart_items for update
using (
  exists (
    select 1 from public.carts c
    where c.id = cart_id and (c.user_id = (select auth.uid()) or (select public.is_admin()))
  )
)
with check (
  exists (
    select 1 from public.carts c
    where c.id = cart_id and (c.user_id = (select auth.uid()) or (select public.is_admin()))
  )
);

create policy "cart_items_delete_via_cart"
on public.cart_items for delete
using (
  exists (
    select 1 from public.carts c
    where c.id = cart_id and (c.user_id = (select auth.uid()) or (select public.is_admin()))
  )
);

-- Cart item customizations
create policy "cart_customizations_select_via_cart"
on public.cart_item_customizations for select
using (
  exists (
    select 1
    from public.cart_items ci
    join public.carts c on c.id = ci.cart_id
    where ci.id = cart_item_id
      and (c.user_id = (select auth.uid()) or (select public.is_admin()))
  )
);

create policy "cart_customizations_insert_via_cart"
on public.cart_item_customizations for insert
with check (
  exists (
    select 1
    from public.cart_items ci
    join public.carts c on c.id = ci.cart_id
    where ci.id = cart_item_id
      and (c.user_id = (select auth.uid()) or (select public.is_admin()))
  )
);

create policy "cart_customizations_update_via_cart"
on public.cart_item_customizations for update
using (
  exists (
    select 1
    from public.cart_items ci
    join public.carts c on c.id = ci.cart_id
    where ci.id = cart_item_id
      and (c.user_id = (select auth.uid()) or (select public.is_admin()))
  )
)
with check (
  exists (
    select 1
    from public.cart_items ci
    join public.carts c on c.id = ci.cart_id
    where ci.id = cart_item_id
      and (c.user_id = (select auth.uid()) or (select public.is_admin()))
  )
);

create policy "cart_customizations_delete_via_cart"
on public.cart_item_customizations for delete
using (
  exists (
    select 1
    from public.cart_items ci
    join public.carts c on c.id = ci.cart_id
    where ci.id = cart_item_id
      and (c.user_id = (select auth.uid()) or (select public.is_admin()))
  )
);

-- Saved meals
create policy "saved_meals_select_own"
on public.saved_meals for select
using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "saved_meals_insert_own"
on public.saved_meals for insert
with check (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "saved_meals_update_own"
on public.saved_meals for update
using (user_id = (select auth.uid()) or (select public.is_admin()))
with check (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "saved_meals_delete_own"
on public.saved_meals for delete
using (user_id = (select auth.uid()) or (select public.is_admin()));

-- Saved meal customizations
create policy "saved_meal_customizations_select"
on public.saved_meal_customizations for select
using (
  exists (
    select 1 from public.saved_meals sm
    where sm.id = saved_meal_id
      and (sm.user_id = (select auth.uid()) or (select public.is_admin()))
  )
);

create policy "saved_meal_customizations_insert"
on public.saved_meal_customizations for insert
with check (
  exists (
    select 1 from public.saved_meals sm
    where sm.id = saved_meal_id
      and (sm.user_id = (select auth.uid()) or (select public.is_admin()))
  )
);

create policy "saved_meal_customizations_update"
on public.saved_meal_customizations for update
using (
  exists (
    select 1 from public.saved_meals sm
    where sm.id = saved_meal_id
      and (sm.user_id = (select auth.uid()) or (select public.is_admin()))
  )
)
with check (
  exists (
    select 1 from public.saved_meals sm
    where sm.id = saved_meal_id
      and (sm.user_id = (select auth.uid()) or (select public.is_admin()))
  )
);

create policy "saved_meal_customizations_delete"
on public.saved_meal_customizations for delete
using (
  exists (
    select 1 from public.saved_meals sm
    where sm.id = saved_meal_id
      and (sm.user_id = (select auth.uid()) or (select public.is_admin()))
  )
);

-- Payments
create policy "payments_select"
on public.payments for select
using (
  exists (
    select 1 from public.orders o
    where o.id = order_id
      and (o.user_id = (select auth.uid())
        or (select public.is_restaurant_member(o.restaurant_id))
        or (select public.is_admin()))
  )
);

create policy "payments_admin_write"
on public.payments for insert
with check (
  exists (
    select 1 from public.orders o
    where o.id = order_id
      and ((select public.is_restaurant_admin(o.restaurant_id)) or (select public.is_admin()))
  )
);

create policy "payments_admin_update"
on public.payments for update
using (
  exists (
    select 1 from public.orders o
    where o.id = order_id
      and ((select public.is_restaurant_admin(o.restaurant_id)) or (select public.is_admin()))
  )
)
with check (
  exists (
    select 1 from public.orders o
    where o.id = order_id
      and ((select public.is_restaurant_admin(o.restaurant_id)) or (select public.is_admin()))
  )
);

-- Order status history
create policy "order_status_history_select"
on public.order_status_history for select
using (
  exists (
    select 1 from public.orders o
    where o.id = order_id
      and (o.user_id = (select auth.uid())
        or (select public.is_restaurant_member(o.restaurant_id))
        or (select public.is_admin()))
  )
);

create policy "order_status_history_admin_insert"
on public.order_status_history for insert
with check (
  exists (
    select 1 from public.orders o
    where o.id = order_id
      and ((select public.is_restaurant_admin(o.restaurant_id)) or (select public.is_admin()))
  )
);

-- User addresses
create policy "user_addresses_select_own"
on public.user_addresses for select
using (user_id = (select auth.uid()));

create policy "user_addresses_insert_own"
on public.user_addresses for insert
with check (user_id = (select auth.uid()));

create policy "user_addresses_update_own"
on public.user_addresses for update
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "user_addresses_delete_own"
on public.user_addresses for delete
using (user_id = (select auth.uid()));

-- Payment methods
create policy "payment_methods_select_own"
on public.payment_methods for select
using (user_id = (select auth.uid()));

create policy "payment_methods_insert_own"
on public.payment_methods for insert
with check (user_id = (select auth.uid()));

create policy "payment_methods_update_own"
on public.payment_methods for update
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "payment_methods_delete_own"
on public.payment_methods for delete
using (user_id = (select auth.uid()));

-- Recurring orders
create policy "recurring_orders_select_own"
on public.recurring_orders for select
using (user_id = (select auth.uid()));

create policy "recurring_orders_insert_own"
on public.recurring_orders for insert
with check (user_id = (select auth.uid()));

create policy "recurring_orders_update_own"
on public.recurring_orders for update
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "recurring_orders_delete_own"
on public.recurring_orders for delete
using (user_id = (select auth.uid()));

-- Recurring order items
create policy "recurring_order_items_select"
on public.recurring_order_items for select
using (
  exists (
    select 1 from public.recurring_orders ro
    where ro.id = recurring_order_id
      and ro.user_id = (select auth.uid())
  )
);

create policy "recurring_order_items_insert"
on public.recurring_order_items for insert
with check (
  exists (
    select 1 from public.recurring_orders ro
    where ro.id = recurring_order_id
      and ro.user_id = (select auth.uid())
  )
);

create policy "recurring_order_items_update"
on public.recurring_order_items for update
using (
  exists (
    select 1 from public.recurring_orders ro
    where ro.id = recurring_order_id
      and ro.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.recurring_orders ro
    where ro.id = recurring_order_id
      and ro.user_id = (select auth.uid())
  )
);

create policy "recurring_order_items_delete"
on public.recurring_order_items for delete
using (
  exists (
    select 1 from public.recurring_orders ro
    where ro.id = recurring_order_id
      and ro.user_id = (select auth.uid())
  )
);

-- Recurring order customizations
create policy "recurring_order_customizations_select"
on public.recurring_order_customizations for select
using (
  exists (
    select 1
    from public.recurring_order_items roi
    join public.recurring_orders ro on ro.id = roi.recurring_order_id
    where roi.id = recurring_order_item_id
      and ro.user_id = (select auth.uid())
  )
);

create policy "recurring_order_customizations_insert"
on public.recurring_order_customizations for insert
with check (
  exists (
    select 1
    from public.recurring_order_items roi
    join public.recurring_orders ro on ro.id = roi.recurring_order_id
    where roi.id = recurring_order_item_id
      and ro.user_id = (select auth.uid())
  )
);

create policy "recurring_order_customizations_update"
on public.recurring_order_customizations for update
using (
  exists (
    select 1
    from public.recurring_order_items roi
    join public.recurring_orders ro on ro.id = roi.recurring_order_id
    where roi.id = recurring_order_item_id
      and ro.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.recurring_order_items roi
    join public.recurring_orders ro on ro.id = roi.recurring_order_id
    where roi.id = recurring_order_item_id
      and ro.user_id = (select auth.uid())
  )
);

create policy "recurring_order_customizations_delete"
on public.recurring_order_customizations for delete
using (
  exists (
    select 1
    from public.recurring_order_items roi
    join public.recurring_orders ro on ro.id = roi.recurring_order_id
    where roi.id = recurring_order_item_id
      and ro.user_id = (select auth.uid())
  )
);

-- Storage objects (bucket: media)
create policy "media_public_read"
on storage.objects for select
using (bucket_id = 'media');

create policy "media_admin_write"
on storage.objects for insert
with check (
  bucket_id = 'media'
  and public.storage_restaurant_id(name) is not null
  and ((select public.is_admin()) or (select public.is_restaurant_admin(public.storage_restaurant_id(name))))
);

create policy "media_admin_update"
on storage.objects for update
using (
  bucket_id = 'media'
  and public.storage_restaurant_id(name) is not null
  and ((select public.is_admin()) or (select public.is_restaurant_admin(public.storage_restaurant_id(name))))
)
with check (
  bucket_id = 'media'
  and public.storage_restaurant_id(name) is not null
  and ((select public.is_admin()) or (select public.is_restaurant_admin(public.storage_restaurant_id(name))))
);

create policy "media_admin_delete"
on storage.objects for delete
using (
  bucket_id = 'media'
  and public.storage_restaurant_id(name) is not null
  and ((select public.is_admin()) or (select public.is_restaurant_admin(public.storage_restaurant_id(name))))
);
