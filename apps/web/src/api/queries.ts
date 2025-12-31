import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { fetchJikan } from "./jikan";

/** =======================
 *  API Response Types
 *  ======================= */

type JikanListResponse<T> = {
  data: T;
  pagination?: {
    last_visible_page?: number;
    has_next_page?: boolean;
    current_page?: number;
  };
};

type JikanSingleResponse<T> = {
  data: T;
};

/** =======================
 *  Domain Types
 *  ======================= */

export type AnimeBase = {
  mal_id: number;

  // depende del endpoint: anime tiene title; otros pueden traer name/titles/url
  title?: string;
  name?: string;
  titles?: Array<{ type: string; title: string }>;
  url?: string;

  score?: number | null;

  images?: {
    jpg?: { image_url?: string; small_image_url?: string; large_image_url?: string };
    webp?: { image_url?: string; small_image_url?: string; large_image_url?: string };
  };

  type?: string | null;
  status?: string | null;
  source?: string | null;
  episodes?: number | null;

  aired?: {
    from?: string | null;
    to?: string | null;
  };

  year?: number | null;
  season?: string | null;

  studios?: Array<{ name: string; mal_id: number }> | null;
  genres?: Array<{ name: string; mal_id: number }> | null;
  themes?: Array<{ name: string; mal_id: number }> | null;

  duration?: string | null;
};

export type Anime = AnimeBase & { title: string };

export type Genre = {
  mal_id: number;
  name: string;
  url?: string;
};

export type SearchResult = AnimeBase;

export type SearchFilters = {
  genres?: number[];
  type?: string;
  status?: string;
  year?: number;
  season?: string;
  sfw?: boolean;
};

export type AnimeDetail = (AnimeBase & { title: string }) & {
  synopsis?: string | null;
  background?: string | null;

  rank?: number | null;
  popularity?: number | null;
  members?: number | null;
  favorites?: number | null;

  rating?: string | null;

  title_english?: string | null;
  title_japanese?: string | null;

  trailer?: {
    url?: string | null;
    embed_url?: string | null;
    images?: {
      image_url?: string | null;
      small_image_url?: string | null;
      medium_image_url?: string | null;
      large_image_url?: string | null;
      maximum_image_url?: string | null;
    } | null;
  } | null;

  producers?: Array<{ name: string; mal_id: number }> | null;
  licensors?: Array<{ name: string; mal_id: number }> | null;
  demographics?: Array<{ name: string; mal_id: number }> | null;
};

/** =======================
 *  Helpers
 *  ======================= */

function pickPoster(a?: { images?: AnimeBase["images"] } | null) {
  return (
    a?.images?.webp?.large_image_url ||
    a?.images?.jpg?.large_image_url ||
    a?.images?.webp?.image_url ||
    a?.images?.jpg?.image_url ||
    ""
  );
}

// Retry “inteligente” para evitar loading eterno por 429 o 404
function getStatusFromError(err: unknown): number | undefined {
  const e: any = err;
  return e?.status ?? e?.response?.status ?? e?.cause?.status ?? e?.cause?.response?.status ?? undefined;
}

function shouldRetry(failureCount: number, err: unknown) {
  const status = getStatusFromError(err);
  if (status === 404) return false;
  if (status === 429) return failureCount < 1;
  return failureCount < 2;
}

function retryDelay(attemptIndex: number) {
  return Math.min(1000 * 2 ** attemptIndex, 4000);
}

/** =======================
 *  Fetchers
 *  ======================= */

async function fetchTopAnime(page = 1, signal?: AbortSignal) {
  return fetchJikan<JikanListResponse<Anime[]>>("/top/anime", { page }, { signal });
}

async function fetchGenres(signal?: AbortSignal) {
  return fetchJikan<JikanListResponse<Genre[]>>("/genres/anime", {}, { signal });
}

async function fetchSeasonsNow(page = 1, sfw = true, signal?: AbortSignal) {
  return fetchJikan<JikanListResponse<Anime[]>>("/seasons/now", { page, sfw }, { signal });
}

async function fetchSeasonsUpcoming(page = 1, sfw = true, signal?: AbortSignal) {
  return fetchJikan<JikanListResponse<Anime[]>>("/seasons/upcoming", { page, sfw }, { signal });
}

async function fetchTopAnimeByPopularity(page = 1, limit = 20, signal?: AbortSignal) {
  return fetchJikan<JikanListResponse<Anime[]>>("/top/anime", { page, limit, filter: "bypopularity" }, { signal });
}

async function fetchSeasonAnime(year: number, season: string, page = 1, sfw = true, signal?: AbortSignal) {
  return fetchJikan<JikanListResponse<Anime[]>>(`/seasons/${year}/${season}`, { page, sfw }, { signal });
}

async function fetchSearch<T>(
  type: string,
  q: string,
  page = 1,
  sfw = true,
  filters?: SearchFilters,
  signal?: AbortSignal
) {
  const params: Record<string, string | number | boolean> = { page, sfw };

  // q solo si hay texto
  const query = q.trim();
  if (query.length > 0) params.q = query;

  if (filters?.genres?.length) params.genres = filters.genres.join(",");
  if (filters?.type) params.type = filters.type;
  if (filters?.status) params.status = filters.status;

  // Año / Temporada (Jikan acepta fechas YYYY-MM-DD)
  if (filters?.year && !filters?.season) {
    params.start_date = `${filters.year}-01-01`;
    params.end_date = `${filters.year}-12-31`;
  }

  if (filters?.year && filters?.season) {
    const seasonToMonth: Record<string, string> = {
      winter: "01",
      spring: "04",
      summer: "07",
      fall: "10",
    };
    const month = seasonToMonth[filters.season] || "01";
    params.start_date = `${filters.year}-${month}-01`;
  }

  if (filters?.sfw !== undefined) params.sfw = filters.sfw;

  return fetchJikan<JikanListResponse<T[]>>(`/${type}`, params, { signal });
}

async function fetchAnimeDetail(id: number, signal?: AbortSignal) {
  return fetchJikan<JikanSingleResponse<AnimeDetail>>(`/anime/${id}/full`, {}, { signal });
}

/** =======================
 *  Hooks
 *  ======================= */

export function useTopAnime(page = 1) {
  return useQuery({
    queryKey: ["topAnime", page],
    queryFn: ({ signal }) => fetchTopAnime(page, signal),
    retry: shouldRetry,
    retryDelay,
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });
}

export function useGenres() {
  return useQuery({
    queryKey: ["genres"],
    queryFn: ({ signal }) => fetchGenres(signal),
    select: (data) => data?.data ?? [],
    retry: shouldRetry,
    retryDelay,
    staleTime: 1000 * 60 * 60 * 24 * 7,
    refetchOnWindowFocus: false,
  });
}

export function getCurrentSeason(): { year: number; season: string } {
  const now = new Date();
  const month = now.getMonth() + 1;
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

  if (currentIndex === 0) return { year: year - 1, season: "fall" };
  return { year, season: seasons[currentIndex - 1] };
}

export function useSeasonAnime(year: number, season: string, page = 1, sfw = true, enabled = true) {
  return useQuery({
    queryKey: ["seasonAnime", year, season, page, sfw],
    queryFn: ({ signal }) => fetchSeasonAnime(year, season, page, sfw, signal),
    enabled,
    retry: shouldRetry,
    retryDelay,
    staleTime: 1000 * 60 * 60 * 6,
    refetchOnWindowFocus: false,
  });
}

export function useSeasonsNow(sfw = true, enabled = true) {
  return useInfiniteQuery({
    queryKey: ["seasonsNow", sfw],
    queryFn: ({ pageParam = 1, signal }) => fetchSeasonsNow(pageParam, sfw, signal),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination?.has_next_page ? (lastPage.pagination?.current_page ?? 1) + 1 : undefined,
    enabled,
    retry: shouldRetry,
    retryDelay,
    staleTime: 1000 * 60 * 60 * 2,
    refetchOnWindowFocus: false,
  });
}

export function useSeasonsUpcoming(sfw = true, enabled = true) {
  return useInfiniteQuery({
    queryKey: ["seasonsUpcoming", sfw],
    queryFn: ({ pageParam = 1, signal }) => fetchSeasonsUpcoming(pageParam, sfw, signal),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination?.has_next_page ? (lastPage.pagination?.current_page ?? 1) + 1 : undefined,
    enabled,
    retry: shouldRetry,
    retryDelay,
    staleTime: 1000 * 60 * 60 * 2,
    refetchOnWindowFocus: false,
  });
}

export function useTopAnimeByPopularity(limit = 20, enabled = true) {
  return useInfiniteQuery({
    queryKey: ["topAnimeByPopularity", limit],
    queryFn: ({ pageParam = 1, signal }) => fetchTopAnimeByPopularity(pageParam, limit, signal),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination?.has_next_page ? (lastPage.pagination?.current_page ?? 1) + 1 : undefined,
    enabled,
    retry: shouldRetry,
    retryDelay,
    staleTime: 1000 * 60 * 60 * 4,
    refetchOnWindowFocus: false,
  });
}

export function useInfiniteSearch(q: string, type: string, sfw = true, filters?: SearchFilters) {
  const query = q.trim();

  const hasActiveFilters =
    !!filters &&
    ((filters.genres?.length ?? 0) > 0 || !!filters.type || !!filters.status || !!filters.year || !!filters.season);

  return useInfiniteQuery({
    queryKey: ["search", type, query, sfw, JSON.stringify(filters ?? {})],
    queryFn: ({ pageParam = 1, signal }) => fetchSearch<SearchResult>(type, query, pageParam, sfw, filters, signal),
    enabled: query.length > 0 || hasActiveFilters,
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination?.has_next_page ? (lastPage.pagination?.current_page ?? 1) + 1 : undefined,
    retry: shouldRetry,
    retryDelay,
    staleTime: 1000 * 60 * 60 * 2,
    refetchOnWindowFocus: false,
  });
}

export function useAnimeDetail(id: number, enabled = true) {
  const ok = enabled && Number.isFinite(id) && id > 0;

  return useQuery({
    queryKey: ["animeDetail", id],
    queryFn: ({ signal }) => fetchAnimeDetail(id, signal),
    enabled: ok,
    retry: shouldRetry,
    retryDelay,
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });
}

export const animeUtils = { pickPoster };


