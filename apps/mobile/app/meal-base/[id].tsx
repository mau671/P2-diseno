import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, ScrollView } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useThemePreference } from '@/context/theme-preference';
import { useAuth } from '@/hooks/use-auth';
import { useMealBase, useCustomizationOptions, useCalculatePrice } from '@/hooks/use-meal-bases';
import { useAddToCart } from '@/hooks/use-cart';

function IngredientSection({
  title,
  ingredients,
  onToggle,
  priceSign,
}: {
  title: string;
  ingredients: {
    id: string;
    name: string;
    price: number;
    isRemovable: boolean;
    isEssential: boolean;
    selected: boolean;
  }[];
  onToggle: (id: string) => void;
  priceSign: '+' | '-';
}) {
  const { resolvedScheme } = useThemePreference();
  const colors = Colors[resolvedScheme];

  if (ingredients.length === 0) return null;

  return (
    <View style={styles.section}>
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
      {ingredients.map((ing) => (
        <Pressable
          key={ing.id}
          onPress={() => ing.isRemovable && onToggle(ing.id)}
          style={[
            styles.ingredientRow,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
              opacity: ing.isRemovable ? 1 : 0.5,
            },
          ]}
        >
          <View style={styles.ingredientInfo}>
            <ThemedText style={styles.ingredientName}>{ing.name}</ThemedText>
            {ing.isEssential && (
              <ThemedText style={[styles.essentialTag, { color: colors.primary }]}>
                Esencial
              </ThemedText>
            )}
          </View>
          <View style={styles.ingredientActions}>
            {ing.price > 0 && (
              <ThemedText style={[styles.ingredientPrice, { color: colors.icon }]}>
                {priceSign}${ing.price.toFixed(2)}
              </ThemedText>
            )}
            {ing.isRemovable ? (
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: ing.selected ? colors.primary : 'transparent',
                    borderColor: colors.primary,
                  },
                ]}
              >
                {ing.selected && <IconSymbol name="checkmark" size={14} color="white" />}
              </View>
            ) : null}
          </View>
        </Pressable>
      ))}
    </View>
  );
}

export default function MealBaseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { resolvedScheme } = useThemePreference();
  const colors = Colors[resolvedScheme];
  const { session } = useAuth();
  const accessToken = session?.access_token;
  const navigation = useNavigation();
  const mealBaseId = Array.isArray(id) ? id[0] : id;

  const [quantity, setQuantity] = useState(1);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [removedIngredients, setRemovedIngredients] = useState<Set<string>>(new Set());
  const [addedIngredients, setAddedIngredients] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<string | null>(null);
  const [calculatedTotal, setCalculatedTotal] = useState<number | null>(null);
  const calcRequestRef = useRef(0);

  const mealBaseQuery = useMealBase(mealBaseId, accessToken);
  const customizationQuery = useCustomizationOptions(mealBaseId, accessToken);
  const calculatePriceMutation = useCalculatePrice(mealBaseId, accessToken);
  const addToCartMutation = useAddToCart(accessToken);

  const options = customizationQuery.data?.customization_options;
  const mealBase = mealBaseQuery.data?.meal_base;

  const removedList = useMemo(() => Array.from(removedIngredients), [removedIngredients]);
  const addedList = useMemo(() => Array.from(addedIngredients), [addedIngredients]);

  const calculatePrice = calculatePriceMutation.mutateAsync;

  useEffect(() => {
    let isActive = true;
    if (!mealBaseId || !options) return;
    const requestId = ++calcRequestRef.current;

    calculatePrice({
        quantity,
        cooking_method_id: selectedMethod ?? undefined,
        removed_ingredients: removedList.map((itemId) => ({ ingredient_id: itemId })),
        added_ingredients: addedList.map((itemId) => ({ ingredient_id: itemId })),
      })
      .then((result) => {
        if (isActive && requestId === calcRequestRef.current) {
          setCalculatedTotal(result.total);
        }
      })
      .catch(() => {
        if (isActive && requestId === calcRequestRef.current) {
        }
      });

    return () => {
      isActive = false;
    };
  }, [mealBaseId, options, quantity, selectedMethod, removedList, addedList, calculatePrice]);

  const totalPrice = calculatedTotal ?? (options?.base_price ?? 0) * quantity;

  const handleToggleRemoved = (ingredientId: string) => {
    setRemovedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(ingredientId)) {
        next.delete(ingredientId);
      } else {
        next.add(ingredientId);
      }
      return next;
    });
  };

  const handleToggleAdded = (ingredientId: string) => {
    setAddedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(ingredientId)) {
        next.delete(ingredientId);
      } else {
        next.add(ingredientId);
      }
      return next;
    });
  };

  const handleAddToCart = () => {
    if (!mealBaseId) return;
    setFeedback(null);
    addToCartMutation.mutate(
      {
        meal_base_id: mealBaseId,
        quantity,
        cooking_method_id: selectedMethod ?? undefined,
        removed_ingredients: removedList.map((itemId) => ({ ingredient_id: itemId })),
        added_ingredients: addedList.map((itemId) => ({ ingredient_id: itemId })),
      },
      {
        onSuccess: () => {
          setFeedback('Agregado al carrito');
        },
        onError: (error) => {
          const message = error instanceof Error ? error.message : 'No se pudo agregar al carrito';
          setFeedback(message);
        },
      }
    );
  };

  if (mealBaseQuery.isLoading || customizationQuery.isLoading) {
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

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </Pressable>
        <ThemedText type="title">{mealBase?.name}</ThemedText>
      </View>

      <ScrollView style={styles.scrollContent}>
        {mealBase?.description && (
          <ThemedText style={[styles.description, { color: colors.icon }]}>
            {mealBase.description}
          </ThemedText>
        )}

        <View style={styles.quantityRow}>
          <ThemedText style={styles.label}>Cantidad</ThemedText>
          <View style={styles.quantityControls}>
            <Pressable
              onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              style={[styles.quantityBtn, { backgroundColor: colors.primary }]}
            >
              <ThemedText style={{ color: colors.primaryText }}>-</ThemedText>
            </Pressable>
            <ThemedText style={styles.quantityValue}>{quantity}</ThemedText>
            <Pressable
              onPress={() => setQuantity((q) => q + 1)}
              style={[styles.quantityBtn, { backgroundColor: colors.primary }]}
            >
              <ThemedText style={{ color: colors.primaryText }}>+</ThemedText>
            </Pressable>
          </View>
        </View>

        {options?.cooking_methods && options.cooking_methods.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Método de Cocción</ThemedText>
            {options.cooking_methods.map((method) => {
              const methodDelta = typeof method.price_delta === 'number'
                ? method.price_delta
                : Number(method.price_delta ?? 0);

              return (
                <Pressable
                  key={method.id}
                  onPress={() => setSelectedMethod(method.id === selectedMethod ? null : method.id)}
                  style={[
                    styles.methodRow,
                    {
                      backgroundColor: colors.card,
                      borderColor: selectedMethod === method.id ? colors.primary : colors.cardBorder,
                    },
                  ]}
                >
                  <ThemedText style={styles.methodName}>{method.name}</ThemedText>
                  <ThemedText style={[styles.methodPrice, { color: colors.icon }]}
                  >
                    {methodDelta >= 0 ? '+' : ''}${methodDelta.toFixed(2)}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        )}

        <IngredientSection
          title="Quitar Ingredientes"
          priceSign="-"
          ingredients={
            options?.removable_ingredients.map((ing) => ({
              id: ing.ingredient_id,
              name: ing.ingredient_name,
              price: typeof ing.unit_price === 'number' ? ing.unit_price : 0,
              isRemovable: ing.is_removable,
              isEssential: ing.is_essential,
              selected: removedIngredients.has(ing.ingredient_id)
            })) ?? []
          }
          onToggle={handleToggleRemoved}
        />

        <IngredientSection
          title="Agregar Ingredientes"
          priceSign="+"
          ingredients={
            options?.extra_ingredients.map((ing) => ({
              id: ing.ingredient_id,
              name: ing.ingredient_name,
              price: typeof ing.unit_price === 'number' ? ing.unit_price : 0,
              isRemovable: true,
              isEssential: false,
              selected: addedIngredients.has(ing.ingredient_id)
            })) ?? []
          }
          onToggle={handleToggleAdded}
        />
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={styles.totalRow}>
          <ThemedText style={styles.totalLabel}>Total:</ThemedText>
          <ThemedText style={styles.totalPrice}>${totalPrice.toFixed(2)}</ThemedText>
        </View>
        <Pressable
          onPress={handleAddToCart}
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          disabled={!mealBaseId || addToCartMutation.isPending}
        >
          <ThemedText style={{ color: colors.primaryText, fontWeight: '600' }}>
            {addToCartMutation.isPending ? 'Agregando...' : 'Agregar al Carrito'}
          </ThemedText>
        </Pressable>
        {feedback && (
          <ThemedText style={[styles.feedbackText, { color: colors.icon }]}>
            {feedback}
          </ThemedText>
        )}
      </View>
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
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  scrollContent: { flex: 1, paddingHorizontal: 16 },
  description: { fontSize: 15, marginBottom: 16, lineHeight: 22 },
  quantityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600' },
  quantityControls: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  quantityBtn: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  quantityValue: { fontSize: 18, fontWeight: '600', minWidth: 40, textAlign: 'center' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  ingredientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  ingredientInfo: { flex: 1 },
  ingredientName: { fontSize: 15 },
  essentialTag: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  ingredientActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ingredientPrice: { fontSize: 13 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  methodRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderRadius: 10, padding: 14, marginBottom: 8 },
  methodName: { fontSize: 15 },
  methodPrice: { fontSize: 14 },
  footer: { borderTopWidth: 1, padding: 16, gap: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 18, fontWeight: '600' },
  totalPrice: { fontSize: 24, fontWeight: '700', color: '#22c55e' },
  addButton: { borderRadius: 12, padding: 16, alignItems: 'center' },
  feedbackText: { fontSize: 13, textAlign: 'center' },
});
