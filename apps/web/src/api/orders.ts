import { apiRequest } from "@/api/backend";

export type OrderItem = {
  id: string;
  baseName: string;
  quantity: number;
  unitPrice: string;
  subtotal: string;
};

export type OrderSummary = {
  id: string;
  status: string;
  total: string;
  currency: string;
  createdAt: string;
  items: OrderItem[];
  deliveryAddress?: {
    line1?: string | null;
    line2?: string | null;
    city?: string | null;
    region?: string | null;
    country?: string | null;
  } | null;
};

export type OrdersResponse = {
  orders: OrderSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
};

export type OrdersQueryParams = {
  page?: number;
  limit?: number;
  status?: string;
};

const buildQueryString = (params: OrdersQueryParams) => {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.status) query.set("status", params.status);
  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
};

export async function fetchOrders(params: OrdersQueryParams, accessToken?: string) {
  const queryString = buildQueryString(params);
  return apiRequest<OrdersResponse>(
    `/profiles/me/orders${queryString}`,
    { method: "GET" },
    accessToken
  );
}
