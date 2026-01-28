import { apiRequest } from "@/api/backend";

export type Profile = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  date_of_birth?: string | null;
  preferred_language?: string | null;
  preferred_currency_code?: string | null;
  notification_preferences?: Record<string, boolean> | null;
  is_admin?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type UpdateProfilePayload = {
  full_name?: string;
  phone?: string | null;
  avatar_url?: string | null;
  date_of_birth?: string | null;
  preferred_language?: string;
  preferred_currency_code?: string | null;
  notification_preferences?: Record<string, boolean> | null;
};

export async function fetchProfile(accessToken?: string) {
  return apiRequest<{ profile: Profile | null }>("/profiles/me", { method: "GET" }, accessToken);
}

export async function updateProfile(payload: UpdateProfilePayload, accessToken?: string) {
  return apiRequest<{ profile: Profile | null }>(
    "/profiles/me",
    {
      method: "PUT",
      body: JSON.stringify(payload)
    },
    accessToken
  );
}
