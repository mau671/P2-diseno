import { useQuery } from "@tanstack/react-query";
import { getRestaurantDashboard } from "@/api/dashboard";

export function useDashboard(restaurantId?: string | null, accessToken?: string) {
  return useQuery({
    queryKey: ["dashboard", restaurantId ?? ""],
    enabled: Boolean(restaurantId && accessToken),
    queryFn: async () => {
      return getRestaurantDashboard(restaurantId as string, accessToken as string);
    },
    staleTime: 15_000,
    refetchOnWindowFocus: false,
  });
}
