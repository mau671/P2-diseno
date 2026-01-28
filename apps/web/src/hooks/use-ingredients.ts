import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createIngredient,
  deleteIngredient,
  fetchIngredients,
  updateIngredient,
  type CreateIngredientPayload,
  type IngredientsQueryParams,
  type UpdateIngredientPayload,
} from "@/api/ingredients";

export const ingredientsQueryKey = (params: IngredientsQueryParams) => ["ingredients", params];

export function useIngredientsList(params: IngredientsQueryParams, accessToken?: string) {
  return useQuery({
    queryKey: ingredientsQueryKey(params),
    queryFn: () => fetchIngredients(params, accessToken),
    enabled: !!accessToken && !!params.restaurant_id,
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
  });
}

export function useCreateIngredient(accessToken?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateIngredientPayload) => createIngredient(payload, accessToken),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["ingredients"] });
    },
  });
}

export function useUpdateIngredient(accessToken?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateIngredientPayload }) =>
      updateIngredient(id, payload, accessToken),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["ingredients"] });
    },
  });
}

export function useDeleteIngredient(accessToken?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteIngredient(id, accessToken),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["ingredients"] });
    },
  });
}
