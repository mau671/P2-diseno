import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPaymentMethod,
  deletePaymentMethod,
  fetchPaymentMethods,
  setDefaultPaymentMethod,
  updatePaymentMethod,
  type CreatePaymentMethodPayload,
  type UpdatePaymentMethodPayload,
} from "@/api/payment-methods";

export const paymentMethodsQueryKey = ["payment-methods"];

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
      void queryClient.invalidateQueries({ queryKey: paymentMethodsQueryKey });
    },
  });
}

export function useUpdatePaymentMethod(accessToken?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePaymentMethodPayload }) =>
      updatePaymentMethod(id, payload, accessToken),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: paymentMethodsQueryKey });
    },
  });
}

export function useDeletePaymentMethod(accessToken?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePaymentMethod(id, accessToken),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: paymentMethodsQueryKey });
    },
  });
}

export function useSetDefaultPaymentMethod(accessToken?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => setDefaultPaymentMethod(id, accessToken),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: paymentMethodsQueryKey });
    },
  });
}
