-- Currencies
insert into public.currencies (code, name, symbol, precision, is_active)
values
  ('CRC', 'Colon costarricense', 'CRC', 2, true),
  ('USD', 'Dolar estadounidense', '$', 2, true)
on conflict do nothing;

-- Storage bucket
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict do nothing;

-- Countries, regions, cities
insert into public.countries (iso2, iso3, name_es, name_en)
values
  ('CR', 'CRI', 'Costa Rica', 'Costa Rica')
on conflict do nothing;

with c as (
  select id from public.countries where iso2 = 'CR'
)
insert into public.regions (country_id, name)
select c.id, v.name
from c
join (values
  ('San Jose'),
  ('Alajuela'),
  ('Cartago'),
  ('Heredia'),
  ('Guanacaste'),
  ('Puntarenas'),
  ('Limon')
) as v(name) on true
on conflict do nothing;

with r as (
  select id, name from public.regions
)
insert into public.cities (region_id, name)
select r.id, v.city
from (values
  ('San Jose', 'San Jose'),
  ('San Jose', 'Escazu'),
  ('San Jose', 'Santa Ana'),
  ('Cartago', 'Cartago'),
  ('Heredia', 'Heredia'),
  ('Alajuela', 'Alajuela'),
  ('Guanacaste', 'Liberia'),
  ('Puntarenas', 'Puntarenas'),
  ('Limon', 'Limon')
) as v(region_name, city)
join r on r.name = v.region_name
on conflict do nothing;

-- Restaurants
insert into public.restaurants (name, legal_name, status)
select v.name, v.legal_name, v.status
from (values
  ('Cocina Express Central', 'Cocina Express Central S.A.', 'active'),
  ('Sabores Ticos', 'Sabores Ticos S.R.L.', 'active'),
  ('La Huerta Viva', 'La Huerta Viva S.A.', 'active')
) as v(name, legal_name, status)
where not exists (
  select 1 from public.restaurants r where r.name = v.name
);

-- Restaurant currencies
with r as (
  select id, name from public.restaurants
)
insert into public.restaurant_currencies (restaurant_id, currency_code, is_default)
select r.id, v.currency_code, v.is_default
from (values
  ('Cocina Express Central', 'CRC', true),
  ('Cocina Express Central', 'USD', false),
  ('Sabores Ticos', 'CRC', true),
  ('La Huerta Viva', 'CRC', true),
  ('La Huerta Viva', 'USD', false)
) as v(restaurant_name, currency_code, is_default)
join r on r.name = v.restaurant_name
on conflict do nothing;

-- Addresses
with c as (
  select id from public.countries where iso2 = 'CR'
), r as (
  select id, name from public.regions
), ci as (
  select id, name, region_id from public.cities
)
insert into public.addresses (line1, line2, city_id, region_id, country_id, postal_code, notes)
select v.line1, v.line2, ci.id, r.id, c.id, v.postal_code, v.notes
from (values
  ('Avenida Central 123', null, 'San Jose', 'San Jose', '10101', 'Frente al parque'),
  ('Calle 5, Barrio Escalante', null, 'San Jose', 'San Jose', '10102', 'Edificio esquinero'),
  ('Ruta 27, Santa Ana', null, 'Santa Ana', 'San Jose', '10901', 'Centro comercial'),
  ('Boulevard Los Yoses 45', null, 'San Jose', 'San Jose', '11501', 'Costado norte')
) as v(line1, line2, city, region, postal_code, notes)
join r on r.name = v.region
join ci on ci.name = v.city and ci.region_id = r.id
join c on true
where not exists (
  select 1 from public.addresses a where a.line1 = v.line1
);

-- Kitchens
with r as (
  select id, name from public.restaurants
), a as (
  select id, line1 from public.addresses
)
insert into public.kitchens (restaurant_id, name, address_id, status)
select r.id, v.kitchen_name, a.id, v.status
from (values
  ('Cocina Express Central', 'Cocina Central', 'Avenida Central 123', 'active'),
  ('Sabores Ticos', 'Cocina Escalante', 'Calle 5, Barrio Escalante', 'active'),
  ('Sabores Ticos', 'Cocina Santa Ana', 'Ruta 27, Santa Ana', 'active'),
  ('La Huerta Viva', 'Cocina Los Yoses', 'Boulevard Los Yoses 45', 'active')
) as v(restaurant_name, kitchen_name, address_line1, status)
join r on r.name = v.restaurant_name
join a on a.line1 = v.address_line1
where not exists (
  select 1 from public.kitchens k
  where k.restaurant_id = r.id and k.name = v.kitchen_name
);

-- Dietary restriction types
insert into public.dietary_restriction_types (name)
values
  ('alergeno'),
  ('dieta')
on conflict do nothing;

-- Dietary restrictions
with t as (
  select id, name from public.dietary_restriction_types
)
insert into public.dietary_restrictions (name, restriction_type_id)
select v.name, t.id
from (values
  ('Gluten', 'alergeno'),
  ('Lactosa', 'alergeno'),
  ('Mani', 'alergeno'),
  ('Huevo', 'alergeno'),
  ('Mariscos', 'alergeno'),
  ('Soya', 'alergeno'),
  ('Nueces', 'alergeno'),
  ('Vegano', 'dieta'),
  ('Vegetariano', 'dieta'),
  ('Keto', 'dieta'),
  ('Sin azucar', 'dieta'),
  ('Sin gluten', 'dieta')
) as v(name, type_name)
join t on t.name = v.type_name
on conflict do nothing;

-- Nutrition goals
insert into public.nutrition_goals (name)
values
  ('Bajar peso'),
  ('Ganar masa'),
  ('Mantener peso'),
  ('Control de glucosa')
on conflict do nothing;

-- Ingredient categories
insert into public.ingredient_categories (name)
values
  ('Proteina'),
  ('Vegetal'),
  ('Carbohidrato'),
  ('Salsa'),
  ('Lacteo'),
  ('Grano'),
  ('Fruta'),
  ('Especia'),
  ('Aceite'),
  ('Pan')
on conflict do nothing;

-- Ingredients
with r as (
  select id, name from public.restaurants
), c as (
  select id, name from public.ingredient_categories
)
insert into public.ingredients (restaurant_id, category_id, name, unit_price, stock, is_active)
select
  r.id,
  c.id,
  v.name,
  case v.category_name
    when 'Proteina' then 4.50
    when 'Vegetal' then 1.20
    when 'Carbohidrato' then 1.80
    when 'Salsa' then 0.80
    when 'Lacteo' then 1.50
    when 'Grano' then 1.60
    when 'Fruta' then 1.40
    when 'Especia' then 0.60
    when 'Aceite' then 0.90
    when 'Pan' then 1.00
    else 1.00
  end as unit_price,
  v.stock,
  v.is_active
from (values
  ('Cocina Express Central', 'Proteina', 'Pechuga de pollo', 80, true),
  ('Cocina Express Central', 'Proteina', 'Carne de res', 60, true),
  ('Cocina Express Central', 'Proteina', 'Cerdo desmechado', 50, true),
  ('Cocina Express Central', 'Proteina', 'Pescado blanco', 40, true),
  ('Cocina Express Central', 'Proteina', 'Camaron', 30, true),
  ('Cocina Express Central', 'Proteina', 'Atun', 35, true),
  ('Cocina Express Central', 'Proteina', 'Pavo', 30, true),
  ('Cocina Express Central', 'Vegetal', 'Lechuga romana', 90, true),
  ('Cocina Express Central', 'Vegetal', 'Tomate', 90, true),
  ('Cocina Express Central', 'Vegetal', 'Cebolla morada', 80, true),
  ('Cocina Express Central', 'Vegetal', 'Pimiento rojo', 70, true),
  ('Cocina Express Central', 'Vegetal', 'Pimiento verde', 70, true),
  ('Cocina Express Central', 'Vegetal', 'Zanahoria rallada', 85, true),
  ('Cocina Express Central', 'Vegetal', 'Brocoli', 60, true),
  ('Cocina Express Central', 'Vegetal', 'Espinaca', 75, true),
  ('Cocina Express Central', 'Vegetal', 'Pepino', 80, true),
  ('Cocina Express Central', 'Vegetal', 'Aguacate', 50, true),
  ('Cocina Express Central', 'Carbohidrato', 'Arroz blanco', 120, true),
  ('Cocina Express Central', 'Carbohidrato', 'Arroz integral', 110, true),
  ('Cocina Express Central', 'Carbohidrato', 'Pasta corta', 100, true),
  ('Cocina Express Central', 'Carbohidrato', 'Papas asadas', 80, true),
  ('Cocina Express Central', 'Carbohidrato', 'Tortilla de trigo', 90, true),
  ('Cocina Express Central', 'Carbohidrato', 'Quinoa', 60, true),
  ('Cocina Express Central', 'Salsa', 'Salsa de tomate', 100, true),
  ('Cocina Express Central', 'Salsa', 'Salsa pesto', 60, true),
  ('Cocina Express Central', 'Salsa', 'Salsa de yogurt', 60, true),
  ('Cocina Express Central', 'Salsa', 'Salsa picante', 70, true),
  ('Cocina Express Central', 'Salsa', 'Vinagreta citrica', 60, true),
  ('Cocina Express Central', 'Lacteo', 'Queso mozzarella', 50, true),
  ('Cocina Express Central', 'Lacteo', 'Queso cheddar', 50, true),
  ('Cocina Express Central', 'Lacteo', 'Queso parmesano', 45, true),
  ('Cocina Express Central', 'Lacteo', 'Crema agria', 40, true),
  ('Cocina Express Central', 'Grano', 'Frijoles negros', 90, true),
  ('Cocina Express Central', 'Grano', 'Garbanzos', 70, true),
  ('Cocina Express Central', 'Grano', 'Lentejas', 70, true),
  ('Cocina Express Central', 'Grano', 'Mani', 40, true),
  ('Cocina Express Central', 'Fruta', 'Pina', 50, true),
  ('Cocina Express Central', 'Fruta', 'Mango', 50, true),
  ('Cocina Express Central', 'Especia', 'Comino', 120, true),
  ('Cocina Express Central', 'Especia', 'Oregano', 120, true),
  ('Cocina Express Central', 'Especia', 'Paprika', 110, true),
  ('Cocina Express Central', 'Aceite', 'Aceite de oliva', 60, true),
  ('Cocina Express Central', 'Aceite', 'Aceite de coco', 40, true),
  ('Cocina Express Central', 'Pan', 'Pan integral', 50, true),
  ('Cocina Express Central', 'Pan', 'Pan pita', 60, true),

  ('Sabores Ticos', 'Proteina', 'Pollo asado', 70, true),
  ('Sabores Ticos', 'Proteina', 'Carne molida', 70, true),
  ('Sabores Ticos', 'Proteina', 'Chorizo criollo', 60, true),
  ('Sabores Ticos', 'Proteina', 'Lomo de cerdo', 50, true),
  ('Sabores Ticos', 'Proteina', 'Tilapia', 40, true),
  ('Sabores Ticos', 'Proteina', 'Huevo', 80, true),
  ('Sabores Ticos', 'Vegetal', 'Repollo', 90, true),
  ('Sabores Ticos', 'Vegetal', 'Tomate', 90, true),
  ('Sabores Ticos', 'Vegetal', 'Cebolla blanca', 80, true),
  ('Sabores Ticos', 'Vegetal', 'Chile dulce', 70, true),
  ('Sabores Ticos', 'Vegetal', 'Culantro', 70, true),
  ('Sabores Ticos', 'Vegetal', 'Lechuga', 90, true),
  ('Sabores Ticos', 'Vegetal', 'Zanahoria', 90, true),
  ('Sabores Ticos', 'Vegetal', 'Ayote', 60, true),
  ('Sabores Ticos', 'Vegetal', 'Chayote', 60, true),
  ('Sabores Ticos', 'Vegetal', 'Platano verde', 70, true),
  ('Sabores Ticos', 'Carbohidrato', 'Arroz con coco', 120, true),
  ('Sabores Ticos', 'Carbohidrato', 'Arroz blanco', 120, true),
  ('Sabores Ticos', 'Carbohidrato', 'Tortilla de maiz', 100, true),
  ('Sabores Ticos', 'Carbohidrato', 'Yuca sancochada', 70, true),
  ('Sabores Ticos', 'Carbohidrato', 'Papa criolla', 80, true),
  ('Sabores Ticos', 'Salsa', 'Salsa lizano', 80, true),
  ('Sabores Ticos', 'Salsa', 'Salsa criolla', 70, true),
  ('Sabores Ticos', 'Salsa', 'Salsa de tomate casera', 70, true),
  ('Sabores Ticos', 'Salsa', 'Chimichurri', 60, true),
  ('Sabores Ticos', 'Lacteo', 'Queso fresco', 60, true),
  ('Sabores Ticos', 'Lacteo', 'Queso turrialba', 50, true),
  ('Sabores Ticos', 'Grano', 'Frijoles rojos', 90, true),
  ('Sabores Ticos', 'Grano', 'Frijoles negros', 90, true),
  ('Sabores Ticos', 'Fruta', 'Papaya', 50, true),
  ('Sabores Ticos', 'Fruta', 'Guayaba', 40, true),
  ('Sabores Ticos', 'Especia', 'Achiote', 90, true),
  ('Sabores Ticos', 'Especia', 'Pimienta negra', 90, true),
  ('Sabores Ticos', 'Aceite', 'Aceite de canola', 60, true),
  ('Sabores Ticos', 'Pan', 'Pan cuadrado', 50, true),

  ('La Huerta Viva', 'Proteina', 'Tofu', 60, true),
  ('La Huerta Viva', 'Proteina', 'Tempeh', 40, true),
  ('La Huerta Viva', 'Proteina', 'Proteina de soya', 40, true),
  ('La Huerta Viva', 'Proteina', 'Huevo organico', 40, true),
  ('La Huerta Viva', 'Vegetal', 'Kale', 60, true),
  ('La Huerta Viva', 'Vegetal', 'Espinaca baby', 70, true),
  ('La Huerta Viva', 'Vegetal', 'Tomate cherry', 70, true),
  ('La Huerta Viva', 'Vegetal', 'Cebolla morada', 70, true),
  ('La Huerta Viva', 'Vegetal', 'Pepino', 80, true),
  ('La Huerta Viva', 'Vegetal', 'Remolacha', 60, true),
  ('La Huerta Viva', 'Vegetal', 'Berenjena', 60, true),
  ('La Huerta Viva', 'Vegetal', 'Calabacin', 60, true),
  ('La Huerta Viva', 'Vegetal', 'Champinon', 60, true),
  ('La Huerta Viva', 'Vegetal', 'Maiz dulce', 70, true),
  ('La Huerta Viva', 'Vegetal', 'Aguacate', 50, true),
  ('La Huerta Viva', 'Carbohidrato', 'Quinoa', 80, true),
  ('La Huerta Viva', 'Carbohidrato', 'Arroz integral', 100, true),
  ('La Huerta Viva', 'Carbohidrato', 'Batata asada', 60, true),
  ('La Huerta Viva', 'Carbohidrato', 'Pan pita integral', 60, true),
  ('La Huerta Viva', 'Carbohidrato', 'Couscous', 70, true),
  ('La Huerta Viva', 'Salsa', 'Hummus', 50, true),
  ('La Huerta Viva', 'Salsa', 'Salsa tahini', 40, true),
  ('La Huerta Viva', 'Salsa', 'Salsa de tomate', 60, true),
  ('La Huerta Viva', 'Salsa', 'Salsa de aguacate', 50, true),
  ('La Huerta Viva', 'Lacteo', 'Queso de cabra', 40, true),
  ('La Huerta Viva', 'Lacteo', 'Yogurt natural', 40, true),
  ('La Huerta Viva', 'Grano', 'Garbanzos', 70, true),
  ('La Huerta Viva', 'Grano', 'Lentejas', 70, true),
  ('La Huerta Viva', 'Grano', 'Almendras', 40, true),
  ('La Huerta Viva', 'Grano', 'Semillas de chia', 40, true),
  ('La Huerta Viva', 'Fruta', 'Fresa', 50, true),
  ('La Huerta Viva', 'Fruta', 'Manzana verde', 50, true),
  ('La Huerta Viva', 'Especia', 'Curcuma', 70, true),
  ('La Huerta Viva', 'Especia', 'Pimienta blanca', 70, true),
  ('La Huerta Viva', 'Especia', 'Oregano', 80, true),
  ('La Huerta Viva', 'Aceite', 'Aceite de oliva', 60, true),
  ('La Huerta Viva', 'Pan', 'Pan masa madre', 40, true)
) as v(restaurant_name, category_name, name, stock, is_active)
join r on r.name = v.restaurant_name
join c on c.name = v.category_name
on conflict do nothing;

-- Ingredient restrictions
with i as (
  select id, name, restaurant_id from public.ingredients
), r as (
  select id, name from public.dietary_restrictions
)
insert into public.ingredient_restrictions (ingredient_id, restriction_id)
select i.id, r.id
from (values
  ('Queso mozzarella', 'Lactosa'),
  ('Queso cheddar', 'Lactosa'),
  ('Queso parmesano', 'Lactosa'),
  ('Crema agria', 'Lactosa'),
  ('Queso fresco', 'Lactosa'),
  ('Queso turrialba', 'Lactosa'),
  ('Queso de cabra', 'Lactosa'),
  ('Yogurt natural', 'Lactosa'),
  ('Tortilla de trigo', 'Gluten'),
  ('Pasta corta', 'Gluten'),
  ('Pan integral', 'Gluten'),
  ('Pan pita', 'Gluten'),
  ('Pan cuadrado', 'Gluten'),
  ('Pan masa madre', 'Gluten'),
  ('Mani', 'Mani'),
  ('Huevo', 'Huevo'),
  ('Huevo organico', 'Huevo'),
  ('Camaron', 'Mariscos'),
  ('Tofu', 'Soya'),
  ('Tempeh', 'Soya'),
  ('Proteina de soya', 'Soya'),
  ('Almendras', 'Nueces')
) as v(ingredient_name, restriction_name)
join i on i.name = v.ingredient_name
join r on r.name = v.restriction_name
on conflict do nothing;

-- Meal base categories
insert into public.meal_base_categories (name)
values
  ('Bowls'),
  ('Ensaladas'),
  ('Tacos'),
  ('Pastas'),
  ('Tipico'),
  ('Wraps'),
  ('Vegetariano'),
  ('Platos calientes')
on conflict do nothing;

-- Cooking methods
insert into public.cooking_methods (name, price_delta)
values
  ('Plancha', 0.00),
  ('Horno', 0.50),
  ('Salteado', 0.40),
  ('Vapor', 0.30),
  ('Frito', 0.60)
on conflict do nothing;

-- Meal bases
with r as (
  select id, name from public.restaurants
)
insert into public.meal_bases (restaurant_id, name, description, base_price, is_active)
select r.id, v.name, v.description, v.base_price, v.is_active
from (values
  ('Cocina Express Central', 'Bowl de pollo citrico', 'Pollo con granos y vegetales frescos.', 7.50, true),
  ('Cocina Express Central', 'Pasta pesto con verduras', 'Pasta corta con pesto y verduras salteadas.', 7.20, true),
  ('Cocina Express Central', 'Ensalada mediterranea', 'Ensalada con vegetales frescos y queso.', 6.80, true),
  ('Cocina Express Central', 'Tacos de res', 'Tacos de res con vegetales y salsa.', 7.00, true),
  ('Cocina Express Central', 'Bowl de pescado y quinoa', 'Pescado blanco con quinoa y verduras.', 8.20, true),
  ('Cocina Express Central', 'Wrap de pavo y aguacate', 'Wrap con pavo, aguacate y vegetales.', 7.10, true),

  ('Sabores Ticos', 'Casado tradicional', 'Arroz, frijoles, pollo y guarniciones.', 6.90, true),
  ('Sabores Ticos', 'Taco tico', 'Tortilla de maiz con carne y salsa criolla.', 5.90, true),
  ('Sabores Ticos', 'Bowl de arroz y frijoles', 'Arroz con coco, frijoles y proteina.', 6.50, true),
  ('Sabores Ticos', 'Ensalada criolla', 'Ensalada tipica con queso fresco.', 5.50, true),
  ('Sabores Ticos', 'Yuca con cerdo', 'Yuca sancochada con cerdo y chimichurri.', 6.70, true),
  ('Sabores Ticos', 'Tortilla de maiz con pollo', 'Tortilla rellena con pollo y salsa.', 5.80, true),

  ('La Huerta Viva', 'Bowl vegano de quinoa', 'Quinoa con vegetales y salsa tahini.', 7.30, true),
  ('La Huerta Viva', 'Ensalada verde con hummus', 'Mix verde con hummus y vegetales.', 6.40, true),
  ('La Huerta Viva', 'Berenjena al horno', 'Berenjena al horno con salsa de tomate.', 6.60, true),
  ('La Huerta Viva', 'Wrap vegetariano', 'Wrap integral con tofu y vegetales.', 6.80, true),
  ('La Huerta Viva', 'Curry de garbanzos', 'Garbanzos al curry con arroz integral.', 7.10, true),
  ('La Huerta Viva', 'Bowl de tofu salteado', 'Tofu salteado con arroz y vegetales.', 7.00, true)
) as v(restaurant_name, name, description, base_price, is_active)
join r on r.name = v.restaurant_name
on conflict do nothing;

-- Meal base category mapping
with b as (
  select id, name from public.meal_bases
), c as (
  select id, name from public.meal_base_categories
)
insert into public.meal_base_category_map (base_id, category_id)
select b.id, c.id
from (values
  ('Bowl de pollo citrico', 'Bowls'),
  ('Pasta pesto con verduras', 'Pastas'),
  ('Ensalada mediterranea', 'Ensaladas'),
  ('Tacos de res', 'Tacos'),
  ('Bowl de pescado y quinoa', 'Bowls'),
  ('Wrap de pavo y aguacate', 'Wraps'),
  ('Casado tradicional', 'Tipico'),
  ('Taco tico', 'Tacos'),
  ('Bowl de arroz y frijoles', 'Bowls'),
  ('Ensalada criolla', 'Ensaladas'),
  ('Yuca con cerdo', 'Platos calientes'),
  ('Tortilla de maiz con pollo', 'Platos calientes'),
  ('Bowl vegano de quinoa', 'Bowls'),
  ('Ensalada verde con hummus', 'Ensaladas'),
  ('Berenjena al horno', 'Vegetariano'),
  ('Wrap vegetariano', 'Wraps'),
  ('Curry de garbanzos', 'Vegetariano'),
  ('Bowl de tofu salteado', 'Bowls')
) as v(base_name, category_name)
join b on b.name = v.base_name
join c on c.name = v.category_name
on conflict do nothing;

-- Base cooking methods
with b as (
  select id, name from public.meal_bases
), m as (
  select id, name from public.cooking_methods
)
insert into public.base_cooking_methods (base_id, method_id)
select b.id, m.id
from (values
  ('Bowl de pollo citrico', 'Plancha'),
  ('Bowl de pollo citrico', 'Salteado'),
  ('Pasta pesto con verduras', 'Salteado'),
  ('Ensalada mediterranea', 'Vapor'),
  ('Tacos de res', 'Plancha'),
  ('Bowl de pescado y quinoa', 'Plancha'),
  ('Wrap de pavo y aguacate', 'Plancha'),
  ('Casado tradicional', 'Plancha'),
  ('Taco tico', 'Plancha'),
  ('Bowl de arroz y frijoles', 'Plancha'),
  ('Ensalada criolla', 'Vapor'),
  ('Yuca con cerdo', 'Horno'),
  ('Tortilla de maiz con pollo', 'Plancha'),
  ('Bowl vegano de quinoa', 'Vapor'),
  ('Ensalada verde con hummus', 'Vapor'),
  ('Berenjena al horno', 'Horno'),
  ('Wrap vegetariano', 'Plancha'),
  ('Curry de garbanzos', 'Salteado'),
  ('Bowl de tofu salteado', 'Salteado')
) as v(base_name, method_name)
join b on b.name = v.base_name
join m on m.name = v.method_name
on conflict do nothing;

-- Meal base kitchens
with b as (
  select id, name, restaurant_id from public.meal_bases
), k as (
  select id, name, restaurant_id from public.kitchens
)
insert into public.meal_base_kitchens (base_id, kitchen_id, is_available)
select b.id, k.id, true
from (values
  ('Cocina Express Central', 'Cocina Central', 'Bowl de pollo citrico'),
  ('Cocina Express Central', 'Cocina Central', 'Pasta pesto con verduras'),
  ('Cocina Express Central', 'Cocina Central', 'Ensalada mediterranea'),
  ('Cocina Express Central', 'Cocina Central', 'Tacos de res'),
  ('Cocina Express Central', 'Cocina Central', 'Bowl de pescado y quinoa'),
  ('Cocina Express Central', 'Cocina Central', 'Wrap de pavo y aguacate'),
  ('Sabores Ticos', 'Cocina Escalante', 'Casado tradicional'),
  ('Sabores Ticos', 'Cocina Escalante', 'Taco tico'),
  ('Sabores Ticos', 'Cocina Escalante', 'Bowl de arroz y frijoles'),
  ('Sabores Ticos', 'Cocina Santa Ana', 'Ensalada criolla'),
  ('Sabores Ticos', 'Cocina Santa Ana', 'Yuca con cerdo'),
  ('Sabores Ticos', 'Cocina Santa Ana', 'Tortilla de maiz con pollo'),
  ('La Huerta Viva', 'Cocina Los Yoses', 'Bowl vegano de quinoa'),
  ('La Huerta Viva', 'Cocina Los Yoses', 'Ensalada verde con hummus'),
  ('La Huerta Viva', 'Cocina Los Yoses', 'Berenjena al horno'),
  ('La Huerta Viva', 'Cocina Los Yoses', 'Wrap vegetariano'),
  ('La Huerta Viva', 'Cocina Los Yoses', 'Curry de garbanzos'),
  ('La Huerta Viva', 'Cocina Los Yoses', 'Bowl de tofu salteado')
) as v(restaurant_name, kitchen_name, base_name)
join b on b.name = v.base_name
join k on k.name = v.kitchen_name
where b.restaurant_id = k.restaurant_id
on conflict do nothing;

-- Base ingredients
with b as (
  select id, name, restaurant_id from public.meal_bases
), i as (
  select id, name, restaurant_id from public.ingredients
)
insert into public.base_ingredients (base_id, ingredient_id, default_qty, is_removable, is_essential)
select b.id, i.id, v.default_qty, v.is_removable, v.is_essential
from (values
  ('Cocina Express Central', 'Bowl de pollo citrico', 'Pechuga de pollo', 1, false, true),
  ('Cocina Express Central', 'Bowl de pollo citrico', 'Arroz integral', 1, true, true),
  ('Cocina Express Central', 'Bowl de pollo citrico', 'Lechuga romana', 1, true, false),
  ('Cocina Express Central', 'Bowl de pollo citrico', 'Zanahoria rallada', 1, true, false),
  ('Cocina Express Central', 'Bowl de pollo citrico', 'Vinagreta citrica', 1, true, false),
  ('Cocina Express Central', 'Bowl de pollo citrico', 'Aguacate', 1, true, false),

  ('Cocina Express Central', 'Pasta pesto con verduras', 'Pasta corta', 1, false, true),
  ('Cocina Express Central', 'Pasta pesto con verduras', 'Salsa pesto', 1, true, true),
  ('Cocina Express Central', 'Pasta pesto con verduras', 'Brocoli', 1, true, false),
  ('Cocina Express Central', 'Pasta pesto con verduras', 'Pimiento rojo', 1, true, false),
  ('Cocina Express Central', 'Pasta pesto con verduras', 'Queso parmesano', 1, true, false),
  ('Cocina Express Central', 'Pasta pesto con verduras', 'Espinaca', 1, true, false),

  ('Cocina Express Central', 'Ensalada mediterranea', 'Lechuga romana', 1, false, true),
  ('Cocina Express Central', 'Ensalada mediterranea', 'Tomate', 1, true, false),
  ('Cocina Express Central', 'Ensalada mediterranea', 'Pepino', 1, true, false),
  ('Cocina Express Central', 'Ensalada mediterranea', 'Cebolla morada', 1, true, false),
  ('Cocina Express Central', 'Ensalada mediterranea', 'Queso mozzarella', 1, true, false),
  ('Cocina Express Central', 'Ensalada mediterranea', 'Vinagreta citrica', 1, true, false),

  ('Cocina Express Central', 'Tacos de res', 'Tortilla de trigo', 2, false, true),
  ('Cocina Express Central', 'Tacos de res', 'Carne de res', 1, false, true),
  ('Cocina Express Central', 'Tacos de res', 'Cebolla morada', 1, true, false),
  ('Cocina Express Central', 'Tacos de res', 'Pimiento verde', 1, true, false),
  ('Cocina Express Central', 'Tacos de res', 'Salsa picante', 1, true, false),
  ('Cocina Express Central', 'Tacos de res', 'Queso cheddar', 1, true, false),

  ('Cocina Express Central', 'Bowl de pescado y quinoa', 'Pescado blanco', 1, false, true),
  ('Cocina Express Central', 'Bowl de pescado y quinoa', 'Quinoa', 1, false, true),
  ('Cocina Express Central', 'Bowl de pescado y quinoa', 'Espinaca', 1, true, false),
  ('Cocina Express Central', 'Bowl de pescado y quinoa', 'Aguacate', 1, true, false),
  ('Cocina Express Central', 'Bowl de pescado y quinoa', 'Salsa de yogurt', 1, true, false),

  ('Cocina Express Central', 'Wrap de pavo y aguacate', 'Pavo', 1, false, true),
  ('Cocina Express Central', 'Wrap de pavo y aguacate', 'Tortilla de trigo', 1, false, true),
  ('Cocina Express Central', 'Wrap de pavo y aguacate', 'Aguacate', 1, true, false),
  ('Cocina Express Central', 'Wrap de pavo y aguacate', 'Lechuga romana', 1, true, false),
  ('Cocina Express Central', 'Wrap de pavo y aguacate', 'Salsa de yogurt', 1, true, false),

  ('Sabores Ticos', 'Casado tradicional', 'Arroz blanco', 1, false, true),
  ('Sabores Ticos', 'Casado tradicional', 'Frijoles negros', 1, false, true),
  ('Sabores Ticos', 'Casado tradicional', 'Pollo asado', 1, false, true),
  ('Sabores Ticos', 'Casado tradicional', 'Repollo', 1, true, false),
  ('Sabores Ticos', 'Casado tradicional', 'Tomate', 1, true, false),
  ('Sabores Ticos', 'Casado tradicional', 'Platano verde', 1, true, false),
  ('Sabores Ticos', 'Casado tradicional', 'Salsa lizano', 1, true, false),

  ('Sabores Ticos', 'Taco tico', 'Tortilla de maiz', 2, false, true),
  ('Sabores Ticos', 'Taco tico', 'Carne molida', 1, false, true),
  ('Sabores Ticos', 'Taco tico', 'Repollo', 1, true, false),
  ('Sabores Ticos', 'Taco tico', 'Tomate', 1, true, false),
  ('Sabores Ticos', 'Taco tico', 'Salsa criolla', 1, true, false),

  ('Sabores Ticos', 'Bowl de arroz y frijoles', 'Arroz con coco', 1, false, true),
  ('Sabores Ticos', 'Bowl de arroz y frijoles', 'Frijoles rojos', 1, false, true),
  ('Sabores Ticos', 'Bowl de arroz y frijoles', 'Chorizo criollo', 1, false, true),
  ('Sabores Ticos', 'Bowl de arroz y frijoles', 'Chile dulce', 1, true, false),
  ('Sabores Ticos', 'Bowl de arroz y frijoles', 'Culantro', 1, true, false),

  ('Sabores Ticos', 'Ensalada criolla', 'Lechuga', 1, false, true),
  ('Sabores Ticos', 'Ensalada criolla', 'Tomate', 1, true, false),
  ('Sabores Ticos', 'Ensalada criolla', 'Cebolla blanca', 1, true, false),
  ('Sabores Ticos', 'Ensalada criolla', 'Culantro', 1, true, false),
  ('Sabores Ticos', 'Ensalada criolla', 'Queso fresco', 1, true, false),
  ('Sabores Ticos', 'Ensalada criolla', 'Salsa criolla', 1, true, false),

  ('Sabores Ticos', 'Yuca con cerdo', 'Yuca sancochada', 1, false, true),
  ('Sabores Ticos', 'Yuca con cerdo', 'Lomo de cerdo', 1, false, true),
  ('Sabores Ticos', 'Yuca con cerdo', 'Chimichurri', 1, true, false),
  ('Sabores Ticos', 'Yuca con cerdo', 'Repollo', 1, true, false),
  ('Sabores Ticos', 'Yuca con cerdo', 'Zanahoria', 1, true, false),

  ('Sabores Ticos', 'Tortilla de maiz con pollo', 'Tortilla de maiz', 2, false, true),
  ('Sabores Ticos', 'Tortilla de maiz con pollo', 'Pollo asado', 1, false, true),
  ('Sabores Ticos', 'Tortilla de maiz con pollo', 'Salsa lizano', 1, true, false),
  ('Sabores Ticos', 'Tortilla de maiz con pollo', 'Cebolla blanca', 1, true, false),
  ('Sabores Ticos', 'Tortilla de maiz con pollo', 'Culantro', 1, true, false),

  ('La Huerta Viva', 'Bowl vegano de quinoa', 'Quinoa', 1, false, true),
  ('La Huerta Viva', 'Bowl vegano de quinoa', 'Garbanzos', 1, false, true),
  ('La Huerta Viva', 'Bowl vegano de quinoa', 'Kale', 1, true, false),
  ('La Huerta Viva', 'Bowl vegano de quinoa', 'Tomate cherry', 1, true, false),
  ('La Huerta Viva', 'Bowl vegano de quinoa', 'Salsa tahini', 1, true, false),
  ('La Huerta Viva', 'Bowl vegano de quinoa', 'Aguacate', 1, true, false),

  ('La Huerta Viva', 'Ensalada verde con hummus', 'Espinaca baby', 1, false, true),
  ('La Huerta Viva', 'Ensalada verde con hummus', 'Kale', 1, true, false),
  ('La Huerta Viva', 'Ensalada verde con hummus', 'Pepino', 1, true, false),
  ('La Huerta Viva', 'Ensalada verde con hummus', 'Hummus', 1, true, false),
  ('La Huerta Viva', 'Ensalada verde con hummus', 'Tomate cherry', 1, true, false),

  ('La Huerta Viva', 'Berenjena al horno', 'Berenjena', 1, false, true),
  ('La Huerta Viva', 'Berenjena al horno', 'Salsa de tomate', 1, true, false),
  ('La Huerta Viva', 'Berenjena al horno', 'Queso de cabra', 1, true, false),
  ('La Huerta Viva', 'Berenjena al horno', 'Oregano', 1, true, false),
  ('La Huerta Viva', 'Berenjena al horno', 'Aceite de oliva', 1, true, false),

  ('La Huerta Viva', 'Wrap vegetariano', 'Pan pita integral', 1, false, true),
  ('La Huerta Viva', 'Wrap vegetariano', 'Tofu', 1, false, true),
  ('La Huerta Viva', 'Wrap vegetariano', 'Espinaca baby', 1, true, false),
  ('La Huerta Viva', 'Wrap vegetariano', 'Tomate cherry', 1, true, false),
  ('La Huerta Viva', 'Wrap vegetariano', 'Salsa de aguacate', 1, true, false),

  ('La Huerta Viva', 'Curry de garbanzos', 'Garbanzos', 1, false, true),
  ('La Huerta Viva', 'Curry de garbanzos', 'Calabacin', 1, true, false),
  ('La Huerta Viva', 'Curry de garbanzos', 'Champinon', 1, true, false),
  ('La Huerta Viva', 'Curry de garbanzos', 'Curcuma', 1, true, false),
  ('La Huerta Viva', 'Curry de garbanzos', 'Arroz integral', 1, true, false),

  ('La Huerta Viva', 'Bowl de tofu salteado', 'Tofu', 1, false, true),
  ('La Huerta Viva', 'Bowl de tofu salteado', 'Arroz integral', 1, false, true),
  ('La Huerta Viva', 'Bowl de tofu salteado', 'Maiz dulce', 1, true, false),
  ('La Huerta Viva', 'Bowl de tofu salteado', 'Salsa de tomate', 1, true, false),
  ('La Huerta Viva', 'Bowl de tofu salteado', 'Aceite de oliva', 1, true, false)
) as v(restaurant_name, base_name, ingredient_name, default_qty, is_removable, is_essential)
join b on b.name = v.base_name
join i on i.name = v.ingredient_name
where b.restaurant_id = i.restaurant_id
on conflict do nothing;
