import { FlashList } from '@shopify/flash-list';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRecurringOrders, useRunRecurringOrder, useUpdateRecurringOrderStatus } from '@/hooks/use-recurring-orders';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useThemePreference } from '@/context/theme-preference';
import { useAuth } from '@/hooks/use-auth';
import { RecurringOrderCard } from '@/components/recurring-order-card';

export default function RecurringOrdersScreen() {
  const { t } = useTranslation();
  const { resolvedScheme } = useThemePreference();
  const colors = Colors[resolvedScheme];
  const { session } = useAuth();
  const accessToken = session?.access_token;
  const recurringQuery = useRecurringOrders(accessToken);
  const updateStatus = useUpdateRecurringOrderStatus(accessToken);
  const runNow = useRunRecurringOrder(accessToken);

  const renderRecurring = ({ item }: { item: NonNullable<typeof recurringQuery.data>['recurring_orders'][0] }) => (
    <RecurringOrderCard
      recurring={item}
      onPause={(id) => updateStatus.mutate({ id, status: 'paused' })}
      onRunNow={(id) => runNow.mutate(id)}
    />
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
        <ThemedText type="title">{t('recurringOrders.title')}</ThemedText>
      </View>

      <FlashList
        data={recurringQuery.data?.recurring_orders ?? []}
        renderItem={renderRecurring}
        estimatedItemSize={100}
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          <ThemedText style={[styles.subText, { color: colors.icon }]}>
            {t('recurringOrders.empty')}
          </ThemedText>
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
});
