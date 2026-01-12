// apps/mobile/hooks/use-anime-schedule.ts
import * as React from "react";
import { fetchScheduleAll, weekdayFilterFromDate, type ScheduleItem } from "@/app/api/schedule";

type State = {
  data: ScheduleItem[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
};

const cache = new Map<string, { at: number; data: ScheduleItem[] }>();
const CACHE_TTL_MS = 1000 * 60 * 10; // 10 min

function keyFor(date: Date, sfw: boolean, maxPages: number) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}|sfw=${sfw}|pages=${maxPages}`;
}

export function useAnimeSchedule(date: Date, opts?: { enabled?: boolean; sfw?: boolean; maxPages?: number }) {
  const enabled = opts?.enabled ?? true;
  const sfw = opts?.sfw ?? true;
  const maxPages = Math.max(1, opts?.maxPages ?? 3);

  const [state, setState] = React.useState<State>({
    data: [],
    isLoading: enabled,
    isError: false,
    error: null,
  });

  const dateKey = React.useMemo(() => keyFor(date, sfw, maxPages), [date, sfw, maxPages]);

  const run = React.useCallback(async (signal?: AbortSignal) => {
    if (!enabled) return;

    // Cache
    const c = cache.get(dateKey);
    if (c && Date.now() - c.at < CACHE_TTL_MS) {
      setState({ data: c.data, isLoading: false, isError: false, error: null });
      return;
    }

    setState((s) => ({ ...s, isLoading: true, isError: false, error: null }));

    try {
      const filter = weekdayFilterFromDate(date);
      const data = await fetchScheduleAll(filter, { sfw, maxPages, signal });

      cache.set(dateKey, { at: Date.now(), data });
      setState({ data, isLoading: false, isError: false, error: null });
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Unknown error");
      setState({ data: [], isLoading: false, isError: true, error: err });
    }
  }, [enabled, date, sfw, maxPages, dateKey]);

  React.useEffect(() => {
    if (!enabled) return;

    const ctrl = new AbortController();
    run(ctrl.signal);

    return () => ctrl.abort();
  }, [run, enabled, dateKey]);

  const refetch = React.useCallback(() => {
    // invalida cache para esta key y vuelve a correr
    cache.delete(dateKey);
    const ctrl = new AbortController();
    run(ctrl.signal);
  }, [dateKey, run]);

  return { ...state, refetch };
}
