import * as React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

import { useScheduleForWeekday, type ScheduleItem } from "@/hooks/use-anime-schedule";
import { weekdayFilterFromDate } from "@/lib/api/schedule";
import { ScheduleCard } from "@/components/calendar/ScheduleCard";
import { ScheduleColumnSkeleton } from "@/components/calendar/ScheduleColumnSkeleton";

function dedupeItems(list: ScheduleItem[]) {
  const seen = new Set<string>();
  const out: ScheduleItem[] = [];
  for (const it of list) {
    const k = `${it.malId}-${it.timeLabelCR ?? "na"}-${it.title ?? ""}`;
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
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];

  const weekday = weekdayFilterFromDate(date);
  const { data: items, isLoading, error, refetch } = useScheduleForWeekday(weekday);

  React.useEffect(() => {
    onBusyChange?.(isLoading);
  }, [isLoading, onBusyChange]);

  const dedupedItems = React.useMemo(() => {
    if (!items) return [];
    return dedupeItems(items);
  }, [items]);

  return (
    <ThemedView
      style={[
        styles.wrap,
        { borderColor: c.cardBorder },
      ]}
    >
      {isLoading ? (
        <ScheduleColumnSkeleton />
      ) : null}

      {!isLoading && error ? (
        <View style={[styles.loadingBox, { borderColor: c.cardBorder }]}>
          <ThemedText style={{ color: c.icon }}>
            {t("common.error", { defaultValue: "Error" })}
          </ThemedText>
          <Pressable
            onPress={() => refetch()}
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

      {!isLoading && !error && dedupedItems.length > 0 ? (
        <View style={styles.list}>
          {dedupedItems.map((it, idx) => (
            <ScheduleCard
              key={`${it.malId}-${it.timeLabelCR ?? "na"}-${idx}`}
              item={it}
            />
          ))}
        </View>
      ) : null}

      {!isLoading && !error && dedupedItems.length === 0 ? (
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
    minHeight: 200,
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
    gap: 16,
  },
});

export { ScheduleColumn as default };
