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

async function fetchSearchAnime(q: string, page = 1, sfw = true, signal?: AbortSignal) {
  return fetchJikan<JikanListResponse<Anime[]>>("/anime", { q, page, sfw }, { signal });
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

export function useSearchAnime(q: string, page = 1, sfw = true) {
  const query = q.trim();

  return useQuery({
    queryKey: ["searchAnime", query, page, sfw],
    queryFn: ({ signal }) => fetchSearchAnime(query, page, sfw, signal),
    enabled: query.length > 0,
    staleTime: 1000 * 60 * 2,
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
    //Ir a la temporada anterior del mismo año
    return { year, season: seasons[currentIndex - 1] };
  }
}

async function fetchSeasonAnime(year: number, season: string, page = 1, sfw = true, signal?: AbortSignal) {
  return fetchJikan<JikanListResponse<Anime[]>>(`/seasons/${year}/${season}`, { page, sfw }, { signal });
}

export function useSeasonAnime(year: number, season: string, page = 1, sfw = true) {
  return useQuery({
    queryKey: ["seasonAnime", year, season, page, sfw],
    queryFn: ({ signal }) => fetchSeasonAnime(year, season, page, sfw, signal),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
    retry: false,
  });
}

