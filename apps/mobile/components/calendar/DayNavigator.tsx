import * as React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useThemePreference } from "@/context/theme-preference";
import { formatDayNavigatorDate } from "@/lib/date-utils";

export function DayNavigator({
  disabled = false,
  selectedDate,
  canPrev,
  canNext,
  onPrev,
  onNext,
}: {
  disabled?: boolean;
  selectedDate: Date;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  const { i18n } = useTranslation();
  const { resolvedScheme } = useThemePreference();
  const c = Colors[resolvedScheme];

  const locale = i18n.language || "es-419";
  const dateLabel = formatDayNavigatorDate(selectedDate, locale);

  return (
    <View style={styles.row}>
      <NavBtn
        label="<"
        onPress={onPrev}
        disabled={disabled || !canPrev}
        c={c}
      />

      <Pressable
        onPress={onNext}
        disabled={disabled || !canNext}
        style={({ pressed }) => [
          styles.dateBtn,
          {
            backgroundColor: c.card,
            borderColor: c.cardBorder,
            opacity: disabled ? 0.55 : pressed ? 0.9 : 1,
          },
        ]}
      >
        <ThemedText style={[styles.dateLabel, { color: c.text }]}>
          {dateLabel}
        </ThemedText>
      </Pressable>

      <NavBtn
        label=">"
        onPress={onNext}
        disabled={disabled || !canNext}
        c={c}
      />
    </View>
  );
}

function NavBtn({
  label,
  onPress,
  disabled,
  c,
}: {
  label: string;
  onPress: () => void;
  disabled: boolean;
  c: (typeof Colors)["light"];
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: c.card,
          borderColor: c.cardBorder,
          opacity: disabled ? 0.35 : pressed ? 0.9 : 1,
        },
      ]}
    >
      <ThemedText style={[styles.btnLabel, { color: c.text }]}>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "space-between",
  },
  btn: {
    width: 62,
    height: 58,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  btnLabel: {
    fontSize: 20,
    fontWeight: "900",
  },
  dateBtn: {
    flex: 1,
    height: 58,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: "900",
  },
});
