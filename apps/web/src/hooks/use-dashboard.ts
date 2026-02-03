import { useQuery } from "@tanstack/react-query";
import { getRestaurantDashboard } from "@/api/dashboard";

export function useDashboard(restaurantId?: string | null, accessToken?: string) {
  return useQuery({
    queryKey: ["dashboard", restaurantId ?? ""],
    enabled: Boolean(restaurantId && accessToken),
    queryFn: async () => getRestaurantDashboard(restaurantId as string, accessToken as string),

    // ✅ esto evita que “se congele” al volver rápido al dashboard
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });
}
