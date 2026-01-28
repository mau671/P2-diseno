import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createAddress, fetchAddresses, type CreateAddressPayload } from '@/lib/addresses';

export const addressesQueryKey = ['addresses'];

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
      queryClient.invalidateQueries({ queryKey: addressesQueryKey });
    },
  });
}
