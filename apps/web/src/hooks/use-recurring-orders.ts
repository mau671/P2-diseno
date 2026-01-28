import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createRecurringOrder,
  fetchRecurringOrders,
  runRecurringOrder,
  updateRecurringOrder,
  updateRecurringOrderStatus,
  type CreateRecurringOrderPayload,
  type UpdateRecurringOrderPayload,
} from "@/api/recurring-orders";

export const recurringOrdersQueryKey = ["recurring-orders"];

export function useRecurringOrders(accessToken?: string) {
  return useQuery({
    queryKey: recurringOrdersQueryKey,
    queryFn: () => fetchRecurringOrders(accessToken),
    enabled: !!accessToken,
  });
}

export function useCreateRecurringOrder(accessToken?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRecurringOrderPayload) => createRecurringOrder(payload, accessToken),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: recurringOrdersQueryKey });
    },
  });
}

export function useUpdateRecurringOrder(accessToken?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateRecurringOrderPayload }) =>
      updateRecurringOrder(id, payload, accessToken),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: recurringOrdersQueryKey });
    },
  });
}

export function useUpdateRecurringOrderStatus(accessToken?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateRecurringOrderStatus(id, status, accessToken),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: recurringOrdersQueryKey });
    },
  });
}

export function useRunRecurringOrder(accessToken?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => runRecurringOrder(id, accessToken),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: recurringOrdersQueryKey });
    },
  });
}
