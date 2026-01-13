import React, { useCallback } from "react";
import {
  FlatList,
  ListRenderItem,
  StyleSheet,
  View,
} from "react-native";
import { AnimeCard } from "./AnimeCard";
import { AnimeCardSkeleton } from "./AnimeCardSkeleton";
import { AnimeListItem } from "@/lib/api/home";

type Props = {
  data: AnimeListItem[] | undefined;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean | undefined;
  onEndReached: () => void;
  renderItem?: ListRenderItem<AnimeListItem>;
  keyExtractor?: (item: AnimeListItem) => string;
  ListHeaderComponent?: React.ReactElement | null;
  ListEmptyComponent?: React.ReactElement | null;
  showsHorizontalScrollIndicator?: boolean;
};

export function InfiniteHorizontalCarousel({
  data = [],
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  onEndReached,
  renderItem,
  keyExtractor,
  ListHeaderComponent,
  ListEmptyComponent,
  showsHorizontalScrollIndicator = false,
}: Props) {

  const defaultKeyExtractor = useCallback(
    (item: AnimeListItem) => String(item.mal_id),
    []
  );

  const defaultRenderItem = useCallback(
    ({ item }: { item: AnimeListItem }) => <AnimeCard item={item} />,
    []
  );

  const SkeletonView = () => (
    <View style={styles.skeletonContainer}>
      {Array.from({ length: 5 }).map((_, i) => (
        <AnimeCardSkeleton key={i} />
      ))}
    </View>
  );

  const displayData = data.length > 0 ? data : [];

  return (
    <FlatList
      horizontal
      data={displayData}
      renderItem={renderItem ?? defaultRenderItem}
      keyExtractor={keyExtractor ?? defaultKeyExtractor}
      showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
      contentContainerStyle={styles.listContent}
      onEndReached={hasNextPage ? onEndReached : undefined}
      onEndReachedThreshold={0.5}
      ListHeaderComponent={isLoading && data.length === 0 ? <SkeletonView /> : ListHeaderComponent}
      ListFooterComponent={
        isFetchingNextPage && data.length > 0 ? (
          <View style={styles.footerSkeleton}>
            {Array.from({ length: 2 }).map((_, i) => (
              <AnimeCardSkeleton key={i} />
            ))}
          </View>
        ) : undefined
      }
      initialNumToRender={5}
      maxToRenderPerBatch={5}
      windowSize={10}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 16,
  },
  skeletonContainer: {
    flexDirection: "row",
  },
  footerSkeleton: {
    flexDirection: "row",
  },
});
