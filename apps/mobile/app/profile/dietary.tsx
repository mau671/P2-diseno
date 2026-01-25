import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useThemePreference } from '@/context/theme-preference';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/api';

type DietaryRestriction = {
  id: string;
  name: string;
  type: string;
};

export default function DietaryProfileScreen() {
  const { t } = useTranslation();
  const { resolvedScheme } = useThemePreference();
  const { session, loading: authLoading } = useAuth();
  const colors = Colors[resolvedScheme];

  const [restrictions, setRestrictions] = useState<DietaryRestriction[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const grouped = useMemo(() => {
    const allergens: DietaryRestriction[] = [];
    const diets: DietaryRestriction[] = [];
    restrictions.forEach((item) => {
      if (item.type === 'allergen') {
        allergens.push(item);
      } else {
        diets.push(item);
      }
    });
    return { allergens, diets };
  }, [restrictions]);

  const toggleRestriction = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const loadData = async () => {
    setError('');
    setSuccess(false);
    setLoading(true);
    try {
      const restrictionsResponse = await apiRequest<{ restrictions: DietaryRestriction[] }>(
        '/dietary/restrictions',
        { method: 'GET' }
      );

      const dietaryResponse = await apiRequest<{ restriction_ids: string[] }>(
        '/profiles/me/dietary',
        { method: 'GET' },
        session?.access_token
      );

      setRestrictions(restrictionsResponse.restrictions || []);
      setSelectedIds(new Set(dietaryResponse.restriction_ids || []));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('dietary.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setError('');
    setSuccess(false);
    setSaving(true);
    try {
      await apiRequest<{ restriction_ids: string[] }>(
        '/profiles/me/dietary',
        {
          method: 'PUT',
          body: JSON.stringify({ restriction_ids: Array.from(selectedIds) })
        },
        session?.access_token
      );
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('dietary.saveError'));
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!session?.access_token) {
      router.replace('/auth/login');
      return;
    }
    void loadData();
  }, [authLoading, session?.access_token]);

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={20} color={colors.text} />
        </TouchableOpacity>
        <ThemedText type="title">{t('dietary.title')}</ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.icon }]}>{t('dietary.subtitle')}</ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {error ? (
          <View style={[styles.messageBox, { backgroundColor: `${colors.error}20`, borderColor: `${colors.error}40` }]}
            >
            <ThemedText style={[styles.messageText, { color: colors.error }]}>{error}</ThemedText>
          </View>
        ) : null}

        {success ? (
          <View style={[styles.messageBox, { backgroundColor: `${colors.success}20`, borderColor: `${colors.success}40` }]}
            >
            <ThemedText style={[styles.messageText, { color: colors.success }]}>{t('dietary.saved')}</ThemedText>
          </View>
        ) : null}

        {loading ? (
          <ThemedText style={[styles.loadingText, { color: colors.icon }]}>{t('common.loading')}</ThemedText>
        ) : (
          <>
            <Section
              title={t('dietary.allergens')}
              items={grouped.allergens}
              selectedIds={selectedIds}
              onToggle={toggleRestriction}
              colors={colors}
              emptyLabel={t('dietary.emptyAllergens')}
            />
            <Section
              title={t('dietary.diets')}
              items={grouped.diets}
              selectedIds={selectedIds}
              onToggle={toggleRestriction}
              colors={colors}
              emptyLabel={t('dietary.emptyDiets')}
            />
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.cardBorder }]}>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving || loading}
        >
          <ThemedText style={[styles.saveButtonText, { color: colors.primaryText }]}
            >
            {saving ? t('dietary.saving') : t('common.save')}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

function Section({
  title,
  items,
  selectedIds,
  onToggle,
  colors,
  emptyLabel,
}: {
  title: string;
  items: DietaryRestriction[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  colors: typeof Colors.light;
  emptyLabel: string;
}) {
  return (
    <View style={styles.section}>
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
      {items.length === 0 ? (
        <ThemedText style={[styles.emptyText, { color: colors.icon }]}>{emptyLabel}</ThemedText>
      ) : (
        items.map((item) => {
          const isSelected = selectedIds.has(item.id);
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.optionItem,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
                isSelected && { borderColor: colors.primary }
              ]}
              onPress={() => onToggle(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.optionRow}>
                <ThemedText style={styles.optionText}>{item.name}</ThemedText>
                {isSelected ? (
                  <IconSymbol name="checkmark.circle.fill" size={20} color={colors.primary} />
                ) : (
                  <IconSymbol name="circle" size={20} color={colors.icon} />
                )}
              </View>
            </TouchableOpacity>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  messageBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  messageText: {
    fontSize: 13,
  },
  loadingText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 13,
  },
  optionItem: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionText: {
    fontSize: 15,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    borderTopWidth: 1,
  },
  saveButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
