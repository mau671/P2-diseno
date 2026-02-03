import { Pressable, StyleSheet, View, TextInput, ScrollView, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import DatePicker, { useDefaultStyles } from 'react-native-ui-datepicker';
import { router, useNavigation } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useThemePreference } from '@/context/theme-preference';
import { useAuth } from '@/hooks/use-auth';
import { useProfile, useUpdateProfile } from '@/hooks/use-profile';

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
  const { t } = useTranslation();
  const { session, logout } = useAuth();
  const accessToken = session?.access_token;
  const navigation = useNavigation();

  const profileQuery = useProfile(accessToken);
  const updateProfileMutation = useUpdateProfile(accessToken);
  const profile = profileQuery.data?.profile;

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('');
  const [preferredCurrency, setPreferredCurrency] = useState('');
  const [notificationsEmail, setNotificationsEmail] = useState(false);
  const [notificationsPush, setNotificationsPush] = useState(false);
  const [notificationsSms, setNotificationsSms] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const defaultDatepickerStyles = useDefaultStyles();
  const datepickerStyles = useMemo(
    () => ({
      ...defaultDatepickerStyles,
      header: { ...defaultDatepickerStyles.header, backgroundColor: colors.card },
      weekdays: { ...defaultDatepickerStyles.weekdays, backgroundColor: colors.card },
      weekday_label: { ...defaultDatepickerStyles.weekday_label, color: colors.icon },
      day: { ...defaultDatepickerStyles.day, backgroundColor: colors.card },
      day_label: { ...defaultDatepickerStyles.day_label, color: colors.text },
      outside_label: { ...defaultDatepickerStyles.outside_label, color: colors.textMuted },
      disabled_label: { ...defaultDatepickerStyles.disabled_label, color: colors.textMuted },
      selected: { ...defaultDatepickerStyles.selected, backgroundColor: colors.primary },
      selected_label: { ...defaultDatepickerStyles.selected_label, color: colors.primaryText },
      today: { ...defaultDatepickerStyles.today, borderColor: colors.primary, borderWidth: 1 },
      today_label: { ...defaultDatepickerStyles.today_label, color: colors.text },
      month_selector_label: { ...defaultDatepickerStyles.month_selector_label, color: colors.text },
      year_selector_label: { ...defaultDatepickerStyles.year_selector_label, color: colors.text },
      button_prev: { ...defaultDatepickerStyles.button_prev, backgroundColor: colors.card },
      button_next: { ...defaultDatepickerStyles.button_next, backgroundColor: colors.card },
    }),
    [colors, defaultDatepickerStyles]
  );

  const languageOptions = useMemo(
    () => [
      { value: 'es-419', label: t('settings.appearance.language.es-419') },
      { value: 'en-US', label: t('settings.appearance.language.en-US') },
    ],
    [t]
  );

  const currencyOptions = useMemo(
    () => [
      { value: 'CRC', label: t('currencies.crc', { defaultValue: 'CRC - Colon' }) },
      { value: 'USD', label: t('currencies.usd', { defaultValue: 'USD - Dollar' }) },
      { value: 'EUR', label: t('currencies.eur', { defaultValue: 'EUR - Euro' }) },
    ],
    [t]
  );

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? '');
    setPhone(profile.phone ?? '');
    setAvatarUrl(profile.avatar_url ?? '');
    setDateOfBirth(profile.date_of_birth ?? '');
    setPreferredLanguage(profile.preferred_language ?? '');
    setPreferredCurrency(profile.preferred_currency_code ?? '');
    const preferences = profile.notification_preferences ?? {};
    if (typeof preferences === 'object' && preferences) {
      const data = preferences as Record<string, unknown>;
      setNotificationsEmail(Boolean(data.email));
      setNotificationsPush(Boolean(data.push));
      setNotificationsSms(Boolean(data.sms));
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    const notificationPayload = {
      email: notificationsEmail,
      push: notificationsPush,
      sms: notificationsSms,
    };

    await updateProfileMutation.mutateAsync({
      full_name: fullName || undefined,
      phone: phone || undefined,
      avatar_url: avatarUrl ? avatarUrl : null,
      date_of_birth: dateOfBirth ? dateOfBirth : null,
      preferred_language: preferredLanguage || undefined,
      preferred_currency_code: preferredCurrency || undefined,
      notification_preferences: notificationPayload
    });
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </Pressable>
        <ThemedText type="title">{t('profile.title', { defaultValue: 'Perfil' })}</ThemedText>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.avatar}>
            <ThemedText style={styles.avatarText}>{profile?.full_name?.[0] || profile?.email?.[0] || 'U'}</ThemedText>
          </View>
          <ThemedText style={styles.profileName}>{profile?.full_name || t('profile.fallbackName', { defaultValue: 'Usuario' })}</ThemedText>
          <ThemedText style={[styles.profileEmail, { color: colors.icon }]}>{profile?.email}</ThemedText>
        </View>

        <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <TextInput
            style={[styles.input, { borderColor: colors.cardBorder, color: colors.text }]}
            placeholder={t('profile.fullName', { defaultValue: 'Nombre completo' })}
            placeholderTextColor={colors.icon}
            value={fullName}
            onChangeText={setFullName}
          />
          <TextInput
            style={[styles.input, { borderColor: colors.cardBorder, color: colors.text }]}
            placeholder={t('profile.phone', { defaultValue: 'Telefono' })}
            placeholderTextColor={colors.icon}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <TextInput
            style={[styles.input, { borderColor: colors.cardBorder, color: colors.text }]}
            placeholder={t('profile.avatarUrl', { defaultValue: 'URL de avatar' })}
            placeholderTextColor={colors.icon}
            value={avatarUrl}
            onChangeText={setAvatarUrl}
            autoCapitalize="none"
          />
          <Pressable
            onPress={() => setShowDatePicker(true)}
            style={[styles.selectRow, { borderColor: colors.cardBorder, backgroundColor: colors.card }]}
          >
            <View>
              <ThemedText style={styles.selectLabel}>{t('profile.dateOfBirth', { defaultValue: 'Fecha de nacimiento' })}</ThemedText>
              <ThemedText
                style={[
                  styles.selectValue,
                  { color: dateOfBirth ? colors.text : colors.icon }
                ]}
              >
                {dateOfBirth || t('profile.selectDate', { defaultValue: 'Selecciona una fecha' })}
              </ThemedText>
            </View>
            <IconSymbol name="calendar" size={18} color={colors.icon} />
          </Pressable>
          {showDatePicker && Platform.OS !== 'web' ? (
            <DateTimePicker
              value={dateOfBirth ? new Date(dateOfBirth) : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_, selectedDate) => {
                setShowDatePicker(false);
                if (!selectedDate) return;
                const iso = selectedDate.toISOString().slice(0, 10);
                setDateOfBirth(iso);
              }}
            />
          ) : null}
          {showDatePicker && Platform.OS === 'web' ? (
            <View style={[styles.webOverlay, { backgroundColor: colors.overlay }]}>
              <View style={[styles.webPickerCard, { borderColor: colors.cardBorder, backgroundColor: colors.card }]}>
                <DatePicker
                  mode="single"
                  date={dateOfBirth ? new Date(dateOfBirth) : new Date()}
                  onChange={({ date }) => {
                    if (!date) return;
                    const iso = new Date(date).toISOString().slice(0, 10);
                    setDateOfBirth(iso);
                    setShowDatePicker(false);
                  }}
                  styles={datepickerStyles}
                />
                <Pressable onPress={() => setShowDatePicker(false)} style={styles.webPickerClose}>
                  <ThemedText style={[styles.webPickerCloseText, { color: colors.primary }]}>
                    {t('common.close', { defaultValue: 'Cerrar' })}
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          ) : null}
          <View style={styles.selectGroup}>
            <ThemedText style={styles.selectLabel}>{t('profile.preferredLanguage', { defaultValue: 'Idioma preferido' })}</ThemedText>
            {languageOptions.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => setPreferredLanguage(option.value)}
                style={[
                  styles.optionRow,
                  {
                    borderColor: preferredLanguage === option.value ? colors.primary : colors.cardBorder,
                    backgroundColor: preferredLanguage === option.value ? colors.secondary : colors.card,
                  },
                ]}
              >
                <ThemedText>{option.label}</ThemedText>
                {preferredLanguage === option.value ? (
                  <IconSymbol name="checkmark" size={16} color={colors.primary} />
                ) : null}
              </Pressable>
            ))}
          </View>
          <View style={styles.selectGroup}>
            <ThemedText style={styles.selectLabel}>{t('profile.preferredCurrency', { defaultValue: 'Moneda preferida' })}</ThemedText>
            {currencyOptions.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => setPreferredCurrency(option.value)}
                style={[
                  styles.optionRow,
                  {
                    borderColor: preferredCurrency === option.value ? colors.primary : colors.cardBorder,
                    backgroundColor: preferredCurrency === option.value ? colors.secondary : colors.card,
                  },
                ]}
              >
                <ThemedText>{option.label}</ThemedText>
                {preferredCurrency === option.value ? (
                  <IconSymbol name="checkmark" size={16} color={colors.primary} />
                ) : null}
              </Pressable>
            ))}
          </View>
          <View style={styles.selectGroup}>
            <ThemedText style={styles.selectLabel}>
              {t('profile.notificationsTitle', { defaultValue: 'Notificaciones' })}
            </ThemedText>
            <Pressable
              onPress={() => setNotificationsEmail((value) => !value)}
              style={[
                styles.optionRow,
                {
                  borderColor: notificationsEmail ? colors.primary : colors.cardBorder,
                  backgroundColor: notificationsEmail ? colors.secondary : colors.card,
                },
              ]}
            >
              <ThemedText>{t('profile.notificationsEmail', { defaultValue: 'Correo' })}</ThemedText>
              <IconSymbol
                name={notificationsEmail ? 'checkmark.circle.fill' : 'circle'}
                size={18}
                color={notificationsEmail ? colors.primary : colors.icon}
              />
            </Pressable>
            <Pressable
              onPress={() => setNotificationsPush((value) => !value)}
              style={[
                styles.optionRow,
                {
                  borderColor: notificationsPush ? colors.primary : colors.cardBorder,
                  backgroundColor: notificationsPush ? colors.secondary : colors.card,
                },
              ]}
            >
              <ThemedText>{t('profile.notificationsPush', { defaultValue: 'Push' })}</ThemedText>
              <IconSymbol
                name={notificationsPush ? 'checkmark.circle.fill' : 'circle'}
                size={18}
                color={notificationsPush ? colors.primary : colors.icon}
              />
            </Pressable>
            <Pressable
              onPress={() => setNotificationsSms((value) => !value)}
              style={[
                styles.optionRow,
                {
                  borderColor: notificationsSms ? colors.primary : colors.cardBorder,
                  backgroundColor: notificationsSms ? colors.secondary : colors.card,
                },
              ]}
            >
              <ThemedText>{t('profile.notificationsSms', { defaultValue: 'SMS' })}</ThemedText>
              <IconSymbol
                name={notificationsSms ? 'checkmark.circle.fill' : 'circle'}
                size={18}
                color={notificationsSms ? colors.primary : colors.icon}
              />
            </Pressable>
          </View>
          <Pressable
            onPress={handleSaveProfile}
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          >
            <ThemedText style={{ color: colors.primaryText, fontWeight: '600' }}>
              {t('common.save', { defaultValue: 'Guardar' })}
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.menuContainer}>
          <MenuItem icon="leaf.fill" label={t('settings.profile.dietary')} onPress={() => navigation.navigate('profile/dietary' as never)} />
          <MenuItem icon="location" label={t('settings.profile.addresses')} onPress={() => navigation.navigate('addresses' as never)} />
          <MenuItem icon="creditcard" label={t('settings.profile.paymentMethods')} onPress={() => navigation.navigate('payment-methods' as never)} />
          <MenuItem icon="cart" label={t('profile.savedMeals', { defaultValue: 'Comidas guardadas' })} onPress={() => navigation.navigate('saved-meals' as never)} />
          <MenuItem icon="arrow.clockwise" label={t('settings.profile.recurringOrders')} onPress={() => navigation.navigate('recurring-orders' as never)} />
          <MenuItem icon="list.bullet" label={t('settings.profile.orders')} onPress={() => navigation.navigate('orders' as never)} />
        </View>
        <Pressable
          onPress={async () => {
            await logout();
            router.replace('/auth/login');
          }}
          style={styles.logoutBtn}
        >
          <ThemedText style={styles.logoutText}>{t('auth.logout')}</ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative' },
  header: { padding: 20, paddingTop: 60, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  content: { paddingBottom: 40 },
  profileCard: { borderWidth: 1, borderRadius: 16, padding: 20, alignItems: 'center', marginHorizontal: 16, marginBottom: 24 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { color: 'white', fontSize: 24, fontWeight: '700' },
  profileName: { fontSize: 20, fontWeight: '600', marginBottom: 4 },
  profileEmail: { fontSize: 14 },
  formCard: { borderWidth: 1, borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 16, gap: 12 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  selectRow: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectGroup: { gap: 8 },
  selectLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  selectValue: { fontSize: 14, fontWeight: '500' },
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderRadius: 10, padding: 10 },
  webOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  webPickerCard: { borderWidth: 1, borderRadius: 16, padding: 12, width: '100%', maxWidth: 420 },
  webPickerClose: { marginTop: 8, alignSelf: 'flex-end' },
  webPickerCloseText: { fontSize: 13, fontWeight: '600' },
  primaryButton: { borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  menuContainer: { paddingHorizontal: 16, gap: 8 },
  menuItem: { borderWidth: 1, borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuLabel: { fontSize: 16 },
  logoutBtn: { margin: 16, padding: 16, alignItems: 'center' },
  logoutText: { color: '#ef4444', fontSize: 16, fontWeight: '500' },
});
