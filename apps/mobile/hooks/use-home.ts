import { useInfiniteQuery } from '@tanstack/react-query';
import {
  fetchSeasonsNow,
  fetchSeasonsUpcoming,
  fetchTopAnimeByPopularity,
} from '@/lib/api/home';
import type { JikanAnimeResponse } from '@/lib/api/types';

const PAGE_LIMIT = 20;
const STALE_TIME = 15 * 60 * 1000;
const GC_TIME = 60 * 60 * 1000;

export function useSeasonsNow() {
  return useInfiniteQuery({
    queryKey: ['home', 'seasonsNow'],
    queryFn: ({ pageParam = 1 }) => fetchSeasonsNow(pageParam as number, PAGE_LIMIT),
    getNextPageParam: (last: JikanAnimeResponse, allPages) =>
      last.pagination?.has_next_page
        ? allPages.length + 1
        : undefined,
    initialPageParam: 1,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    retry: 3,
  });
}

export function useSeasonsUpcoming() {
  return useInfiniteQuery({
    queryKey: ['home', 'seasonsUpcoming'],
    queryFn: ({ pageParam = 1 }) => fetchSeasonsUpcoming(pageParam as number, PAGE_LIMIT),
    getNextPageParam: (last: JikanAnimeResponse, allPages) =>
      last.pagination?.has_next_page
        ? allPages.length + 1
        : undefined,
    initialPageParam: 1,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    retry: 3,
  });
}

export function useTopAnimeByPopularity() {
  return useInfiniteQuery({
    queryKey: ['home', 'topByPopularity'],
    queryFn: ({ pageParam = 1 }) => fetchTopAnimeByPopularity(pageParam as number, PAGE_LIMIT),
    getNextPageParam: (last: JikanAnimeResponse, allPages) =>
      last.pagination?.has_next_page
        ? allPages.length + 1
        : undefined,
    initialPageParam: 1,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    retry: 3,
  });
}
