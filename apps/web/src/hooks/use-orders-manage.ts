// src/hooks/use-orders-manage.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { advanceOrder, deleteOrder, fetchOrdersManage, type OrderManageRow } from "@/api/orders";

export function useOrdersManage(restaurantId?: string | null, accessToken?: string) {
  return useQuery<OrderManageRow[]>({
    queryKey: ["orders-manage", restaurantId ?? ""],
    enabled: Boolean(restaurantId && accessToken),
    queryFn: () => fetchOrdersManage(restaurantId as string, accessToken as string),
    staleTime: 15_000,
    refetchOnWindowFocus: false,
  });
}

export function useOrderActions(restaurantId?: string | null, accessToken?: string) {
  const qc = useQueryClient();

  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: ["orders-manage", restaurantId ?? ""] });
    await qc.invalidateQueries({ queryKey: ["dashboard", restaurantId ?? ""] });
  };

  const advance = useMutation({
    mutationFn: (orderId: string) => advanceOrder(orderId, accessToken as string),
    onSuccess: invalidate,
  });

  const cancelDelete = useMutation({
    mutationFn: (orderId: string) => deleteOrder(orderId, accessToken as string),
    onSuccess: invalidate,
  });

  return { advance, cancelDelete };
}
