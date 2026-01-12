import * as React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

import {
  fetchScheduleForDate,
  isHttpError,
  type ScheduleItem,
} from "@/app/api/schedule";
import { ScheduleCard } from "@/components/calendar/ScheduleCard";

const TZ_CR = "America/Costa_Rica";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function isSameDay(a: Date, b: Date) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

function formatHeaderDate(d: Date) {
  try {
    const fmt = new Intl.DateTimeFormat(undefined, {
      timeZone: TZ_CR,
      weekday: "short",
      day: "2-digit",
      month: "short",
    });
    return fmt.format(d);
  } catch {
    return d.toDateString();
  }
}

function dedupeItems(list: ScheduleItem[]) {
  const seen = new Set<string>();
  const out: ScheduleItem[] = [];
  for (const it of list) {
    const k = `${it.malId}-${it.timeLabel ?? "na"}-${it.title ?? ""}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(it);
  }
  return out;
}

export function ScheduleColumn({
  date,
  onBusyChange,
}: {
  date: Date;
  onBusyChange?: (busy: boolean) => void;
}) {
  const { t, i18n } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];

  const todayBlue = scheme === "dark" ? "#4EA1FF" : "#0A84FF";
  const [items, setItems] = React.useState<ScheduleItem[] | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [retryKey, setRetryKey] = React.useState(0);

  const dayLabel = React.useMemo(() => formatHeaderDate(date), [date]);
  const isToday = React.useMemo(() => isSameDay(date, new Date()), [date]);

  const todayFallback = i18n.language?.toLowerCase().startsWith("en") ? "Today" : "Hoy";

  const refetch = React.useCallback(() => {
    setRetryKey((k) => k + 1);
  }, []);

  React.useEffect(() => {
    let mounted = true;
    const ac = new AbortController();

    const run = async () => {
      const minLoadMs = 450;
      const debounceMs = 320;
      const started = Date.now();

      setLoading(true);
      setError(null);
      onBusyChange?.(true);

      await new Promise<void>((res) => {
        const id = setTimeout(() => {
          clearTimeout(id);
          res();
        }, debounceMs);
      });

      if (ac.signal.aborted) return;

      const max429Retries = 3;
      let tries429 = 0;

      while (!ac.signal.aborted) {
        try {
          const data = await fetchScheduleForDate(date, ac.signal);
          if (!mounted || ac.signal.aborted) return;

          setItems(dedupeItems(data));
          setError(null);
          break;
        } catch (e: any) {
          if (!mounted || ac.signal.aborted) return;

          if (isHttpError(e, 429)) {
            tries429 += 1;
            if (tries429 > max429Retries) {
              setError(
                t("common.tooManyRequests", {
                  defaultValue: "Demasiadas solicitudes. Intenta de nuevo.",
                })
              );
              break;
            }
            const waitMs = 900 + tries429 * 700;
            await new Promise((r) => setTimeout(r, waitMs));
            continue;
          }

          const msg =
            e instanceof Error
              ? e.message
              : t("common.error", { defaultValue: "Error" });

          setError(msg);
          break;
        }
      }

      const elapsed = Date.now() - started;
      const waitMore = Math.max(0, minLoadMs - elapsed);
      if (waitMore) await new Promise((r) => setTimeout(r, waitMore));

      if (!mounted || ac.signal.aborted) return;
      setLoading(false);
      onBusyChange?.(false);
    };

    run();

    return () => {
      mounted = false;
      ac.abort();
    };
  }, [date, retryKey, onBusyChange, t]);

  return (
    <ThemedView
      style={[
        styles.wrap,
        { borderColor: c.cardBorder, backgroundColor: c.background },
      ]}
    >
      <View style={styles.headerRow}>
        <ThemedText
          style={[
            styles.dayTitle,
            { color: isToday ? todayBlue : c.text },
          ]}
        >
          {dayLabel}
        </ThemedText>

        {isToday ? (
          <View
            style={[
              styles.todayPill,
              { backgroundColor: c.secondary, borderColor: c.cardBorder },
            ]}
          >
            <ThemedText style={[styles.todayPillText, { color: c.text }]}>
              {t("calendar.today", { defaultValue: todayFallback })}
            </ThemedText>
          </View>
        ) : null}
      </View>

      {loading ? (
        <View style={[styles.loadingBox, { borderColor: c.cardBorder }]}>
          <ThemedText style={{ color: c.icon }}>
            {t("common.loading", { defaultValue: "Cargando..." })}
          </ThemedText>
        </View>
      ) : null}

      {!loading && error ? (
        <View style={[styles.loadingBox, { borderColor: c.cardBorder }]}>
          <ThemedText style={{ color: c.icon }}>{error}</ThemedText>
          <Pressable
            onPress={refetch}
            style={[
              styles.retryBtn,
              { borderColor: c.cardBorder, backgroundColor: c.card },
            ]}
          >
            <ThemedText style={{ color: c.text, fontWeight: "900" }}>
              {t("common.retry", { defaultValue: "Reintentar" })}
            </ThemedText>
          </Pressable>
        </View>
      ) : null}

      {!loading && !error && items && items.length > 0 ? (
        <View style={styles.list}>
          {items.map((it, idx) => (
            <ScheduleCard
              key={`${it.malId}-${it.timeLabel ?? "na"}-${idx}`}
              item={it}
            />
          ))}
        </View>
      ) : null}

      {!loading && !error && (!items || items.length === 0) ? (
        <View style={[styles.loadingBox, { borderColor: c.cardBorder }]}>
          <ThemedText style={{ color: c.icon }}>
            {t("calendar.noEvents", { defaultValue: "No hay eventos programados" })}
          </ThemedText>
        </View>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
    paddingTop: 26,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  dayTitle: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.2,
    textTransform: "capitalize",
  },
  todayPill: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  todayPillText: {
    fontSize: 12,
    fontWeight: "900",
  },
  loadingBox: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    minHeight: 120,
  },
  retryBtn: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  list: {
    gap: 8,
  },
});

export default ScheduleColumn;
