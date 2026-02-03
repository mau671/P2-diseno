import { useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';
import { router, useNavigation } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useThemePreference } from '@/context/theme-preference';
import { useAuth } from '@/hooks/use-auth';
import { useCartSummary } from '@/hooks/use-cart';
import { useRestaurants } from '@/hooks/use-restaurants';

type RestaurantCardData = {
  id: string;
  name: string;
  legal_name: string;
  status: string;
  created_at: string;
  updated_at: string;
};

function RestaurantCard({ item }: { item: RestaurantCardData }) {
  const { resolvedScheme } = useThemePreference();
  const colors = Colors[resolvedScheme];
  const navigation = useNavigation();

  return (
    <Pressable
      onPress={() => navigation.navigate('restaurant/[id]', { id: item.id })}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.cardBorder, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <ThemedText style={styles.cardTitle}>{item.name}</ThemedText>
      <ThemedText style={[styles.cardSubtitle, { color: colors.icon }]}>
        {item.legal_name}
      </ThemedText>
      <View style={styles.statusRow}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: item.status === 'active' ? '#22c55e' : '#ef4444' },
          ]}
        />
        <ThemedText style={[styles.statusText, { color: colors.icon }]}>
          {item.status}
        </ThemedText>
      </View>
    </Pressable>
  );
}

export default function ExploreScreen() {
  const { t } = useTranslation();
  const { resolvedScheme } = useThemePreference();
  const colors = Colors[resolvedScheme];
  const { session } = useAuth();
  const accessToken = session?.access_token;
  const cartSummaryQuery = useCartSummary(accessToken);
  const cartCount = cartSummaryQuery.data?.item_count ?? 0;

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const restaurantsQuery = useRestaurants(
    { search, page, limit: 20 },
    accessToken
  );

  const renderRestaurant = ({ item }: { item: RestaurantCardData }) => (
    <RestaurantCard item={item} />
  );

  const loadMore = () => {
    if (restaurantsQuery.data?.pagination && page < restaurantsQuery.data.pagination.total / 20) {
      setPage((p) => p + 1);
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <ThemedText type="title">{t('explore.title', { defaultValue: 'Explorar' })}</ThemedText>
      </View>

      <View style={styles.searchContainer}>
        <IconSymbol name="magnifyingglass" size={20} color={colors.icon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder={t('explore.search', { defaultValue: 'Buscar restaurantes...' })}
          placeholderTextColor={colors.icon}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlashList
        data={restaurantsQuery.data?.restaurants ?? []}
        renderItem={renderRestaurant}
        estimatedItemSize={100}
        contentContainerStyle={styles.listContent}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshing={restaurantsQuery.isLoading}
        onRefresh={() => {
          setPage(1);
          restaurantsQuery.refetch();
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ThemedText style={[styles.emptyText, { color: colors.icon }]}>
              {t('explore.empty', { defaultValue: 'No hay restaurantes disponibles' })}
            </ThemedText>
          </View>
        }
      />

      <Pressable
        onPress={() => router.push('/cart')}
        style={[styles.cartFab, { backgroundColor: colors.primary }]}
        accessibilityRole="button"
        accessibilityLabel={t('nav.cart', { defaultValue: 'Carrito' })}
      >
        <IconSymbol name="cart.fill" size={24} color={colors.primaryText} />
        {cartCount > 0 && (
          <View style={[styles.cartBadge, { backgroundColor: colors.secondary }]}
            pointerEvents="none"
          >
            <ThemedText style={[styles.cartBadgeText, { color: colors.text }]}>
              {cartCount > 99 ? '99+' : cartCount}
            </ThemedText>
          </View>
        )}
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 60 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: { flex: 1, padding: 12, marginLeft: 8 },
  listContent: { paddingHorizontal: 16, paddingBottom: 120 },
  cartFab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0px 8px 12px rgba(0,0,0,0.2)' },
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
      },
    }),
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 18,
    textAlign: 'center',
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  cardSubtitle: { fontSize: 14, marginBottom: 8 },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusText: { fontSize: 12, textTransform: 'capitalize' },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 16 },
});
