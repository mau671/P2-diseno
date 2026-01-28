import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useThemePreference } from '@/context/theme-preference';
import { useAuth } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-profile';

function MenuItem({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  const { resolvedScheme } = useThemePreference();
  const colors = Colors[resolvedScheme];

  return (
    <Pressable onPress={onPress} style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <View style={styles.menuRow}>
        <IconSymbol name={icon as any} size={22} color={colors.primary} />
        <ThemedText style={styles.menuLabel}>{label}</ThemedText>
      </View>
      <IconSymbol name="chevron.right" size={18} color={colors.icon} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { resolvedScheme } = useThemePreference();
  const colors = Colors[resolvedScheme];
  const { session, signOut } = useAuth();
  const accessToken = session?.access_token;
  const navigation = useNavigation();

  const profileQuery = useProfile(accessToken);
  const profile = profileQuery.data?.profile;

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <ThemedText type="title">Perfil</ThemedText>
      </View>
      <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={styles.avatar}>
          <ThemedText style={styles.avatarText}>{profile?.full_name?.[0] || profile?.email?.[0] || 'U'}</ThemedText>
        </View>
        <ThemedText style={styles.profileName}>{profile?.full_name || 'Usuario'}</ThemedText>
        <ThemedText style={[styles.profileEmail, { color: colors.icon }]}>{profile?.email}</ThemedText>
      </View>
      <View style={styles.menuContainer}>
        <MenuItem icon="person" label="Dietary Preferences" onPress={() => navigation.navigate('profile/dietary' as never)} />
        <MenuItem icon="location" label="Direcciones" onPress={() => navigation.navigate('addresses' as never)} />
        <MenuItem icon="creditcard" label="Métodos de Pago" onPress={() => navigation.navigate('payment-methods' as never)} />
        <MenuItem icon="cart" label="Comidas Guardadas" onPress={() => navigation.navigate('saved-meals' as never)} />
        <MenuItem icon="arrow.clockwise" label="Órdenes Recurrentes" onPress={() => navigation.navigate('recurring-orders' as never)} />
        <MenuItem icon="list.bullet" label="Historial de Pedidos" onPress={() => navigation.navigate('orders' as never)} />
      </View>
      <Pressable onPress={() => signOut()} style={styles.logoutBtn}>
        <ThemedText style={styles.logoutText}>Cerrar Sesión</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 60 },
  profileCard: { borderWidth: 1, borderRadius: 16, padding: 20, alignItems: 'center', marginHorizontal: 16, marginBottom: 24 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { color: 'white', fontSize: 24, fontWeight: '700' },
  profileName: { fontSize: 20, fontWeight: '600', marginBottom: 4 },
  profileEmail: { fontSize: 14 },
  menuContainer: { paddingHorizontal: 16, gap: 8 },
  menuItem: { borderWidth: 1, borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuLabel: { fontSize: 16 },
  logoutBtn: { margin: 16, padding: 16, alignItems: 'center' },
  logoutText: { color: '#ef4444', fontSize: 16, fontWeight: '500' },
});
