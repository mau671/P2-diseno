import { apiRequest } from '@/lib/api';

export type Address = {
  id: string;
  label?: string | null;
  isDefault: boolean;
  address: {
    line1: string;
    line2?: string | null;
    city: { id: string; name: string };
    region: { id: string; name: string };
    country: { id: string; nameEs: string; nameEn: string };
  };
};

export type AddressesResponse = {
  addresses: Address[];
};

export type CreateAddressPayload = {
  label?: string;
  isDefault?: boolean;
  line1: string;
  line2?: string;
  cityId: string;
  regionId: string;
  countryId: string;
};

export type UpdateAddressPayload = {
  label?: string | null;
  isDefault?: boolean;
  line1?: string;
  line2?: string | null;
  cityId?: string;
  regionId?: string;
  countryId?: string;
  postalCode?: string | null;
  notes?: string | null;
};

export async function fetchAddresses(accessToken?: string) {
  return apiRequest<AddressesResponse>('/profiles/me/addresses', { method: 'GET' }, accessToken);
}

export async function createAddress(payload: CreateAddressPayload, accessToken?: string) {
  return apiRequest<{ address_id: string }>(
    '/profiles/me/addresses',
    { method: 'POST', body: JSON.stringify(payload) },
    accessToken
  );
}

export async function updateAddress(addressId: string, payload: UpdateAddressPayload, accessToken?: string) {
  return apiRequest<{ address_id: string }>(
    `/profiles/me/addresses/${addressId}`,
    { method: 'PUT', body: JSON.stringify(payload) },
    accessToken
  );
}

export async function deleteAddress(addressId: string, accessToken?: string) {
  return apiRequest<void>(
    `/profiles/me/addresses/${addressId}`,
    { method: 'DELETE' },
    accessToken
  );
}

export async function setDefaultAddress(addressId: string, accessToken?: string) {
  return apiRequest<{ address_id: string }>(
    `/profiles/me/addresses/${addressId}/default`,
    { method: 'PATCH' },
    accessToken
  );
}
