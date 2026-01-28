import { FlashList } from '@shopify/flash-list';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useOrders } from '@/hooks/use-orders';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useThemePreference } from '@/context/theme-preference';
import { useAuth } from '@/hooks/use-auth';
import { OrderCard } from '@/components/order-card';

export default function OrdersScreen() {
  const { t } = useTranslation();
  const { resolvedScheme } = useThemePreference();
  const colors = Colors[resolvedScheme];
  const { session } = useAuth();
  const accessToken = session?.access_token;

  const ordersQuery = useOrders({}, accessToken);

  const renderOrder = ({ item }: { item: NonNullable<typeof ordersQuery.data>['orders'][0] }) => (
    <OrderCard order={item} />
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
        <ThemedText type="title">{t('orders.title')}</ThemedText>
      </View>

      <FlashList
        data={ordersQuery.data?.orders ?? []}
        renderItem={renderOrder}
        estimatedItemSize={100}
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          <ThemedText style={[styles.subText, { color: colors.icon }]}>
            {t('orders.empty')}
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
