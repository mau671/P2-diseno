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

export type AnimeBase = {
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
  type?: string;
  status?: string;
  source?: string;
  episodes?: number | null;
  aired?: {
    from?: string;
    to?: string;
  };
  year?: number | null;
  season?: string | null;
  studios?: Array<{ name: string; mal_id: number }>;
  genres?: Array<{ name: string; mal_id: number }>;
  themes?: Array<{ name: string; mal_id: number }>;
};

export type Anime = AnimeBase & { title: string };

export type Genre = {
  mal_id: number;
  name: string;
  url?: string;
};

export type SearchResult = AnimeBase;

/* ================================
   ✅ US-14: Anime Characters types
================================ */
export type AnimeCharacter = {
  character: {
    mal_id: number;
    name: string;
    images?: {
      jpg?: { image_url?: string };
      webp?: { image_url?: string };
    };
  };
  role?: string;
};

type JikanCharactersResponse = {
  data: AnimeCharacter[];
};

async function fetchAnimeCharacters(animeId: number, signal?: AbortSignal) {
  return fetchJikan<JikanCharactersResponse>(`/anime/${animeId}/characters`, {}, { signal });
}

export function useAnimeCharacters(animeId: number, enabled = true) {
  return useQuery({
    queryKey: ["animeCharacters", animeId],
    queryFn: ({ signal }) => fetchAnimeCharacters(animeId, signal),
    enabled: enabled && Number.isFinite(animeId) && animeId > 0,
    select: (data) => data?.data ?? [],
    staleTime: 1000 * 60 * 30,
  });
}
/* ================================ */

async function fetchTopAnime(page = 1, signal?: AbortSignal) {
  return fetchJikan<JikanListResponse<Anime[]>>("/top/anime", { page }, { signal });
}

async function fetchSearchAnime(
  q: string,
  page = 1,
  sfw = true,
  filters?: SearchFilters,
  signal?: AbortSignal
) {
  const params: Record<string, string | number | boolean> = { q, page, sfw };

  if (filters?.genres && filters.genres.length > 0) {
    params.genres = filters.genres.join(",");
  }
  if (filters?.type && filters.type.length > 0) {
    params.type = filters.type;
  }
  if (filters?.status && filters.status.length > 0) {
    params.status = filters.status;
  }
  if (filters?.year) {
    params.start_date = `${filters.year}`;
  }
  if (filters?.season && filters.year) {
    const seasonEndpoints: Record<string, string> = {
      winter: "01",
      spring: "04",
      summer: "07",
      fall: "10",
    };
    const month = seasonEndpoints[filters.season] || "01";
    params.start_date = `${filters.year}-${month}`;
  }
  if (filters?.sfw !== undefined) {
    params.sfw = filters.sfw;
  }

  return fetchJikan<JikanListResponse<Anime[]>>("/anime", params, { signal });
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

  if (q.trim().length > 0) {
    params.q = q;
  }

  if (filters?.genres && filters.genres.length > 0) {
    params.genres = filters.genres.join(",");
  }
  if (filters?.type && filters.type.length > 0) {
    params.type = filters.type;
  }

  return fetchJikan<JikanListResponse<T[]>>(`/${type}`, params, { signal });
}

export type SearchFilters = {
  genres?: number[];
  type?: string;
  status?: string;
  year?: number;
  season?: string;
  sfw?: boolean;
};

async function fetchGenres(signal?: AbortSignal) {
  return fetchJikan<JikanListResponse<Genre[]>>("/genres/anime", {}, { signal });
}

export function useTopAnime(page = 1) {
  return useQuery({
    queryKey: ["topAnime", page],
    queryFn: ({ signal }) => fetchTopAnime(page, signal),
  });
}

export function useSearchAnime(q: string, page = 1, sfw = true, filters?: SearchFilters) {
  const query = q.trim();

  return useQuery({
    queryKey: ["searchAnime", query, page, sfw, JSON.stringify(filters ?? {})],
    queryFn: ({ signal }) => fetchSearchAnime(query, page, sfw, filters, signal),
    enabled: query.length > 0,
  });
}

export function useSearch(q: string, type: string, page = 1, sfw = true, filters?: SearchFilters) {
  const query = q.trim();

  return useQuery({
    queryKey: ["search", type, query, page, sfw, JSON.stringify(filters ?? {})],
    queryFn: ({ signal }) => fetchSearch<SearchResult>(type, query, page, sfw, filters, signal),
    enabled: query.length > 0,
  });
}

export function useInfiniteSearch(q: string, type: string, sfw = true, filters?: SearchFilters) {
  const query = q.trim();

  // Check if there are any active filters (excluding sfw as it's a default)
  const hasActiveFilters = filters && (
    (filters.genres && filters.genres.length > 0) ||
    !!filters.type ||
    !!filters.status ||
    !!filters.year ||
    !!filters.season
  );

  return useInfiniteQuery({
    queryKey: ["search", type, query, sfw, JSON.stringify(filters ?? {})],
    queryFn: ({ pageParam = 1, signal }) => fetchSearch<SearchResult>(type, query, pageParam, sfw, filters, signal),
    enabled: query.length > 0 || !!hasActiveFilters,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination?.has_next_page) {
        return (lastPage.pagination?.current_page ?? 1) + 1;
      }
      return undefined;
    },
    staleTime: 1000 * 60 * 60 * 2,
  });
}

export function useGenres() {
  return useQuery({
    queryKey: ["genres"],
    queryFn: ({ signal }) => fetchGenres(signal),
    select: (data) => data?.data ?? [],
    staleTime: 1000 * 60 * 60 * 24 * 7,
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
    enabled,
    staleTime: 1000 * 60 * 60 * 6,
  });
}

async function fetchSeasonsNow(page = 1, sfw = true, signal?: AbortSignal) {
  return fetchJikan<JikanListResponse<Anime[]>>("/seasons/now", { page, sfw }, { signal });
}

export function useSeasonsNow(sfw = true, enabled = true) {
  return useInfiniteQuery({
    queryKey: ["seasonsNow", sfw],
    queryFn: ({ pageParam = 1, signal }) => fetchSeasonsNow(pageParam, sfw, signal),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination?.has_next_page) {
        return (lastPage.pagination?.current_page ?? 1) + 1;
      }
      return undefined;
    },
    enabled,
    staleTime: 1000 * 60 * 60 * 2,
  });
}

async function fetchSeasonsUpcoming(page = 1, sfw = true, signal?: AbortSignal) {
  return fetchJikan<JikanListResponse<Anime[]>>("/seasons/upcoming", { page, sfw }, { signal });
}

export function useSeasonsUpcoming(sfw = true, enabled = true) {
  return useInfiniteQuery({
    queryKey: ["seasonsUpcoming", sfw],
    queryFn: ({ pageParam = 1, signal }) => fetchSeasonsUpcoming(pageParam, sfw, signal),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination?.has_next_page) {
        return (lastPage.pagination?.current_page ?? 1) + 1;
      }
      return undefined;
    },
    enabled,
    staleTime: 1000 * 60 * 60 * 2,
  });
}

async function fetchTopAnimeByPopularity(page = 1, limit = 20, signal?: AbortSignal) {
  return fetchJikan<JikanListResponse<Anime[]>>("/top/anime", { page, limit, filter: "bypopularity" }, { signal });
}

export function useTopAnimeByPopularity(limit = 20, enabled = true) {
  return useInfiniteQuery({
    queryKey: ["topAnimeByPopularity", limit],
    queryFn: ({ pageParam = 1, signal }) => fetchTopAnimeByPopularity(pageParam, limit, signal),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination?.has_next_page) {
        return (lastPage.pagination?.current_page ?? 1) + 1;
      }
      return undefined;
    },
    enabled,
    staleTime: 1000 * 60 * 60 * 4,
  });
}
