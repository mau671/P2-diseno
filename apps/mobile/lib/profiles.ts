import { apiRequest } from './api';

export type UserProfile = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
};

export async function fetchProfile(accessToken?: string): Promise<{ profile: UserProfile }> {
  return apiRequest('/profiles/me', {}, accessToken);
}

export async function updateProfile(
  params: {
    full_name?: string;
    phone?: string;
  },
  accessToken?: string
): Promise<{ profile: UserProfile }> {
  return apiRequest('/profiles/me', {
    method: 'PUT',
    body: JSON.stringify(params),
  }, accessToken);
}
