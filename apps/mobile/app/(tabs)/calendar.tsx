import * as React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { DayNavigator } from "@/components/calendar/DayNavigator";
import { ScheduleColumn } from "@/components/calendar/ScheduleColumn";
import {
  getZonedParts,
  zonedTimeToUtc,
  ymdKey,
  TZ_CR,
} from "@/lib/date-utils";

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

function makeCrNoonDateFromNow() {
  const cr = getZonedParts(new Date(), TZ_CR);
  // mediodía CR para que todo quede estable
  return zonedTimeToUtc(cr.year, cr.month, cr.day, 12, 0, TZ_CR);
}

function buildCurrentWeekCR() {
  const todayCrNoon = makeCrNoonDateFromNow();
  const idx = weekdayIndexCR(todayCrNoon); // 0..6 (Mon..Sun)
  const weekStart = addDaysUTC(todayCrNoon, -idx);

  const days = Array.from({ length: 7 }).map((_, i) => addDaysUTC(weekStart, i));

  const todayKey = ymdKey(todayCrNoon, TZ_CR);
  const todayIndex = Math.max(
    0,
    days.findIndex((d) => ymdKey(d, TZ_CR) === todayKey)
  );

  return { days, todayIndex };
}

export default function CalendarScreen() {
  const { t } = useTranslation();

  // recalcula por si cambia el día (en práctica se recalcula al re-render)
  const nowKey = ymdKey(new Date(), TZ_CR);
  const { days, todayIndex } = React.useMemo(buildCurrentWeekCR, [nowKey]);

  const [selectedIndex, setSelectedIndex] = React.useState<number>(() => todayIndex);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    // si cambió la semana porque ya es otro día (y el app re-renderizó), reseteamos al hoy de la semana nueva
    setSelectedIndex(todayIndex);
  }, [todayIndex]);

  const onPrev = React.useCallback(() => {
    setSelectedIndex((i) => Math.max(0, i - 1));
  }, []);

  const onNext = React.useCallback(() => {
    setSelectedIndex((i) => Math.min(6, i + 1));
  }, []);

  const selectedDate = days[selectedIndex];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">{t("calendar.title", { defaultValue: "Calendario" })}</ThemedText>
      </ThemedView>

      <ThemedView style={styles.controls}>
        <DayNavigator
          disabled={busy}
          selectedDate={selectedDate}
          canPrev={selectedIndex > 0}
          canNext={selectedIndex < 6}
          onPrev={onPrev}
          onNext={onNext}
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
