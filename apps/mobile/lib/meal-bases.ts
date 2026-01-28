import { apiRequest } from './api';

export type MealBase = {
  id: string;
  restaurant_id: string;
  restaurant_name: string;
  name: string;
  description: string | null;
  image_asset_id: string | null;
  base_price: number;
  is_active: boolean;
  categories: { id: string; name: string }[];
  restriction_warnings: {
    restriction_id: string;
    restriction_name: string;
    ingredient_name: string;
  }[];
  matches_user_restrictions: boolean;
};

export type MealBaseDetail = {
  id: string;
  restaurant_id: string;
  restaurant_name: string;
  name: string;
  description: string | null;
  image_asset_id: string | null;
  base_price: number;
  is_active: boolean;
  categories: { id: string; name: string }[];
  cooking_methods: { id: string; name: string; price_delta: number }[];
  base_ingredients: {
    ingredient_id: string;
    ingredient_name: string;
    category_id: string;
    category_name: string;
    unit_price: number;
    default_qty: number;
    is_removable: boolean;
    is_essential: boolean;
  }[];
  extra_ingredients: {
    ingredient_id: string;
    ingredient_name: string;
    category_id: string;
    category_name: string;
    unit_price: number;
  }[];
  restriction_warnings: {
    restriction_id: string;
    restriction_name: string;
    ingredient_name: string;
  }[];
  matches_user_restrictions: boolean;
};

export type CustomizationOptions = {
  base_price: number;
  cooking_methods: { id: string; name: string; price_delta: number }[];
  removable_ingredients: {
    ingredient_id: string;
    ingredient_name: string;
    category_id: string;
    category_name: string;
    unit_price: number;
    default_qty: number;
    is_removable: boolean;
    is_essential: boolean;
  }[];
  extra_ingredients: {
    ingredient_id: string;
    ingredient_name: string;
    category_id: string;
    category_name: string;
    unit_price: number;
  }[];
};

export type PriceCalculation = {
  base_price: number;
  cooking_method_delta: number;
  removed_discounts: number;
  added_charges: number;
  quantity: number;
  subtotal: number;
  tax: number;
  total: number;
  currency_code: string | null;
};

export type PaginationParams = {
  page?: number;
  limit?: number;
};

export async function fetchMealBases(
  params: PaginationParams & {
    search?: string;
    restaurantId?: string;
    kitchenId?: string;
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    isAvailable?: boolean;
  },
  accessToken?: string
): Promise<{ meal_bases: MealBase[]; pagination: { page: number; limit: number; total: number } }> {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.restaurantId) query.set('restaurantId', params.restaurantId);
  if (params.kitchenId) query.set('kitchenId', params.kitchenId);
  if (params.categoryId) query.set('categoryId', params.categoryId);
  if (params.minPrice !== undefined) query.set('minPrice', String(params.minPrice));
  if (params.maxPrice !== undefined) query.set('maxPrice', String(params.maxPrice));
  if (params.isAvailable !== undefined) query.set('isAvailable', String(params.isAvailable));
  query.set('page', String(params.page ?? 1));
  query.set('limit', String(params.limit ?? 20));

  return apiRequest(`/meal-bases?${query.toString()}`, {}, accessToken);
}

export async function fetchMealBase(
  id: string,
  accessToken?: string
): Promise<{ meal_base: MealBaseDetail }> {
  return apiRequest(`/meal-bases/${id}`, {}, accessToken);
}

export async function fetchCustomizationOptions(
  id: string,
  accessToken?: string
): Promise<{ customization_options: CustomizationOptions }> {
  return apiRequest(`/meal-bases/${id}/customization-options`, {}, accessToken);
}

export async function calculatePrice(
  id: string,
  params: {
    quantity?: number;
    cooking_method_id?: string;
    removed_ingredients?: { ingredient_id: string }[];
    added_ingredients?: { ingredient_id: string; qty?: number }[];
  },
  accessToken?: string
): Promise<PriceCalculation> {
  return apiRequest(`/meal-bases/${id}/calculate-price`, {
    method: 'POST',
    body: JSON.stringify(params),
  }, accessToken);
}
