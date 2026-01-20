-- 1) Quitar acceso anon de tablas sensibles
revoke all on table
  public.orders,
  public.order_items,
  public.item_customizations,
  public.profiles,
  public.user_dietary_restrictions
from anon;

-- 2) Asegurar que anon SOLO ve catalogo (lectura)
grant select on table
  public.ingredients,
  public.meal_bases,
  public.base_ingredients,
  public.dietary_restrictions
to anon;
