import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchMealBases,
  fetchMealBase,
  fetchCustomizationOptions,
  calculatePrice,
  type PaginationParams,
} from '@/lib/meal-bases';

export const mealBasesQueryKey = ['meal-bases'];
export const mealBaseQueryKey = (id: string) => ['meal-bases', id];
export const mealBaseCustomizationQueryKey = (id: string) => ['meal-bases', id, 'customization'];

export function useMealBases(
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
) {
  return useQuery({
    queryKey: [...mealBasesQueryKey, params],
    queryFn: () => fetchMealBases(params, accessToken),
  });
}

export function useMealBase(id: string, accessToken?: string) {
  return useQuery({
    queryKey: mealBaseQueryKey(id),
    queryFn: () => fetchMealBase(id, accessToken),
    enabled: !!id,
  });
}

export function useCustomizationOptions(id: string, accessToken?: string) {
  return useQuery({
    queryKey: mealBaseCustomizationQueryKey(id),
    queryFn: () => fetchCustomizationOptions(id, accessToken),
    enabled: !!id,
  });
}

export function useCalculatePrice(id: string, accessToken?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      quantity?: number;
      cooking_method_id?: string;
      removed_ingredients?: { ingredient_id: string }[];
      added_ingredients?: { ingredient_id: string; qty?: number }[];
    }) => calculatePrice(id, params, accessToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}
