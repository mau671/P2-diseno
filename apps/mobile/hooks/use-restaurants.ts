import { useQuery } from '@tanstack/react-query';
import { fetchRestaurants, fetchRestaurant, fetchRestaurantMenu, type PaginationParams } from '@/lib/restaurants';

export const restaurantsQueryKey = ['restaurants'];
export const restaurantQueryKey = (id: string) => ['restaurants', id];
export const restaurantMenuQueryKey = (id: string) => ['restaurants', id, 'menu'];

export function useRestaurants(
  params: PaginationParams & { search?: string; status?: string },
  accessToken?: string
) {
  return useQuery({
    queryKey: [...restaurantsQueryKey, params],
    queryFn: () => fetchRestaurants(params, accessToken),
  });
}

export function useRestaurant(id: string, accessToken?: string) {
  return useQuery({
    queryKey: restaurantQueryKey(id),
    queryFn: () => fetchRestaurant(id, accessToken),
    enabled: !!id,
  });
}

export function useRestaurantMenu(id: string, accessToken?: string) {
  return useQuery({
    queryKey: restaurantMenuQueryKey(id),
    queryFn: () => fetchRestaurantMenu(id, accessToken),
    enabled: !!id,
  });
}
