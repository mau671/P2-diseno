import { useQuery } from "@tanstack/react-query";
import { fetchJikan } from "./jikan";

type JikanListResponse<T> = {
  data: T;
  pagination?: {
    last_visible_page?: number;
    has_next_page?: boolean;
    current_page?: number;
  };
};

export type Anime = {
  mal_id: number;
  title: string;
  score?: number | null;
  images?: {
    jpg?: { image_url?: string };
    webp?: { image_url?: string };
  };
};

async function fetchTopAnime(page = 1, signal?: AbortSignal) {
  return fetchJikan<JikanListResponse<Anime[]>>("/top/anime", { page }, { signal });
}

async function fetchSearchAnime(q: string, page = 1, signal?: AbortSignal) {
  return fetchJikan<JikanListResponse<Anime[]>>("/anime", { q, page }, { signal });
}

export function useTopAnime(page = 1) {
  return useQuery({
    queryKey: ["topAnime", page],
    queryFn: ({ signal }) => fetchTopAnime(page, signal),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: false, // para que el botón "Reintentar" sea el que mande
  });
}

export function useSearchAnime(q: string, page = 1) {
  const query = q.trim();

  return useQuery({
    queryKey: ["searchAnime", query, page],
    queryFn: ({ signal }) => fetchSearchAnime(query, page, signal),
    enabled: query.length > 0,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
    retry: false,
  });
}
