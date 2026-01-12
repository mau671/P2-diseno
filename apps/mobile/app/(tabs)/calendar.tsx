import * as React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

// ✅ estos archivos deben estar en: apps/mobile/app/components/calendar/...
import { DayNavigator } from "@/components/calendar/DayNavigator";
import { ScheduleColumn } from "@/components/calendar/ScheduleColumn";

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export default function CalendarScreen() {
  const { t } = useTranslation();

  const [baseDate, setBaseDate] = React.useState<Date>(() => new Date());

  const nextDate = React.useMemo(() => addDays(baseDate, 1), [baseDate]);

  const onToday = React.useCallback(() => {
    setBaseDate(new Date());
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">{t("calendar.title")}</ThemedText>
      </ThemedView>

      <ThemedView style={styles.controls}>
        <DayNavigator date={baseDate} onChangeDate={setBaseDate} onToday={onToday} />
      </ThemedView>

      {/* ✅ 2 columnas: hoy + mañana */}
      <View style={styles.columns}>
        <ScheduleColumn date={baseDate} />
        <ScheduleColumn date={nextDate} />
      </View>
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
  columns: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
});
