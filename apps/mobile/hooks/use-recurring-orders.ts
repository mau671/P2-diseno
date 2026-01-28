import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchRecurringOrders, runRecurringOrder, updateRecurringOrderStatus } from '@/lib/recurring-orders';

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
