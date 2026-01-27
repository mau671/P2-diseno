import { useInfiniteQuery } from "@tanstack/react-query";
import { getCatalogBases } from "@/api/catalog";

type Args = {
  q: string;
  cuisine: string;
  limit?: number;
  accessToken?: string;
  enabled?: boolean;
};

export function useCatalogBases({
  q,
  cuisine,
  limit = 12,
  accessToken,
  enabled = true,
}: Args) {
  return useInfiniteQuery({
    queryKey: ["catalog-bases", { q, cuisine, limit, isAuthed: Boolean(accessToken) }],
    enabled,
    queryFn: ({ pageParam }) =>
      getCatalogBases(
        {
          page: Number(pageParam ?? 1),
          limit,
          q: q || undefined,
          cuisine: cuisine || undefined,
        },
        accessToken
      ),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.has_more ? lastPage.page + 1 : undefined),
  });
}
