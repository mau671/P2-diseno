import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { processPayment, fetchPaymentHistory } from '@/lib/payments';
import { orderQueryKey, orderTrackingQueryKey, ordersQueryKey } from '@/hooks/use-orders';

export const paymentHistoryQueryKey = ['payments', 'history'];

export function usePaymentHistory(
  params: { page?: number; limit?: number },
  accessToken?: string
) {
  return useQuery({
    queryKey: [...paymentHistoryQueryKey, params],
    queryFn: () => fetchPaymentHistory(params, accessToken),
    enabled: !!accessToken,
  });
}

export function useProcessPayment(accessToken?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      order_id: string;
      payment_method_id: string;
      amount: number;
      currency_code: string;
    }) => processPayment(params, accessToken),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ordersQueryKey });
      queryClient.invalidateQueries({ queryKey: orderQueryKey(variables.order_id) });
      queryClient.invalidateQueries({ queryKey: orderTrackingQueryKey(variables.order_id) });
    },
  });
}
