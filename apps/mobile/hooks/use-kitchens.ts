import { useQuery } from '@tanstack/react-query';
import { fetchKitchens, fetchKitchen, type PaginationParams } from '@/lib/kitchens';

export const kitchensQueryKey = ['kitchens'];
export const kitchenQueryKey = (id: string) => ['kitchens', id];

export function useKitchens(
  params: PaginationParams & { restaurantId?: string; status?: string },
  accessToken?: string
) {
  return useQuery({
    queryKey: [...kitchensQueryKey, params],
    queryFn: () => fetchKitchens(params, accessToken),
  });
}

export function useKitchen(id: string, accessToken?: string) {
  return useQuery({
    queryKey: kitchenQueryKey(id),
    queryFn: () => fetchKitchen(id, accessToken),
    enabled: !!id,
  });
}
