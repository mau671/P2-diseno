import * as React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { InfiniteHorizontalCarousel } from '@/components/home/InfiniteHorizontalCarousel';
import {
  useSeasonsNow,
  useSeasonsUpcoming,
  useTopAnimeByPopularity,
} from '@/hooks/use-home';

export default function HomeScreen() {
  const { t } = useTranslation();

  const seasonsNowQuery = useSeasonsNow();
  const seasonsUpcomingQuery = useSeasonsUpcoming();
  const topPopularityQuery = useTopAnimeByPopularity();

  const seasonsNowData = React.useMemo(() => {
    const all = (seasonsNowQuery.data?.pages ?? []).flatMap((page: any) => page.data ?? []);
    const seen = new Set<number>();
    return all.filter(item => {
      if (seen.has(item.mal_id)) return false;
      seen.add(item.mal_id);
      return true;
    });
  }, [seasonsNowQuery.data]);

  const seasonsUpcomingData = React.useMemo(() => {
    const all = (seasonsUpcomingQuery.data?.pages ?? []).flatMap((page: any) => page.data ?? []);
    const seen = new Set<number>();
    return all.filter(item => {
      if (seen.has(item.mal_id)) return false;
      seen.add(item.mal_id);
      return true;
    });
  }, [seasonsUpcomingQuery.data]);

  const topPopularityData = React.useMemo(() => {
    const all = (topPopularityQuery.data?.pages ?? []).flatMap((page: any) => page.data ?? []);
    const seen = new Set<number>();
    return all.filter(item => {
      if (seen.has(item.mal_id)) return false;
      seen.add(item.mal_id);
      return true;
    });
  }, [topPopularityQuery.data]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">{t('home.welcome', { defaultValue: 'Home' })}</ThemedText>
      </ThemedView>

      <Section
        title={t('home.trendingNow', { defaultValue: 'Trending Now' })}
        isLoading={seasonsNowQuery.isLoading}
        error={seasonsNowQuery.error}
        empty={!seasonsNowQuery.isLoading && seasonsNowData.length === 0}
      >
        <InfiniteHorizontalCarousel
          data={seasonsNowData}
          isLoading={seasonsNowQuery.isLoading}
          isFetchingNextPage={seasonsNowQuery.isFetchingNextPage}
          hasNextPage={seasonsNowQuery.hasNextPage ?? false}
          onEndReached={() => seasonsNowQuery.fetchNextPage()}
        />
      </Section>

      <Section
        title={t('home.upcoming', { defaultValue: 'Upcoming Next Season' })}
        isLoading={seasonsUpcomingQuery.isLoading}
        error={seasonsUpcomingQuery.error}
        empty={!seasonsUpcomingQuery.isLoading && seasonsUpcomingData.length === 0}
      >
        <InfiniteHorizontalCarousel
          data={seasonsUpcomingData}
          isLoading={seasonsUpcomingQuery.isLoading}
          isFetchingNextPage={seasonsUpcomingQuery.isFetchingNextPage}
          hasNextPage={seasonsUpcomingQuery.hasNextPage ?? false}
          onEndReached={() => seasonsUpcomingQuery.fetchNextPage()}
        />
      </Section>

      <Section
        title={t('home.allTimePopular', { defaultValue: 'All Time Popular' })}
        isLoading={topPopularityQuery.isLoading}
        error={topPopularityQuery.error}
        empty={!topPopularityQuery.isLoading && topPopularityData.length === 0}
      >
        <InfiniteHorizontalCarousel
          data={topPopularityData}
          isLoading={topPopularityQuery.isLoading}
          isFetchingNextPage={topPopularityQuery.isFetchingNextPage}
          hasNextPage={topPopularityQuery.hasNextPage ?? false}
          onEndReached={() => topPopularityQuery.fetchNextPage()}
        />
      </Section>
    </ScrollView>
  );
}

function Section({
  title,
  isLoading,
  error,
  empty,
  children,
}: {
  title: string;
  isLoading: boolean;
  error: unknown;
  empty: boolean;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <View style={styles.section}>
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>

      {error ? (
        <ThemedText style={styles.sectionState}>
          {t('common.error', { defaultValue: 'Error' })}
        </ThemedText>
      ) : null}

      {empty ? (
        <ThemedText style={styles.sectionState}>
          {t('common.empty', { defaultValue: 'No results' })}
        </ThemedText>
      ) : null}

      {!error && !empty ? children : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 32 },
  header: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 10,
  },
  section: {
    marginTop: 12,
  },
  sectionTitle: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  sectionState: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
});
