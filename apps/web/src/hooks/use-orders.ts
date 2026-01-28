import { useQuery } from "@tanstack/react-query";
import { fetchOrders, type OrdersQueryParams } from "@/api/orders";

export const ordersQueryKey = (params: OrdersQueryParams) => ["orders", params];

export function useOrders(params: OrdersQueryParams, accessToken?: string) {
  return useQuery({
    queryKey: ordersQueryKey(params),
    queryFn: () => fetchOrders(params, accessToken),
    enabled: !!accessToken,
  });
}
