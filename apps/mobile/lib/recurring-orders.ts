import { apiRequest } from '@/lib/api';

export type RecurringOrder = {
  id: string;
  status: string;
  next_run_at: string;
  interval_unit: string;
  interval_value: number;
  days_of_week: number[];
  days_of_month: number[];
  time_windows: { start: string; end: string }[];
  time_zone?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  last_run_at?: string | null;
  delivery_address_id?: string | null;
  payment_method_id?: string | null;
};

export type RecurringOrdersResponse = {
  recurring_orders: RecurringOrder[];
};

export async function fetchRecurringOrders(accessToken?: string) {
  return apiRequest<RecurringOrdersResponse>('/profiles/me/recurring-orders', { method: 'GET' }, accessToken);
}

export async function updateRecurringOrderStatus(id: string, status: string, accessToken?: string) {
  return apiRequest<{ recurring_order_id: string }>(
    `/profiles/me/recurring-orders/${id}/status`,
    { method: 'PATCH', body: JSON.stringify({ status }) },
    accessToken
  );
}

export async function updateRecurringOrder(
  id: string,
  params: {
    interval_unit?: string;
    interval_value?: number;
    days_of_week?: number[];
    days_of_month?: number[];
    time_windows?: { start: string; end: string }[];
    next_run_at?: string;
    end_date?: string | null;
    delivery_address_id?: string | null;
    payment_method_id?: string | null;
    status?: string;
  },
  accessToken?: string
) {
  return apiRequest<{ recurring_order_id: string }>(
    `/profiles/me/recurring-orders/${id}`,
    { method: 'PUT', body: JSON.stringify(params) },
    accessToken
  );
}

export async function runRecurringOrder(id: string, accessToken?: string) {
  return apiRequest<{ order_id: string }>(
    `/profiles/me/recurring-orders/${id}/run`,
    { method: 'POST' },
    accessToken
  );
}

export async function skipRecurringOrder(id: string, accessToken?: string) {
  return apiRequest<{ success: boolean; next_run_at?: string }>(
    `/profiles/me/recurring-orders/${id}/skip`,
    { method: 'POST' },
    accessToken
  );
}

export async function deleteRecurringOrder(id: string, accessToken?: string) {
  return apiRequest<void>(
    `/profiles/me/recurring-orders/${id}`,
    { method: 'DELETE' },
    accessToken
  );
}
