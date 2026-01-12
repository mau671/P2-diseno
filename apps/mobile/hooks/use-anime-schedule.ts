// apps/mobile/hooks/use-anime-schedule.ts
import * as React from "react";

import { fetchScheduleForDate, isHttpError, type ScheduleItem } from "@/app/api/schedule";

type State = {
  data: ScheduleItem[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
};

const TZ_CR = "America/Costa_Rica";

// cache simple para no spamear Jikan al navegar
const cache = new Map<string, { at: number; data: ScheduleItem[] }>();
const CACHE_TTL_MS = 1000 * 60 * 5; // 5 min

function safeWeekdayKeyCR(date: Date) {
  try {
    // Monday, Tuesday, ...
    const day = new Intl.DateTimeFormat("en-US", {
      timeZone: TZ_CR,
      weekday: "long",
    })
      .format(date)
      .toLowerCase();

    // monday..sunday
    return day;
  } catch {
    const names = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    return names[date.getDay()] ?? "monday";
  }
}

function buildCacheKey(date: Date, sfw: boolean, maxPages: number) {
  // OJO: el schedule de Jikan es por día de semana (no histórico),
  // así que cachear por weekday es lo más correcto.
  const weekday = safeWeekdayKeyCR(date);
  return `${weekday}::sfw=${sfw ? 1 : 0}::maxPages=${maxPages}`;
}

function uniqSchedule(items: ScheduleItem[]) {
  // Evita el error de "two children with the same key"
  // (malId se repite a veces, o pueden venir duplicados por paginación).
  const seen = new Set<string>();
  const out: ScheduleItem[] = [];

  for (const it of items) {
    const key = `${it.malId ?? "na"}|${it.timeLabel ?? ""}|${it.title ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }

  return out;
}

export function useAnimeSchedule({
  date,
  enabled = true,
  sfw = true,
  maxPages = 2,
}: {
  date: Date;
  enabled?: boolean;
  sfw?: boolean;
  maxPages?: number; // se mantiene por compatibilidad, aunque fetchScheduleForDate maneja su propia lógica
}) {
  const [state, setState] = React.useState<State>({
    data: [],
    isLoading: false,
    isError: false,
    error: null,
  });

  const refreshNonce = React.useRef(0);

  const refetch = React.useCallback(() => {
    refreshNonce.current += 1;
    // forzamos re-render para que el effect se dispare
    setState((s) => ({ ...s }));
  }, []);

  React.useEffect(() => {
    if (!enabled) {
      setState((s) => ({ ...s, isLoading: false }));
      return;
    }

    let mounted = true;
    const ac = new AbortController();

    const dateKey = buildCacheKey(date, sfw, maxPages);

    // 1) pintar cache primero (si existe y está fresco)
    const cached = cache.get(dateKey);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
      setState({
        data: cached.data,
        isLoading: false,
        isError: false,
        error: null,
      });
    } else {
      // si no hay cache, mostramos loading pero sin “romper” si ya había data
      setState((s) => ({
        ...s,
        isLoading: true,
        isError: false,
        error: null,
      }));
    }

    const run = async () => {
      // ✅ debounce para cuando el mae aprieta flechas rapidísimo
      const debounceMs = 300;
      await new Promise((r) => setTimeout(r, debounceMs));
      if (!mounted || ac.signal.aborted) return;

      const minLoadMs = 450; // evita flicker
      const started = Date.now();

      let attempt = 0;

      while (attempt < 2) {
        try {
          // Nota: usamos la API que SÍ existe
          const data = await fetchScheduleForDate(date, ac.signal);

          if (!mounted || ac.signal.aborted) return;

          const clean = uniqSchedule(Array.isArray(data) ? data : []);

          cache.set(dateKey, { at: Date.now(), data: clean });

          setState({
            data: clean,
            isLoading: false,
            isError: false,
            error: null,
          });

          return;
        } catch (e: any) {
          if (!mounted || ac.signal.aborted) return;

          // ✅ 429: esperamos suave y reintentamos 1 vez (sin mostrar error feo)
          if (isHttpError && isHttpError(e, 429) && attempt === 0) {
            attempt += 1;
            await new Promise((r) => setTimeout(r, 1100));
            continue;
          }

          const err = e instanceof Error ? e : new Error("Unknown error");

          // si ya había data (cache o anterior), no “rompemos” la UI con pantalla vacía
          setState((s) => ({
            data: s.data ?? [],
            isLoading: false,
            isError: true,
            error: err,
          }));

          return;
        } finally {
          const elapsed = Date.now() - started;
          const waitMore = Math.max(0, minLoadMs - elapsed);
          if (waitMore) await new Promise((r) => setTimeout(r, waitMore));
        }
      }
    };

    run();

    return () => {
      mounted = false;
      ac.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, date, sfw, maxPages, refreshNonce.current]);

  return {
    ...state,
    refetch,
  };
}
