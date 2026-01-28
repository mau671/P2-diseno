import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useThemePreference } from '@/context/theme-preference';

type PaymentMethod = {
  id: string;
  name: string;
  lastFour: string | null;
};

type PaymentMethodCardProps = {
  method: PaymentMethod;
};

function PaymentMethodCardComponent({ method }: PaymentMethodCardProps) {
  const { t } = useTranslation();
  const { resolvedScheme } = useThemePreference();
  const colors = Colors[resolvedScheme];

  return (
    <View
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
    >
      <ThemedText style={styles.sectionTitle}>{method.name}</ThemedText>
      <ThemedText style={[styles.subText, { color: colors.icon }]}>
        {method.lastFour ? `**** ${method.lastFour}` : t('common.na')}
      </ThemedText>
    </View>
  );
}

export const PaymentMethodCard = React.memo(PaymentMethodCardComponent);

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 10 },
  subText: { fontSize: 13, marginTop: 4 },
});
