// apps/mobile/components/calendar/ScheduleColumn.tsx
import * as React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { ThemedText } from "@/components/themed-text";
import { useAnimeSchedule } from "@/hooks/use-anime-schedule";
import { ScheduleCard } from "./ScheduleCard";

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function prettyDayLabel(date: Date, locale: string) {
  // Ej: "Sun Jan 11" / "dom 11 ene" (depende del locale)
  // Luego lo dejamos más “bonito” con capitalización ligera.
  const fmt = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const raw = fmt.format(date);

  // capitaliza cada palabra (simple)
  return raw
    .split(" ")
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export function ScheduleColumn(props: {
  date: Date;
  maxPages?: number; // por ahora 3 default
}) {
  const { t, i18n } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];

  const now = new Date();
  const today = isSameDay(props.date, now);

  const q = useAnimeSchedule(props.date, {
    enabled: true,
    sfw: true,
    maxPages: props.maxPages ?? 3,
  });

  const title = prettyDayLabel(props.date, i18n.language || "en-US");

  return (
    <View style={[styles.col, { borderColor: c.divider }]}>
      <View style={styles.header}>
        <ThemedText style={[styles.headerText, { color: today ? c.tint : c.text }]}>
          {title}
        </ThemedText>
      </View>

      {q.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator />
          <ThemedText style={{ marginTop: 8, opacity: 0.8 }}>
            {t("common.loading", { defaultValue: "Loading..." })}
          </ThemedText>
        </View>
      ) : null}

      {q.isError ? (
        <View style={styles.center}>
          <ThemedText style={{ color: c.error, fontWeight: "700" }}>
            {t("common.loadError", { defaultValue: "Failed to load data." })}
          </ThemedText>
          <ThemedText style={{ marginTop: 6, opacity: 0.8 }}>
            {q.error?.message ?? ""}
          </ThemedText>
          <ThemedText
            onPress={q.refetch}
            style={{ marginTop: 10, color: c.tint, fontWeight: "700" }}
          >
            {t("common.retry", { defaultValue: "Retry" })}
          </ThemedText>
        </View>
      ) : null}

      {!q.isLoading && !q.isError && q.data.length === 0 ? (
        <View style={styles.center}>
          <ThemedText style={{ opacity: 0.8 }}>
            {t("calendar.empty", { defaultValue: "No items." })}
          </ThemedText>
        </View>
      ) : null}

      {!q.isLoading && !q.isError && q.data.length > 0 ? (
        <View style={styles.list}>
          {q.data.map((it) => (
            <ScheduleCard key={it.id} item={it} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  col: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    minWidth: 0,
  },
  header: {
    marginBottom: 6,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "800",
  },
  list: {
    marginTop: 4,
  },
  center: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
