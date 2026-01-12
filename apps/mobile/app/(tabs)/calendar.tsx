import * as React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

// ✅ deben existir en: apps/mobile/app/components/calendar/...
import { DayNavigator } from "@/components/calendar/DayNavigator";
import { ScheduleColumn } from "@/components/calendar/ScheduleColumn";

function normalizeDay(d: Date) {
  // Noon evita rarezas de cambio de día por zonas horarias/offsets
  const x = new Date(d);
  x.setHours(12, 0, 0, 0);
  return x;
}

export default function CalendarScreen() {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = React.useState<Date>(() => normalizeDay(new Date()));

  const onToday = React.useCallback(() => {
    setSelectedDate(normalizeDay(new Date()));
  }, []);

  const onChangeDate = React.useCallback((d: Date) => {
    setSelectedDate(normalizeDay(d));
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">{t("calendar.title")}</ThemedText>
      </ThemedView>

      <ThemedView style={styles.controls}>
        <DayNavigator date={selectedDate} onChangeDate={onChangeDate} onToday={onToday} />
      </ThemedView>

      {/* ✅ 1 solo día (el seleccionado) */}
      <ThemedView style={styles.dayWrap}>
        <ScheduleColumn date={selectedDate} />
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingBottom: 24,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 10,
  },
  controls: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  dayWrap: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
});
