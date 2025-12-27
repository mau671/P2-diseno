import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
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
    jpg?: { image_url?: string; small_image_url?: string; large_image_url?: string };
    webp?: { image_url?: string; small_image_url?: string; large_image_url?: string };
  };
};

export type SearchResult = {
  mal_id: number;
  title?: string;
  name?: string;
  titles?: Array<{
    type: string;
    title: string;
  }>;
  score?: number | null;
  images?: {
    jpg?: { image_url?: string; small_image_url?: string; large_image_url?: string };
    webp?: { image_url?: string; small_image_url?: string; large_image_url?: string };
  };
};

async function fetchTopAnime(page = 1, signal?: AbortSignal) {
  return fetchJikan<JikanListResponse<Anime[]>>("/top/anime", { page }, { signal });
}

async function fetchSearchAnime(q: string, page = 1, sfw = true, signal?: AbortSignal) {
  return fetchJikan<JikanListResponse<Anime[]>>("/anime", { q, page, sfw }, { signal });
}

async function fetchSearch<T>(type: string, q: string, page = 1, sfw = true, signal?: AbortSignal) {
  return fetchJikan<JikanListResponse<T[]>>(`/${type}`, { q, page, sfw }, { signal });
}

export function useTopAnime(page = 1) {
  return useQuery({
    queryKey: ["topAnime", page],
    queryFn: ({ signal }) => fetchTopAnime(page, signal),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

export function useSearchAnime(q: string, page = 1, sfw = true) {
  const query = q.trim();

  return useQuery({
    queryKey: ["searchAnime", query, page, sfw],
    queryFn: ({ signal }) => fetchSearchAnime(query, page, sfw, signal),
    enabled: query.length > 0,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

export function useSearch(q: string, type: string, page = 1, sfw = true) {
  const query = q.trim();

  return useQuery({
    queryKey: ["search", type, query, page, sfw],
    queryFn: ({ signal }) => fetchSearch<SearchResult>(type, query, page, sfw, signal),
    enabled: query.length > 0,
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

export function useInfiniteSearch(q: string, type: string, sfw = true) {
  const query = q.trim();

  return useInfiniteQuery({
    queryKey: ["search", type, query, sfw],
    queryFn: ({ pageParam = 1, signal }) => fetchSearch<SearchResult>(type, query, pageParam, sfw, signal),
    enabled: query.length > 0,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination?.has_next_page) {
        return (lastPage.pagination?.current_page ?? 1) + 1;
      }
      return undefined;
    },
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

export function getCurrentSeason(): { year: number; season: string } {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const year = now.getFullYear();

  let season: string;
  if (month >= 1 && month <= 3) season = "winter";
  else if (month >= 4 && month <= 6) season = "spring";
  else if (month >= 7 && month <= 9) season = "summer";
  else season = "fall";

  return { year, season };
}

export function getPreviousSeason(year: number, season: string): { year: number; season: string } {
  const seasons = ["winter", "spring", "summer", "fall"];
  const currentIndex = seasons.indexOf(season);

  if (currentIndex === 0) {
    return { year: year - 1, season: "fall" };
  } else {
    return { year, season: seasons[currentIndex - 1] };
  }
}

async function fetchSeasonAnime(year: number, season: string, page = 1, sfw = true, signal?: AbortSignal) {
  return fetchJikan<JikanListResponse<Anime[]>>(`/seasons/${year}/${season}`, { page, sfw }, { signal });
}

export function useSeasonAnime(year: number, season: string, page = 1, sfw = true, enabled = true) {
  return useQuery({
    queryKey: ["seasonAnime", year, season, page, sfw],
    queryFn: ({ signal }) => fetchSeasonAnime(year, season, page, sfw, signal),
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
    retry: false,
    enabled,
  });
}

async function fetchSeasonsNow(page = 1, sfw = true, signal?: AbortSignal) {
  return fetchJikan<JikanListResponse<Anime[]>>("/seasons/now", { page, sfw }, { signal });
}

export function useSeasonsNow(page = 1, sfw = true, enabled = true) {
  return useQuery({
    queryKey: ["seasonsNow", page, sfw],
    queryFn: ({ signal }) => fetchSeasonsNow(page, sfw, signal),
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
    retry: false,
    enabled,
  });
}

async function fetchSeasonsUpcoming(page = 1, sfw = true, signal?: AbortSignal) {
  return fetchJikan<JikanListResponse<Anime[]>>("/seasons/upcoming", { page, sfw }, { signal });
}

export function useSeasonsUpcoming(page = 1, sfw = true, enabled = true) {
  return useQuery({
    queryKey: ["seasonsUpcoming", page, sfw],
    queryFn: ({ signal }) => fetchSeasonsUpcoming(page, sfw, signal),
    enabled,
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

async function fetchTopAnimeByPopularity(page = 1, limit = 20, signal?: AbortSignal) {
  return fetchJikan<JikanListResponse<Anime[]>>("/top/anime", { page, limit, filter: "bypopularity" }, { signal });
}

export function useTopAnimeByPopularity(page = 1, limit = 20, enabled = true) {
  return useQuery({
    queryKey: ["topAnimeByPopularity", page, limit],
    queryFn: ({ signal }) => fetchTopAnimeByPopularity(page, limit, signal),
    enabled,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
    retry: false,
  });
}
