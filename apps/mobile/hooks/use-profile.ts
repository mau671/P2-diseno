import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchProfile, updateProfile } from '@/lib/profiles';

export const profileQueryKey = ['profile'];

export function useProfile(accessToken?: string) {
  return useQuery({
    queryKey: profileQueryKey,
    queryFn: () => fetchProfile(accessToken),
    enabled: !!accessToken,
  });
}

export function useUpdateProfile(accessToken?: string) {
  return useMutation({
    mutationFn: (params: { full_name?: string; phone?: string }) =>
      updateProfile(params, accessToken),
  });
}
