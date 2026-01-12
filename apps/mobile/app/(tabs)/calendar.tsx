import * as React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

import { DayNavigator } from "@/components/calendar/DayNavigator";
import ScheduleColumn from "@/components/calendar/ScheduleColumn";

const TZ_CR = "America/Costa_Rica";

function getZonedParts(date: Date, timeZone: string) {
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

function zonedTimeToUtc(
  y: number,
  m: number,
  d: number,
  hh: number,
  mm: number,
  timeZone: string
) {
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

function makeCrNoonDateFromNow() {
  const cr = getZonedParts(new Date(), TZ_CR);
  // mediodía CR para que todo quede estable
  return zonedTimeToUtc(cr.year, cr.month, cr.day, 12, 0, TZ_CR);
}

function weekdayIndexCR(date: Date) {
  const w = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ_CR,
    weekday: "short",
  }).format(date);
  // Mon..Sun => 0..6
  const map: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  };
  return map[w] ?? 0;
}

function addDaysUTC(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function ymdKeyCR(date: Date) {
  const p = getZonedParts(date, TZ_CR);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(
    2,
    "0"
  )}`;
}

function buildCurrentWeekCR() {
  const todayCrNoon = makeCrNoonDateFromNow();
  const idx = weekdayIndexCR(todayCrNoon); // 0..6 (Mon..Sun)
  const weekStart = addDaysUTC(todayCrNoon, -idx);

  const days = Array.from({ length: 7 }).map((_, i) => addDaysUTC(weekStart, i));

  const todayKey = ymdKeyCR(todayCrNoon);
  const todayIndex = Math.max(
    0,
    days.findIndex((d) => ymdKeyCR(d) === todayKey)
  );

  return { days, todayIndex };
}

export default function CalendarScreen() {
  const { t } = useTranslation();

  // recalcula por si cambia el día (en práctica se recalcula al re-render)
  const nowKey = ymdKeyCR(new Date());
  const { days, todayIndex } = React.useMemo(buildCurrentWeekCR, [nowKey]);

  const [selectedIndex, setSelectedIndex] = React.useState<number>(() => todayIndex);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    // si cambió la semana porque ya es otro día (y el app re-renderizó), reseteamos al hoy de la semana nueva
    setSelectedIndex(todayIndex);
  }, [todayIndex]);

  const onToday = React.useCallback(() => {
    setSelectedIndex(todayIndex);
  }, [todayIndex]);

  const onPrev = React.useCallback(() => {
    setSelectedIndex((i) => Math.max(0, i - 1));
  }, []);

  const onNext = React.useCallback(() => {
    setSelectedIndex((i) => Math.min(6, i + 1));
  }, []);

  const selectedDate = days[selectedIndex];
  const isToday = selectedIndex === todayIndex;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">{t("calendar.title", { defaultValue: "Calendario" })}</ThemedText>
      </ThemedView>

      <ThemedView style={styles.controls}>
        <DayNavigator
          disabled={busy}
          isToday={isToday}
          canPrev={selectedIndex > 0}
          canNext={selectedIndex < 6}
          onPrev={onPrev}
          onNext={onNext}
          onToday={onToday}
        />
      </ThemedView>

      {/* ✅ SOLO 1 DÍA (dentro de la semana actual) */}
      <ThemedView style={styles.dayWrap}>
        <ScheduleColumn date={selectedDate} onBusyChange={setBusy} />
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 24 },
  header: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 10,
  },
  controls: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  dayWrap: {
    paddingHorizontal: 20,
  },
});
