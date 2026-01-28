import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useThemePreference } from '@/context/theme-preference';
import { useAuth } from '@/hooks/use-auth';
import { useOrder, useOrderTracking, useCancelOrder, useReorder } from '@/hooks/use-orders';

export default function OrderDetailScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { resolvedScheme } = useThemePreference();
  const colors = Colors[resolvedScheme];
  const { session } = useAuth();
  const accessToken = session?.access_token;
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'details' | 'tracking'>('details');

  const orderQuery = useOrder(orderId, accessToken);
  const trackingQuery = useOrderTracking(orderId, accessToken);
  const cancelMutation = useCancelOrder(accessToken);
  const reorderMutation = useReorder(accessToken);

  const order = orderQuery.data?.order;
  const tracking = trackingQuery.data;

  if (orderQuery.isLoading) {
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
        <ThemedText type="title">Pedido #{order?.id.slice(0, 8)}</ThemedText>
      </View>
      <View style={styles.tabRow}>
        <Pressable onPress={() => setActiveTab('details')} style={[styles.tab, activeTab === 'details' && { borderColor: colors.primary }]}>
          <ThemedText>Detalles</ThemedText>
        </Pressable>
        <Pressable onPress={() => setActiveTab('tracking')} style={[styles.tab, activeTab === 'tracking' && { borderColor: colors.primary }]}>
          <ThemedText>Seguimiento</ThemedText>
        </Pressable>
      </View>
      <View style={styles.content}>
        {activeTab === 'details' ? (
          <>
            <View style={[styles.statusBadge, { backgroundColor: colors.primary }]}>
              <ThemedText style={styles.statusText}>{order?.status.toUpperCase()}</ThemedText>
            </View>
            {order?.items.map((item) => (
              <View key={item.id} style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <ThemedText style={styles.itemName}>{item.base_name}</ThemedText>
                <ThemedText style={[styles.itemQty, { color: colors.icon }]}>Qty: {item.quantity}</ThemedText>
                <ThemedText style={styles.itemPrice}>${Number(item.subtotal).toFixed(2)}</ThemedText>
              </View>
            ))}
          </>
        ) : (
          <View style={styles.trackingContainer}>
            {tracking?.status_history.map((h, i) => (
              <View key={i} style={styles.trackingItem}>
                <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                <View>
                  <ThemedText style={styles.trackingStatus}>{h.status}</ThemedText>
                  <ThemedText style={[styles.trackingDate, { color: colors.icon }]}>{new Date(h.changed_at).toLocaleString()}</ThemedText>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
      <View style={[styles.footer, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={styles.totalRow}>
          <ThemedText style={styles.totalLabel}>Total</ThemedText>
          <ThemedText style={styles.totalValue}>${Number(order?.total).toFixed(2)}</ThemedText>
        </View>
        <View style={styles.actionsRow}>
          {order?.status === 'pending' && (
            <Pressable onPress={() => cancelMutation.mutate(orderId)} style={[styles.actionBtn, { backgroundColor: '#ef4444' }]}>
              <ThemedText style={{ color: 'white' }}>Cancelar</ThemedText>
            </Pressable>
          )}
          <Pressable onPress={() => reorderMutation.mutate(orderId)} style={[styles.actionBtn, { backgroundColor: colors.primary }]}>
            <ThemedText style={{ color: colors.primaryText }}>Volver a pedir</ThemedText>
          </Pressable>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 60, flexDirection: 'row', alignItems: 'center' },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#e5e7eb' },
  tab: { flex: 1, padding: 16, alignItems: 'center', borderBottomWidth: 2 },
  content: { flex: 1, padding: 16 },
  statusBadge: { borderRadius: 8, padding: 12, alignItems: 'center', marginBottom: 16 },
  statusText: { color: 'white', fontWeight: '700' },
  itemCard: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 10 },
  itemName: { fontSize: 16, fontWeight: '600' },
  itemQty: { fontSize: 13, marginTop: 4 },
  itemPrice: { fontSize: 15, fontWeight: '500', marginTop: 4, color: '#22c55e' },
  trackingContainer: { gap: 12 },
  trackingItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  trackingStatus: { fontSize: 15, fontWeight: '500' },
  trackingDate: { fontSize: 13 },
  footer: { borderTopWidth: 1, padding: 16, gap: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontSize: 18, fontWeight: '600' },
  totalValue: { fontSize: 22, fontWeight: '700', color: '#22c55e' },
  actionsRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  actionBtn: { flex: 1, borderRadius: 10, padding: 14, alignItems: 'center' },
});
