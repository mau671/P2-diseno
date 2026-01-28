import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useThemePreference } from '@/context/theme-preference';

type Order = {
  id: string;
  status: string;
  total: number;
  currency_code: string;
  items?: { id: string; quantity: number; baseName?: string; base_name?: string }[];
};

type OrderCardProps = {
  order: Order;
};

function OrderCardComponent({ order }: OrderCardProps) {
  const { t } = useTranslation();
  const { resolvedScheme } = useThemePreference();
  const colors = Colors[resolvedScheme];

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <ThemedText style={styles.sectionTitle}>
        {t('orders.orderId', { id: order.id })}
      </ThemedText>
      <ThemedText style={[styles.subText, { color: colors.icon }]}>
        {order.status} · {order.total} {order.currency_code}
      </ThemedText>
      {order.items && order.items.length > 0 && (
        <View style={styles.itemsList}>
          {order.items.map((item) => (
            <ThemedText key={item.id} style={styles.itemText}>
              {item.quantity}× {item.baseName ?? item.base_name ?? ''}
            </ThemedText>
          ))}
        </View>
      )}
    </View>
  );
}

export const OrderCard = React.memo(OrderCardComponent);

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
  subText: { fontSize: 13 },
  itemsList: { marginTop: 8 },
  itemText: { fontSize: 13 },
});
