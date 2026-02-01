import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  calculatePrice,
  createMealBase,
  deleteMealBase,
  fetchCustomizationOptions,
  fetchMealBaseById,
  fetchMealBases,
  updateMealBase,
  type CalculatePricePayload,
  type CreateMealBasePayload,
  type MealBasesQueryParams,
  type UpdateMealBasePayload,
} from "@/api/meal-bases";

/* =======================
   Query Keys
======================= */

export const mealBasesQueryKey = {
  all: ["meal-bases"] as const,
  list: (params: MealBasesQueryParams) => ["meal-bases", params] as const,
  detail: (id: string) => ["meal-bases", "detail", id] as const,
  customization: (id: string) => ["meal-bases", "customization", id] as const,
};

/* =======================
   Queries
======================= */

export function useMealBasesList(
  params: MealBasesQueryParams,
  accessToken?: string
) {
  return useQuery({
    queryKey: mealBasesQueryKey.list(params),
    queryFn: () => fetchMealBases(params, accessToken),
    enabled: !!accessToken,
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
  });
}

export function useMealBaseDetail(id: string, accessToken?: string) {
  return useQuery({
    queryKey: mealBasesQueryKey.detail(id),
    queryFn: () => fetchMealBaseById(id, accessToken),
    enabled: !!accessToken && !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCustomizationOptions(id: string, accessToken?: string) {
  return useQuery({
    queryKey: mealBasesQueryKey.customization(id),
    queryFn: () => fetchCustomizationOptions(id, accessToken),
    enabled: !!accessToken && !!id,
    staleTime: 1000 * 60 * 5,
  });
}

/* =======================
   Mutations
======================= */

export function useCalculatePrice(id: string, accessToken?: string) {
  return useMutation({
    mutationFn: (payload: CalculatePricePayload) =>
      calculatePrice(id, payload, accessToken),
  });
}

export function useCreateMealBase(accessToken?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateMealBasePayload) =>
      createMealBase(payload, accessToken),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: mealBasesQueryKey.all,
      });
    },
  });
}

export function useUpdateMealBase(accessToken?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateMealBasePayload;
    }) => updateMealBase(id, payload, accessToken),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: mealBasesQueryKey.all });
      void queryClient.invalidateQueries({
        queryKey: mealBasesQueryKey.detail(id),
      });
      void queryClient.invalidateQueries({
        queryKey: mealBasesQueryKey.customization(id),
      });
    },
  });
}

export function useDeleteMealBase(accessToken?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteMealBase(id, accessToken),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: mealBasesQueryKey.all,
      });
    },
  });
}
