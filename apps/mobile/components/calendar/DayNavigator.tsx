// apps/mobile/components/calendar/DayNavigator.tsx
import * as React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { ThemedText } from "@/components/themed-text";

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export function DayNavigator(props: {
  date: Date;
  onChangeDate: (d: Date) => void;
  onToday: () => void;
}) {
  const { t, i18n } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];

  const isToday = React.useMemo(() => {
    const now = new Date();
    return (
      props.date.getFullYear() === now.getFullYear() &&
      props.date.getMonth() === now.getMonth() &&
      props.date.getDate() === now.getDate()
    );
  }, [props.date]);

  const todayLabel = t("calendar.today", { defaultValue: "Today" });

  return (
    <View style={[styles.row, { borderColor: c.divider }]}>
      <Pressable
        onPress={() => props.onChangeDate(addDays(props.date, -7))}
        style={[styles.btn, { borderColor: c.divider }]}
        accessibilityLabel={t("calendar.prevWeek", { defaultValue: "Previous week" })}
      >
        <ThemedText style={styles.btnText}>{"<<"}</ThemedText>
      </Pressable>

      <Pressable
        onPress={() => props.onChangeDate(addDays(props.date, -1))}
        style={[styles.btn, { borderColor: c.divider }]}
        accessibilityLabel={t("calendar.prevDay", { defaultValue: "Previous day" })}
      >
        <ThemedText style={styles.btnText}>{"<"}</ThemedText>
      </Pressable>

      <Pressable
        onPress={props.onToday}
        style={[
          styles.todayBtn,
          { borderColor: c.divider, backgroundColor: isToday ? c.secondary : "transparent" },
        ]}
        accessibilityLabel={todayLabel}
      >
        <ThemedText style={[styles.todayText, { color: c.text }]}>{todayLabel}</ThemedText>
      </Pressable>

      <Pressable
        onPress={() => props.onChangeDate(addDays(props.date, 1))}
        style={[styles.btn, { borderColor: c.divider }]}
        accessibilityLabel={t("calendar.nextDay", { defaultValue: "Next day" })}
      >
        <ThemedText style={styles.btnText}>{">"}</ThemedText>
      </Pressable>

      <Pressable
        onPress={() => props.onChangeDate(addDays(props.date, 7))}
        style={[styles.btn, { borderColor: c.divider }]}
        accessibilityLabel={t("calendar.nextWeek", { defaultValue: "Next week" })}
      >
        <ThemedText style={styles.btnText}>{">>"}</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  btn: {
    width: 44,
    height: 38,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    fontSize: 16,
    fontWeight: "700",
    opacity: 0.9,
  },
  todayBtn: {
    flex: 1,
    height: 38,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  todayText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
