import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchSavedMeals,
  fetchSavedMeal,
  createSavedMeal,
  updateSavedMeal,
  deleteSavedMeal,
  addSavedMealToCart,
  createRecurringFromSavedMeal,
} from '@/lib/saved-meals';

export const savedMealsQueryKey = ['saved-meals'];
export const savedMealQueryKey = (id: string) => ['saved-meals', id];

export function useSavedMeals(accessToken?: string) {
  return useQuery({
    queryKey: savedMealsQueryKey,
    queryFn: () => fetchSavedMeals(accessToken),
    enabled: !!accessToken,
  });
}

export function useSavedMeal(id: string, accessToken?: string) {
  return useQuery({
    queryKey: savedMealQueryKey(id),
    queryFn: () => fetchSavedMeal(id, accessToken),
    enabled: !!id && !!accessToken,
  });
}

export function useCreateSavedMeal(accessToken?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      name: string;
      meal_base_id: string;
      customizations: { ingredient_id: string; action: string; qty?: number }[];
    }) => createSavedMeal(params, accessToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: savedMealsQueryKey });
    },
  });
}

export function useUpdateSavedMeal(accessToken?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      params,
    }: {
      id: string;
      params: {
        name?: string;
        customizations?: { ingredient_id: string; action: string; qty?: number }[];
      };
    }) => updateSavedMeal(id, params, accessToken),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: savedMealsQueryKey });
      queryClient.invalidateQueries({ queryKey: savedMealQueryKey(id) });
    },
  });
}

export function useDeleteSavedMeal(accessToken?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSavedMeal(id, accessToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: savedMealsQueryKey });
    },
  });
}

export function useAddSavedMealToCart(accessToken?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity?: number }) =>
      addSavedMealToCart(id, { quantity }, accessToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

export function useCreateRecurringFromSavedMeal(accessToken?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      params,
    }: {
      id: string;
      params: {
        frequency: string;
        next_run_at: string;
        delivery_address_id?: string;
        payment_method_id?: string;
        currency_code: string;
      };
    }) => createRecurringFromSavedMeal(id, params, accessToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-orders'] });
    },
  });
}
