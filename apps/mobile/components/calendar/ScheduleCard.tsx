import * as React from "react";
import { Image, StyleSheet, View } from "react-native";

import { Colors } from "@/constants/theme";
import { useThemePreference } from "@/context/theme-preference";
import { ThemedText } from "@/components/themed-text";
import type { ScheduleItem } from "@/hooks/use-anime-schedule";

const POSTER_WIDTH = 54;
const POSTER_HEIGHT = 81;
const ROW_HEIGHT = 81;

export function ScheduleCard({ item }: { item: ScheduleItem }) {
  const { resolvedScheme } = useThemePreference();
  const c = Colors[resolvedScheme];

  return (
    <View style={styles.wrap}>
      <View style={styles.timelineCol}>
        <View style={[styles.dot, { backgroundColor: c.primary }]} />
        <View style={[styles.line, { backgroundColor: c.divider }]} />
      </View>

      <View style={styles.contentRow}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.poster} />
        ) : (
          <View style={[styles.poster, { backgroundColor: c.secondary }]} />
        )}

        <View style={styles.textCol}>
          <ThemedText style={[styles.time, { color: c.icon }]}>
            {item.timeLabelCR ?? "—"}
          </ThemedText>

          <ThemedText numberOfLines={2} style={[styles.title, { color: c.text }]}>
            {item.title}
          </ThemedText>

          <ThemedText numberOfLines={1} style={[styles.meta, { color: c.icon }]}>
            {item.type ? item.type : "—"}
            {item.totalEpisodes != null ? ` • ${item.totalEpisodes} eps` : ""}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    gap: 12,
    height: ROW_HEIGHT,
    alignItems: "center",
  },
  timelineCol: {
    width: 16,
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  line: {
    width: 2,
    flex: 1,
    borderRadius: 999,
    marginTop: 6,
  },
  contentRow: {
    flex: 1,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    height: POSTER_HEIGHT,
  },
  poster: {
    width: POSTER_WIDTH,
    height: POSTER_HEIGHT,
    borderRadius: 8,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    height: POSTER_HEIGHT,
    justifyContent: "center",
  },
  time: {
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18,
    marginBottom: 2,
  },
  meta: {
    fontSize: 12,
    opacity: 0.8,
  },
});
