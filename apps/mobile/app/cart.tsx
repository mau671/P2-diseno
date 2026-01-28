import { Pressable, StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';
import { useNavigation } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useThemePreference } from '@/context/theme-preference';
import { useAuth } from '@/hooks/use-auth';
import { useCart, useUpdateCartItem, useRemoveCartItem, useClearCart } from '@/hooks/use-cart';

type CartItemData = {
  id: string;
  base_id: string;
  base_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  customizations: {
    id: string;
    ingredient_id: string;
    ingredient_name: string;
    action: string;
    qty: number;
    delta_price: number;
  }[];
};

function CartItemCard({
  item,
  onUpdateQuantity,
  onRemove,
}: {
  item: CartItemData;
  onUpdateQuantity: (qty: number) => void;
  onRemove: () => void;
}) {
  const { resolvedScheme } = useThemePreference();
  const colors = Colors[resolvedScheme];

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <View style={styles.cardHeader}>
        <ThemedText style={styles.itemName}>{item.base_name}</ThemedText>
        <Pressable onPress={onRemove} style={styles.removeBtn}>
          <IconSymbol name="trash" size={18} color="#ef4444" />
        </Pressable>
      </View>

      <View style={styles.customizationsContainer}>
        {item.customizations.map((c) => (
          <ThemedText key={c.id} style={[styles.customization, { color: colors.icon }]}>
            {c.action === 'add' ? '+' : '-'}{c.qty}x {c.ingredient_name}
          </ThemedText>
        ))}
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.quantityControls}>
          <Pressable
            onPress={() => onUpdateQuantity(Math.max(1, item.quantity - 1))}
            style={[styles.qtyBtn, { backgroundColor: colors.primary }]}
          >
            <ThemedText style={{ color: colors.primaryText }}>-</ThemedText>
          </Pressable>
          <ThemedText style={styles.quantity}>{item.quantity}</ThemedText>
          <Pressable
            onPress={() => onUpdateQuantity(item.quantity + 1)}
            style={[styles.qtyBtn, { backgroundColor: colors.primary }]}
          >
            <ThemedText style={{ color: colors.primaryText }}>+</ThemedText>
          </Pressable>
        </View>
        <ThemedText style={styles.subtotal}>${Number(item.subtotal).toFixed(2)}</ThemedText>
      </View>
    </View>
  );
}

export default function CartScreen() {
  const { t } = useTranslation();
  const { resolvedScheme } = useThemePreference();
  const colors = Colors[resolvedScheme];
  const { session } = useAuth();
  const accessToken = session?.access_token;
  const navigation = useNavigation();

  const cartQuery = useCart(accessToken);
  const updateItemMutation = useUpdateCartItem(accessToken);
  const removeItemMutation = useRemoveCartItem(accessToken);
  const clearCartMutation = useClearCart(accessToken);

  const cart = cartQuery.data?.cart;
  const items = cart?.items ?? [];

  const renderItem = ({ item }: { item: CartItemData }) => (
    <CartItemCard
      item={item}
      onUpdateQuantity={(qty) => updateItemMutation.mutate({ itemId: item.id, data: { quantity: qty } })}
      onRemove={() => removeItemMutation.mutate(item.id)}
    />
  );

  const handleCheckout = () => {
    navigation.navigate('checkout' as never);
  };

  if (cartQuery.isLoading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={colors.text} />
          </Pressable>
          <ThemedText type="title">{t('cart.title', { defaultValue: 'Carrito' })}</ThemedText>
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
        <ThemedText type="title">{t('cart.title', { defaultValue: 'Carrito' })}</ThemedText>
      </View>

      <FlashList
        data={items}
        renderItem={renderItem}
        estimatedItemSize={150}
        contentContainerStyle={styles.listContent}
        style={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconSymbol name="cart" size={48} color={colors.icon} />
            <ThemedText style={[styles.emptyText, { color: colors.icon }]}>
              {t('cart.empty', { defaultValue: 'Tu carrito está vacío' })}
            </ThemedText>
          </View>
        }
      />

      {cart && items.length > 0 && (
        <View style={[styles.footer, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>{t('cart.subtotal', { defaultValue: 'Subtotal' })}</ThemedText>
            <ThemedText style={styles.summaryValue}>${Number(cart.subtotal).toFixed(2)}</ThemedText>
          </View>
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>{t('cart.items', { defaultValue: 'Items' })}</ThemedText>
            <ThemedText style={styles.summaryValue}>{cart.item_count}</ThemedText>
          </View>
          <View style={styles.totalRow}>
            <ThemedText style={styles.totalLabel}>{t('cart.total', { defaultValue: 'Total' })}</ThemedText>
            <ThemedText style={styles.totalValue}>${Number(cart.total).toFixed(2)}</ThemedText>
          </View>
          <View style={styles.actionsRow}>
            <Pressable onPress={handleCheckout} style={[styles.checkoutBtn, { backgroundColor: colors.primary }]}>
              <ThemedText style={{ color: colors.primaryText, fontWeight: '600' }}>
                {t('cart.checkout', { defaultValue: 'Proceder al pago' })}
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => clearCartMutation.mutate()}
              style={styles.clearBtn}
            >
              <ThemedText style={[styles.clearText, { color: colors.icon }]}>
                {t('cart.clear', { defaultValue: 'Vaciar Carrito' })}
              </ThemedText>
            </Pressable>
          </View>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 60, flexDirection: 'row', alignItems: 'center' },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingBottom: 200 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  removeBtn: { padding: 4 },
  itemName: { fontSize: 16, fontWeight: '600' },
  customizationsContainer: { marginBottom: 12 },
  customization: { fontSize: 13, marginBottom: 2 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quantityControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn: { width: 28, height: 28, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  quantity: { fontSize: 15, fontWeight: '600', minWidth: 30, textAlign: 'center' },
  subtotal: { fontSize: 16, fontWeight: '600', color: '#22c55e' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100, gap: 12 },
  emptyText: { fontSize: 16 },
  footer: { borderTopWidth: 1, padding: 16, paddingBottom: 24 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 14, color: '#6b7280' },
  summaryValue: { fontSize: 14, fontWeight: '500' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, marginBottom: 12 },
  totalLabel: { fontSize: 18, fontWeight: '600' },
  totalValue: { fontSize: 22, fontWeight: '700', color: '#22c55e' },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkoutBtn: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  clearBtn: { paddingVertical: 6, paddingHorizontal: 8 },
  clearText: { fontSize: 12, fontWeight: '600' },
});
