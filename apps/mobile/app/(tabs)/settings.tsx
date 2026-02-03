import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { ThemePreference, useThemePreference } from '@/context/theme-preference';
import { useAuth } from '@/hooks/use-auth';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

const LANGUAGES = [
  { code: 'es-419', label: 'settings.appearance.language.es-419' },
  { code: 'en-US', label: 'settings.appearance.language.en-US' },
] as const;

const THEMES = [
  { value: 'system' as ThemePreference, label: 'settings.appearance.theme.system' },
  { value: 'light' as ThemePreference, label: 'settings.appearance.theme.light' },
  { value: 'dark' as ThemePreference, label: 'settings.appearance.theme.dark' },
] as const;

type SectionKey = 'profile' | 'appearance';

function SectionHeader({ 
  icon, 
  title, 
  subtitle, 
  isOpen, 
  onPress,
  colors 
}: { 
  icon: string; 
  title: string; 
  subtitle?: string; 
  isOpen: boolean;
  onPress: () => void;
  colors: typeof Colors.light;
}) {
  return (
    <TouchableOpacity
      style={[styles.sectionHeader, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.sectionHeaderContent}>
        <IconSymbol name={icon as any} size={24} color={colors.primary} />
        <View style={styles.sectionHeaderText}>
          <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
          {subtitle && <ThemedText style={[styles.sectionSubtitle, { color: colors.icon }]}>{subtitle}</ThemedText>}
        </View>
      </View>
      <View style={styles.chevron}>
        <IconSymbol name="chevron.right" size={20} color={colors.icon} />
      </View>
    </TouchableOpacity>
  );
}

function ProfileSection({ user, colors }: { user: any; colors: typeof Colors.light }) {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const email = user?.email || '';
  const initial = email ? email.charAt(0).toUpperCase() : 'U';

  const handleLogout = async () => {
    Alert.alert(
      t('auth.logout'),
      t('auth.logout') + '?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('auth.logout'), style: 'destructive', onPress: async () => {
          try {
            await logout();
          } finally {
            router.replace('/auth/login');
          }
        }}
      ]
    );
  };

  return (
    <View style={[styles.sectionContent, { backgroundColor: colors.background }]}>
      <View style={styles.profileHeader}>
        <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
          <ThemedText style={styles.avatarText}>
            {initial}
          </ThemedText>
        </View>
        <View style={styles.profileInfo}>
          <ThemedText style={styles.profileEmail}>{email || t('user.myProfile')}</ThemedText>
          <ThemedText style={[styles.profileLabel, { color: colors.icon }]}>{t('settings.profile.verified')}</ThemedText>
        </View>
      </View>

      <View style={styles.divider} />

      <TouchableOpacity
        style={[styles.optionItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
        onPress={() => router.push('/profile/dietary')}
        activeOpacity={0.7}
      >
        <View style={styles.optionItemRow}>
          <IconSymbol name="leaf.fill" size={20} color={colors.primary} />
          <ThemedText style={styles.optionItemText}>{t('settings.profile.dietary')}</ThemedText>
          <IconSymbol name="chevron.right" size={18} color={colors.icon} />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.optionItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
        onPress={() => router.push('/profile')}
        activeOpacity={0.7}
      >
        <View style={styles.optionItemRow}>
          <IconSymbol name="person.fill" size={20} color={colors.primary} />
          <ThemedText style={styles.optionItemText}>{t('settings.profile.details', { defaultValue: 'Perfil completo' })}</ThemedText>
          <IconSymbol name="chevron.right" size={18} color={colors.icon} />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.optionItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
        onPress={() => router.push('/addresses')}
        activeOpacity={0.7}
      >
        <View style={styles.optionItemRow}>
          <IconSymbol name="location.fill" size={20} color={colors.primary} />
          <ThemedText style={styles.optionItemText}>{t('settings.profile.addresses')}</ThemedText>
          <IconSymbol name="chevron.right" size={18} color={colors.icon} />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.optionItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
        onPress={() => router.push('/payment-methods')}
        activeOpacity={0.7}
      >
        <View style={styles.optionItemRow}>
          <IconSymbol name="creditcard.fill" size={20} color={colors.primary} />
          <ThemedText style={styles.optionItemText}>{t('settings.profile.paymentMethods')}</ThemedText>
          <IconSymbol name="chevron.right" size={18} color={colors.icon} />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.optionItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
        onPress={() => router.push('/orders')}
        activeOpacity={0.7}
      >
        <View style={styles.optionItemRow}>
          <IconSymbol name="list.bullet.rectangle" size={20} color={colors.primary} />
          <ThemedText style={styles.optionItemText}>{t('settings.profile.orders')}</ThemedText>
          <IconSymbol name="chevron.right" size={18} color={colors.icon} />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.optionItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
        onPress={() => router.push('/recurring-orders')}
        activeOpacity={0.7}
      >
        <View style={styles.optionItemRow}>
          <IconSymbol name="arrow.triangle.2.circlepath" size={20} color={colors.primary} />
          <ThemedText style={styles.optionItemText}>{t('settings.profile.recurringOrders')}</ThemedText>
          <IconSymbol name="chevron.right" size={18} color={colors.icon} />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.logoutOption, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <View style={styles.optionItemRow}>
          <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color={colors.primary} />
          <ThemedText style={styles.optionItemText}>{t('auth.logout')}</ThemedText>
        </View>
      </TouchableOpacity>
    </View>
  );
}

function AppearanceSection({ colors }: { colors: typeof Colors.light }) {
  const { t } = useTranslation();
  const { i18n } = useTranslation();
  const { preference, setPreference } = useThemePreference();
  const currentLanguage = i18n.language;

  const handleLanguageChange = async (languageCode: string) => {
    await i18n.changeLanguage(languageCode);
  };

  return (
    <View style={[styles.sectionContent, { backgroundColor: colors.background }]}>
      <View style={styles.subsection}>
        <ThemedText style={styles.subsectionTitle}>{t('settings.appearance.language.title')}</ThemedText>
        <View style={[styles.optionsList, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {LANGUAGES.map((language) => (
            <TouchableOpacity
              key={language.code}
              style={[styles.option, { borderColor: colors.divider }]}
              onPress={() => handleLanguageChange(language.code)}
              activeOpacity={0.7}
            >
              <View style={styles.optionRow}>
                <ThemedText style={styles.optionText}>{t(language.label)}</ThemedText>
                {currentLanguage === language.code && (
                  <IconSymbol name="checkmark" size={20} color={colors.primary} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.subsection}>
        <ThemedText style={styles.subsectionTitle}>{t('settings.appearance.theme.title')}</ThemedText>
        <View style={[styles.optionsList, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {THEMES.map((theme) => (
            <TouchableOpacity
              key={theme.value}
              style={[styles.option, { borderColor: colors.divider }]}
              onPress={() => setPreference(theme.value)}
              activeOpacity={0.7}
            >
              <View style={styles.optionRow}>
                <ThemedText style={styles.optionText}>{t(theme.label)}</ThemedText>
                {preference === theme.value && (
                  <IconSymbol name="checkmark" size={20} color={colors.primary} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { resolvedScheme } = useThemePreference();
  const { user } = useAuth();
  const [openSection, setOpenSection] = useState<SectionKey | null>(null);
  const colors = Colors[resolvedScheme];

  const toggleSection = (key: SectionKey) => {
    if (!user && key === 'profile') {
      router.push('/auth/login');
      return;
    }
    setOpenSection(openSection === key ? null : key);
  };

  const sections: { key: SectionKey; icon: string; title: string; subtitle?: string; component: React.ReactNode }[] = [
    { 
      key: 'profile', 
      icon: 'person.circle.fill',
      title: t('settings.profile.title'),
      subtitle: user?.email || t('user.myProfile'),
      component: <ProfileSection user={user} colors={colors} />
    },
    { 
      key: 'appearance', 
      icon: 'paintbrush.fill',
      title: t('settings.appearance.title'),
      subtitle: t('settings.appearance.subtitle'),
      component: <AppearanceSection colors={colors} />
    },
  ];

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">{t('settings.title')}</ThemedText>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {sections.map((section) => (
          <View key={section.key} style={styles.section}>
            <SectionHeader
              icon={section.icon}
              title={section.title}
              subtitle={section.subtitle}
              isOpen={openSection === section.key}
              onPress={() => toggleSection(section.key)}
              colors={colors}
            />
            {openSection === section.key && section.component}
          </View>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  sectionSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  chevron: {
    marginLeft: 8,
  },
  sectionContent: {
    padding: 16,
    borderRadius: 16,
    marginTop: 4,
  },
  subsection: {
    marginBottom: 20,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  optionsList: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '600',
  },
  profileInfo: {
    flex: 1,
  },
  profileEmail: {
    fontSize: 17,
    fontWeight: '600',
  },
  profileLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  optionItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  optionItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  logoutOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
});
