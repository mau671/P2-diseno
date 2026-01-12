// apps/mobile/app/api/schedule.ts
const JIKAN_BASE = "https://api.jikan.moe/v4";
export const TZ_CR = "America/Costa_Rica";

export type ScheduleWeekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type ScheduleItem = {
  malId: number;
  title: string;
  imageUrl?: string | null;
  type?: string | null;
  totalEpisodes?: number | null;
  timeLabel?: string | null;
  weekday: ScheduleWeekday;
};

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

export function isHttpError(e: unknown, status: number) {
  return (
    typeof e === "object" &&
    e != null &&
    (e as any).name === "HttpError" &&
    (e as any).status === status
  );
}

const WEEKDAYS: ScheduleWeekday[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

function toWeekdayKeyFromEnglishLong(s: string): ScheduleWeekday {
  const k = s.trim().toLowerCase();
  if (k.startsWith("mon")) return "monday";
  if (k.startsWith("tue")) return "tuesday";
  if (k.startsWith("wed")) return "wednesday";
  if (k.startsWith("thu")) return "thursday";
  if (k.startsWith("fri")) return "friday";
  if (k.startsWith("sat")) return "saturday";
  return "sunday";
}

/**
 * ✅ Export que te falta:
 * Convierte un Date a weekday filter (monday..sunday) en timezone CR.
 */
export function weekdayFilterFromDate(date: Date): ScheduleWeekday {
  try {
    const weekdayLong = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      timeZone: TZ_CR,
    }).format(date);

    return toWeekdayKeyFromEnglishLong(weekdayLong);
  } catch {
    // fallback simple (timezone local)
    const d = date.getDay(); // 0=Sun
    return (["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][
      d
    ] ?? "sunday") as ScheduleWeekday;
  }
}

type JikanScheduleResponse = {
  data?: Array<{
    mal_id: number;
    title: string;
    title_english?: string | null;
    images?: {
      jpg?: { image_url?: string | null; large_image_url?: string | null };
      webp?: { image_url?: string | null; large_image_url?: string | null };
    };
    type?: string | null;
    episodes?: number | null;
    broadcast?: {
      day?: string | null;
      time?: string | null; // "17:00"
      timezone?: string | null; // "Asia/Tokyo"
      string?: string | null;
    };
  }>;
};

function pickTitle(a: { title: string; title_english?: string | null }) {
  return (a.title_english || a.title || "").trim();
}

function pickImage(a: any) {
  return (
    a?.images?.webp?.image_url ??
    a?.images?.jpg?.image_url ??
    a?.images?.webp?.large_image_url ??
    a?.images?.jpg?.large_image_url ??
    null
  );
}

function pickTimeLabel(a: any) {
  // OJO: Jikan da hora en el timezone de broadcast; aquí solo mostramos hh:mm si existe.
  // (tu UI ya acepta null -> "—")
  const t = a?.broadcast?.time;
  return typeof t === "string" && t.trim() ? t.trim() : null;
}

async function fetchJson(url: string, signal?: AbortSignal) {
  const res = await fetch(url, { signal });

  if (!res.ok) {
    const msg = `HTTP ${res.status}`;
    throw new HttpError(res.status, msg);
  }

  const json = (await res.json()) as JikanScheduleResponse;
  return json;
}

async function fetchScheduleByWeekday(
  weekday: ScheduleWeekday,
  signal?: AbortSignal
): Promise<ScheduleItem[]> {
  // ✅ SFW para evitar cosas raras en algunos resultados
  const url = `${JIKAN_BASE}/schedules?filter=${weekday}&sfw=true&page=1`;

  const json = await fetchJson(url, signal);
  const raw = json?.data ?? [];

  // ✅ de-dup por mal_id (evita el error de keys duplicadas en el render)
  const seen = new Set<number>();
  const out: ScheduleItem[] = [];

  for (const a of raw) {
    const id = a?.mal_id;
    if (typeof id !== "number") continue;
    if (seen.has(id)) continue;
    seen.add(id);

    out.push({
      malId: id,
      title: pickTitle(a),
      imageUrl: pickImage(a),
      type: a?.type ?? null,
      totalEpisodes: a?.episodes ?? null,
      timeLabel: pickTimeLabel(a),
      weekday,
    });
  }

  return out;
}

/**
 * ✅ Export que te falta:
 * Trae todo “por semana” (en realidad por weekday) en 1 llamada por día (7).
 * Útil para navegar de lunes a domingo sin inventar semanas pasadas/futuras.
 */
export async function fetchScheduleAll(signal?: AbortSignal) {
  // Para bajar chance de 429, hacemos requests secuenciales.
  const result = {
    monday: [] as ScheduleItem[],
    tuesday: [] as ScheduleItem[],
    wednesday: [] as ScheduleItem[],
    thursday: [] as ScheduleItem[],
    friday: [] as ScheduleItem[],
    saturday: [] as ScheduleItem[],
    sunday: [] as ScheduleItem[],
  };

  for (const wd of WEEKDAYS) {
    if (signal?.aborted) break;
    // pequeño delay para cuidar rate-limit (Jikan a veces se pone intenso)
    await new Promise((r) => setTimeout(r, 120));
    result[wd] = await fetchScheduleByWeekday(wd, signal);
  }

  return result;
}

/**
 * ✅ Mantengo este export porque tu UI ya lo venía usando.
 * Trae solo el día correspondiente a la fecha (en TZ CR).
 */
export async function fetchScheduleForDate(date: Date, signal?: AbortSignal) {
  const wd = weekdayFilterFromDate(date);
  return fetchScheduleByWeekday(wd, signal);
}
