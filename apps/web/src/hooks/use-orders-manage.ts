import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  advanceOrder,
  deleteOrder,
  fetchOrdersManage,
  fetchRecurringOrdersManage,
} from "@/api/orders";

// Aquí expone el query de "pedidos del día" para la pantalla /orders (tabla principal)
export function useOrdersManage(restaurantId?: string | null, accessToken?: string) {
  return useQuery({
    queryKey: ["orders-manage", restaurantId ?? ""], // Aquí separa caché por restaurante
    enabled: Boolean(restaurantId && accessToken), // Aquí evita requests si falta restaurante o sesión
    queryFn: async () => fetchOrdersManage(restaurantId as string, accessToken as string), // Aquí delega al API layer (RPC)
    staleTime: 5_000, // Aquí permite refresco frecuente sin spamear demasiado el backend
    refetchOnWindowFocus: false, // Aquí evita refetch automático al volver a la pestaña
  });
}

// Aquí expone el query de "pedidos recurrentes" para la tabla extra en /orders
export function useRecurringOrdersManage(restaurantId?: string | null, accessToken?: string) {
  return useQuery({
    queryKey: ["recurring-orders-manage", restaurantId ?? ""], // Aquí separa caché por restaurante
    enabled: Boolean(restaurantId && accessToken), // Aquí evita requests si falta restaurante o sesión
    queryFn: async () => fetchRecurringOrdersManage(restaurantId as string, accessToken as string), // Aquí trae programaciones recurrentes por RPC
    staleTime: 5_000, // Aquí mantiene la lista razonablemente fresca para la UI de gestión
    refetchOnWindowFocus: false, // Aquí evita refetch automático al volver a la pestaña
  });
}

// Aquí agrupa mutaciones que cambian estado o eliminan pedidos, y luego invalidan cachés relacionadas
export function useOrderActions(restaurantId?: string | null, accessToken?: string) {
  const qc = useQueryClient(); // Aquí obtiene el cliente para invalidar caché de React Query
  const enabled = Boolean(restaurantId && accessToken); // Aquí define guard para no mutar sin contexto válido

  const advance = useMutation({
    // Aquí avanza el estado del pedido (según el flujo definido en el backend/RPC)
    mutationFn: async (orderId: string) => {
      if (!enabled) throw new Error("Missing restaurant/session"); // Aquí protege de llamadas sin restaurante/token
      return advanceOrder(orderId, accessToken as string); // Aquí manda token para cumplir RLS/Policies
    },
    // Aquí refresca listas y métricas relacionadas para que la UI refleje el cambio inmediatamente
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders-manage", restaurantId ?? ""] }); // Aquí refresca tabla de pedidos del día
      qc.invalidateQueries({ queryKey: ["dashboard", restaurantId ?? ""] }); // Aquí refresca tarjetas/métricas del dashboard
    },
  });

  const cancelDelete = useMutation({
    // Aquí cancela/elimina el pedido completo (según tu RPC delete_order)
    mutationFn: async (orderId: string) => {
      if (!enabled) throw new Error("Missing restaurant/session"); // Aquí protege de llamadas sin restaurante/token
      return deleteOrder(orderId, accessToken as string); // Aquí manda token para cumplir RLS/Policies
    },
    // Aquí refresca listas y métricas relacionadas para que la UI no muestre el pedido eliminado
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders-manage", restaurantId ?? ""] }); // Aquí refresca tabla de pedidos del día
      qc.invalidateQueries({ queryKey: ["dashboard", restaurantId ?? ""] }); // Aquí refresca tarjetas/métricas del dashboard
    },
  });

  // Aquí retorna mutaciones listas para usar en la UI (actions.advance, actions.cancelDelete)
  return { advance, cancelDelete };
}
