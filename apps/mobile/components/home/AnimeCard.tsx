import React from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { Image } from "expo-image";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useThemePreference } from "@/context/theme-preference";
import { AnimeListItem } from "@/lib/api/home";

type AnimeCardProps = {
  item: AnimeListItem;
  onPress?: () => void;
  width?: number;
};

export function AnimeCard({ item, onPress, width: customWidth }: AnimeCardProps) {
  const { resolvedScheme } = useThemePreference();
  const c = Colors[resolvedScheme];

  const imageUrl =
    item.images?.webp?.large_image_url ??
    item.images?.webp?.image_url ??
    item.images?.jpg?.large_image_url ??
    item.images?.jpg?.image_url ??
    null;

  const title = item.title_english ?? item.title;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        customWidth ? { width: customWidth } : null,
        { opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <Image
        source={{ uri: imageUrl ?? undefined }}
        style={[
          styles.poster,
          { backgroundColor: c.secondary },
          customWidth ? { width: customWidth, height: customWidth * 1.4 } : null,
        ]}
        transition={200}
      />
      <View style={styles.info}>
        <View style={styles.titleWrapper}>
          <ThemedText
            numberOfLines={2}
            style={styles.title}
          >
            {title}
          </ThemedText>
        </View>
        <View style={styles.metaRow}>
          {item.score && (
            <ThemedText style={[styles.score, { color: c.text }]}>
              ★ {item.score}
            </ThemedText>
          )}
          {item.type && (
            <ThemedText style={[styles.type, { color: c.textSecondary }]}>
              {item.type}
            </ThemedText>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 140,
    marginRight: 12,
  },
  poster: {
    width: 140,
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },
  info: {
    gap: 4,
    minHeight: 52,
  },
  titleWrapper: {
    height: 36,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 18,
    includeFontPadding: false,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  score: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: "500",
    includeFontPadding: false,
  },
  type: {
    fontSize: 11,
    lineHeight: 14,
    includeFontPadding: false,
  },
});
