import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAddress,
  deleteAddress,
  fetchAddresses,
  setDefaultAddress,
  updateAddress,
  type CreateAddressPayload,
  type UpdateAddressPayload,
} from "@/api/addresses";

export const addressesQueryKey = ["addresses"];

export function useAddresses(accessToken?: string) {
  return useQuery({
    queryKey: addressesQueryKey,
    queryFn: () => fetchAddresses(accessToken),
    enabled: !!accessToken,
  });
}

export function useCreateAddress(accessToken?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAddressPayload) => createAddress(payload, accessToken),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: addressesQueryKey });
    },
  });
}

export function useUpdateAddress(accessToken?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAddressPayload }) =>
      updateAddress(id, payload, accessToken),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: addressesQueryKey });
    },
  });
}

export function useDeleteAddress(accessToken?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAddress(id, accessToken),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: addressesQueryKey });
    },
  });
}

export function useSetDefaultAddress(accessToken?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => setDefaultAddress(id, accessToken),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: addressesQueryKey });
    },
  });
}
