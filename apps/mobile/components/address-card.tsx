import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useThemePreference } from '@/context/theme-preference';

type Address = {
  id: string;
  label: string | null;
  address: {
    line1: string;
    city: { name: string };
  };
};

type AddressCardProps = {
  address: Address;
};

function AddressCardComponent({ address }: AddressCardProps) {
  const { resolvedScheme } = useThemePreference();
  const colors = Colors[resolvedScheme];

  return (
    <View
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
    >
      <ThemedText style={styles.sectionTitle}>
        {address.label || address.address.line1}
      </ThemedText>
      <ThemedText style={[styles.subText, { color: colors.icon }]}>
        {address.address.line1} · {address.address.city.name}
      </ThemedText>
    </View>
  );
}

export const AddressCard = React.memo(AddressCardComponent);

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 10 },
  subText: { fontSize: 13, marginTop: 4 },
});
