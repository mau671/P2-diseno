import { apiRequest } from './api';

export type CartItemCustomization = {
  id: string;
  ingredient_id: string;
  ingredient_name: string;
  action: string;
  qty: number;
  delta_price: number;
};

export type CartItem = {
  id: string;
  base_id: string;
  cooking_method_id?: string | null;
  base_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  customizations: CartItemCustomization[];
  restriction_warnings: {
    restriction_id: string;
    restriction_name: string;
    ingredient_id: string;
    ingredient_name: string;
  }[];
};

export type Cart = {
  id: string;
  restaurant_id: string;
  status: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  item_count: number;
  created_at: string;
  updated_at: string;
};

export type CartSummary = {
  has_active_cart: boolean;
  cart_id: string;
  item_count: number;
  subtotal: number;
};

export type AddToCartParams = {
  meal_base_id: string;
  cooking_method_id?: string;
  quantity?: number;
  added_ingredients?: { ingredient_id: string; qty?: number }[];
  removed_ingredients?: { ingredient_id: string; qty?: number }[];
};

export type UpdateCartItemParams = {
  quantity?: number;
  added_ingredients?: { ingredient_id: string; qty?: number }[];
  removed_ingredients?: { ingredient_id: string; qty?: number }[];
};

export async function fetchCart(accessToken?: string): Promise<{ cart: Cart | null }> {
  return apiRequest('/cart', {}, accessToken);
}

export async function fetchCartSummary(accessToken?: string): Promise<CartSummary> {
  return apiRequest('/cart/summary', {}, accessToken);
}

export async function addToCart(
  params: AddToCartParams,
  accessToken?: string
): Promise<{ cart: Cart }> {
  return apiRequest('/cart/items', {
    method: 'POST',
    body: JSON.stringify(params),
  }, accessToken);
}

export async function updateCartItem(
  itemId: string,
  params: UpdateCartItemParams,
  accessToken?: string
): Promise<{ cart: Cart }> {
  return apiRequest(`/cart/items/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify(params),
  }, accessToken);
}

export async function removeCartItem(itemId: string, accessToken?: string): Promise<{ cart: Cart }> {
  return apiRequest(`/cart/items/${itemId}`, {
    method: 'DELETE',
  }, accessToken);
}

export async function clearCart(accessToken?: string): Promise<void> {
  return apiRequest('/cart', {
    method: 'DELETE',
  }, accessToken);
}

export async function validateCart(accessToken?: string): Promise<{
  valid: boolean;
  price_updates: { item_id: string; old_unit_price: number; new_unit_price: number; delta: number }[];
  cart: Cart;
}> {
  return apiRequest('/cart/validate', {
    method: 'POST',
  }, accessToken);
}
