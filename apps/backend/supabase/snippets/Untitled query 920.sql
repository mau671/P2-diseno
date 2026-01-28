ALTER TABLE cart_items
  ADD COLUMN cooking_method_id uuid REFERENCES cooking_methods(id);

ALTER TABLE order_items
  ADD COLUMN cooking_method_id uuid REFERENCES cooking_methods(id);

ALTER TABLE recurring_order_items
  ADD COLUMN cooking_method_id uuid REFERENCES cooking_methods(id);

ALTER TABLE saved_meals
  ADD COLUMN cooking_method_id uuid REFERENCES cooking_methods(id);
