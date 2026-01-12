import { StyleSheet, TouchableOpacity, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

const LANGUAGES = [
  { code: 'es-419', label: 'settings.appearance.language.es-419' },
  { code: 'en-US', label: 'settings.appearance.language.en-US' },
] as const;

type SettingsSectionProps = {
  icon: string;
  title: string;
  subtitle: string;
  onPress?: () => void;
  children?: React.ReactNode;
};

function SettingsSection({ icon, title, subtitle, onPress, children }: SettingsSectionProps) {
  const colorScheme = useColorScheme();
  
  const content = (
    <View style={styles.sectionContent}>
      <IconSymbol 
        name={icon as any} 
        size={24} 
        color={Colors[colorScheme ?? 'light'].tint} 
      />
      <View style={styles.sectionHeaderText}>
        <ThemedText type="subtitle">{title}</ThemedText>
        <ThemedText style={styles.sectionSubtitle}>
          {subtitle}
        </ThemedText>
      </View>
      {onPress && (
        <IconSymbol 
          name="chevron.right" 
          size={20} 
          color={Colors[colorScheme ?? 'light'].icon} 
        />
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity style={styles.section} onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.section}>
      {content}
      {children}
    </View>
  );
}

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const colorScheme = useColorScheme();
  const currentLanguage = i18n.language;

  const handleLanguageChange = async (languageCode: string) => {
    await i18n.changeLanguage(languageCode);
  };

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">{t('settings.title')}</ThemedText>
      </ThemedView>

      {/* Profile Section */}
      <SettingsSection
        icon="person.circle.fill"
        title={t('settings.profile.title')}
        subtitle={t('settings.profile.subtitle')}
        onPress={() => {
          console.log('Navigate to profile');
        }}
      />

      <View style={styles.divider} />

      {/* Security Section */}
      <SettingsSection
        icon="lock.shield.fill"
        title={t('settings.security.title')}
        subtitle={t('settings.security.subtitle')}
        onPress={() => {
          console.log('Navigate to security');
        }}
      />

      <View style={styles.divider} />

      {/* Appearance Section */}
      <View style={styles.section}>
        <View style={styles.sectionContent}>
          <IconSymbol 
            name="paintbrush.fill" 
            size={24} 
            color={Colors[colorScheme ?? 'light'].tint} 
          />
          <View style={styles.sectionHeaderText}>
            <ThemedText type="subtitle">{t('settings.appearance.title')}</ThemedText>
            <ThemedText style={styles.sectionSubtitle}>
              {t('settings.appearance.subtitle')}
            </ThemedText>
          </View>
        </View>

        {/* Language Subsection */}
        <View style={styles.subsection}>
          <ThemedText style={styles.subsectionTitle}>
            {t('settings.appearance.language.title')}
          </ThemedText>
          <ThemedText style={styles.subsectionSubtitle}>
            {t('settings.appearance.language.subtitle')}
          </ThemedText>
          
          {LANGUAGES.map((language) => (
            <TouchableOpacity
              key={language.code}
              style={styles.option}
              onPress={() => handleLanguageChange(language.code)}
              activeOpacity={0.7}
            >
              <View style={styles.optionContent}>
                <ThemedText style={styles.optionText}>
                  {t(language.label)}
                </ThemedText>
                {currentLanguage === language.code && (
                  <IconSymbol 
                    name="checkmark" 
                    size={20} 
                    color={Colors[colorScheme ?? 'light'].tint} 
                  />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Theme Subsection - Coming Soon */}
        <View style={styles.subsection}>
          <ThemedText style={styles.subsectionTitle}>
            {t('settings.appearance.theme.title')}
          </ThemedText>
          <ThemedText style={styles.subsectionSubtitle}>
            {t('settings.appearance.theme.subtitle')}
          </ThemedText>
          
          <View style={[styles.option, { opacity: 0.5 }]}>
            <View style={styles.optionContent}>
              <ThemedText style={styles.optionText}>
                Coming soon
              </ThemedText>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
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
  divider: {
    height: 1,
    backgroundColor: '#e5e5e5',
    marginVertical: 8,
    marginHorizontal: 20,
    opacity: 0.3,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionSubtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 2,
  },
  subsection: {
    marginTop: 20,
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  subsectionSubtitle: {
    fontSize: 13,
    opacity: 0.7,
    marginBottom: 12,
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  optionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
  },
});
