import { apiRequest } from './api';

export type Restaurant = {
  id: string;
  name: string;
  legal_name: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type RestaurantDetail = Restaurant & {
  currencies: { currency_code: string; is_default: boolean }[];
  kitchens: {
    id: string;
    name: string;
    status: string;
    address: {
      line1: string | null;
      line2: string | null;
      postal_code: string | null;
      city: string | null;
      region: string | null;
      country: string | null;
    } | null;
  }[];
};

export type MenuCategory = {
  id: string;
  name: string;
  bases: {
    id: string;
    name: string;
    description: string | null;
    image_asset_id?: string | null;
    image_url?: string | null;
    base_price: number;
    is_active: boolean;
  }[];
};

export type RestaurantMenu = {
  restaurant_id: string;
  categories: MenuCategory[];
};

export type PaginationParams = {
  page?: number;
  limit?: number;
};

export async function fetchRestaurants(
  params: PaginationParams & { search?: string; status?: string },
  accessToken?: string
): Promise<{ restaurants: Restaurant[]; pagination: { page: number; limit: number; total: number } }> {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.status) query.set('status', params.status);
  query.set('page', String(params.page ?? 1));
  query.set('limit', String(params.limit ?? 20));

  return apiRequest(`/restaurants?${query.toString()}`, {}, accessToken);
}

export async function fetchRestaurant(
  id: string,
  accessToken?: string
): Promise<{ restaurant: RestaurantDetail }> {
  return apiRequest(`/restaurants/${id}`, {}, accessToken);
}

export async function fetchRestaurantMenu(
  id: string,
  accessToken?: string
): Promise<{ menu: RestaurantMenu }> {
  return apiRequest(`/restaurants/${id}/menu`, {}, accessToken);
}
