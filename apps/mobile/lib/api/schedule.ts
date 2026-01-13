import { jikanFetch, pickTitle, pickImage } from './jikan';
import type { ScheduleItem } from './types';
import type { ScheduleWeekday } from './types';

export const TZ_CR = 'America/Costa_Rica';

const WEEKDAYS: ScheduleWeekday[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

function toWeekdayKeyFromEnglishLong(s: string): ScheduleWeekday {
  const k = s.trim().toLowerCase();
  if (k.startsWith('mon')) return 'monday';
  if (k.startsWith('tue')) return 'tuesday';
  if (k.startsWith('wed')) return 'wednesday';
  if (k.startsWith('thu')) return 'thursday';
  if (k.startsWith('fri')) return 'friday';
  if (k.startsWith('sat')) return 'saturday';
  return 'sunday';
}

export function weekdayFilterFromDate(date: Date): ScheduleWeekday {
  try {
    const weekdayLong = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      timeZone: TZ_CR,
    }).format(date);

    return toWeekdayKeyFromEnglishLong(weekdayLong);
  } catch {
    const d = date.getDay();
    return (['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][
      d
    ] ?? 'sunday') as ScheduleWeekday;
  }
}

function pickTimeLabel(a: any) {
  const t = a?.broadcast?.time;
  return typeof t === 'string' && t.trim() ? t.trim() : null;
}

async function fetchScheduleByWeekday(weekday: ScheduleWeekday): Promise<ScheduleItem[]> {
  const BASE_URL = 'https://api.jikan.moe/v4';
  const url = `${BASE_URL}/schedules?filter=${weekday}&sfw=true&page=1`;

  const json = await jikanFetch<any>(() => fetch(url).then(r => r.json()));

  const raw = json?.data ?? [];
  const seen = new Set<number>();
  const out: ScheduleItem[] = [];

  for (const a of raw) {
    const id = a?.mal_id;
    if (typeof id !== 'number') continue;
    if (seen.has(id)) continue;
    seen.add(id);

    out.push({
      malId: id,
      title: pickTitle(a),
      imageUrl: pickImage(a),
      type: a?.type ?? null,
      totalEpisodes: a?.episodes ?? null,
      timeLabel: pickTimeLabel(a),
      broadcastTime: a?.broadcast?.time ?? null,
      broadcastTimezone: a?.broadcast?.timezone ?? 'Asia/Tokyo',
      weekday,
    });
  }

  return out;
}

export { fetchScheduleByWeekday };

export async function fetchScheduleAll() {
  const result: Record<ScheduleWeekday, ScheduleItem[]> = {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  };

  for (const wd of WEEKDAYS) {
    result[wd] = await fetchScheduleByWeekday(wd);
  }

  return result;
}

export async function fetchScheduleForDate(date: Date): Promise<ScheduleItem[]> {
  const wd = weekdayFilterFromDate(date);
  return fetchScheduleByWeekday(wd);
}
