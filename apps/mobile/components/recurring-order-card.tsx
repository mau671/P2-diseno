import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useThemePreference } from '@/context/theme-preference';

type RecurringOrder = {
  id: string;
  interval_unit: string;
  interval_value: number;
  days_of_week: number[];
  days_of_month: number[];
  time_windows: { start: string; end: string }[];
  next_run_at?: string | null;
  status: string;
};

type RecurringOrderCardProps = {
  recurring: RecurringOrder;
  onPause?: (id: string) => void;
  onResume?: (id: string) => void;
  onRunNow?: (id: string) => void;
  onSkip?: (id: string) => void;
  onCancel?: (id: string) => void;
  onEdit?: (id: string) => void;
};

function RecurringOrderCardComponent({
  recurring,
  onPause,
  onResume,
  onRunNow,
  onSkip,
  onCancel,
  onEdit,
}: RecurringOrderCardProps) {
  const { t } = useTranslation();
  const { resolvedScheme } = useThemePreference();
  const colors = Colors[resolvedScheme];

  const unitLabel = (() => {
    const isPlural = Number(recurring.interval_value) !== 1;
    switch (recurring.interval_unit) {
      case 'day':
        return isPlural
          ? t('recurringOrders.unitDays', { defaultValue: 'days' })
          : t('recurringOrders.unitDay', { defaultValue: 'day' });
      case 'month':
        return isPlural
          ? t('recurringOrders.unitMonths', { defaultValue: 'months' })
          : t('recurringOrders.unitMonth', { defaultValue: 'month' });
      case 'week':
      default:
        return isPlural
          ? t('recurringOrders.unitWeeks', { defaultValue: 'weeks' })
          : t('recurringOrders.unitWeek', { defaultValue: 'week' });
    }
  })();

  const everyLabel = t('recurringOrders.everyInterval', {
    defaultValue: 'Every {{count}} {{unit}}',
    count: recurring.interval_value,
    unit: unitLabel,
  });

  const weekdayLabels = [
    t('recurringOrders.weekdaySun', { defaultValue: 'Sun' }),
    t('recurringOrders.weekdayMon', { defaultValue: 'Mon' }),
    t('recurringOrders.weekdayTue', { defaultValue: 'Tue' }),
    t('recurringOrders.weekdayWed', { defaultValue: 'Wed' }),
    t('recurringOrders.weekdayThu', { defaultValue: 'Thu' }),
    t('recurringOrders.weekdayFri', { defaultValue: 'Fri' }),
    t('recurringOrders.weekdaySat', { defaultValue: 'Sat' }),
  ];

  const daysLabel = (() => {
    if (recurring.interval_unit === 'week' && recurring.days_of_week?.length) {
      const labels = [...recurring.days_of_week].sort((a, b) => a - b).map((day) => weekdayLabels[day]);
      return labels.join(', ');
    }
    if (recurring.interval_unit === 'month' && recurring.days_of_month?.length) {
      const labels = [...recurring.days_of_month].sort((a, b) => a - b).join(', ');
      return t('recurringOrders.monthDaysLabel', { defaultValue: 'Days {{days}}', days: labels });
    }
    return '';
  })();

  const timeWindowsLabel = recurring.time_windows?.length
    ? recurring.time_windows.map((window) => `${window.start}-${window.end}`).join(', ')
    : '';

  const nextRunLabel = recurring.next_run_at
    ? t('recurringOrders.nextRunValue', {
        defaultValue: 'Next: {{date}}',
        date: new Date(recurring.next_run_at).toLocaleString(),
      })
    : '';

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <ThemedText style={styles.sectionTitle}>{everyLabel}</ThemedText>
      {daysLabel ? (
        <ThemedText style={[styles.subText, { color: colors.icon }]}>{daysLabel}</ThemedText>
      ) : null}
      {timeWindowsLabel ? (
        <ThemedText style={[styles.subText, { color: colors.icon }]}>{timeWindowsLabel}</ThemedText>
      ) : null}
      {nextRunLabel ? (
        <ThemedText style={[styles.subText, { color: colors.icon }]}>{nextRunLabel}</ThemedText>
      ) : null}
      <ThemedText style={[styles.subText, { color: colors.icon }]}>
        {recurring.status}
      </ThemedText>
      <View style={styles.actionsRow}>
        {recurring.status === 'paused' ? (
          <Pressable
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => onResume?.(recurring.id)}
          >
            {({ pressed }) => (
              <ThemedText
                style={[
                  styles.actionText,
                  { color: colors.primaryText, opacity: pressed ? 0.6 : 1 },
                ]}
              >
                {t('recurringOrders.resume', { defaultValue: 'Reanudar' })}
              </ThemedText>
            )}
          </Pressable>
        ) : (
          <Pressable
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => onPause?.(recurring.id)}
          >
            {({ pressed }) => (
              <ThemedText
                style={[
                  styles.actionText,
                  { color: colors.primaryText, opacity: pressed ? 0.6 : 1 },
                ]}
              >
                {t('recurringOrders.pause')}
              </ThemedText>
            )}
          </Pressable>
        )}
        <Pressable
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => onRunNow?.(recurring.id)}
        >
          {({ pressed }) => (
            <ThemedText
              style={[
                styles.actionText,
                { color: colors.primaryText, opacity: pressed ? 0.6 : 1 },
              ]}
            >
              {t('recurringOrders.runNow')}
            </ThemedText>
          )}
        </Pressable>
        <Pressable
          style={[styles.actionButton, { backgroundColor: colors.secondary }]}
          onPress={() => onSkip?.(recurring.id)}
        >
          {({ pressed }) => (
            <ThemedText
              style={[
                styles.actionText,
                { color: colors.text, opacity: pressed ? 0.6 : 1 },
              ]}
            >
              {t('recurringOrders.skip', { defaultValue: 'Saltar' })}
            </ThemedText>
          )}
        </Pressable>
        <Pressable
          style={[styles.actionButton, { backgroundColor: colors.secondary }]}
          onPress={() => onEdit?.(recurring.id)}
        >
          {({ pressed }) => (
            <ThemedText
              style={[
                styles.actionText,
                { color: colors.text, opacity: pressed ? 0.6 : 1 },
              ]}
            >
              {t('common.edit', { defaultValue: 'Editar' })}
            </ThemedText>
          )}
        </Pressable>
        <Pressable
          style={[styles.actionButton, { backgroundColor: colors.error }]}
          onPress={() => onCancel?.(recurring.id)}
        >
          {({ pressed }) => (
            <ThemedText
              style={[
                styles.actionText,
                { color: 'white', opacity: pressed ? 0.6 : 1 },
              ]}
            >
              {t('recurringOrders.cancel', { defaultValue: 'Cancelar' })}
            </ThemedText>
          )}
        </Pressable>
      </View>
    </View>
  );
}

export const RecurringOrderCard = React.memo(RecurringOrderCardComponent);

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
  subText: { fontSize: 13 },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  actionButton: { borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10 },
  actionText: { fontSize: 13, fontWeight: '600' },
});
