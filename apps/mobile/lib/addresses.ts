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
  line1: string;
  line2?: string;
  cityId: string;
  regionId: string;
  countryId: string;
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
