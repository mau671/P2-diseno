import { Pressable, StyleSheet, View, TextInput, Platform, ScrollView, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useMemo, useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import DatePicker, { useDefaultStyles } from 'react-native-ui-datepicker';
import {
  useDeleteRecurringOrder,
  useRecurringOrders,
  useRunRecurringOrder,
  useSkipRecurringOrder,
  useUpdateRecurringOrder,
  useUpdateRecurringOrderStatus
} from '@/hooks/use-recurring-orders';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useThemePreference } from '@/context/theme-preference';
import { useAuth } from '@/hooks/use-auth';
import { RecurringOrderCard } from '@/components/recurring-order-card';
import { useSavedMeals, useCreateRecurringFromSavedMeal } from '@/hooks/use-saved-meals';
import { useAddresses } from '@/hooks/use-addresses';
import { usePaymentMethods } from '@/hooks/use-payment-methods';

export default function RecurringOrdersScreen() {
  const { t } = useTranslation();
  const { resolvedScheme } = useThemePreference();
  const colors = Colors[resolvedScheme];
  const { session } = useAuth();
  const accessToken = session?.access_token;
  const recurringQuery = useRecurringOrders(accessToken);
  const updateStatus = useUpdateRecurringOrderStatus(accessToken);
  const runNow = useRunRecurringOrder(accessToken);
  const skipRecurring = useSkipRecurringOrder(accessToken);
  const deleteRecurring = useDeleteRecurringOrder(accessToken);
  const updateRecurring = useUpdateRecurringOrder(accessToken);
  const savedMealsQuery = useSavedMeals(accessToken);
  const createRecurringFromSavedMeal = useCreateRecurringFromSavedMeal(accessToken);
  const addressesQuery = useAddresses(accessToken);
  const paymentMethodsQuery = usePaymentMethods(accessToken);

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedSavedMealId, setSelectedSavedMealId] = useState<string | null>(null);
  const [intervalUnit, setIntervalUnit] = useState<'day' | 'week' | 'month'>('week');
  const [intervalValue, setIntervalValue] = useState('1');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [daysOfMonth, setDaysOfMonth] = useState<number[]>([]);
  const [timeWindows, setTimeWindows] = useState<{ start: string; end: string }[]>([
    { start: '11:00', end: '14:00' },
  ]);
  const [nextRunDate, setNextRunDate] = useState('');
  const [nextRunTime, setNextRunTime] = useState('');
  const [deliveryAddressId, setDeliveryAddressId] = useState<string | null>(null);
  const [paymentMethodId, setPaymentMethodId] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editIntervalUnit, setEditIntervalUnit] = useState<'day' | 'week' | 'month'>('week');
  const [editIntervalValue, setEditIntervalValue] = useState('1');
  const [editDaysOfWeek, setEditDaysOfWeek] = useState<number[]>([]);
  const [editDaysOfMonth, setEditDaysOfMonth] = useState<number[]>([]);
  const [editTimeWindows, setEditTimeWindows] = useState<{ start: string; end: string }[]>([
    { start: '11:00', end: '14:00' },
  ]);
  const [editNextRunDate, setEditNextRunDate] = useState('');
  const [editNextRunTime, setEditNextRunTime] = useState('');
  const [editAddressId, setEditAddressId] = useState<string | null>(null);
  const [editPaymentId, setEditPaymentId] = useState<string | null>(null);
  const [showCreateDatePicker, setShowCreateDatePicker] = useState(false);
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);
  const [showCreateTimePicker, setShowCreateTimePicker] = useState(false);
  const [showEditTimePicker, setShowEditTimePicker] = useState(false);

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

  const weekdayOptions = useMemo(
    () => [
      { value: 0, label: t('recurringOrders.weekdaySun', { defaultValue: 'Sun' }) },
      { value: 1, label: t('recurringOrders.weekdayMon', { defaultValue: 'Mon' }) },
      { value: 2, label: t('recurringOrders.weekdayTue', { defaultValue: 'Tue' }) },
      { value: 3, label: t('recurringOrders.weekdayWed', { defaultValue: 'Wed' }) },
      { value: 4, label: t('recurringOrders.weekdayThu', { defaultValue: 'Thu' }) },
      { value: 5, label: t('recurringOrders.weekdayFri', { defaultValue: 'Fri' }) },
      { value: 6, label: t('recurringOrders.weekdaySat', { defaultValue: 'Sat' }) },
    ],
    [t]
  );

  const monthDayOptions = useMemo(() => Array.from({ length: 31 }, (_, index) => index + 1), []);

  const parseTimeToMinutes = (value: string) => {
    const match = value.match(/^(\d{2}):(\d{2})$/);
    if (!match) return null;
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (Number.isNaN(hours) || Number.isNaN(minutes) || hours > 23 || minutes > 59) return null;
    return hours * 60 + minutes;
  };

  const toDateParts = (value?: string | null) => {
    if (!value) return { date: '', time: '' };
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return { date: '', time: '' };
    const date = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(
      parsed.getDate()
    ).padStart(2, '0')}`;
    const time = `${String(parsed.getHours()).padStart(2, '0')}:${String(parsed.getMinutes()).padStart(2, '0')}`;
    return { date, time };
  };

  const buildNextRunAt = (date: string, time: string) => {
    if (!date || !time) return '';
    const combined = new Date(`${date}T${time}:00`);
    if (Number.isNaN(combined.getTime())) return '';
    return combined.toISOString();
  };

  const normalizeTimeWindowsInput = (windows: { start: string; end: string }[]) =>
    windows
      .map((window) => ({ start: window.start.trim(), end: window.end.trim() }))
      .filter((window) => {
        const startMinutes = parseTimeToMinutes(window.start);
        const endMinutes = parseTimeToMinutes(window.end);
        return startMinutes !== null && endMinutes !== null && startMinutes < endMinutes;
      });

  const isTimeWithinWindows = (time: string, windows: { start: string; end: string }[]) => {
    const minutes = parseTimeToMinutes(time);
    if (minutes === null) return false;
    return windows.some((window) => {
      const startMinutes = parseTimeToMinutes(window.start);
      const endMinutes = parseTimeToMinutes(window.end);
      if (startMinutes === null || endMinutes === null) return false;
      return minutes >= startMinutes && minutes <= endMinutes;
    });
  };

  const addMinutesToTime = (time: string, minutesToAdd: number) => {
    const baseMinutes = parseTimeToMinutes(time);
    if (baseMinutes === null) return time;
    const total = Math.min(23 * 60 + 59, baseMinutes + minutesToAdd);
    const hours = Math.floor(total / 60);
    const minutes = total % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const toggleWeekdayValue = (value: number, setter: (fn: (prev: number[]) => number[]) => void) => {
    setter((prev) => {
      if (prev.includes(value)) return prev.filter((item) => item !== value);
      return [...prev, value].sort((a, b) => a - b);
    });
  };

  const toggleMonthdayValue = (value: number, setter: (fn: (prev: number[]) => number[]) => void) => {
    setter((prev) => {
      if (prev.includes(value)) return prev.filter((item) => item !== value);
      return [...prev, value].sort((a, b) => a - b);
    });
  };

  const applyTimeToWindows = (
    time: string,
    windows: { start: string; end: string }[],
    setter: (value: { start: string; end: string }[]) => void
  ) => {
    if (!time) return;
    const normalized = normalizeTimeWindowsInput(windows);
    if (!normalized.length || !isTimeWithinWindows(time, normalized)) {
      const nextWindow = { start: time, end: addMinutesToTime(time, 60) };
      setter(windows.length ? [nextWindow, ...windows.slice(1)] : [nextWindow]);
    }
  };

  const updateTimeWindow = (
    index: number,
    field: 'start' | 'end',
    value: string,
    setter: (fn: (prev: { start: string; end: string }[]) => { start: string; end: string }[]) => void
  ) => {
    setter((prev) =>
      prev.map((window, idx) => (idx === index ? { ...window, [field]: value } : window))
    );
  };

  const removeTimeWindow = (
    index: number,
    setter: (fn: (prev: { start: string; end: string }[]) => { start: string; end: string }[]) => void
  ) => {
    setter((prev) => prev.filter((_, idx) => idx !== index));
  };

  const addTimeWindow = (
    setter: (fn: (prev: { start: string; end: string }[]) => { start: string; end: string }[]) => void
  ) => {
    setter((prev) => [...prev, { start: '', end: '' }]);
  };

  const renderRecurring = ({ item }: { item: NonNullable<typeof recurringQuery.data>['recurring_orders'][0] }) => (
    <RecurringOrderCard
      recurring={item}
      onPause={(id) => updateStatus.mutate({ id, status: 'paused' })}
      onResume={(id) => updateStatus.mutate({ id, status: 'active' })}
      onRunNow={(id) => runNow.mutate(id)}
      onSkip={(id) => skipRecurring.mutate(id)}
      onCancel={(id) => deleteRecurring.mutate(id)}
      onEdit={(id) => {
        const current = recurringQuery.data?.recurring_orders.find((row) => row.id === id);
        if (!current) return;
        const { date, time } = toDateParts(current.next_run_at);
        setEditingId(id);
        setEditIntervalUnit((current.interval_unit as 'day' | 'week' | 'month') ?? 'week');
        setEditIntervalValue(String(current.interval_value ?? 1));
        setEditDaysOfWeek(current.days_of_week ?? []);
        setEditDaysOfMonth(current.days_of_month ?? []);
        setEditTimeWindows(
          current.time_windows && current.time_windows.length
            ? current.time_windows
            : [{ start: '11:00', end: '14:00' }]
        );
        setEditNextRunDate(date);
        setEditNextRunTime(time);
        setEditAddressId(current.delivery_address_id ?? null);
        setEditPaymentId(current.payment_method_id ?? null);
      }}
    />
  );

  const handleCreateRecurring = () => {
    const nextRunAt = buildNextRunAt(nextRunDate, nextRunTime);
    if (!selectedSavedMealId || !nextRunAt) return;
    const normalizedTimeWindows = normalizeTimeWindowsInput(timeWindows);
    createRecurringFromSavedMeal.mutate({
      id: selectedSavedMealId,
      params: {
        interval_unit: intervalUnit,
        interval_value: Number(intervalValue),
        days_of_week: daysOfWeek,
        days_of_month: daysOfMonth,
        time_windows: normalizedTimeWindows,
        next_run_at: nextRunAt,
        delivery_address_id: deliveryAddressId ?? undefined,
        payment_method_id: paymentMethodId ?? undefined,
        currency_code: 'CRC'
      }
    }, {
      onSuccess: () => {
        setCreateOpen(false);
        setSelectedSavedMealId(null);
        setNextRunDate('');
        setNextRunTime('');
      }
    });
  };

  const handleUpdateRecurring = () => {
    const nextRunAt = buildNextRunAt(editNextRunDate, editNextRunTime);
    if (!editingId || !nextRunAt) return;
    const normalizedTimeWindows = normalizeTimeWindowsInput(editTimeWindows);
    updateRecurring.mutate({
      id: editingId,
      params: {
        interval_unit: editIntervalUnit,
        interval_value: Number(editIntervalValue),
        days_of_week: editDaysOfWeek,
        days_of_month: editDaysOfMonth,
        time_windows: normalizedTimeWindows,
        next_run_at: nextRunAt,
        delivery_address_id: editAddressId ?? null,
        payment_method_id: editPaymentId ?? null
      }
    }, {
      onSuccess: () => setEditingId(null)
    });
  };

  const normalizedCreateWindows = normalizeTimeWindowsInput(timeWindows);
  const createTimeMatches = nextRunTime ? isTimeWithinWindows(nextRunTime, normalizedCreateWindows) : false;
  const createScheduleValid =
    Number(intervalValue) > 0 &&
    (intervalUnit !== 'week' || daysOfWeek.length > 0) &&
    (intervalUnit !== 'month' || daysOfMonth.length > 0) &&
    normalizedCreateWindows.length > 0;
  const canCreate =
    !!selectedSavedMealId && !!buildNextRunAt(nextRunDate, nextRunTime) && createScheduleValid && createTimeMatches;

  const normalizedEditWindows = normalizeTimeWindowsInput(editTimeWindows);
  const editTimeMatches = editNextRunTime ? isTimeWithinWindows(editNextRunTime, normalizedEditWindows) : false;
  const editScheduleValid =
    Number(editIntervalValue) > 0 &&
    (editIntervalUnit !== 'week' || editDaysOfWeek.length > 0) &&
    (editIntervalUnit !== 'month' || editDaysOfMonth.length > 0) &&
    normalizedEditWindows.length > 0;
  const canUpdate =
    !!editingId && !!buildNextRunAt(editNextRunDate, editNextRunTime) && editScheduleValid && editTimeMatches;

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.5 : 1 }]}
        >
          <IconSymbol name="chevron.left" size={20} color={colors.text} />
        </Pressable>
        <ThemedText type="title">{t('recurringOrders.title')}</ThemedText>
      </View>

      <View style={styles.sectionHeaderRow}>
        <ThemedText style={styles.sectionTitle}>
          {t('recurringOrders.create', { defaultValue: 'Crear recurrencia' })}
        </ThemedText>
        <Pressable onPress={() => setCreateOpen((open) => !open)} style={styles.linkButton}>
          <ThemedText style={[styles.linkText, { color: colors.primary }]}>
            {createOpen
              ? t('common.cancel', { defaultValue: 'Cancelar' })
              : t('recurringOrders.add', { defaultValue: 'Agregar' })}
          </ThemedText>
        </Pressable>
      </View>
      {createOpen ? (
        <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <ThemedText style={styles.formLabel}>
            {t('recurringOrders.savedMeal', { defaultValue: 'Comida guardada' })}
          </ThemedText>
          {(savedMealsQuery.data?.saved_meals ?? []).map((meal) => (
            <Pressable
              key={meal.id}
              onPress={() => setSelectedSavedMealId(meal.id)}
              style={[styles.optionRow, { borderColor: colors.cardBorder }]}
            >
              <ThemedText>{meal.name}</ThemedText>
              {selectedSavedMealId === meal.id ? (
                <IconSymbol name="checkmark" size={16} color={colors.primary} />
              ) : null}
            </Pressable>
          ))}
          <ThemedText style={styles.formLabel}>
            {t('recurringOrders.intervalUnit', { defaultValue: 'Intervalo' })}
          </ThemedText>
          {['day', 'week', 'month'].map((item) => (
            <Pressable
              key={item}
              onPress={() => {
                setIntervalUnit(item as 'day' | 'week' | 'month');
                if (item === 'week' && daysOfWeek.length === 0) {
                  const baseDate = nextRunDate ? new Date(nextRunDate) : new Date();
                  setDaysOfWeek([baseDate.getDay()]);
                }
                if (item === 'month' && daysOfMonth.length === 0) {
                  const baseDate = nextRunDate ? new Date(nextRunDate) : new Date();
                  setDaysOfMonth([baseDate.getDate()]);
                }
              }}
              style={[styles.optionRow, { borderColor: colors.cardBorder }]}
            >
              <ThemedText>
                {item === 'day'
                  ? t('recurringOrders.intervalDay', { defaultValue: 'Diario' })
                  : item === 'week'
                    ? t('recurringOrders.intervalWeek', { defaultValue: 'Semanal' })
                    : t('recurringOrders.intervalMonth', { defaultValue: 'Mensual' })}
              </ThemedText>
              {intervalUnit === item ? (
                <IconSymbol name="checkmark" size={16} color={colors.primary} />
              ) : null}
            </Pressable>
          ))}
          <ThemedText style={styles.formLabel}>
            {t('recurringOrders.intervalValue', { defaultValue: 'Cada' })}
          </ThemedText>
          <TextInput
            style={[styles.input, { borderColor: colors.cardBorder, color: colors.text }]}
            placeholder={t('recurringOrders.intervalValuePlaceholder', { defaultValue: '1' })}
            placeholderTextColor={colors.icon}
            keyboardType="number-pad"
            value={intervalValue}
            onChangeText={(value) => setIntervalValue(value.replace(/[^0-9]/g, ''))}
          />
          {intervalUnit === 'week' ? (
            <View style={styles.selectGroup}>
              <ThemedText style={styles.formLabel}>
                {t('recurringOrders.daysOfWeek', { defaultValue: 'Dias de la semana' })}
              </ThemedText>
              <View style={styles.chipWrap}>
                {weekdayOptions.map((option) => (
                  <Pressable
                    key={`weekday-${option.value}`}
                    onPress={() => toggleWeekdayValue(option.value, setDaysOfWeek)}
                    style={[
                      styles.chip,
                      {
                        borderColor: daysOfWeek.includes(option.value) ? colors.primary : colors.cardBorder,
                        backgroundColor: daysOfWeek.includes(option.value) ? colors.secondary : colors.card,
                      },
                    ]}
                  >
                    <ThemedText style={styles.chipText}>{option.label}</ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
          {intervalUnit === 'month' ? (
            <View style={styles.selectGroup}>
              <ThemedText style={styles.formLabel}>
                {t('recurringOrders.daysOfMonth', { defaultValue: 'Dias del mes' })}
              </ThemedText>
              <View style={styles.chipWrap}>
                {monthDayOptions.map((day) => (
                  <Pressable
                    key={`monthday-${day}`}
                    onPress={() => toggleMonthdayValue(day, setDaysOfMonth)}
                    style={[
                      styles.chip,
                      {
                        borderColor: daysOfMonth.includes(day) ? colors.primary : colors.cardBorder,
                        backgroundColor: daysOfMonth.includes(day) ? colors.secondary : colors.card,
                      },
                    ]}
                  >
                    <ThemedText style={styles.chipText}>{day}</ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
          <ThemedText style={styles.formLabel}>
            {t('recurringOrders.timeWindows', { defaultValue: 'Ventanas horarias' })}
          </ThemedText>
          {timeWindows.map((window, index) => (
            <View key={`time-window-${index}`} style={styles.timeWindowRow}>
              <TextInput
                style={[styles.timeInput, { borderColor: colors.cardBorder, color: colors.text }]}
                placeholder="HH:mm"
                placeholderTextColor={colors.icon}
                value={window.start}
                onChangeText={(value) => updateTimeWindow(index, 'start', value, setTimeWindows)}
              />
              <TextInput
                style={[styles.timeInput, { borderColor: colors.cardBorder, color: colors.text }]}
                placeholder="HH:mm"
                placeholderTextColor={colors.icon}
                value={window.end}
                onChangeText={(value) => updateTimeWindow(index, 'end', value, setTimeWindows)}
              />
              {timeWindows.length > 1 ? (
                <Pressable
                  onPress={() => removeTimeWindow(index, setTimeWindows)}
                  style={[styles.removeButton, { borderColor: colors.cardBorder }]}
                >
                  <ThemedText style={[styles.removeButtonText, { color: colors.icon }]}>×</ThemedText>
                </Pressable>
              ) : null}
            </View>
          ))}
          <Pressable onPress={() => addTimeWindow(setTimeWindows)} style={styles.linkButton}>
            <ThemedText style={[styles.linkText, { color: colors.primary }]}>
              {t('recurringOrders.addWindow', { defaultValue: 'Agregar ventana' })}
            </ThemedText>
          </Pressable>
          {nextRunTime && !createTimeMatches ? (
            <ThemedText style={[styles.warningText, { color: colors.error }]}>
              {t('recurringOrders.timeWindowMismatch', { defaultValue: 'La hora no esta dentro de una ventana' })}
            </ThemedText>
          ) : null}
          <Pressable
            onPress={() => setShowCreateDatePicker(true)}
            style={[styles.selectRow, { borderColor: colors.cardBorder, backgroundColor: colors.card }]}
          >
            <View>
              <ThemedText style={styles.selectLabel}>
                {t('recurringOrders.nextRunLabel', { defaultValue: 'Primera entrega' })}
              </ThemedText>
              <ThemedText style={[styles.selectValue, { color: nextRunDate ? colors.text : colors.icon }]}>
                {nextRunDate || t('recurringOrders.selectDate', { defaultValue: 'Selecciona una fecha' })}
              </ThemedText>
            </View>
            <IconSymbol name="calendar" size={18} color={colors.icon} />
          </Pressable>
          {showCreateDatePicker && Platform.OS !== 'web' ? (
            <DateTimePicker
              value={nextRunDate ? new Date(nextRunDate) : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_, selectedDate) => {
                setShowCreateDatePicker(false);
                if (!selectedDate) return;
                const iso = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(
                  selectedDate.getDate()
                ).padStart(2, '0')}`;
                setNextRunDate(iso);
                if (intervalUnit === 'week') {
                  const day = selectedDate.getDay();
                  if (!daysOfWeek.includes(day)) setDaysOfWeek((prev) => [...prev, day].sort((a, b) => a - b));
                }
                if (intervalUnit === 'month') {
                  const day = selectedDate.getDate();
                  if (!daysOfMonth.includes(day)) setDaysOfMonth((prev) => [...prev, day].sort((a, b) => a - b));
                }
              }}
            />
          ) : null}
          {showCreateDatePicker && Platform.OS === 'web' ? (
            <View style={[styles.webOverlay, { backgroundColor: colors.overlay }]}>
              <View style={[styles.webPickerCard, { borderColor: colors.cardBorder, backgroundColor: colors.card }]}>
                <DatePicker
                  mode="single"
                  date={nextRunDate ? new Date(nextRunDate) : new Date()}
                  onChange={({ date }) => {
                    if (!date) return;
                    const selectedDate = new Date(date);
                    const iso = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(
                      selectedDate.getDate()
                    ).padStart(2, '0')}`;
                    setNextRunDate(iso);
                    if (intervalUnit === 'week') {
                      const day = selectedDate.getDay();
                      if (!daysOfWeek.includes(day)) setDaysOfWeek((prev) => [...prev, day].sort((a, b) => a - b));
                    }
                    if (intervalUnit === 'month') {
                      const day = selectedDate.getDate();
                      if (!daysOfMonth.includes(day)) setDaysOfMonth((prev) => [...prev, day].sort((a, b) => a - b));
                    }
                    setShowCreateDatePicker(false);
                  }}
                  styles={datepickerStyles}
                />
                <Pressable onPress={() => setShowCreateDatePicker(false)} style={styles.webPickerClose}>
                  <ThemedText style={[styles.webPickerCloseText, { color: colors.primary }]}>
                    {t('common.close', { defaultValue: 'Cerrar' })}
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          ) : null}
          <Pressable
            onPress={() => setShowCreateTimePicker(true)}
            style={[styles.selectRow, { borderColor: colors.cardBorder, backgroundColor: colors.card }]}
          >
            <View>
              <ThemedText style={styles.selectLabel}>
                {t('recurringOrders.firstTimeLabel', { defaultValue: 'Hora de entrega' })}
              </ThemedText>
              <ThemedText style={[styles.selectValue, { color: nextRunTime ? colors.text : colors.icon }]}>
                {nextRunTime || t('recurringOrders.selectTime', { defaultValue: 'Selecciona una hora' })}
              </ThemedText>
            </View>
            <IconSymbol name="clock" size={18} color={colors.icon} />
          </Pressable>
          {showCreateTimePicker && Platform.OS !== 'web' ? (
            <DateTimePicker
              value={nextRunTime ? new Date(`1970-01-01T${nextRunTime}:00`) : new Date()}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_, selectedDate) => {
                setShowCreateTimePicker(false);
                if (!selectedDate) return;
                const time = `${String(selectedDate.getHours()).padStart(2, '0')}:${String(
                  selectedDate.getMinutes()
                ).padStart(2, '0')}`;
                setNextRunTime(time);
                applyTimeToWindows(time, timeWindows, setTimeWindows);
              }}
            />
          ) : null}
          {showCreateTimePicker && Platform.OS === 'web' ? (
            <View style={[styles.webTimeCard, { borderColor: colors.cardBorder, backgroundColor: colors.card }]}>
              <TextInput
                style={[styles.timeInput, { borderColor: colors.cardBorder, color: colors.text }]}
                placeholder="HH:mm"
                placeholderTextColor={colors.icon}
                value={nextRunTime}
                onChangeText={(value) => {
                  setNextRunTime(value);
                  applyTimeToWindows(value, timeWindows, setTimeWindows);
                }}
              />
              <Pressable onPress={() => setShowCreateTimePicker(false)} style={styles.webPickerClose}>
                <ThemedText style={[styles.webPickerCloseText, { color: colors.primary }]}>
                  {t('common.close', { defaultValue: 'Cerrar' })}
                </ThemedText>
              </Pressable>
            </View>
          ) : null}
          <ThemedText style={styles.formLabel}>
            {t('recurringOrders.address', { defaultValue: 'Direccion' })}
          </ThemedText>
          {(addressesQuery.data?.addresses ?? []).map((addr) => (
            <Pressable
              key={addr.id}
              onPress={() => setDeliveryAddressId(addr.id)}
              style={[styles.optionRow, { borderColor: colors.cardBorder }]}
            >
              <ThemedText>{addr.label || addr.address.line1}</ThemedText>
              {deliveryAddressId === addr.id ? (
                <IconSymbol name="checkmark" size={16} color={colors.primary} />
              ) : null}
            </Pressable>
          ))}
          <ThemedText style={styles.formLabel}>
            {t('recurringOrders.payment', { defaultValue: 'Metodo de pago' })}
          </ThemedText>
          {(paymentMethodsQuery.data?.payment_methods ?? []).map((method) => (
            <Pressable
              key={method.id}
              onPress={() => setPaymentMethodId(method.id)}
              style={[styles.optionRow, { borderColor: colors.cardBorder }]}
            >
              <ThemedText>{method.name}</ThemedText>
              {paymentMethodId === method.id ? (
                <IconSymbol name="checkmark" size={16} color={colors.primary} />
              ) : null}
            </Pressable>
          ))}
          <Pressable
            onPress={handleCreateRecurring}
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            disabled={!canCreate}
          >
            <ThemedText style={{ color: colors.primaryText, fontWeight: '600' }}>
              {t('recurringOrders.createAction', { defaultValue: 'Crear' })}
            </ThemedText>
          </Pressable>
        </View>
      ) : null}

      {editingId ? (
        <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <ThemedText style={styles.sectionTitle}>
            {t('recurringOrders.edit', { defaultValue: 'Editar recurrencia' })}
          </ThemedText>
          <ThemedText style={styles.formLabel}>
            {t('recurringOrders.intervalUnit', { defaultValue: 'Intervalo' })}
          </ThemedText>
          {['day', 'week', 'month'].map((item) => (
            <Pressable
              key={item}
              onPress={() => {
                setEditIntervalUnit(item as 'day' | 'week' | 'month');
                if (item === 'week' && editDaysOfWeek.length === 0) {
                  const baseDate = editNextRunDate ? new Date(editNextRunDate) : new Date();
                  setEditDaysOfWeek([baseDate.getDay()]);
                }
                if (item === 'month' && editDaysOfMonth.length === 0) {
                  const baseDate = editNextRunDate ? new Date(editNextRunDate) : new Date();
                  setEditDaysOfMonth([baseDate.getDate()]);
                }
              }}
              style={[styles.optionRow, { borderColor: colors.cardBorder }]}
            >
              <ThemedText>
                {item === 'day'
                  ? t('recurringOrders.intervalDay', { defaultValue: 'Diario' })
                  : item === 'week'
                    ? t('recurringOrders.intervalWeek', { defaultValue: 'Semanal' })
                    : t('recurringOrders.intervalMonth', { defaultValue: 'Mensual' })}
              </ThemedText>
              {editIntervalUnit === item ? (
                <IconSymbol name="checkmark" size={16} color={colors.primary} />
              ) : null}
            </Pressable>
          ))}
          <ThemedText style={styles.formLabel}>
            {t('recurringOrders.intervalValue', { defaultValue: 'Cada' })}
          </ThemedText>
          <TextInput
            style={[styles.input, { borderColor: colors.cardBorder, color: colors.text }]}
            placeholder={t('recurringOrders.intervalValuePlaceholder', { defaultValue: '1' })}
            placeholderTextColor={colors.icon}
            keyboardType="number-pad"
            value={editIntervalValue}
            onChangeText={(value) => setEditIntervalValue(value.replace(/[^0-9]/g, ''))}
          />
          {editIntervalUnit === 'week' ? (
            <View style={styles.selectGroup}>
              <ThemedText style={styles.formLabel}>
                {t('recurringOrders.daysOfWeek', { defaultValue: 'Dias de la semana' })}
              </ThemedText>
              <View style={styles.chipWrap}>
                {weekdayOptions.map((option) => (
                  <Pressable
                    key={`edit-weekday-${option.value}`}
                    onPress={() => toggleWeekdayValue(option.value, setEditDaysOfWeek)}
                    style={[
                      styles.chip,
                      {
                        borderColor: editDaysOfWeek.includes(option.value) ? colors.primary : colors.cardBorder,
                        backgroundColor: editDaysOfWeek.includes(option.value) ? colors.secondary : colors.card,
                      },
                    ]}
                  >
                    <ThemedText style={styles.chipText}>{option.label}</ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
          {editIntervalUnit === 'month' ? (
            <View style={styles.selectGroup}>
              <ThemedText style={styles.formLabel}>
                {t('recurringOrders.daysOfMonth', { defaultValue: 'Dias del mes' })}
              </ThemedText>
              <View style={styles.chipWrap}>
                {monthDayOptions.map((day) => (
                  <Pressable
                    key={`edit-monthday-${day}`}
                    onPress={() => toggleMonthdayValue(day, setEditDaysOfMonth)}
                    style={[
                      styles.chip,
                      {
                        borderColor: editDaysOfMonth.includes(day) ? colors.primary : colors.cardBorder,
                        backgroundColor: editDaysOfMonth.includes(day) ? colors.secondary : colors.card,
                      },
                    ]}
                  >
                    <ThemedText style={styles.chipText}>{day}</ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
          <ThemedText style={styles.formLabel}>
            {t('recurringOrders.timeWindows', { defaultValue: 'Ventanas horarias' })}
          </ThemedText>
          {editTimeWindows.map((window, index) => (
            <View key={`edit-time-window-${index}`} style={styles.timeWindowRow}>
              <TextInput
                style={[styles.timeInput, { borderColor: colors.cardBorder, color: colors.text }]}
                placeholder="HH:mm"
                placeholderTextColor={colors.icon}
                value={window.start}
                onChangeText={(value) => updateTimeWindow(index, 'start', value, setEditTimeWindows)}
              />
              <TextInput
                style={[styles.timeInput, { borderColor: colors.cardBorder, color: colors.text }]}
                placeholder="HH:mm"
                placeholderTextColor={colors.icon}
                value={window.end}
                onChangeText={(value) => updateTimeWindow(index, 'end', value, setEditTimeWindows)}
              />
              {editTimeWindows.length > 1 ? (
                <Pressable
                  onPress={() => removeTimeWindow(index, setEditTimeWindows)}
                  style={[styles.removeButton, { borderColor: colors.cardBorder }]}
                >
                  <ThemedText style={[styles.removeButtonText, { color: colors.icon }]}>×</ThemedText>
                </Pressable>
              ) : null}
            </View>
          ))}
          <Pressable onPress={() => addTimeWindow(setEditTimeWindows)} style={styles.linkButton}>
            <ThemedText style={[styles.linkText, { color: colors.primary }]}>
              {t('recurringOrders.addWindow', { defaultValue: 'Agregar ventana' })}
            </ThemedText>
          </Pressable>
          {editNextRunTime && !editTimeMatches ? (
            <ThemedText style={[styles.warningText, { color: colors.error }]}>
              {t('recurringOrders.timeWindowMismatch', { defaultValue: 'La hora no esta dentro de una ventana' })}
            </ThemedText>
          ) : null}
          <Pressable
            onPress={() => setShowEditDatePicker(true)}
            style={[styles.selectRow, { borderColor: colors.cardBorder, backgroundColor: colors.card }]}
          >
            <View>
              <ThemedText style={styles.selectLabel}>
                {t('recurringOrders.nextRunLabel', { defaultValue: 'Primera entrega' })}
              </ThemedText>
              <ThemedText style={[styles.selectValue, { color: editNextRunDate ? colors.text : colors.icon }]}>
                {editNextRunDate || t('recurringOrders.selectDate', { defaultValue: 'Selecciona una fecha' })}
              </ThemedText>
            </View>
            <IconSymbol name="calendar" size={18} color={colors.icon} />
          </Pressable>
          {showEditDatePicker && Platform.OS !== 'web' ? (
            <DateTimePicker
              value={editNextRunDate ? new Date(editNextRunDate) : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_, selectedDate) => {
                setShowEditDatePicker(false);
                if (!selectedDate) return;
                const iso = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(
                  selectedDate.getDate()
                ).padStart(2, '0')}`;
                setEditNextRunDate(iso);
                if (editIntervalUnit === 'week') {
                  const day = selectedDate.getDay();
                  if (!editDaysOfWeek.includes(day)) setEditDaysOfWeek((prev) => [...prev, day].sort((a, b) => a - b));
                }
                if (editIntervalUnit === 'month') {
                  const day = selectedDate.getDate();
                  if (!editDaysOfMonth.includes(day)) setEditDaysOfMonth((prev) => [...prev, day].sort((a, b) => a - b));
                }
              }}
            />
          ) : null}
          {showEditDatePicker && Platform.OS === 'web' ? (
            <View style={[styles.webOverlay, { backgroundColor: colors.overlay }]}>
              <View style={[styles.webPickerCard, { borderColor: colors.cardBorder, backgroundColor: colors.card }]}>
                <DatePicker
                  mode="single"
                  date={editNextRunDate ? new Date(editNextRunDate) : new Date()}
                  onChange={({ date }) => {
                    if (!date) return;
                    const selectedDate = new Date(date);
                    const iso = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(
                      selectedDate.getDate()
                    ).padStart(2, '0')}`;
                    setEditNextRunDate(iso);
                    if (editIntervalUnit === 'week') {
                      const day = selectedDate.getDay();
                      if (!editDaysOfWeek.includes(day)) setEditDaysOfWeek((prev) => [...prev, day].sort((a, b) => a - b));
                    }
                    if (editIntervalUnit === 'month') {
                      const day = selectedDate.getDate();
                      if (!editDaysOfMonth.includes(day)) setEditDaysOfMonth((prev) => [...prev, day].sort((a, b) => a - b));
                    }
                    setShowEditDatePicker(false);
                  }}
                  styles={datepickerStyles}
                />
                <Pressable onPress={() => setShowEditDatePicker(false)} style={styles.webPickerClose}>
                  <ThemedText style={[styles.webPickerCloseText, { color: colors.primary }]}>
                    {t('common.close', { defaultValue: 'Cerrar' })}
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          ) : null}
          <Pressable
            onPress={() => setShowEditTimePicker(true)}
            style={[styles.selectRow, { borderColor: colors.cardBorder, backgroundColor: colors.card }]}
          >
            <View>
              <ThemedText style={styles.selectLabel}>
                {t('recurringOrders.firstTimeLabel', { defaultValue: 'Hora de entrega' })}
              </ThemedText>
              <ThemedText style={[styles.selectValue, { color: editNextRunTime ? colors.text : colors.icon }]}>
                {editNextRunTime || t('recurringOrders.selectTime', { defaultValue: 'Selecciona una hora' })}
              </ThemedText>
            </View>
            <IconSymbol name="clock" size={18} color={colors.icon} />
          </Pressable>
          {showEditTimePicker && Platform.OS !== 'web' ? (
            <DateTimePicker
              value={editNextRunTime ? new Date(`1970-01-01T${editNextRunTime}:00`) : new Date()}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_, selectedDate) => {
                setShowEditTimePicker(false);
                if (!selectedDate) return;
                const time = `${String(selectedDate.getHours()).padStart(2, '0')}:${String(
                  selectedDate.getMinutes()
                ).padStart(2, '0')}`;
                setEditNextRunTime(time);
                applyTimeToWindows(time, editTimeWindows, setEditTimeWindows);
              }}
            />
          ) : null}
          {showEditTimePicker && Platform.OS === 'web' ? (
            <View style={[styles.webTimeCard, { borderColor: colors.cardBorder, backgroundColor: colors.card }]}>
              <TextInput
                style={[styles.timeInput, { borderColor: colors.cardBorder, color: colors.text }]}
                placeholder="HH:mm"
                placeholderTextColor={colors.icon}
                value={editNextRunTime}
                onChangeText={(value) => {
                  setEditNextRunTime(value);
                  applyTimeToWindows(value, editTimeWindows, setEditTimeWindows);
                }}
              />
              <Pressable onPress={() => setShowEditTimePicker(false)} style={styles.webPickerClose}>
                <ThemedText style={[styles.webPickerCloseText, { color: colors.primary }]}>
                  {t('common.close', { defaultValue: 'Cerrar' })}
                </ThemedText>
              </Pressable>
            </View>
          ) : null}
          <ThemedText style={styles.formLabel}>
            {t('recurringOrders.address', { defaultValue: 'Direccion' })}
          </ThemedText>
          {(addressesQuery.data?.addresses ?? []).map((addr) => (
            <Pressable
              key={addr.id}
              onPress={() => setEditAddressId(addr.id)}
              style={[styles.optionRow, { borderColor: colors.cardBorder }]}
            >
              <ThemedText>{addr.label || addr.address.line1}</ThemedText>
              {editAddressId === addr.id ? (
                <IconSymbol name="checkmark" size={16} color={colors.primary} />
              ) : null}
            </Pressable>
          ))}
          <ThemedText style={styles.formLabel}>
            {t('recurringOrders.payment', { defaultValue: 'Metodo de pago' })}
          </ThemedText>
          {(paymentMethodsQuery.data?.payment_methods ?? []).map((method) => (
            <Pressable
              key={method.id}
              onPress={() => setEditPaymentId(method.id)}
              style={[styles.optionRow, { borderColor: colors.cardBorder }]}
            >
              <ThemedText>{method.name}</ThemedText>
              {editPaymentId === method.id ? (
                <IconSymbol name="checkmark" size={16} color={colors.primary} />
              ) : null}
            </Pressable>
          ))}
          <View style={styles.editActions}>
            <Pressable onPress={() => setEditingId(null)} style={styles.linkButton}>
              <ThemedText style={[styles.linkText, { color: colors.icon }]}>
                {t('common.cancel', { defaultValue: 'Cancelar' })}
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={handleUpdateRecurring}
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              disabled={!canUpdate}
            >
              <ThemedText style={{ color: colors.primaryText, fontWeight: '600' }}>
                {t('common.save', { defaultValue: 'Guardar' })}
              </ThemedText>
            </Pressable>
          </View>
        </View>
      ) : null}

      <FlatList
        data={recurringQuery.data?.recurring_orders ?? []}
        renderItem={renderRecurring}
        scrollEnabled={false}
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          <ThemedText style={[styles.subText, { color: colors.icon }]}>
            {t('recurringOrders.empty')}
          </ThemedText>
        }
      />
    </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  header: { padding: 20, paddingTop: 60 },
  backButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  sectionHeaderRow: { paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 16, fontWeight: '600' },
  linkButton: { paddingVertical: 6, paddingHorizontal: 8 },
  linkText: { fontSize: 13, fontWeight: '600' },
  formCard: { margin: 16, borderWidth: 1, borderRadius: 12, padding: 14, gap: 10 },
  formLabel: { fontSize: 12, fontWeight: '600' },
  selectGroup: { gap: 8 },
  optionRow: { borderWidth: 1, borderRadius: 10, padding: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  selectRow: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectLabel: { fontSize: 12, fontWeight: '600' },
  selectValue: { fontSize: 14, fontWeight: '500', marginTop: 4 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  chipText: { fontSize: 12, fontWeight: '600' },
  timeWindowRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeInput: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  removeButton: { borderWidth: 1, borderRadius: 8, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  removeButtonText: { fontSize: 16, fontWeight: '600' },
  warningText: { fontSize: 12, fontWeight: '600' },
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
  webTimeCard: { borderWidth: 1, borderRadius: 16, padding: 12, gap: 8 },
  webPickerClose: { marginTop: 8, alignSelf: 'flex-end' },
  webPickerCloseText: { fontSize: 13, fontWeight: '600' },
  primaryButton: { borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  editActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subText: { fontSize: 13, paddingHorizontal: 16, marginTop: 16 },
});
