import { apiRequest } from './api';

export type Kitchen = {
  id: string;
  name: string;
  status: string;
  restaurant_id: string;
  restaurant_name: string;
  address: {
    line1: string | null;
    line2: string | null;
    postal_code: string | null;
    city: string | null;
    region: string | null;
    country: string | null;
  } | null;
};

export type PaginationParams = {
  page?: number;
  limit?: number;
};

export async function fetchKitchens(
  params: PaginationParams & { restaurantId?: string; status?: string },
  accessToken?: string
): Promise<{ kitchens: Kitchen[]; pagination: { page: number; limit: number; total: number } }> {
  const query = new URLSearchParams();
  if (params.restaurantId) query.set('restaurantId', params.restaurantId);
  if (params.status) query.set('status', params.status);
  query.set('page', String(params.page ?? 1));
  query.set('limit', String(params.limit ?? 20));

  return apiRequest(`/kitchens?${query.toString()}`, {}, accessToken);
}

export async function fetchKitchen(
  id: string,
  accessToken?: string
): Promise<{ kitchen: Kitchen }> {
  return apiRequest(`/kitchens/${id}`, {}, accessToken);
}
