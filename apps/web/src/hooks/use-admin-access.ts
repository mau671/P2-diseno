import { useQuery } from "@tanstack/react-query";
import { fetchAccessSummary } from "@/api/access";

export const accessQueryKey = ["access", "summary"];

export function useAdminAccess(accessToken?: string) {
  return useQuery({
    queryKey: accessQueryKey,
    queryFn: () => fetchAccessSummary(accessToken),
    enabled: !!accessToken,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}
