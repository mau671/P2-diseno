// apps/mobile/components/calendar/ScheduleCard.tsx
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
    <View style={[styles.wrap]}>
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
    gap: 10,
    paddingVertical: 10,
  },
  timelineCol: {
    width: 16,
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    marginTop: 6,
  },
  line: {
    width: 2,
    flex: 1,
    borderRadius: 999,
    marginTop: 6,
  },
  card: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
  },
  topRow: {
    marginBottom: 6,
  },
  time: {
    fontSize: 12,
    fontWeight: "700",
  },
  contentRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  poster: {
    width: 54,
    height: 54,
    borderRadius: 12,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18,
  },
  meta: {
    marginTop: 3,
    fontSize: 12,
    opacity: 0.9,
  },
});
