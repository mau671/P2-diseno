import * as React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export function DayNavigator({
  disabled = false,
  isToday,
  canPrev,
  canNext,
  onPrev,
  onNext,
  onToday,
}: {
  disabled?: boolean;
  isToday: boolean;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  const { t, i18n } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];

  const todayFallback = i18n.language?.toLowerCase().startsWith("en") ? "Today" : "Hoy";

  return (
    <View style={styles.row}>
      <NavBtn
        label="<"
        onPress={onPrev}
        disabled={disabled || !canPrev}
        c={c}
      />

      {/* ✅ SOLO “HOY” */}
      <Pressable
        onPress={onToday}
        disabled={disabled}
        style={({ pressed }) => [
          styles.todayBtn,
          {
            backgroundColor: isToday ? c.card : c.secondary,
            borderColor: c.cardBorder,
            opacity: disabled ? 0.55 : pressed ? 0.9 : 1,
          },
        ]}
      >
        <ThemedText style={[styles.todayLabel, { color: c.text }]}>
          {t("calendar.today", { defaultValue: todayFallback })}
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
          backgroundColor: c.background,
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
  todayBtn: {
    flex: 1,
    height: 58,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  todayLabel: {
    fontSize: 16,
    fontWeight: "900",
  },
});
