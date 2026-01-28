import { apiRequest } from './api';

export type Payment = {
  id: string;
  order_id: string;
  amount: number;
  currency_code: string;
  status: string;
  provider: string;
  transaction_ref: string;
  created_at: string;
};

export type ProcessPaymentParams = {
  order_id: string;
  payment_method_id: string;
  amount: number;
  currency_code: string;
};

export type PaginationParams = {
  page?: number;
  limit?: number;
};

export async function processPayment(
  params: ProcessPaymentParams,
  accessToken?: string
): Promise<{
  payment: { id: string; status: string; provider: string };
  order: { id: string; status: string };
}> {
  return apiRequest('/payments/process', {
    method: 'POST',
    body: JSON.stringify(params),
  }, accessToken);
}

export async function fetchPaymentHistory(
  params: PaginationParams,
  accessToken?: string
): Promise<{
  payments: Payment[];
  pagination: { page: number; limit: number; total: number };
}> {
  const query = new URLSearchParams();
  query.set('page', String(params.page ?? 1));
  query.set('limit', String(params.limit ?? 20));

  return apiRequest(`/payments/history?${query.toString()}`, {}, accessToken);
}
