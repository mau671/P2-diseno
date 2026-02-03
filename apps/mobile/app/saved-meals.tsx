import { Pressable, StyleSheet, View, TextInput } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useThemePreference } from '@/context/theme-preference';
import { useAuth } from '@/hooks/use-auth';
import { useSavedMeals, useAddSavedMealToCart, useDeleteSavedMeal, useUpdateSavedMeal } from '@/hooks/use-saved-meals';

type SavedMealData = { id: string; name: string; base_id: string; base_name: string; created_at: string };

function SavedMealCard({
  item,
  isEditing,
  editingName,
  onEdit,
  onChangeName,
  onSaveEdit,
  onCancelEdit,
  onAddToCart,
  onDelete,
}: {
  item: SavedMealData;
  isEditing: boolean;
  editingName: string;
  onEdit: () => void;
  onChangeName: (value: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onAddToCart: () => void;
  onDelete: () => void;
}) {
  const { resolvedScheme } = useThemePreference();
  const colors = Colors[resolvedScheme];
  const navigation = useNavigation();
  const { t } = useTranslation();

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <Pressable onPress={() => navigation.navigate('meal-base/[id]', { id: item.base_id })} style={styles.cardContent}>
        {isEditing ? (
          <TextInput
            style={[styles.input, { borderColor: colors.cardBorder, color: colors.text }]}
            placeholder={t('savedMeals.name', { defaultValue: 'Nombre para guardar' })}
            placeholderTextColor={colors.icon}
            value={editingName}
            onChangeText={onChangeName}
          />
        ) : (
          <ThemedText style={styles.cardTitle}>{item.name}</ThemedText>
        )}
        <ThemedText style={[styles.cardSubtitle, { color: colors.icon }]}>{item.base_name}</ThemedText>
      </Pressable>
      <View style={styles.actions}>
        {isEditing ? (
          <>
            <Pressable onPress={onSaveEdit} style={[styles.actionBtn, { backgroundColor: colors.primary }]}>
              <ThemedText style={{ color: colors.primaryText, fontSize: 12 }}>
                {t('common.save', { defaultValue: 'Guardar' })}
              </ThemedText>
            </Pressable>
            <Pressable onPress={onCancelEdit} style={styles.deleteBtn}>
              <IconSymbol name="xmark" size={18} color={colors.icon} />
            </Pressable>
          </>
        ) : (
          <>
            <Pressable onPress={onAddToCart} style={[styles.actionBtn, { backgroundColor: colors.primary }]}>
              <ThemedText style={{ color: colors.primaryText, fontSize: 12 }}>
                {t('savedMeals.addToCart', { defaultValue: 'Agregar' })}
              </ThemedText>
            </Pressable>
            <Pressable onPress={onEdit} style={styles.editBtn}>
              <IconSymbol name="pencil" size={18} color={colors.icon} />
            </Pressable>
            <Pressable onPress={onDelete} style={styles.deleteBtn}>
              <IconSymbol name="trash" size={18} color="#ef4444" />
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

export default function SavedMealsScreen() {
  const { resolvedScheme } = useThemePreference();
  const colors = Colors[resolvedScheme];
  const { t } = useTranslation();
  const { session } = useAuth();
  const accessToken = session?.access_token;
  const navigation = useNavigation();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const savedMealsQuery = useSavedMeals(accessToken);
  const addToCartMutation = useAddSavedMealToCart(accessToken);
  const deleteMutation = useDeleteSavedMeal(accessToken);
  const updateMutation = useUpdateSavedMeal(accessToken);

  const renderItem = ({ item }: { item: SavedMealData }) => (
    <SavedMealCard
      item={item}
      isEditing={editingId === item.id}
      editingName={editingName}
      onEdit={() => {
        setEditingId(item.id);
        setEditingName(item.name);
      }}
      onChangeName={setEditingName}
      onSaveEdit={() => {
        updateMutation.mutate({ id: item.id, params: { name: editingName.trim() } }, { onSuccess: () => setEditingId(null) });
      }}
      onCancelEdit={() => setEditingId(null)}
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
        <ThemedText type="title">{t('savedMeals.title', { defaultValue: 'Comidas guardadas' })}</ThemedText>
      </View>
      <FlashList
        data={savedMealsQuery.data?.saved_meals ?? []}
        renderItem={renderItem}
        estimatedItemSize={80}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ThemedText style={[styles.emptyText, { color: colors.icon }]}>
              {t('savedMeals.empty', { defaultValue: 'No tienes comidas guardadas' })}
            </ThemedText>
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
  editBtn: { padding: 8 },
  deleteBtn: { padding: 8 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 14 },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 16 },
});
