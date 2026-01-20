export const TZ_CR = "America/Costa_Rica";

export interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

export function getZonedParts(date: Date, timeZone: string = TZ_CR): ZonedParts {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value;

  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
  };
}

export function zonedTimeToUtc(
  y: number,
  m: number,
  d: number,
  hh: number,
  mm: number,
  timeZone: string
): Date {
  const t0 = Date.UTC(y, m - 1, d, hh, mm);
  const d0 = new Date(t0);
  const p0 = getZonedParts(d0, timeZone);
  const asIfUtc0 = Date.UTC(p0.year, p0.month - 1, p0.day, p0.hour, p0.minute);
  const offset0 = asIfUtc0 - t0;

  const t1 = t0 - offset0;
  const d1 = new Date(t1);
  const p1 = getZonedParts(d1, timeZone);
  const asIfUtc1 = Date.UTC(p1.year, p1.month - 1, p1.day, p1.hour, p1.minute);
  const offset1 = asIfUtc1 - t1;

  return new Date(t0 - offset1);
}

export function ymdKey(date: Date, timeZone: string = TZ_CR): string {
  const p = getZonedParts(date, timeZone);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

export function isTodayInTz(date: Date, timeZone: string = TZ_CR): boolean {
  return ymdKey(date, timeZone) === ymdKey(new Date(), timeZone);
}

export function formatZonedDate(date: Date, locale: string = "es-419", options: Intl.DateTimeFormatOptions = {}): string {
  const normalizedLocaleInput = (locale || "es-419").toLowerCase();
  const normalizedLocale = normalizedLocaleInput.startsWith("es")
    ? "es"
    : normalizedLocaleInput.startsWith("en")
      ? "en"
      : normalizedLocaleInput;

  if (normalizedLocale === "es") {
    return buildDateStringFallback(date, normalizedLocale, options);
  }
  
  try {
    const formatter = new Intl.DateTimeFormat(normalizedLocale, {
      timeZone: TZ_CR,
      ...options,
    });
    
    const parts = formatter.formatToParts(date);
    const requestedParts: Array<"weekday" | "day" | "month" | "year" | "hour" | "minute"> = [];
    if (options.weekday) requestedParts.push("weekday");
    if (options.day) requestedParts.push("day");
    if (options.month) requestedParts.push("month");
    if (options.year) requestedParts.push("year");
    if (options.hour) requestedParts.push("hour");
    if (options.minute) requestedParts.push("minute");
    
    const hasAllParts = requestedParts.every((type) => {
      const matching = parts.find((p) => p.type === type);
      return matching && matching.value.trim().length > 0;
    });
    
    if (hasAllParts) {
      return formatter.format(date);
    }
    
    return buildDateStringFallback(date, normalizedLocale, options);
  } catch {
    return buildDateStringFallback(date, normalizedLocale, options);
  }
}

function buildDateStringFallback(date: Date, locale: string, options: Intl.DateTimeFormatOptions): string {
  const parts = getZonedParts(date, TZ_CR);
  const result: string[] = [];
  
  if (options.weekday) {
    const weekdays = locale.startsWith("es") 
      ? ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"]
      : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const tempDate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12, 0));
    result.push(weekdays[tempDate.getUTCDay()]);
  }
  
  if (options.day) {
    result.push(String(parts.day));
  }
  
  if (options.month) {
    const months = locale.startsWith("es")
      ? ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
      : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    result.push(months[parts.month - 1]);
  }
  
  if (options.year) {
    result.push(String(parts.year));
  }
  
  if (locale.startsWith("es")) {
    if (options.weekday && result.length > 1) {
      return `${result[0]}, ${result.slice(1).join(" ")}`;
    }
    if (!options.weekday && options.day && options.month) {
      return result.join(" ");
    }
    if (options.weekday && options.day && options.month) {
      const [weekday, ...rest] = result;
      return `${weekday}, ${rest.join(" ")}`;
    }
    return result.join(" ");
  }
  
  if (options.weekday && result.length > 1) {
    return result[0] + ", " + result.slice(1).join(" ");
  }
  return result.join(" ");
}
