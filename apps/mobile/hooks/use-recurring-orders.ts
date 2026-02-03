import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deleteRecurringOrder,
  fetchRecurringOrders,
  runRecurringOrder,
  skipRecurringOrder,
  updateRecurringOrder,
  updateRecurringOrderStatus
} from '@/lib/recurring-orders';

export const recurringOrdersQueryKey = ['recurring-orders'];

export function useRecurringOrders(accessToken?: string) {
  return useQuery({
    queryKey: recurringOrdersQueryKey,
    queryFn: () => fetchRecurringOrders(accessToken),
    enabled: !!accessToken,
  });
}

export function useUpdateRecurringOrderStatus(accessToken?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateRecurringOrderStatus(id, status, accessToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringOrdersQueryKey });
    },
  });
}

export function useRunRecurringOrder(accessToken?: string) {
  return useMutation({
    mutationFn: (id: string) => runRecurringOrder(id, accessToken),
  });
}

export function useSkipRecurringOrder(accessToken?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => skipRecurringOrder(id, accessToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringOrdersQueryKey });
    },
  });
}

export function useDeleteRecurringOrder(accessToken?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRecurringOrder(id, accessToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringOrdersQueryKey });
    },
  });
}

export function useUpdateRecurringOrder(accessToken?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      params,
    }: {
      id: string;
      params: {
        interval_unit?: string;
        interval_value?: number;
        days_of_week?: number[];
        days_of_month?: number[];
        time_windows?: { start: string; end: string }[];
        next_run_at?: string;
        end_date?: string | null;
        delivery_address_id?: string | null;
        payment_method_id?: string | null;
        status?: string;
      };
    }) =>
      updateRecurringOrder(id, params, accessToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringOrdersQueryKey });
    },
  });
}
