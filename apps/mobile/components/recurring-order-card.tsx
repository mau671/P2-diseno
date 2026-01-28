import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useThemePreference } from '@/context/theme-preference';

type RecurringOrder = {
  id: string;
  frequency: string;
  status: string;
};

type RecurringOrderCardProps = {
  recurring: RecurringOrder;
  onPause: (id: string) => void;
  onRunNow: (id: string) => void;
};

function RecurringOrderCardComponent({
  recurring,
  onPause,
  onRunNow,
}: RecurringOrderCardProps) {
  const { t } = useTranslation();
  const { resolvedScheme } = useThemePreference();
  const colors = Colors[resolvedScheme];

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <ThemedText style={styles.sectionTitle}>{recurring.frequency}</ThemedText>
      <ThemedText style={[styles.subText, { color: colors.icon }]}>
        {recurring.status}
      </ThemedText>
      <View style={styles.actionsRow}>
        <Pressable
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => onPause(recurring.id)}
        >
          {({ pressed }) => (
            <ThemedText
              style={[
                styles.actionText,
                { color: colors.primaryText, opacity: pressed ? 0.6 : 1 },
              ]}
            >
              {t('recurringOrders.pause')}
            </ThemedText>
          )}
        </Pressable>
        <Pressable
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => onRunNow(recurring.id)}
        >
          {({ pressed }) => (
            <ThemedText
              style={[
                styles.actionText,
                { color: colors.primaryText, opacity: pressed ? 0.6 : 1 },
              ]}
            >
              {t('recurringOrders.runNow')}
            </ThemedText>
          )}
        </Pressable>
      </View>
    </View>
  );
}

export const RecurringOrderCard = React.memo(RecurringOrderCardComponent);

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
  subText: { fontSize: 13 },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionButton: { borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12 },
  actionText: { fontSize: 13, fontWeight: '600' },
});
