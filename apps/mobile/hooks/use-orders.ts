import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchOrders, fetchOrder, fetchOrderTracking, createOrder, cancelOrder, reorder } from '@/lib/orders';

export const ordersQueryKey = ['orders'];
export const orderQueryKey = (id: string) => ['orders', id];
export const orderTrackingQueryKey = (id: string) => ['orders', id, 'tracking'];

export function useOrders(
  params: { page?: number; limit?: number; status?: string; restaurant_id?: string },
  accessToken?: string
) {
  return useQuery({
    queryKey: [...ordersQueryKey, params],
    queryFn: () => fetchOrders(params, accessToken),
    enabled: !!accessToken,
  });
}

export function useOrder(orderId: string, accessToken?: string) {
  return useQuery({
    queryKey: orderQueryKey(orderId),
    queryFn: () => fetchOrder(orderId, accessToken),
    enabled: !!orderId && !!accessToken,
  });
}

export function useOrderTracking(orderId: string, accessToken?: string) {
  return useQuery({
    queryKey: orderTrackingQueryKey(orderId),
    queryFn: () => fetchOrderTracking(orderId, accessToken),
    enabled: !!orderId && !!accessToken,
    refetchInterval: 60000,
  });
}

export function useCreateOrder(accessToken?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      cart_id: string;
      delivery_address_id?: string;
      payment_method_id?: string;
    }) => createOrder(params, accessToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

export function useCancelOrder(accessToken?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => cancelOrder(orderId, accessToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ordersQueryKey });
    },
  });
}

export function useReorder(accessToken?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => reorder(orderId, accessToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}
