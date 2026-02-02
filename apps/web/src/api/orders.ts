// src/api/orders.ts
export type OrdersQueryParams = { restaurantId: string };

export type OrderManageRow = {
  id: string;
  customer_name: string | null;
  items_count: number;
  total: number;
  status: "pending" | "paid" | "preparing" | "delivering" | "completed" | string;
  created_at: string;
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

async function rpc<T>(fn: string, body: unknown, accessToken: string): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body ?? {}),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `RPC ${fn} failed (${res.status})`);
  }

  return (await res.json()) as T;
}

/** Compat (por si un hook viejo la usa) */
export async function fetchOrders(params: OrdersQueryParams, accessToken: string) {
  return fetchOrdersManage(params.restaurantId, accessToken);
}

export async function fetchOrdersManage(
  restaurantId: string,
  accessToken: string,
  limit = 200,
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

/** Solo avanza estado; si entra a paid => crea payment (según tu RPC) */
export async function advanceOrder(orderId: string, accessToken: string) {
  return rpc("advance_order_status", { target_order_id: orderId }, accessToken);
}

/** Cancelar = borrar completo */
export async function deleteOrder(orderId: string, accessToken: string) {
  return rpc("delete_order", { target_order_id: orderId }, accessToken);
}
