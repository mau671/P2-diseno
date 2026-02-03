import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { advanceOrder, deleteOrder, fetchOrdersManage } from "@/api/orders";

export function useOrdersManage(restaurantId?: string | null, accessToken?: string) {
  return useQuery({
    queryKey: ["orders-manage", restaurantId ?? ""],
    enabled: Boolean(restaurantId && accessToken),
    queryFn: async () => fetchOrdersManage(restaurantId as string, accessToken as string),
    staleTime: 5_000,
    refetchOnWindowFocus: false,
  });
}

export function useOrderActions(restaurantId?: string | null, accessToken?: string) {
  const qc = useQueryClient();
  const enabled = Boolean(restaurantId && accessToken);

  const advance = useMutation({
    mutationFn: async (orderId: string) => {
      if (!enabled) throw new Error("Missing restaurant/session");
      return advanceOrder(orderId, accessToken as string);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders-manage", restaurantId ?? ""] });
      qc.invalidateQueries({ queryKey: ["dashboard", restaurantId ?? ""] }); // ✅ clave
    },
  });

  const cancelDelete = useMutation({
    mutationFn: async (orderId: string) => {
      if (!enabled) throw new Error("Missing restaurant/session");
      return deleteOrder(orderId, accessToken as string);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders-manage", restaurantId ?? ""] });
      qc.invalidateQueries({ queryKey: ["dashboard", restaurantId ?? ""] });
    },
  });

  return { advance, cancelDelete };
}
