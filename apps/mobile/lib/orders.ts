import { apiRequest } from './api';

export type OrderItemCustomization = {
  ingredient_id: string;
  ingredient_name: string;
  action: string;
  qty: number;
  delta_price: number;
};

export type OrderItem = {
  id: string;
  base_id: string;
  cooking_method_id?: string | null;
  base_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  customizations: OrderItemCustomization[];
};

export type OrderStatusHistory = {
  status: string;
  changed_at: string;
  changed_by: string;
};

export type Order = {
  id: string;
  restaurant_id: string;
  restaurant_name?: string | null;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  currency_code: string;
  item_count?: number;
  created_at: string;
};

export type OrderDetail = Order & {
  delivery_address_id: string | null;
  delivery_address?: {
    line1: string;
    line2: string | null;
    postal_code: string | null;
    notes: string | null;
    city: string;
    region: string;
    country: string;
  } | null;
  payment_method_id: string | null;
  payment_method?: {
    id: string;
    type: string;
    name: string;
    last_four: string | null;
  } | null;
  items: OrderItem[];
  status_history: OrderStatusHistory[];
};

export type PaginationParams = {
  page?: number;
  limit?: number;
};

export async function fetchOrders(
  params: PaginationParams & { status?: string; restaurant_id?: string },
  accessToken?: string
): Promise<{
  orders: Order[];
  pagination: { page: number; limit: number; total: number };
}> {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.restaurant_id) query.set('restaurant_id', params.restaurant_id);
  query.set('page', String(params.page ?? 1));
  query.set('limit', String(params.limit ?? 20));

  return apiRequest(`/orders?${query.toString()}`, {}, accessToken);
}

export async function fetchOrder(
  orderId: string,
  accessToken?: string
): Promise<{ order: OrderDetail }> {
  return apiRequest(`/orders/${orderId}`, {}, accessToken);
}

export async function fetchOrderTracking(
  orderId: string,
  accessToken?: string
): Promise<{
  order_id: string;
  status: string;
  created_at: string;
  status_history: { status: string; changed_at: string }[];
}> {
  return apiRequest(`/orders/${orderId}/tracking`, {}, accessToken);
}

export async function createOrder(
  params: {
    cart_id: string;
    delivery_address_id?: string;
    payment_method_id?: string;
  },
  accessToken?: string
): Promise<{ order_id: string }> {
  return apiRequest('/orders', {
    method: 'POST',
    body: JSON.stringify(params),
  }, accessToken);
}

export async function cancelOrder(
  orderId: string,
  accessToken?: string
): Promise<{ order_id: string; status: string }> {
  return apiRequest(`/orders/${orderId}/cancel`, {
    method: 'POST',
  }, accessToken);
}

export async function reorder(
  orderId: string,
  accessToken?: string
): Promise<{ cart_id: string }> {
  return apiRequest(`/orders/${orderId}/reorder`, {
    method: 'POST',
  }, accessToken);
}
