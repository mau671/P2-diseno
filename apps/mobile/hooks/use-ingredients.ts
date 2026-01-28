import { useQuery } from '@tanstack/react-query';
import { fetchIngredients, fetchIngredient, type PaginationParams } from '@/lib/ingredients';

export const ingredientsQueryKey = ['ingredients'];
export const ingredientQueryKey = (id: string) => ['ingredients', id];

export function useIngredients(
  params: PaginationParams & {
    search?: string;
    category?: string;
    restaurantId: string;
    isActive?: boolean;
    sort?: string;
    order?: string;
  },
  accessToken?: string
) {
  return useQuery({
    queryKey: [...ingredientsQueryKey, params],
    queryFn: () => fetchIngredients(params, accessToken),
    enabled: !!params.restaurantId,
  });
}

export function useIngredient(id: string, restaurantId: string, accessToken?: string) {
  return useQuery({
    queryKey: ingredientQueryKey(id),
    queryFn: () => fetchIngredient(id, restaurantId, accessToken),
    enabled: !!id && !!restaurantId,
  });
}
