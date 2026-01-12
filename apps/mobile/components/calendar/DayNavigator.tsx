import * as React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

const TZ_CR = "America/Costa_Rica";

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function dayKeyInTZ(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const y = parts.find((p) => p.type === "year")?.value ?? "0000";
  const m = parts.find((p) => p.type === "month")?.value ?? "00";
  const d = parts.find((p) => p.type === "day")?.value ?? "00";
  return `${y}-${m}-${d}`;
}

function isTodayCR(date: Date) {
  return dayKeyInTZ(date, TZ_CR) === dayKeyInTZ(new Date(), TZ_CR);
}

function formatHeaderDate(date: Date, locale: string) {
  // Lun, 12 Ene / Mon, Jan 12 (depende del locale)
  return new Intl.DateTimeFormat(locale, {
    timeZone: TZ_CR,
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(date);
}

export function DayNavigator({
  date,
  onChangeDate,
  onToday,
}: {
  date: Date;
  onChangeDate: (d: Date) => void;
  onToday: () => void;
}) {
  const { i18n, t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];

  const locale =
    i18n.language?.startsWith("es") ? "es-CR" : i18n.language?.startsWith("en") ? "en-US" : i18n.language;

  const today = isTodayCR(date);

  const goPrevDay = React.useCallback(() => onChangeDate(addDays(date, -1)), [date, onChangeDate]);
  const goNextDay = React.useCallback(() => onChangeDate(addDays(date, 1)), [date, onChangeDate]);
  const goPrevWeek = React.useCallback(() => onChangeDate(addDays(date, -7)), [date, onChangeDate]);
  const goNextWeek = React.useCallback(() => onChangeDate(addDays(date, 7)), [date, onChangeDate]);

  const labelToday = t("calendar.today", { defaultValue: "Hoy" });
  const header = formatHeaderDate(date, locale);

  return (
    <View style={styles.row}>
      <Pressable
        onPress={goPrevWeek}
        style={[styles.btn, { borderColor: c.cardBorder, backgroundColor: c.background }]}
        hitSlop={8}
      >
        <ThemedText style={[styles.btnText, { color: c.text }]}>{`<<`}</ThemedText>
      </Pressable>

      <Pressable
        onPress={goPrevDay}
        style={[styles.btn, { borderColor: c.cardBorder, backgroundColor: c.background }]}
        hitSlop={8}
      >
        <ThemedText style={[styles.btnText, { color: c.text }]}>{`<`}</ThemedText>
      </Pressable>

      <Pressable
        onPress={onToday}
        style={[
          styles.todayBtn,
          {
            borderColor: c.cardBorder,
            backgroundColor: c.card,
          },
        ]}
        hitSlop={8}
      >
        <ThemedText style={[styles.todayTop, { color: today ? c.tint : c.text }]}>
          {header}
        </ThemedText>
        <ThemedText style={[styles.todayBottom, { color: c.icon }]}>{labelToday}</ThemedText>
      </Pressable>

      <Pressable
        onPress={goNextDay}
        style={[styles.btn, { borderColor: c.cardBorder, backgroundColor: c.background }]}
        hitSlop={8}
      >
        <ThemedText style={[styles.btnText, { color: c.text }]}>{`>`}</ThemedText>
      </Pressable>

      <Pressable
        onPress={goNextWeek}
        style={[styles.btn, { borderColor: c.cardBorder, backgroundColor: c.background }]}
        hitSlop={8}
      >
        <ThemedText style={[styles.btnText, { color: c.text }]}>{`>>`}</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  btn: {
    width: 52,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    fontSize: 16,
    fontWeight: "800",
  },
  todayBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  todayTop: {
    fontSize: 14,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  todayBottom: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "700",
  },
});
