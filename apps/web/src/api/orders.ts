// src/api/orders.ts

// Aquí define los parámetros de consulta para compatibilidad con hooks antiguos
export type OrdersQueryParams = { restaurantId: string };

// Aquí define el shape de la fila de "pedidos del día" para la pantalla de gestión
export type OrderManageRow = {
  id: string;
  customer_name: string | null;
  items_count: number;
  total: number;
  item_names: string[]; // Aquí se incluye lista de nombres para mostrar detalle sin otro query
  status: "pending" | "paid" | "preparing" | "delivering" | "completed" | string;
  created_at: string;
};

// Aquí define el shape de la fila de "pedidos recurrentes" para la tabla extra en /orders
export type RecurringOrderManageRow = {
  id: string;
  user_id: string;
  customer_name: string | null;
  items_count: number;
  total: number;
  item_names: string[]; // Aquí se incluye lista de nombres para render compactado en la UI
  status: string;
  next_run_at: string;

  interval_unit: string;
  interval_value: number;
  days_of_week: Array<number | string>;
  days_of_month: Array<number | string>;
  time_windows: any; // Aquí se deja flexible porque puede venir como objeto/array/string según RPC
  time_zone: string | null;
  start_date: string | null;
  end_date: string | null;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
};

// Aquí se leen variables de entorno necesarias para llamar los RPC vía REST
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Aquí centraliza la llamada a un RPC de Supabase por REST, reusando headers y manejo de errores
async function rpc<T>(fn: string, body: unknown, accessToken: string): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`, // Aquí se manda el token del usuario (RLS/Policies)
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body ?? {}), // Aquí asegura que siempre se envíe JSON válido
  });

  // Aquí se convierte el error HTTP en un Error usable por React Query (para UI de ErrorState)
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `RPC ${fn} failed (${res.status})`);
  }

  // Aquí devuelve la respuesta del RPC tipada como T
  return (await res.json()) as T;
}

/** Compat (por si un hook viejo la usa) */
// Aquí mantiene la firma antigua para no romper imports existentes
export async function fetchOrders(params: OrdersQueryParams, accessToken: string) {
  return fetchOrdersManage(params.restaurantId, accessToken);
}

// Aquí obtiene los pedidos del día para el restaurante, con paginación (limit/offset)
export async function fetchOrdersManage(
  restaurantId: string,
  accessToken: string,
  limit = 200, // Aquí define límite por defecto para evitar renders gigantes
  offset = 0
): Promise<OrderManageRow[]> {
  return rpc<OrderManageRow[]>(
    "get_restaurant_orders_manage",
    {
      target_restaurant_id: restaurantId,
      target_limit: limit,
      target_offset: offset,
    },
    accessToken
  );
}

/** recurrentes (para la tabla extra en /orders) */
// Aquí obtiene programaciones de pedidos recurrentes para el restaurante, con paginación
export async function fetchRecurringOrdersManage(
  restaurantId: string,
  accessToken: string,
  limit = 200,
  offset = 0
): Promise<RecurringOrderManageRow[]> {
  return rpc<RecurringOrderManageRow[]>(
    "get_restaurant_recurring_orders_manage",
    {
      target_restaurant_id: restaurantId,
      target_limit: limit,
      target_offset: offset,
    },
    accessToken
  );
}

/** Solo avanza estado; si entra a paid => crea payment (según tu RPC) */
// Aquí dispara el RPC que mueve el estado al siguiente paso dentro del flujo definido en SQL
export async function advanceOrder(orderId: string, accessToken: string) {
  return rpc("advance_order_status", { target_order_id: orderId }, accessToken);
}

/** Cancelar = borrar completo */
// Aquí dispara el RPC que elimina el pedido completo (items/historial/pagos) según backend
export async function deleteOrder(orderId: string, accessToken: string) {
  return rpc("delete_order", { target_order_id: orderId }, accessToken);
}
