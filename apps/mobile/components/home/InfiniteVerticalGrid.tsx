import React, { useCallback } from "react";
import {
  FlatList,
  StyleSheet,
  View,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { AnimeCard } from "./AnimeCard";
import { AnimeCardSkeleton } from "./AnimeCardSkeleton";
import { AnimeListItem } from "@/lib/api/home";

type Props = {
  data: AnimeListItem[] | undefined;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean | undefined;
  onEndReached: () => void;
  ListHeaderComponent?: React.ReactElement | null;
  ListEmptyComponent?: React.ReactElement | null;
};

const { width } = Dimensions.get("window");
const COLUMN_WIDTH = (width - 32 - 12) / 2; // 32 for screen padding, 12 for gap

export function InfiniteVerticalGrid({
  data,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  onEndReached,
  ListHeaderComponent,
  ListEmptyComponent,
}: Props) {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];

  const keyExtractor = useCallback((item: AnimeListItem) => String(item.mal_id), []);

  const renderItem = useCallback(
    ({ item }: { item: AnimeListItem }) => (
      <View style={styles.cardWrapper}>
        <AnimeCard item={item} width={COLUMN_WIDTH} />
      </View>
    ),
    []
  );

  if (isLoading && (!data || data.length === 0)) {
    return (
      <View style={styles.skeletonGrid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={i} style={styles.cardWrapper}>
            <AnimeCardSkeleton width={COLUMN_WIDTH} />
          </View>
        ))}
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={2}
      columnWrapperStyle={styles.columnWrapper}
      contentContainerStyle={styles.listContent}
      onEndReached={hasNextPage ? onEndReached : undefined}
      onEndReachedThreshold={0.5}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={ListEmptyComponent}
      ListFooterComponent={
        isFetchingNextPage ? (
          <View style={styles.footerLoader}>
            <ActivityIndicator color={c.tint} />
          </View>
        ) : undefined
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  cardWrapper: {
    width: COLUMN_WIDTH,
  },
  skeletonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    justifyContent: "space-between",
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
});
