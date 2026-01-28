import { apiRequest } from '@/lib/api';

export type RecurringOrder = {
  id: string;
  status: string;
  frequency: string;
  next_run_at: string;
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

export async function runRecurringOrder(id: string, accessToken?: string) {
  return apiRequest<{ order_id: string }>(
    `/profiles/me/recurring-orders/${id}/run`,
    { method: 'POST' },
    accessToken
  );
}
