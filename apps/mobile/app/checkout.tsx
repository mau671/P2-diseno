import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, ActivityIndicator, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useThemePreference } from '@/context/theme-preference';
import { useAuth } from '@/hooks/use-auth';
import { useCart, useClearCart } from '@/hooks/use-cart';
import { useAddresses, useCreateAddress, useUpdateAddress } from '@/hooks/use-addresses';
import {
  useCreatePaymentMethod,
  usePaymentMethods,
  useUpdatePaymentMethod
} from '@/hooks/use-payment-methods';
import { useCreateOrder } from '@/hooks/use-orders';
import { useProcessPayment } from '@/hooks/use-payments';
import { useCities, useCountries, useRegions } from '@/hooks/use-locations';

export default function CheckoutScreen() {
  const { resolvedScheme } = useThemePreference();
  const colors = Colors[resolvedScheme];
  const { t } = useTranslation();
  const { session } = useAuth();
  const accessToken = session?.access_token;
  const navigation = useNavigation();

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | null>(null);
  const [addressFormOpen, setAddressFormOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressLabel, setAddressLabel] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [addressCountryId, setAddressCountryId] = useState('');
  const [addressRegionId, setAddressRegionId] = useState('');
  const [addressCityId, setAddressCityId] = useState('');
  const [addressDefault, setAddressDefault] = useState(false);

  const [paymentFormOpen, setPaymentFormOpen] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [paymentName, setPaymentName] = useState('');
  const [paymentLastFour, setPaymentLastFour] = useState('');
  const [paymentDefault, setPaymentDefault] = useState(false);
  const [pendingDefaultAddressId, setPendingDefaultAddressId] = useState<string | null>(null);
  const [pendingDefaultPaymentId, setPendingDefaultPaymentId] = useState<string | null>(null);

  const cartQuery = useCart(accessToken);
  const addressesQuery = useAddresses(accessToken);
  const paymentMethodsQuery = usePaymentMethods(accessToken);
  const createAddressMutation = useCreateAddress(accessToken);
  const updateAddressMutation = useUpdateAddress(accessToken);
  const createPaymentMethodMutation = useCreatePaymentMethod(accessToken);
  const updatePaymentMethodMutation = useUpdatePaymentMethod(accessToken);
  const createOrderMutation = useCreateOrder(accessToken);
  const processPaymentMutation = useProcessPayment(accessToken);
  const clearCartMutation = useClearCart(accessToken);

  const countriesQuery = useCountries();
  const regionsQuery = useRegions(addressCountryId);
  const citiesQuery = useCities(addressRegionId);

  const cart = cartQuery.data?.cart;
  const addresses = useMemo(() => addressesQuery.data?.addresses ?? [], [addressesQuery.data?.addresses]);
  const paymentMethods = useMemo(
    () => paymentMethodsQuery.data?.payment_methods ?? [],
    [paymentMethodsQuery.data?.payment_methods]
  );
  const countries = countriesQuery.data?.countries ?? [];
  const regions = regionsQuery.data?.regions ?? [];
  const cities = citiesQuery.data?.cities ?? [];

  useEffect(() => {
    if (!pendingDefaultAddressId) return;
    const isNowDefault = addresses.some((addr) => addr.id === pendingDefaultAddressId && addr.isDefault);
    if (isNowDefault) {
      setPendingDefaultAddressId(null);
    }
  }, [addresses, pendingDefaultAddressId]);

  useEffect(() => {
    if (!pendingDefaultPaymentId) return;
    const isNowDefault = paymentMethods.some((pm) => pm.id === pendingDefaultPaymentId && pm.isDefault);
    if (isNowDefault) {
      setPendingDefaultPaymentId(null);
    }
  }, [paymentMethods, pendingDefaultPaymentId]);

  const resetAddressForm = () => {
    setEditingAddressId(null);
    setAddressLabel('');
    setAddressLine1('');
    setAddressLine2('');
    setAddressCountryId('');
    setAddressRegionId('');
    setAddressCityId('');
    setAddressDefault(false);
  };

  const resetPaymentForm = () => {
    setEditingPaymentId(null);
    setPaymentName('');
    setPaymentLastFour('');
    setPaymentDefault(false);
  };

  const startEditAddress = (addressId: string) => {
    const address = addresses.find((item) => item.id === addressId);
    if (!address) return;
    setEditingAddressId(addressId);
    setAddressLabel(address.label ?? '');
    setAddressLine1(address.address.line1);
    setAddressLine2(address.address.line2 ?? '');
    setAddressCountryId(address.address.country.id);
    setAddressRegionId(address.address.region.id);
    setAddressCityId(address.address.city.id);
    setAddressDefault(address.isDefault);
    setAddressFormOpen(true);
  };

  const startEditPayment = (paymentId: string) => {
    const payment = paymentMethods.find((item) => item.id === paymentId);
    if (!payment) return;
    setEditingPaymentId(paymentId);
    setPaymentName(payment.name);
    setPaymentLastFour(payment.lastFour ?? '');
    setPaymentDefault(payment.isDefault);
    setPaymentFormOpen(true);
  };

  const handleSaveAddress = async () => {
    if (!addressLine1 || !addressCountryId || !addressRegionId || !addressCityId) return;
    if (editingAddressId) {
      await updateAddressMutation.mutateAsync({
        id: editingAddressId,
        payload: {
          label: addressLabel || null,
          line1: addressLine1,
          line2: addressLine2 || null,
          countryId: addressCountryId,
          regionId: addressRegionId,
          cityId: addressCityId,
          isDefault: addressDefault
        }
      });
      setSelectedAddressId(editingAddressId);
      if (addressDefault) {
        setPendingDefaultAddressId(editingAddressId);
      }
    } else {
      const result = await createAddressMutation.mutateAsync({
        label: addressLabel || undefined,
        line1: addressLine1,
        line2: addressLine2 || undefined,
        countryId: addressCountryId,
        regionId: addressRegionId,
        cityId: addressCityId,
        isDefault: addressDefault
      });
      if (result?.address_id) {
        setSelectedAddressId(result.address_id);
        if (addressDefault) {
          setPendingDefaultAddressId(result.address_id);
        }
      }
    }
    resetAddressForm();
    setAddressFormOpen(false);
  };

  const handleSavePayment = async () => {
    if (!paymentName) return;
    if (editingPaymentId) {
      await updatePaymentMethodMutation.mutateAsync({
        id: editingPaymentId,
        payload: {
          name: paymentName,
          last_four: paymentLastFour || null,
          is_default: paymentDefault
        }
      });
      setSelectedPaymentMethodId(editingPaymentId);
      if (paymentDefault) {
        setPendingDefaultPaymentId(editingPaymentId);
      }
    } else {
      const result = await createPaymentMethodMutation.mutateAsync({
        type: 'card',
        name: paymentName,
        last_four: paymentLastFour || undefined,
        is_default: paymentDefault
      });
      if (result?.payment_method_id) {
        setSelectedPaymentMethodId(result.payment_method_id);
        if (paymentDefault) {
          setPendingDefaultPaymentId(result.payment_method_id);
        }
      }
    }
    resetPaymentForm();
    setPaymentFormOpen(false);
  };

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
          <ThemedText type="title">{t('checkout.title', { defaultValue: 'Checkout' })}</ThemedText>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={[styles.loadingText, { color: colors.icon }]}>
            {t('cart.loading', { defaultValue: 'Cargando carrito...' })}
          </ThemedText>
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
        <ThemedText type="title">{t('checkout.title', { defaultValue: 'Checkout' })}</ThemedText>
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.scrollContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <ThemedText style={styles.sectionTitle}>
              {t('checkout.deliveryAddress', { defaultValue: 'Direccion de Entrega' })}
            </ThemedText>
            <View style={styles.sectionActions}>
              <Pressable
                onPress={() => {
                  resetAddressForm();
                  setAddressFormOpen((open) => !open);
                }}
                style={styles.linkButton}
              >
                <ThemedText style={[styles.linkText, { color: colors.primary }]}
                  >
                  {addressFormOpen
                    ? t('common.cancel', { defaultValue: 'Cancelar' })
                    : t('checkout.addAddress', { defaultValue: 'Agregar' })}
                </ThemedText>
              </Pressable>
              {selectedAddressId && !addressFormOpen ? (
                <Pressable
                  onPress={() => startEditAddress(selectedAddressId)}
                  style={styles.linkButton}
                >
                  <ThemedText style={[styles.linkText, { color: colors.primary }]}>
                    {t('common.edit', { defaultValue: 'Editar' })}
                  </ThemedText>
                </Pressable>
              ) : null}
            </View>
          </View>
            {addresses.map((addr) => {
              const isDefault = addr.isDefault || pendingDefaultAddressId === addr.id;
              return (
              <Pressable
                key={addr.id}
                onPress={() => setSelectedAddressId(addr.id)}
                style={[
                  styles.optionCard,
                  { backgroundColor: colors.card, borderColor: selectedAddressId === addr.id ? colors.primary : colors.cardBorder },
                ]}
              >
                <View style={styles.optionRow}>
                  <ThemedText style={styles.optionTitle}>{addr.label || addr.address.line1}</ThemedText>
                  {isDefault ? (
                    <View style={[styles.tag, { backgroundColor: colors.secondary }]}
                    >
                      <ThemedText style={styles.tagText}>
                        {t('common.default', { defaultValue: 'Default' })}
                      </ThemedText>
                    </View>
                  ) : null}
                </View>
              </Pressable>
            )})}
          {addressFormOpen ? (
            <View style={[styles.inlineForm, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            >
              <ThemedText style={styles.formTitle}>
                {editingAddressId
                  ? t('checkout.editAddress', { defaultValue: 'Editar direccion' })
                  : t('checkout.newAddress', { defaultValue: 'Nueva direccion' })}
              </ThemedText>
              <TextInput
                style={[styles.input, { borderColor: colors.cardBorder, color: colors.text }]}
                placeholder={t('addresses.line1', { defaultValue: 'Linea 1' })}
                placeholderTextColor={colors.icon}
                value={addressLine1}
                onChangeText={setAddressLine1}
              />
              <TextInput
                style={[styles.input, { borderColor: colors.cardBorder, color: colors.text }]}
                placeholder={t('addresses.line2', { defaultValue: 'Linea 2' })}
                placeholderTextColor={colors.icon}
                value={addressLine2}
                onChangeText={setAddressLine2}
              />
              <TextInput
                style={[styles.input, { borderColor: colors.cardBorder, color: colors.text }]}
                placeholder={t('addresses.label', { defaultValue: 'Etiqueta' })}
                placeholderTextColor={colors.icon}
                value={addressLabel}
                onChangeText={setAddressLabel}
              />
              <ThemedText style={styles.optionLabel}>
                {t('addresses.country', { defaultValue: 'Pais' })}
              </ThemedText>
              {countries.map((country) => (
                <Pressable
                  key={country.id}
                  onPress={() => {
                    setAddressCountryId(country.id);
                    setAddressRegionId('');
                    setAddressCityId('');
                  }}
                  style={[
                    styles.optionRowSelect,
                    {
                      borderColor: addressCountryId === country.id ? colors.primary : colors.cardBorder,
                      backgroundColor: addressCountryId === country.id ? colors.secondary : colors.card,
                    }
                  ]}
                >
                  <ThemedText>{country.name_es}</ThemedText>
                  {addressCountryId === country.id ? (
                    <IconSymbol name="checkmark" size={16} color={colors.primary} />
                  ) : null}
                </Pressable>
              ))}
              {addressCountryId ? (
                <>
                  <ThemedText style={styles.optionLabel}>
                    {t('addresses.region', { defaultValue: 'Region' })}
                  </ThemedText>
                  {regions.map((region) => (
                    <Pressable
                      key={region.id}
                      onPress={() => {
                        setAddressRegionId(region.id);
                        setAddressCityId('');
                      }}
                      style={[
                        styles.optionRowSelect,
                        {
                          borderColor: addressRegionId === region.id ? colors.primary : colors.cardBorder,
                          backgroundColor: addressRegionId === region.id ? colors.secondary : colors.card,
                        }
                      ]}
                    >
                      <ThemedText>{region.name}</ThemedText>
                      {addressRegionId === region.id ? (
                        <IconSymbol name="checkmark" size={16} color={colors.primary} />
                      ) : null}
                    </Pressable>
                  ))}
                </>
              ) : null}
              {addressRegionId ? (
                <>
                  <ThemedText style={styles.optionLabel}>
                    {t('addresses.city', { defaultValue: 'Ciudad' })}
                  </ThemedText>
                  {cities.map((city) => (
                    <Pressable
                      key={city.id}
                      onPress={() => setAddressCityId(city.id)}
                      style={[
                        styles.optionRowSelect,
                        {
                          borderColor: addressCityId === city.id ? colors.primary : colors.cardBorder,
                          backgroundColor: addressCityId === city.id ? colors.secondary : colors.card,
                        }
                      ]}
                    >
                      <ThemedText>{city.name}</ThemedText>
                      {addressCityId === city.id ? (
                        <IconSymbol name="checkmark" size={16} color={colors.primary} />
                      ) : null}
                    </Pressable>
                  ))}
                </>
              ) : null}
              <Pressable
                onPress={() => setAddressDefault((value) => !value)}
                style={styles.toggleRow}
              >
                <IconSymbol
                  name={addressDefault ? 'checkmark.circle.fill' : 'circle'}
                  size={18}
                  color={addressDefault ? colors.primary : colors.icon}
                />
                <ThemedText style={styles.toggleText}>
                  {t('checkout.makeDefault', { defaultValue: 'Marcar como default' })}
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={handleSaveAddress}
                style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              >
                <ThemedText style={{ color: colors.primaryText, fontWeight: '600' }}>
                  {t('common.save', { defaultValue: 'Guardar' })}
                </ThemedText>
              </Pressable>
            </View>
          ) : null}
        </View>
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <ThemedText style={styles.sectionTitle}>
              {t('checkout.paymentMethod', { defaultValue: 'Metodo de Pago' })}
            </ThemedText>
            <View style={styles.sectionActions}>
              <Pressable
                onPress={() => {
                  resetPaymentForm();
                  setPaymentFormOpen((open) => !open);
                }}
                style={styles.linkButton}
              >
                <ThemedText style={[styles.linkText, { color: colors.primary }]}
                  >
                  {paymentFormOpen
                    ? t('common.cancel', { defaultValue: 'Cancelar' })
                    : t('checkout.addPayment', { defaultValue: 'Agregar' })}
                </ThemedText>
              </Pressable>
              {selectedPaymentMethodId && !paymentFormOpen ? (
                <Pressable
                  onPress={() => startEditPayment(selectedPaymentMethodId)}
                  style={styles.linkButton}
                >
                  <ThemedText style={[styles.linkText, { color: colors.primary }]}>
                    {t('common.edit', { defaultValue: 'Editar' })}
                  </ThemedText>
                </Pressable>
              ) : null}
            </View>
          </View>
          {paymentMethods.map((pm) => {
            const isDefault = pm.isDefault || pendingDefaultPaymentId === pm.id;
            return (
            <Pressable
              key={pm.id}
              onPress={() => setSelectedPaymentMethodId(pm.id)}
              style={[
                styles.optionCard,
                { backgroundColor: colors.card, borderColor: selectedPaymentMethodId === pm.id ? colors.primary : colors.cardBorder },
              ]}
            >
              <View style={styles.optionRow}>
                <ThemedText style={styles.optionTitle}>{pm.name}</ThemedText>
                {isDefault ? (
                  <View style={[styles.tag, { backgroundColor: colors.secondary }]}
                  >
                    <ThemedText style={styles.tagText}>
                      {t('common.default', { defaultValue: 'Default' })}
                    </ThemedText>
                  </View>
                ) : null}
              </View>
            </Pressable>
          )})}
          {paymentFormOpen ? (
            <View style={[styles.inlineForm, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            >
              <ThemedText style={styles.formTitle}>
                {editingPaymentId
                  ? t('checkout.editPayment', { defaultValue: 'Editar metodo' })
                  : t('checkout.newPayment', { defaultValue: 'Nuevo metodo' })}
              </ThemedText>
              <TextInput
                style={[styles.input, { borderColor: colors.cardBorder, color: colors.text }]}
                placeholder={t('paymentMethods.name', { defaultValue: 'Nombre' })}
                placeholderTextColor={colors.icon}
                value={paymentName}
                onChangeText={setPaymentName}
              />
              <TextInput
                style={[styles.input, { borderColor: colors.cardBorder, color: colors.text }]}
                placeholder={t('paymentMethods.lastFour', { defaultValue: 'Ultimos 4' })}
                placeholderTextColor={colors.icon}
                value={paymentLastFour}
                onChangeText={setPaymentLastFour}
                keyboardType="number-pad"
                maxLength={4}
              />
              <Pressable
                onPress={() => setPaymentDefault((value) => !value)}
                style={styles.toggleRow}
              >
                <IconSymbol
                  name={paymentDefault ? 'checkmark.circle.fill' : 'circle'}
                  size={18}
                  color={paymentDefault ? colors.primary : colors.icon}
                />
                <ThemedText style={styles.toggleText}>
                  {t('checkout.makeDefault', { defaultValue: 'Marcar como default' })}
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={handleSavePayment}
                style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              >
                <ThemedText style={{ color: colors.primaryText, fontWeight: '600' }}>
                  {t('common.save', { defaultValue: 'Guardar' })}
                </ThemedText>
              </Pressable>
            </View>
          ) : null}
        </View>
        <View style={[styles.orderSummary, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <ThemedText style={styles.sectionTitle}>
            {t('checkout.summary', { defaultValue: 'Resumen' })}
          </ThemedText>
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>
              {t('checkout.items', { defaultValue: 'Items' })}
            </ThemedText>
            <ThemedText style={styles.summaryValue}>{cart.item_count}</ThemedText>
          </View>
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>
              {t('checkout.subtotal', { defaultValue: 'Subtotal' })}
            </ThemedText>
            <ThemedText style={styles.summaryValue}>${Number(cart.subtotal).toFixed(2)}</ThemedText>
          </View>
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>
              {t('checkout.tax', { defaultValue: 'Impuestos' })}
            </ThemedText>
            <ThemedText style={styles.summaryValue}>${Number(cart.tax).toFixed(2)}</ThemedText>
          </View>
          <View style={styles.totalRow}>
            <ThemedText style={styles.totalLabel}>{t('common.total', { defaultValue: 'Total' })}</ThemedText>
            <ThemedText style={styles.totalValue}>${Number(cart.total).toFixed(2)}</ThemedText>
          </View>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <Pressable
        onPress={handlePlaceOrder}
        style={[styles.placeOrderBtn, { backgroundColor: colors.primary }]}
        disabled={!selectedAddressId || !selectedPaymentMethodId || createOrderMutation.isPending}
      >
        <ThemedText style={{ color: colors.primaryText, fontWeight: '600' }}>
          {createOrderMutation.isPending
            ? t('checkout.processing', { defaultValue: 'Procesando...' })
            : t('checkout.placeOrder', { defaultValue: 'Realizar pedido' })}
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 60, flexDirection: 'row', alignItems: 'center' },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  scrollContainer: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 140 },
  section: { marginBottom: 20 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionActions: { flexDirection: 'row', gap: 12 },
  linkButton: { paddingVertical: 4, paddingHorizontal: 6 },
  linkText: { fontSize: 13, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  optionCard: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 8 },
  optionTitle: { fontSize: 15, fontWeight: '500' },
  optionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  tag: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  tagText: { fontSize: 10, fontWeight: '700' },
  inlineForm: { borderWidth: 1, borderRadius: 12, padding: 14, marginTop: 8, gap: 10 },
  formTitle: { fontSize: 15, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  optionLabel: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  optionRowSelect: { borderWidth: 1, borderRadius: 10, padding: 10, marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  toggleText: { fontSize: 13, fontWeight: '500' },
  primaryButton: { borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  orderSummary: { borderWidth: 1, borderRadius: 12, padding: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  summaryLabel: { fontSize: 14, fontWeight: '500' },
  summaryValue: { fontSize: 14, fontWeight: '600' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  totalLabel: { fontSize: 18, fontWeight: '600' },
  totalValue: { fontSize: 22, fontWeight: '700', color: '#22c55e' },
  placeOrderBtn: { margin: 16, borderRadius: 12, padding: 16, alignItems: 'center' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16 },
});
