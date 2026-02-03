import { useQuery } from "@tanstack/react-query";
import { getRestaurantDashboard, getRestaurantPopularDishesMonth } from "@/api/dashboard";

// Aquí expone el query del dashboard del restaurante (métricas del día + órdenes activas + popular del mes)
export function useDashboard(restaurantId?: string | null, accessToken?: string) {
  return useQuery({
    queryKey: ["dashboard", restaurantId ?? ""], // Aquí separa caché por restaurante
    enabled: Boolean(restaurantId && accessToken), // Aquí evita requests si falta restaurante o sesión

    // Aquí compone el dashboard combinando dos RPCs: uno diario y uno mensual
    queryFn: async () => {
      const id = restaurantId as string; // Aquí asume que enabled ya garantizó que exista
      const token = accessToken as string; // Aquí asume que enabled ya garantizó que exista

      // Aquí obtiene métricas base del dashboard (hoy + órdenes activas)
      const dashboard = await getRestaurantDashboard(id, token);

      // Aquí intenta traer el "popular del mes" como dato adicional; si falla, no rompe toda la vista
      try {
        const popularMonth = await getRestaurantPopularDishesMonth(id, token);

        // Aquí devuelve el objeto del dashboard original con popular_dishes inyectado para la UI
        return {
          ...(dashboard as any),
          popular_dishes: popularMonth,
        };
      } catch {
        // Aquí mantiene el dashboard usable aunque falle el RPC mensual
        return {
          ...(dashboard as any),
          popular_dishes: [],
        };
      }
    },

    staleTime: 15_000, // Aquí reduce refetches frecuentes porque el dashboard no cambia cada segundo
    refetchOnWindowFocus: false, // Aquí evita refetch automático al volver a la pestaña
  });
}

