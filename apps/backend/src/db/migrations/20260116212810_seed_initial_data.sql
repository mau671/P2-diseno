-- Dietary restrictions (catálogo)
insert into public.dietary_restrictions (name, type)
values
  ('Gluten', 'allergen'),
  ('Lactosa', 'allergen'),
  ('Maní', 'allergen'),
  ('Vegano', 'diet'),
  ('Keto', 'diet')
on conflict do nothing;

-- 120 ingredientes dummy
insert into public.ingredients (name, category, unit_price, stock, is_active)
select
  'Ingrediente ' || i,
  case when i % 3 = 0 then 'protein' when i % 3 = 1 then 'vegetal' else 'sauce' end,
  (i % 20) + 1,
  50,
  true
from generate_series(1, 120) as i
on conflict do nothing;

-- 30 bases dummy
insert into public.meal_bases (name, description, base_price, is_active)
select
  'Base ' || i,
  'Descripción base ' || i,
  (i % 15) + 5,
  true
from generate_series(1, 30) as i
on conflict do nothing;

-- Composición base_ingredients (por cada base, 6 ingredientes)
insert into public.base_ingredients (base_id, ingredient_id, default_qty, is_removable, is_essential)
select
  b.id,
  ing.id,
  1,
  true,
  case when (row_number() over (partition by b.id order by ing.name)) <= 2 then true else false end
from public.meal_bases b
join lateral (
  select id, name from public.ingredients
  order by random()
  limit 6
) ing on true
on conflict do nothing;
