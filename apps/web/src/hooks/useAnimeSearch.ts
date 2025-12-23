import { useQuery } from "@tanstack/react-query";
import { fetchJikan } from "@/api/jikan";
import type { Anime } from "@/api/queries";

export function useAnimeSearch(q: string) {
  return useQuery({
    queryKey: ["animeSearch", q],
    queryFn: () => fetchJikan<{ data: Anime[] }>(`/anime?q=${encodeURIComponent(q)}&limit=12`),
    enabled: q.trim().length > 0,  // si está vacío, no consulta
    retry: false,
    staleTime: 30_000,
  });
}
