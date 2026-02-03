import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useThemePreference } from '@/context/theme-preference';

type Order = {
  id: string;
  status: string;
  total: number;
  currency_code: string;
  restaurant_name?: string | null;
  item_count?: number;
  items?: { id: string; quantity: number; baseName?: string; base_name?: string }[];
};

type OrderCardProps = {
  order: Order;
  onPress?: () => void;
};

function OrderCardComponent({ order, onPress }: OrderCardProps) {
  const { t } = useTranslation();
  const { resolvedScheme } = useThemePreference();
  const colors = Colors[resolvedScheme];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.cardBorder, opacity: pressed ? 0.85 : 1 }
      ]}
    >
      <ThemedText style={styles.sectionTitle}>
        {t('orders.orderId', { id: order.id })}
      </ThemedText>
      {order.restaurant_name ? (
        <ThemedText style={[styles.subText, { color: colors.icon }]}>
          {order.restaurant_name}
        </ThemedText>
      ) : null}
      <View style={styles.metaRow}>
        <ThemedText style={[styles.subText, { color: colors.icon }]}>
          {t('orders.status', { defaultValue: 'Estado' })}: {order.status}
        </ThemedText>
        <ThemedText style={[styles.subText, { color: colors.icon }]}>
          {order.item_count ?? order.items?.length ?? 0} {t('orders.items', { defaultValue: 'items' })}
        </ThemedText>
      </View>
      <ThemedText style={styles.totalText}>
        {order.total} {order.currency_code}
      </ThemedText>
    </Pressable>
  );
}

export const OrderCard = React.memo(OrderCardComponent);

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
  subText: { fontSize: 13 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  totalText: { fontSize: 16, fontWeight: '700', marginTop: 8 },
});
