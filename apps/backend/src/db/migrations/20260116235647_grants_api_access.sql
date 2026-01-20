-- Permisos base para usar el schema
grant usage on schema public to anon, authenticated;

-- Catalogo: lectura (puede ser anon y authenticated)
grant select on table
  public.ingredients,
  public.meal_bases,
  public.base_ingredients,
  public.dietary_restrictions
to anon, authenticated;

-- Perfil y restricciones del usuario: solo authenticated
grant select, insert, update, delete on table
  public.profiles,
  public.user_dietary_restrictions
to authenticated;

-- Pedidos: solo authenticated
grant select, insert, update on table
  public.orders,
  public.order_items,
  public.item_customizations
to authenticated;

-- (Opcional) si querés permitir delete en items/customizations:
grant delete on table
  public.order_items,
  public.item_customizations
to authenticated;
