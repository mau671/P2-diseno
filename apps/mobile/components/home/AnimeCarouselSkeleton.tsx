import React from "react";
import { StyleSheet, View } from "react-native";
import { AnimeCardSkeleton } from "./AnimeCardSkeleton";

export function AnimeCarouselSkeleton({ count = 5 }: { count?: number }) {
  return (
    <View style={styles.row}>
      {Array.from({ length: count }).map((_, i) => (
        <AnimeCardSkeleton key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    paddingHorizontal: 16,
  },
});
