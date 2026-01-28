import { apiRequest } from "@/api/backend";

export type RecurringOrderItem = {
  id: string;
  recurringOrderId?: string;
  baseId: string;
  quantity: number;
  unitPrice: string;
  subtotal: string;
};

export type RecurringOrder = {
  id: string;
  status: string;
  frequency: string;
  next_run_at: string;
  delivery_address_id?: string | null;
  payment_method_id?: string | null;
  currency_code: string;
  restaurant_id: string;
  items?: RecurringOrderItem[];
};

export type CreateRecurringOrderPayload = {
  restaurant_id: string;
  currency_code: string;
  exchange_rate?: number | null;
  status?: string;
  frequency: string;
  next_run_at: string;
  delivery_address_id?: string | null;
  payment_method_id?: string | null;
  items?: Array<{
    base_id: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    customizations?: Array<{
      ingredient_id: string;
      action: string;
      qty?: number;
      delta_price?: number;
    }>;
  }>;
  saved_meal_id?: string;
  saved_meal_quantity?: number;
  saved_meal_unit_price?: number;
  saved_meal_subtotal?: number;
};

export type UpdateRecurringOrderPayload = {
  frequency?: string;
  next_run_at?: string;
  delivery_address_id?: string | null;
  payment_method_id?: string | null;
  status?: string;
};

export async function fetchRecurringOrders(accessToken?: string) {
  return apiRequest<{ recurring_orders: RecurringOrder[] }>(
    "/profiles/me/recurring-orders",
    { method: "GET" },
    accessToken
  );
}

export async function createRecurringOrder(payload: CreateRecurringOrderPayload, accessToken?: string) {
  return apiRequest<{ recurring_order_id: string }>(
    "/profiles/me/recurring-orders",
    {
      method: "POST",
      body: JSON.stringify(payload)
    },
    accessToken
  );
}

export async function updateRecurringOrder(
  id: string,
  payload: UpdateRecurringOrderPayload,
  accessToken?: string
) {
  return apiRequest<{ recurring_order_id: string }>(
    `/profiles/me/recurring-orders/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(payload)
    },
    accessToken
  );
}

export async function updateRecurringOrderStatus(
  id: string,
  status: string,
  accessToken?: string
) {
  return apiRequest<{ recurring_order_id: string }>(
    `/profiles/me/recurring-orders/${id}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status })
    },
    accessToken
  );
}

export async function runRecurringOrder(id: string, accessToken?: string) {
  return apiRequest<{ order_id: string }>(
    `/profiles/me/recurring-orders/${id}/run`,
    { method: "POST" },
    accessToken
  );
}
