import { useState } from 'react';
import { Pressable, StyleSheet, View, ActivityIndicator } from 'react-native';
import { useNavigation } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useThemePreference } from '@/context/theme-preference';
import { useAuth } from '@/hooks/use-auth';
import { useCart, useClearCart } from '@/hooks/use-cart';
import { useAddresses } from '@/hooks/use-addresses';
import { usePaymentMethods } from '@/hooks/use-payment-methods';
import { useCreateOrder } from '@/hooks/use-orders';
import { useProcessPayment } from '@/hooks/use-payments';

export default function CheckoutScreen() {
  const { resolvedScheme } = useThemePreference();
  const colors = Colors[resolvedScheme];
  const { session } = useAuth();
  const accessToken = session?.access_token;
  const navigation = useNavigation();

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | null>(null);

  const cartQuery = useCart(accessToken);
  const addressesQuery = useAddresses(accessToken);
  const paymentMethodsQuery = usePaymentMethods(accessToken);
  const createOrderMutation = useCreateOrder(accessToken);
  const processPaymentMutation = useProcessPayment(accessToken);
  const clearCartMutation = useClearCart(accessToken);

  const cart = cartQuery.data?.cart;
  const addresses = addressesQuery.data?.addresses ?? [];
  const paymentMethods = paymentMethodsQuery.data?.payment_methods ?? [];

  const handlePlaceOrder = async () => {
    if (!cart || !selectedAddressId || !selectedPaymentMethodId) return;
    try {
      const { order_id } = await createOrderMutation.mutateAsync({
        cart_id: cart.id,
        delivery_address_id: selectedAddressId,
        payment_method_id: selectedPaymentMethodId,
      });
      await processPaymentMutation.mutateAsync({
        order_id,
        payment_method_id: selectedPaymentMethodId,
        amount: Number(cart.total),
        currency_code: 'CRC',
      });
      clearCartMutation.mutate();
      navigation.navigate('order-detail' as never, { orderId: order_id } as never);
    } catch (error) {
      console.error('Checkout failed:', error);
    }
  };

  if (cartQuery.isLoading || !cart) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={colors.text} />
          </Pressable>
          <ThemedText type="title">Checkout</ThemedText>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={[styles.loadingText, { color: colors.icon }]}>Cargando carrito...</ThemedText>
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
        <ThemedText type="title">Checkout</ThemedText>
      </View>
      <View style={styles.scrollContent}>
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Dirección de Entrega</ThemedText>
          {addresses.map((addr) => (
            <Pressable
              key={addr.id}
              onPress={() => setSelectedAddressId(addr.id)}
              style={[
                styles.optionCard,
                { backgroundColor: colors.card, borderColor: selectedAddressId === addr.id ? colors.primary : colors.cardBorder },
              ]}
            >
              <ThemedText style={styles.optionTitle}>{addr.label || addr.address.line1}</ThemedText>
            </Pressable>
          ))}
        </View>
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Método de Pago</ThemedText>
          {paymentMethods.map((pm) => (
            <Pressable
              key={pm.id}
              onPress={() => setSelectedPaymentMethodId(pm.id)}
              style={[
                styles.optionCard,
                { backgroundColor: colors.card, borderColor: selectedPaymentMethodId === pm.id ? colors.primary : colors.cardBorder },
              ]}
            >
              <ThemedText style={styles.optionTitle}>{pm.name}</ThemedText>
            </Pressable>
          ))}
        </View>
        <View style={[styles.orderSummary, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <ThemedText style={styles.sectionTitle}>Resumen</ThemedText>
          <View style={styles.totalRow}>
            <ThemedText style={styles.totalLabel}>Total</ThemedText>
            <ThemedText style={styles.totalValue}>${Number(cart.total).toFixed(2)}</ThemedText>
          </View>
        </View>
      </View>
      <Pressable
        onPress={handlePlaceOrder}
        style={[styles.placeOrderBtn, { backgroundColor: colors.primary }]}
        disabled={!selectedAddressId || !selectedPaymentMethodId || createOrderMutation.isPending}
      >
        <ThemedText style={{ color: colors.primaryText, fontWeight: '600' }}>
          {createOrderMutation.isPending ? 'Procesando...' : 'Realizar Pedido'}
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 60, flexDirection: 'row', alignItems: 'center' },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  scrollContent: { flex: 1, padding: 16 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  optionCard: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 8 },
  optionTitle: { fontSize: 15, fontWeight: '500' },
  orderSummary: { borderWidth: 1, borderRadius: 12, padding: 16 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  totalLabel: { fontSize: 18, fontWeight: '600' },
  totalValue: { fontSize: 22, fontWeight: '700', color: '#22c55e' },
  placeOrderBtn: { margin: 16, borderRadius: 12, padding: 16, alignItems: 'center' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16 },
});
