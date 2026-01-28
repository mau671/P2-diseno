import { useState } from 'react';
import { FlashList } from '@shopify/flash-list';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useCreatePaymentMethod, usePaymentMethods } from '@/hooks/use-payment-methods';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useThemePreference } from '@/context/theme-preference';
import { useAuth } from '@/hooks/use-auth';
import { PaymentMethodCard } from '@/components/payment-method-card';

export default function PaymentMethodsScreen() {
  const { t } = useTranslation();
  const { resolvedScheme } = useThemePreference();
  const colors = Colors[resolvedScheme];
  const { session } = useAuth();
  const accessToken = session?.access_token;

  const [name, setName] = useState('');
  const [lastFour, setLastFour] = useState('');

  const methodsQuery = usePaymentMethods(accessToken);
  const createMethod = useCreatePaymentMethod(accessToken);

  const renderMethod = ({ item }: { item: NonNullable<typeof methodsQuery.data>['payment_methods'][0] }) => (
    <PaymentMethodCard method={item} />
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.5 : 1 }]}
        >
          <IconSymbol name="chevron.left" size={20} color={colors.text} />
        </Pressable>
        <ThemedText type="title">{t('paymentMethods.title')}</ThemedText>
      </View>

      <FlashList
        data={methodsQuery.data?.payment_methods ?? []}
        renderItem={renderMethod}
        estimatedItemSize={100}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <ThemedText style={styles.sectionTitle}>{t('paymentMethods.addNew')}</ThemedText>
            <TextInput
              style={[styles.input, { borderColor: colors.cardBorder, color: colors.text }]}
              placeholder={t('paymentMethods.name')}
              placeholderTextColor={colors.icon}
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={[styles.input, { borderColor: colors.cardBorder, color: colors.text }]}
              placeholder={t('paymentMethods.lastFour')}
              placeholderTextColor={colors.icon}
              value={lastFour}
              onChangeText={setLastFour}
              keyboardType="number-pad"
              maxLength={4}
            />
            <Pressable
              style={[
                styles.primaryButton,
                { backgroundColor: colors.primary },
                !name && styles.disabledButton,
              ]}
              onPress={() => {
                createMethod.mutate({ type: 'card', name, last_four: lastFour || undefined });
                setName('');
                setLastFour('');
              }}
              disabled={!name}
            >
              {({ pressed }) => (
                <ThemedText
                  style={[
                    styles.primaryButtonText,
                    { color: colors.primaryText, opacity: pressed ? 0.6 : 1 },
                  ]}
                >
                  {t('common.save')}
                </ThemedText>
              )}
            </Pressable>
          </View>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 60 },
  backButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 10 },
  subText: { fontSize: 13, marginTop: 4 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  primaryButton: { borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8 },
  primaryButtonText: { fontSize: 16, fontWeight: '600' },
  disabledButton: { opacity: 0.6 },
});
