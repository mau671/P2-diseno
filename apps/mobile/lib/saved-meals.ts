import { apiRequest } from './api';

export type SavedMealCustomization = {
  id: string;
  ingredient_id: string;
  ingredient_name: string;
  action: string;
  qty: number;
  delta_price: number;
};

export type SavedMeal = {
  id: string;
  name: string;
  base_id: string;
  base_name: string;
  created_at: string;
};

export type SavedMealDetail = {
  id: string;
  name: string;
  base_id: string;
  base_name: string;
  base_price: number;
  cooking_method_id?: string | null;
  created_at: string;
  customizations: SavedMealCustomization[];
};

export type CreateSavedMealParams = {
  name: string;
  meal_base_id: string;
  cooking_method_id?: string;
  customizations: {
    ingredient_id: string;
    action: string;
    qty?: number;
  }[];
};

export type UpdateSavedMealParams = {
  name?: string;
  customizations?: {
    ingredient_id: string;
    action: string;
    qty?: number;
  }[];
};

export async function fetchSavedMeals(accessToken?: string): Promise<{ saved_meals: SavedMeal[] }> {
  return apiRequest('/saved-meals', {}, accessToken);
}

export async function fetchSavedMeal(
  id: string,
  accessToken?: string
): Promise<{ saved_meal: SavedMealDetail }> {
  return apiRequest(`/saved-meals/${id}`, {}, accessToken);
}

export async function createSavedMeal(
  params: CreateSavedMealParams,
  accessToken?: string
): Promise<{ saved_meal_id: string }> {
  return apiRequest('/saved-meals', {
    method: 'POST',
    body: JSON.stringify(params),
  }, accessToken);
}

export async function updateSavedMeal(
  id: string,
  params: UpdateSavedMealParams,
  accessToken?: string
): Promise<{ saved_meal_id: string }> {
  return apiRequest(`/saved-meals/${id}`, {
    method: 'PUT',
    body: JSON.stringify(params),
  }, accessToken);
}

export async function deleteSavedMeal(id: string, accessToken?: string): Promise<void> {
  return apiRequest(`/saved-meals/${id}`, {
    method: 'DELETE',
  }, accessToken);
}

export async function addSavedMealToCart(
  id: string,
  params: { quantity?: number },
  accessToken?: string
): Promise<{ success: boolean }> {
  return apiRequest(`/saved-meals/${id}/add-to-cart`, {
    method: 'POST',
    body: JSON.stringify(params),
  }, accessToken);
}

export async function createRecurringFromSavedMeal(
  id: string,
  params: {
    interval_unit: string;
    interval_value: number;
    days_of_week: number[];
    days_of_month: number[];
    time_windows: { start: string; end: string }[];
    next_run_at: string;
    delivery_address_id?: string;
    payment_method_id?: string;
    currency_code: string;
  },
  accessToken?: string
): Promise<{ recurring_order_id: string }> {
  return apiRequest(`/saved-meals/${id}/create-recurring`, {
    method: 'POST',
    body: JSON.stringify(params),
  }, accessToken);
}
