import { jikanFetch, pickTitle, pickImage } from './jikan';
import type { JikanAnimeResponse, JikanGenreResponse, JikanAnime } from './types';

export type AnimeListItem = JikanAnime;
export type Genre = { mal_id: number; name: string; type: string; count: number };

const BASE_URL = 'https://api.jikan.moe/v4';

export type Season = 'winter' | 'spring' | 'summer' | 'fall';
export type Format =
  | 'tv'
  | 'movie'
  | 'ova'
  | 'special'
  | 'ona'
  | 'music'
  | 'cm'
  | 'pv'
  | 'tv_special';
export type Status = 'airing' | 'complete' | 'upcoming';

export type SearchFilters = {
  genres?: number[];
  sfw?: boolean;
  type?: Format;
  status?: Status;
  year?: number;
  season?: Season;
};

const seasonToMonth: Record<Season, string> = {
  winter: '01',
  spring: '04',
  summer: '07',
  fall: '10',
};

function filtersToParams(filters?: SearchFilters) {
  const params: Record<string, string | number | boolean | undefined> = {};

  if (filters?.genres && filters.genres.length > 0) {
    params.genres = filters.genres.join(',');
  }

  if (filters?.type) {
    params.type = filters.type;
  }

  if (filters?.status) {
    params.status = filters.status;
  }

  if (filters?.year) {
    if (filters?.season) {
      params.start_date = `${filters.year}-${seasonToMonth[filters.season]}`;
    } else {
      params.start_date = `${filters.year}`;
    }
  }

  if (filters?.sfw !== undefined) {
    params.sfw = filters.sfw;
  } else {
    params.sfw = true;
  }

  return params;
}

function buildQuery(params?: Record<string, string | number | boolean | undefined>): string {
  if (!params) return '';
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue;
    usp.set(k, String(v));
  }
  const qs = usp.toString();
  return qs ? `?${qs}` : '';
}

export async function fetchSeasonsNow(page: number = 1, limit: number = 25): Promise<JikanAnimeResponse> {
  const params = buildQuery({ page, limit, sfw: true });
  return jikanFetch(() =>
    fetch(`${BASE_URL}/seasons/now${params}`).then(r => r.json())
  );
}

export async function fetchSeasonsUpcoming(page: number = 1, limit: number = 25): Promise<JikanAnimeResponse> {
  const params = buildQuery({ page, limit, sfw: true });
  return jikanFetch(() =>
    fetch(`${BASE_URL}/seasons/upcoming${params}`).then(r => r.json())
  );
}

export async function fetchTopAnimeByPopularity(
  page: number = 1,
  limit: number = 20
): Promise<JikanAnimeResponse> {
  const params = buildQuery({ page, limit, filter: 'bypopularity', sfw: true });
  return jikanFetch(() =>
    fetch(`${BASE_URL}/top/anime${params}`).then(r => r.json())
  );
}

export async function fetchSearchAnime(
  query: string,
  page: number = 1,
  limit: number = 25,
  filters?: SearchFilters
): Promise<JikanAnimeResponse> {
  const params = { q: query, page, limit, ...filtersToParams(filters) };
  const queryString = buildQuery(params);
  return jikanFetch(() =>
    fetch(`${BASE_URL}/anime${queryString}`).then(r => r.json())
  );
}

export async function fetchGenres(): Promise<JikanGenreResponse> {
  return jikanFetch(() =>
    fetch(`${BASE_URL}/genres/anime`).then(r => r.json())
  );
}

export { pickTitle, pickImage };
