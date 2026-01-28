import { useQuery, useMutation } from '@tanstack/react-query';
import { processPayment, fetchPaymentHistory } from '@/lib/payments';

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
  return useMutation({
    mutationFn: (params: {
      order_id: string;
      payment_method_id: string;
      amount: number;
      currency_code: string;
    }) => processPayment(params, accessToken),
  });
}
