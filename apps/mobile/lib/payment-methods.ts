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
