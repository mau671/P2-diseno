import { apiRequest } from './api';

export type UserProfile = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url?: string | null;
  date_of_birth?: string | null;
  preferred_language?: string | null;
  preferred_currency_code?: string | null;
  notification_preferences?: Record<string, unknown> | null;
  created_at: string;
};

export async function fetchProfile(accessToken?: string): Promise<{ profile: UserProfile }> {
  return apiRequest('/profiles/me', {}, accessToken);
}

export async function updateProfile(
  params: {
    full_name?: string;
    phone?: string;
    avatar_url?: string | null;
    date_of_birth?: string | null;
    preferred_language?: string;
    preferred_currency_code?: string;
    notification_preferences?: Record<string, unknown> | null;
  },
  accessToken?: string
): Promise<{ profile: UserProfile }> {
  return apiRequest('/profiles/me', {
    method: 'PUT',
    body: JSON.stringify(params),
  }, accessToken);
}
