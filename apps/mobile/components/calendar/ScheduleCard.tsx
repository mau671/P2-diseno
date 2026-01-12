import * as React from "react";
import { Image, StyleSheet, View } from "react-native";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { ThemedText } from "@/components/themed-text";
import type { ScheduleItem } from "@/app/api/schedule";

export function ScheduleCard({ item }: { item: ScheduleItem }) {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];

  return (
    <View style={styles.wrap}>
      {/* timeline */}
      <View style={styles.timelineCol}>
        <View style={[styles.dot, { backgroundColor: c.tint }]} />
        <View style={[styles.line, { backgroundColor: c.divider }]} />
      </View>

      <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
        <View style={styles.topRow}>
          <ThemedText style={[styles.time, { color: c.icon }]}>
            {item.timeLabel ?? "—"}
          </ThemedText>
        </View>

        <View style={styles.contentRow}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.poster} />
          ) : (
            <View style={[styles.poster, { backgroundColor: c.secondary }]} />
          )}

          <View style={styles.textCol}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 10,
  },
  timelineCol: {
    width: 18,
    alignItems: "center",
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 999,
    marginTop: 8,
  },
  line: {
    width: 2,
    flex: 1,
    borderRadius: 999,
    marginTop: 8,
  },
  card: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    minHeight: 104,
  },
  topRow: {
    marginBottom: 8,
  },
  time: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  contentRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  poster: {
    width: 72,
    height: 72,
    borderRadius: 16,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 20,
  },
  meta: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "700",
    opacity: 0.9,
  },
});
