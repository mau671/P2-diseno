-- Permissions and access control

-- 1) Remove anon access from sensitive tables
revoke all on table
  public.profiles,
  public.restaurant_users,
  public.user_dietary_restrictions,
  public.user_nutrition_goals,
  public.user_addresses,
  public.addresses,
  public.orders,
  public.order_items,
  public.item_customizations,
  public.carts,
  public.cart_items,
  public.cart_item_customizations,
  public.saved_meals,
  public.saved_meal_customizations,
  public.payments,
  public.order_status_history,
  public.ingredient_stock_movements,
  public.ingredient_price_history,
  public.restaurant_currencies,
  public.payment_methods,
  public.recurring_orders,
  public.recurring_order_items,
  public.recurring_order_customizations
from anon;

-- 2) Base schema usage
grant usage on schema public to anon, authenticated;

-- 3) Catalog: read access (anon and authenticated)
grant select on table
  public.restaurants,
  public.kitchens,
  public.currencies,
  public.restaurant_currencies,
  public.countries,
  public.regions,
  public.cities,
  public.ingredient_categories,
  public.ingredients,
  public.meal_base_categories,
  public.assets,
  public.meal_bases,
  public.meal_base_category_map,
  public.base_ingredients,
  public.meal_base_kitchens,
  public.dietary_restriction_types,
  public.dietary_restrictions,
  public.cooking_methods,
  public.base_cooking_methods,
  public.ingredient_restrictions,
  public.payment_methods
to anon, authenticated;

-- 4) User data and orders: authenticated only
grant select, insert, update, delete on table
  public.profiles,
  public.user_dietary_restrictions,
  public.user_nutrition_goals,
  public.user_addresses,
  public.addresses,
  public.carts,
  public.cart_items,
  public.cart_item_customizations,
  public.orders,
  public.order_items,
  public.item_customizations,
  public.saved_meals,
  public.saved_meal_customizations,
  public.currencies,
  public.countries,
  public.regions,
  public.cities,
  public.restaurant_currencies,
  public.payment_methods
to authenticated;

-- 5) Admin portal and operational tables: authenticated only (RLS enforced)
grant select, insert, update, delete on table
  public.restaurants,
  public.kitchens,
  public.restaurant_users,
  public.currencies,
  public.restaurant_currencies,
  public.countries,
  public.regions,
  public.cities,
  public.ingredient_categories,
  public.ingredients,
  public.ingredient_stock_movements,
  public.ingredient_price_history,
  public.meal_base_categories,
  public.assets,
  public.meal_bases,
  public.meal_base_category_map,
  public.base_ingredients,
  public.meal_base_kitchens,
  public.cooking_methods,
  public.base_cooking_methods,
  public.dietary_restriction_types,
  public.dietary_restrictions,
  public.ingredient_restrictions,
  public.payments,
  public.order_status_history,
  public.nutrition_goals,
  public.payment_methods,
  public.recurring_orders,
  public.recurring_order_items,
  public.recurring_order_customizations
to authenticated;
