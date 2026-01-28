import { apiRequest } from './api';

export type Ingredient = {
  id: string;
  name: string;
  category_id: string;
  category_name: string;
  unit_price: number;
  stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type PaginationParams = {
  page?: number;
  pageSize?: number;
};

export async function fetchIngredients(
  params: PaginationParams & {
    search?: string;
    category?: string;
    restaurantId: string;
    isActive?: boolean;
    sort?: string;
    order?: string;
  },
  accessToken?: string
): Promise<{
  items: Ingredient[];
  page: number;
  page_size: number;
  total: number;
}> {
  const query = new URLSearchParams();
  query.set('restaurant_id', params.restaurantId);
  if (params.search) query.set('search', params.search);
  if (params.category) query.set('category', params.category);
  if (params.isActive !== undefined) query.set('is_active', String(params.isActive));
  if (params.sort) query.set('sort', params.sort);
  if (params.order) query.set('order', params.order);
  query.set('page', String(params.page ?? 1));
  query.set('page_size', String(params.pageSize ?? 20));

  return apiRequest(`/ingredients?${query.toString()}`, {}, accessToken);
}

export async function fetchIngredient(
  id: string,
  restaurantId: string,
  accessToken?: string
): Promise<{ ingredient: Ingredient }> {
  return apiRequest(`/ingredients/${id}?restaurant_id=${restaurantId}`, {}, accessToken);
}
