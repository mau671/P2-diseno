import { Pressable, StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useThemePreference } from '@/context/theme-preference';
import { useAuth } from '@/hooks/use-auth';
import { useSavedMeals, useAddSavedMealToCart, useDeleteSavedMeal } from '@/hooks/use-saved-meals';

type SavedMealData = { id: string; name: string; base_id: string; base_name: string; created_at: string };

function SavedMealCard({ item, onAddToCart, onDelete }: { item: SavedMealData; onAddToCart: () => void; onDelete: () => void }) {
  const { resolvedScheme } = useThemePreference();
  const colors = Colors[resolvedScheme];
  const navigation = useNavigation();

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <Pressable onPress={() => navigation.navigate('meal-base/[id]', { id: item.base_id })} style={styles.cardContent}>
        <ThemedText style={styles.cardTitle}>{item.name}</ThemedText>
        <ThemedText style={[styles.cardSubtitle, { color: colors.icon }]}>{item.base_name}</ThemedText>
      </Pressable>
      <View style={styles.actions}>
        <Pressable onPress={onAddToCart} style={[styles.actionBtn, { backgroundColor: colors.primary }]}>
          <ThemedText style={{ color: colors.primaryText, fontSize: 12 }}>Agregar</ThemedText>
        </Pressable>
        <Pressable onPress={onDelete} style={styles.deleteBtn}>
          <IconSymbol name="trash" size={18} color="#ef4444" />
        </Pressable>
      </View>
    </View>
  );
}

export default function SavedMealsScreen() {
  const { resolvedScheme } = useThemePreference();
  const colors = Colors[resolvedScheme];
  const { session } = useAuth();
  const accessToken = session?.access_token;
  const navigation = useNavigation();

  const savedMealsQuery = useSavedMeals(accessToken);
  const addToCartMutation = useAddSavedMealToCart(accessToken);
  const deleteMutation = useDeleteSavedMeal(accessToken);

  const renderItem = ({ item }: { item: SavedMealData }) => (
    <SavedMealCard
      item={item}
      onAddToCart={() => addToCartMutation.mutate({ id: item.id })}
      onDelete={() => deleteMutation.mutate(item.id)}
    />
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </Pressable>
        <ThemedText type="title">Comidas Guardadas</ThemedText>
      </View>
      <FlashList
        data={savedMealsQuery.data?.saved_meals ?? []}
        renderItem={renderItem}
        estimatedItemSize={80}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ThemedText style={[styles.emptyText, { color: colors.icon }]}>No tienes comidas guardadas</ThemedText>
          </View>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 60, flexDirection: 'row', alignItems: 'center' },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  card: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  cardSubtitle: { fontSize: 13 },
  actions: { flexDirection: 'row', gap: 8, marginLeft: 12 },
  actionBtn: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  deleteBtn: { padding: 8 },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 16 },
});
