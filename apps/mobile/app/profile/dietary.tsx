import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

type DietaryRestrictionsResponse = {
  restrictions: DietaryRestriction[];
};

type UserDietaryResponse = {
  restriction_ids: string[];
};

const RESTRICTIONS_CACHE_KEY = 'ce-dietary-restrictions';
const USER_RESTRICTIONS_CACHE_PREFIX = 'ce-user-dietary';

const setsEqual = (a: Set<string>, b: Set<string>) => {
  if (a.size !== b.size) return false;
  for (const value of a) {
    if (!b.has(value)) return false;
  }
  return true;
};

const getErrorMessage = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback;

export default function DietaryProfileScreen() {
  const { t } = useTranslation();
  const { resolvedScheme } = useThemePreference();
  const { session, user, loading: authLoading } = useAuth();
  const colors = Colors[resolvedScheme];
  const queryClient = useQueryClient();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [initialIds, setInitialIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const restrictionsQuery = useQuery<DietaryRestrictionsResponse>({
    queryKey: ['dietary', 'restrictions'],
    queryFn: () => apiRequest<DietaryRestrictionsResponse>('/dietary/restrictions', { method: 'GET' }),
    staleTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
  });

  const userRestrictionsQuery = useQuery<UserDietaryResponse>({
    queryKey: ['dietary', 'user', user?.id],
    queryFn: () =>
      apiRequest<UserDietaryResponse>('/profiles/me/dietary', { method: 'GET' }, session?.access_token),
    enabled: !!session?.access_token,
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    let active = true;
    const loadCache = async () => {
      try {
        const restrictionsRaw = await AsyncStorage.getItem(RESTRICTIONS_CACHE_KEY);
        if (restrictionsRaw) {
          const cached = JSON.parse(restrictionsRaw) as DietaryRestrictionsResponse & { cachedAt?: number };
          if (active && cached?.restrictions?.length) {
            queryClient.setQueryData(['dietary', 'restrictions'], { restrictions: cached.restrictions });
          }
        }
        if (user?.id) {
          const userKey = `${USER_RESTRICTIONS_CACHE_PREFIX}:${user.id}`;
          const userRaw = await AsyncStorage.getItem(userKey);
          if (userRaw) {
            const cached = JSON.parse(userRaw) as UserDietaryResponse & { cachedAt?: number };
            if (active && cached?.restriction_ids) {
              queryClient.setQueryData(['dietary', 'user', user.id], {
                restriction_ids: cached.restriction_ids,
              });
            }
          }
        }
      } catch {
        // Ignore cache errors
      }
    };
    void loadCache();
    return () => {
      active = false;
    };
  }, [queryClient, user?.id]);

  useEffect(() => {
    const restrictions = restrictionsQuery.data?.restrictions;
    if (!restrictions) return;
    void AsyncStorage.setItem(
      RESTRICTIONS_CACHE_KEY,
      JSON.stringify({ restrictions, cachedAt: Date.now() })
    );
  }, [restrictionsQuery.data]);

  useEffect(() => {
    if (!user?.id) return;
    const restrictionIds = userRestrictionsQuery.data?.restriction_ids;
    if (!restrictionIds) return;
    const userKey = `${USER_RESTRICTIONS_CACHE_PREFIX}:${user.id}`;
    void AsyncStorage.setItem(
      userKey,
      JSON.stringify({ restriction_ids: restrictionIds, cachedAt: Date.now() })
    );
  }, [user?.id, userRestrictionsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (restrictionIds: string[]) =>
      apiRequest<UserDietaryResponse>(
        '/profiles/me/dietary',
        {
          method: 'PUT',
          body: JSON.stringify({ restriction_ids: restrictionIds }),
        },
        session?.access_token
      ),
    onMutate: async (restrictionIds: string[]) => {
      setError('');
      setSuccess(false);
      const previous = queryClient.getQueryData<UserDietaryResponse>(['dietary', 'user', user?.id]);
      queryClient.setQueryData(['dietary', 'user', user?.id], { restriction_ids: restrictionIds });
      return { previous };
    },
    onError: (err, _restrictionIds, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['dietary', 'user', user?.id], context.previous);
      }
      setError(getErrorMessage(err, t('dietary.saveError')));
    },
    onSuccess: (data) => {
      const updatedIds = data?.restriction_ids ?? [];
      const nextSet = new Set(updatedIds);
      setSelectedIds(nextSet);
      setInitialIds(nextSet);
      setSuccess(true);
    },
  });

  const grouped = useMemo(() => {
    const restrictions = restrictionsQuery.data?.restrictions ?? [];
    const allergens: DietaryRestriction[] = [];
    const diets: DietaryRestriction[] = [];
    restrictions.forEach((item) => {
      if (item.type === 'allergen' || item.type === 'alergeno') {
        allergens.push(item);
      } else {
        diets.push(item);
      }
    });
    return { allergens, diets };
  }, [restrictionsQuery.data]);

  const toggleRestriction = (id: string) => {
    setError('');
    setSuccess(false);
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

  const isDirty = useMemo(() => !setsEqual(selectedIds, initialIds), [initialIds, selectedIds]);

  useEffect(() => {
    if (!userRestrictionsQuery.data) return;
    if (isDirty) return;
    const next = new Set(userRestrictionsQuery.data.restriction_ids ?? []);
    setSelectedIds(next);
    setInitialIds(next);
  }, [isDirty, userRestrictionsQuery.data, userRestrictionsQuery.dataUpdatedAt]);

  const handleSave = () => {
    if (!session?.access_token) {
      router.replace('/auth/login');
      return;
    }
    saveMutation.mutate(Array.from(selectedIds));
  };

  const loadErrorMessage = useMemo(() => {
    if (restrictionsQuery.error) {
      return getErrorMessage(restrictionsQuery.error, t('dietary.loadError'));
    }
    if (userRestrictionsQuery.error) {
      return getErrorMessage(userRestrictionsQuery.error, t('dietary.loadError'));
    }
    return '';
  }, [restrictionsQuery.error, t, userRestrictionsQuery.error]);

  const saving = (saveMutation as { isPending?: boolean; isLoading?: boolean }).isPending
    ?? saveMutation.isLoading;
  const loading = restrictionsQuery.isLoading || userRestrictionsQuery.isLoading;
  const canSave = !loading && !saving && isDirty;

  useEffect(() => {
    if (authLoading) return;
    if (!session?.access_token) {
      router.replace('/auth/login');
      return;
    }
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
        {error || loadErrorMessage ? (
          <View
            style={[
              styles.messageBox,
              { backgroundColor: `${colors.error}20`, borderColor: `${colors.error}40` },
            ]}
          >
            <ThemedText style={[styles.messageText, { color: colors.error }]}>
              {error || loadErrorMessage}
            </ThemedText>
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
          style={[styles.saveButton, { backgroundColor: colors.primary }, !canSave && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={!canSave}
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
