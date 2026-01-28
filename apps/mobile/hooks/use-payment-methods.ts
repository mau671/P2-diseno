import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createPaymentMethod,
  fetchPaymentMethods,
  type CreatePaymentMethodPayload,
} from '@/lib/payment-methods';

export const paymentMethodsQueryKey = ['payment-methods'];

export function usePaymentMethods(accessToken?: string) {
  return useQuery({
    queryKey: paymentMethodsQueryKey,
    queryFn: () => fetchPaymentMethods(accessToken),
    enabled: !!accessToken,
  });
}

export function useCreatePaymentMethod(accessToken?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePaymentMethodPayload) => createPaymentMethod(payload, accessToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentMethodsQueryKey });
    },
  });
}
