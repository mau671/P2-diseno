// apps/mobile/api/schedule.ts
import { fetchJikan, type JikanListResponse } from "./jikan";

export type WeekdayFilter =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type JikanImages = {
  jpg?: { image_url?: string; small_image_url?: string; large_image_url?: string };
  webp?: { image_url?: string; small_image_url?: string; large_image_url?: string };
};

export type JikanBroadcast = {
  day?: string | null;     // "Sundays"
  time?: string | null;    // "17:00"
  timezone?: string | null;// "Asia/Tokyo"
  string?: string | null;  // "Sundays at 17:00 (JST)"
};

export type JikanScheduleAnime = {
  mal_id: number;
  title: string;
  images?: JikanImages;
  type?: string | null;
  episodes?: number | null;
  broadcast?: JikanBroadcast | null;
};

export type ScheduleItem = {
  id: number;
  title: string;
  imageUrl?: string | null;
  type?: string | null;
  totalEpisodes?: number | null;
  timeLabel?: string | null; // "17:00" o null
};

export function weekdayFilterFromDate(d: Date): WeekdayFilter {
  // JS: 0=Sunday ... 6=Saturday
  const day = d.getDay();
  switch (day) {
    case 0: return "sunday";
    case 1: return "monday";
    case 2: return "tuesday";
    case 3: return "wednesday";
    case 4: return "thursday";
    case 5: return "friday";
    default: return "saturday";
  }
}

export function normalizeScheduleAnime(a: JikanScheduleAnime): ScheduleItem {
  const img =
    a.images?.webp?.image_url ||
    a.images?.jpg?.image_url ||
    a.images?.webp?.small_image_url ||
    a.images?.jpg?.small_image_url ||
    null;

  const time = a.broadcast?.time?.trim() || null;

  return {
    id: a.mal_id,
    title: a.title,
    imageUrl: img,
    type: a.type ?? null,
    totalEpisodes: a.episodes ?? null,
    timeLabel: time,
  };
}

export async function fetchSchedulePage(
  filter: WeekdayFilter,
  page = 1,
  sfw = true,
  signal?: AbortSignal
) {
  // Jikan v4 schedule: /schedules?filter=monday&page=1&sfw=true
  return fetchJikan<JikanListResponse<JikanScheduleAnime[]>>(
    "/schedules",
    { filter, page, sfw },
    { signal }
  );
}

/**
 * Trae varias páginas (por defecto 3) y deduplica por mal_id.
 * Esto lo hacemos porque algunos días vienen con mucha data.
 */
export async function fetchScheduleAll(
  filter: WeekdayFilter,
  opts?: {
    sfw?: boolean;
    maxPages?: number; // ej: 3
    signal?: AbortSignal;
  }
): Promise<ScheduleItem[]> {
  const sfw = opts?.sfw ?? true;
  const maxPages = Math.max(1, opts?.maxPages ?? 3);

  const seen = new Set<number>();
  const out: ScheduleItem[] = [];

  let page = 1;
  for (; page <= maxPages; page++) {
    const res = await fetchSchedulePage(filter, page, sfw, opts?.signal);

    const items = (res?.data ?? []).map(normalizeScheduleAnime);

    for (const it of items) {
      if (seen.has(it.id)) continue;
      seen.add(it.id);
      out.push(it);
    }

    if (!res.pagination?.has_next_page) break;
  }

  return out;
}
