import { apiRequest } from "@/api/backend";

export type Address = {
  id: string;
  label?: string | null;
  isDefault: boolean;
  address: {
    id: string;
    line1: string;
    line2?: string | null;
    postalCode?: string | null;
    notes?: string | null;
    city: { id: string; name: string };
    region: { id: string; name: string };
    country: { id: string; nameEs: string; nameEn: string };
  };
};

export type CreateAddressPayload = {
  label?: string;
  isDefault?: boolean;
  line1: string;
  line2?: string | null;
  cityId: string;
  regionId: string;
  countryId: string;
  postalCode?: string | null;
  notes?: string | null;
};

export type UpdateAddressPayload = Partial<CreateAddressPayload>;

export async function fetchAddresses(accessToken?: string) {
  return apiRequest<{ addresses: Address[] }>("/profiles/me/addresses", { method: "GET" }, accessToken);
}

export async function createAddress(payload: CreateAddressPayload, accessToken?: string) {
  return apiRequest<{ address_id: string }>(
    "/profiles/me/addresses",
    {
      method: "POST",
      body: JSON.stringify(payload)
    },
    accessToken
  );
}

export async function updateAddress(
  addressId: string,
  payload: UpdateAddressPayload,
  accessToken?: string
) {
  return apiRequest<{ address_id: string }>(
    `/profiles/me/addresses/${addressId}`,
    {
      method: "PUT",
      body: JSON.stringify(payload)
    },
    accessToken
  );
}

export async function deleteAddress(addressId: string, accessToken?: string) {
  return apiRequest<void>(
    `/profiles/me/addresses/${addressId}`,
    { method: "DELETE" },
    accessToken
  );
}

export async function setDefaultAddress(addressId: string, accessToken?: string) {
  return apiRequest<{ address_id: string }>(
    `/profiles/me/addresses/${addressId}/default`,
    { method: "PATCH" },
    accessToken
  );
}
