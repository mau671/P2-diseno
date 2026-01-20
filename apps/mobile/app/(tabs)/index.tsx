import * as React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function HomeScreen() {
  const { t } = useTranslation();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">{t('home.welcome', { defaultValue: 'Home' })}</ThemedText>
      </ThemedView>

      <View style={styles.section}>
        <ThemedText style={styles.sectionState}>
          {t('common.comingSoon', { defaultValue: 'Coming Soon' })}
        </ThemedText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 32 },
  header: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 10,
  },
  section: {
    marginTop: 12,
  },
  sectionState: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
});
