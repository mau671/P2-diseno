import { useQuery } from "@tanstack/react-query";
import { getRestaurantDashboard, getRestaurantPopularDishesMonth } from "@/api/dashboard";

export function useDashboard(restaurantId?: string | null, accessToken?: string) {
  return useQuery({
    queryKey: ["dashboard", restaurantId ?? ""],
    enabled: Boolean(restaurantId && accessToken),
    queryFn: async () => {
      const id = restaurantId as string;
      const token = accessToken as string;

      const dashboard = await getRestaurantDashboard(id, token);

      // Popular del mes (independiente del filtro diario)
      // Si falla, no rompemos el dashboard entero.
      try {
        const popularMonth = await getRestaurantPopularDishesMonth(id, token);

        // dashboard viene como objeto plano; le inyectamos popular_dishes
        return {
          ...(dashboard as any),
          popular_dishes: popularMonth,
        };
      } catch {
        return {
          ...(dashboard as any),
          popular_dishes: [],
        };
      }
    },
    staleTime: 15_000,
    refetchOnWindowFocus: false,
  });
}
