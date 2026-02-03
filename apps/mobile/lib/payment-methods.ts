import { apiRequest } from '@/lib/api';

export type PaymentMethod = {
  id: string;
  name: string;
  lastFour?: string | null;
  isDefault: boolean;
};

export type PaymentMethodsResponse = {
  payment_methods: PaymentMethod[];
};

export type CreatePaymentMethodPayload = {
  type: string;
  name: string;
  last_four?: string;
  is_default?: boolean;
};

export type UpdatePaymentMethodPayload = {
  type?: string;
  name?: string;
  last_four?: string | null;
  expiry_month?: number | null;
  expiry_year?: number | null;
  is_default?: boolean;
};

export async function fetchPaymentMethods(accessToken?: string) {
  return apiRequest<PaymentMethodsResponse>('/profiles/me/payment-methods', { method: 'GET' }, accessToken);
}

export async function createPaymentMethod(payload: CreatePaymentMethodPayload, accessToken?: string) {
  return apiRequest<{ payment_method_id: string }>(
    '/profiles/me/payment-methods',
    { method: 'POST', body: JSON.stringify(payload) },
    accessToken
  );
}

export async function updatePaymentMethod(
  id: string,
  payload: UpdatePaymentMethodPayload,
  accessToken?: string
) {
  return apiRequest<{ payment_method_id: string }>(
    `/profiles/me/payment-methods/${id}`,
    { method: 'PUT', body: JSON.stringify(payload) },
    accessToken
  );
}

export async function deletePaymentMethod(id: string, accessToken?: string) {
  return apiRequest<void>(
    `/profiles/me/payment-methods/${id}`,
    { method: 'DELETE' },
    accessToken
  );
}

export async function setDefaultPaymentMethod(id: string, accessToken?: string) {
  return apiRequest<{ payment_method_id: string }>(
    `/profiles/me/payment-methods/${id}/default`,
    { method: 'PATCH' },
    accessToken
  );
}
