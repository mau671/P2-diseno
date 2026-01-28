import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchProfile, updateProfile, type UpdateProfilePayload } from "@/api/profiles";

export const profileQueryKey = ["profile"];

export function useProfile(accessToken?: string) {
  return useQuery({
    queryKey: profileQueryKey,
    queryFn: () => fetchProfile(accessToken),
    enabled: !!accessToken,
  });
}

export function useUpdateProfile(accessToken?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateProfile(payload, accessToken),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: profileQueryKey });
    },
  });
}
