export type ScheduleItem = {
  id: number;
  title: string;
  imageUrl?: string;
  type?: string | null;
  totalEpisodes?: number | null;
  timeLabel?: string | null; // ya en hora CR si se puede
};

const TZ_CR = "America/Costa_Rica";
const TZ_DEFAULT_SOURCE = "Asia/Tokyo";

type JikanScheduleAnime = {
  mal_id: number;
  title: string;
  type?: string | null;
  episodes?: number | null;
  images?: {
    jpg?: { image_url?: string; large_image_url?: string };
    webp?: { image_url?: string; large_image_url?: string };
  };
  broadcast?: {
    day?: string | null;      // "Sundays"
    time?: string | null;     // "17:30"
    timezone?: string | null; // "Asia/Tokyo"
    string?: string | null;
  };
};

function getPartsInTZ(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value;

  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
  };
}

function weekdayInTZ(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", { timeZone, weekday: "long" })
    .format(date)
    .toLowerCase(); // monday, tuesday...
}

export function getDateKeyCR(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ_CR,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const y = parts.find((p) => p.type === "year")?.value ?? "0000";
  const m = parts.find((p) => p.type === "month")?.value ?? "00";
  const d = parts.find((p) => p.type === "day")?.value ?? "00";
  return `${y}-${m}-${d}`;
}

// Convierte "YYYY-MM-DD hh:mm" en timeZone -> Date UTC real
function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string
) {
  const desiredUTC = Date.UTC(year, month - 1, day, hour, minute, 0);

  // 1) guess
  let guess = new Date(desiredUTC);

  // 2) medir como se vería el guess en esa zona
  const p1 = getPartsInTZ(guess, timeZone);
  const asUTC1 = Date.UTC(p1.year, p1.month - 1, p1.day, p1.hour, p1.minute, 0);
  guess = new Date(guess.getTime() + (desiredUTC - asUTC1));

  // 3) segundo pase (mejora precisión con DST/offsets)
  const p2 = getPartsInTZ(guess, timeZone);
  const asUTC2 = Date.UTC(p2.year, p2.month - 1, p2.day, p2.hour, p2.minute, 0);
  guess = new Date(guess.getTime() + (desiredUTC - asUTC2));

  return guess;
}

function parseHHMM(s?: string | null): { hh: number; mm: number } | null {
  if (!s) return null;
  const m = String(s).trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  return { hh, mm };
}

function formatTimeCR(dateUtc: Date, locale: string) {
  const hour12 = locale.startsWith("en");
  return new Intl.DateTimeFormat(locale, {
    timeZone: TZ_CR,
    hour: "2-digit",
    minute: "2-digit",
    hour12,
  }).format(dateUtc);
}

function pickImageUrl(a: JikanScheduleAnime) {
  return (
    a.images?.webp?.image_url ||
    a.images?.jpg?.image_url ||
    a.images?.webp?.large_image_url ||
    a.images?.jpg?.large_image_url ||
    undefined
  );
}

async function fetchScheduleFilter(filter: string, signal?: AbortSignal): Promise<JikanScheduleAnime[]> {
  const url = `https://api.jikan.moe/v4/schedules?filter=${encodeURIComponent(filter)}&page=1&limit=25`;

  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Jikan schedules failed (${res.status})`);
  const json = (await res.json()) as { data?: JikanScheduleAnime[] };
  return json?.data ?? [];
}

function unique<T>(arr: T[]) {
  return Array.from(new Set(arr));
}

/**
 * Trae el calendario PARA UN DÍA (según Costa Rica).
 * - calcula qué días toca pedir en JST (start/end) para cubrir el día completo CR
 * - convierte broadcast.time -> hora CR cuando se puede
 * - filtra solo lo que cae en esa fecha CR
 */
export async function fetchScheduleForCRDate(date: Date, signal?: AbortSignal): Promise<ScheduleItem[]> {
  const locale = "es-CR"; // solo para formato de hora si no pasás i18n aquí (UI igual lo ve bien)
  // rango del día en CR (00:00 y 23:59) convertidos a UTC
  const crYMD = getPartsInTZ(date, TZ_CR);
  const startUtc = zonedTimeToUtc(crYMD.year, crYMD.month, crYMD.day, 0, 0, TZ_CR);
  const endUtc = zonedTimeToUtc(crYMD.year, crYMD.month, crYMD.day, 23, 59, TZ_CR);

  // Jikan filtra por día (asumimos schedule de Japón), así que pedimos los 2 días JST que cubren el día CR
  const f1 = weekdayInTZ(startUtc, TZ_DEFAULT_SOURCE); // e.g. monday
  const f2 = weekdayInTZ(endUtc, TZ_DEFAULT_SOURCE);   // e.g. tuesday
  const filters = unique([f1, f2]);

  const pages = await Promise.all(filters.map((f) => fetchScheduleFilter(f, signal)));
  const combined = pages.flat();

  // dedupe por anime id
  const byId = new Map<number, JikanScheduleAnime>();
  for (const a of combined) {
    if (!byId.has(a.mal_id)) byId.set(a.mal_id, a);
  }

  const targetKeyCR = getDateKeyCR(date);

  const itemsWithTime: Array<{ item: ScheduleItem; eventUtc?: Date }> = [];

  for (const a of byId.values()) {
    const tzSrc = a.broadcast?.timezone ?? TZ_DEFAULT_SOURCE;
    const time = parseHHMM(a.broadcast?.time);

    let eventUtc: Date | undefined;

    if (time) {
      // Para decidir cuál "fecha source" usar, tomamos las fechas source al inicio y al final del día CR
      const srcStart = getPartsInTZ(startUtc, tzSrc);
      const srcEnd = getPartsInTZ(endUtc, tzSrc);

      // intentamos con srcStart primero, si no cae en el día CR, probamos con srcEnd
      const cand1 = zonedTimeToUtc(srcStart.year, srcStart.month, srcStart.day, time.hh, time.mm, tzSrc);
      const cand2 = zonedTimeToUtc(srcEnd.year, srcEnd.month, srcEnd.day, time.hh, time.mm, tzSrc);

      if (getDateKeyCR(cand1) === targetKeyCR) eventUtc = cand1;
      else if (getDateKeyCR(cand2) === targetKeyCR) eventUtc = cand2;
      else eventUtc = undefined;
    }

    // si tenemos hora, filtramos estrictamente al día CR
    if (eventUtc && getDateKeyCR(eventUtc) !== targetKeyCR) continue;

    const item: ScheduleItem = {
      id: a.mal_id,
      title: a.title,
      imageUrl: pickImageUrl(a),
      type: a.type ?? null,
      totalEpisodes: a.episodes ?? null,
      timeLabel: eventUtc ? formatTimeCR(eventUtc, locale) : null,
    };

    itemsWithTime.push({ item, eventUtc });
  }

  // ordenar: primero con hora, luego sin hora
  itemsWithTime.sort((A, B) => {
    const a = A.eventUtc?.getTime();
    const b = B.eventUtc?.getTime();
    if (a != null && b != null) return a - b;
    if (a != null) return -1;
    if (b != null) return 1;
    return A.item.title.localeCompare(B.item.title);
  });

  return itemsWithTime.map((x) => x.item);
}
