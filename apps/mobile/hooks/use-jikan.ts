import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { jikanFetch } from '@/lib/api/jikan';

interface UseJikanOptions<T> {
  queryKey: string[];
  queryFn: () => Promise<T>;
  enabled?: boolean;
}

export function useJikanQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  enabled: boolean = true
) {
  return useQuery({
    queryKey,
    queryFn: () => jikanFetch(queryFn),
    enabled,
  });
}
