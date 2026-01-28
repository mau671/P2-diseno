import { Pressable, StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useThemePreference } from '@/context/theme-preference';
import { useAuth } from '@/hooks/use-auth';
import { useRestaurant, useRestaurantMenu } from '@/hooks/use-restaurants';

type MenuBase = {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  is_active: boolean;
};

type CategoryData = {
  id: string;
  name: string;
  bases: MenuBase[];
};

function MenuBaseCard({ item, restaurantId }: { item: MenuBase; restaurantId: string }) {
  const { resolvedScheme } = useThemePreference();
  const colors = Colors[resolvedScheme];
  const navigation = useNavigation();

  return (
    <Pressable
      onPress={() => navigation.navigate('meal-base/[id]', { id: item.id })}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.cardBorder, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <ThemedText style={styles.cardTitle}>{item.name}</ThemedText>
      {item.description && (
        <ThemedText style={[styles.cardDescription, { color: colors.icon }]}>
          {item.description}
        </ThemedText>
      )}
      <View style={styles.cardFooter}>
        <ThemedText style={styles.priceText}>
          ${typeof item.base_price === 'number' ? item.base_price.toFixed(2) : '0.00'}
        </ThemedText>
        <IconSymbol name="chevron.right" size={16} color={colors.icon} />
      </View>
    </Pressable>
  );
}

function CategorySection({ category }: { category: CategoryData }) {
  const { resolvedScheme } = useThemePreference();
  const colors = Colors[resolvedScheme];

  return (
    <View style={styles.section}>
      <ThemedText style={styles.sectionTitle}>{category.name}</ThemedText>
      <FlashList
        data={category.bases}
        renderItem={({ item }) => <MenuBaseCard item={item} restaurantId={category.id} />}
        estimatedItemSize={80}
        scrollEnabled={false}
        ListEmptyComponent={
          <ThemedText style={[styles.emptyText, { color: colors.icon }]}>
            No hay platillos en esta categoría
          </ThemedText>
        }
      />
    </View>
  );
}

export default function RestaurantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { resolvedScheme } = useThemePreference();
  const colors = Colors[resolvedScheme];
  const { session } = useAuth();
  const accessToken = session?.access_token;
  const navigation = useNavigation();

  const restaurantQuery = useRestaurant(id, accessToken);
  const menuQuery = useRestaurantMenu(id, accessToken);

  if (restaurantQuery.isLoading || menuQuery.isLoading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={colors.text} />
          </Pressable>
          <ThemedText type="title">Cargando...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const restaurant = restaurantQuery.data?.restaurant;
  const menu = menuQuery.data?.menu;

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </Pressable>
        <ThemedText type="title">{restaurant?.name}</ThemedText>
      </View>

      <FlashList
        data={menu?.categories ?? []}
        renderItem={({ item }) => <CategorySection category={item} />}
        estimatedItemSize={200}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          restaurant ? (
            <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <ThemedText style={styles.infoTitle}>{restaurant.legal_name}</ThemedText>
              <View style={styles.kitchensContainer}>
                <ThemedText style={[styles.infoSubtitle, { color: colors.icon }]}>
                  Cocinas disponibles:
                </ThemedText>
                {restaurant.kitchens.map((kitchen) => (
                  <View key={kitchen.id} style={styles.kitchenItem}>
                    <IconSymbol name="location" size={14} color={colors.primary} />
                    <ThemedText style={[styles.kitchenName, { color: colors.text }]}>
                      {kitchen.name}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ThemedText style={[styles.emptyText, { color: colors.icon }]}>
              Este restaurante no tiene platillos disponibles
            </ThemedText>
          </View>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  infoCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  infoTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  infoSubtitle: { fontSize: 14, marginBottom: 8 },
  kitchensContainer: { gap: 4 },
  kitchenItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  kitchenName: { fontSize: 13 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  cardDescription: { fontSize: 13, marginBottom: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceText: { fontSize: 15, fontWeight: '600', color: '#22c55e' },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 16 },
});
