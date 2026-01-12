import * as React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

import { fetchScheduleForCRDate, getDateKeyCR, type ScheduleItem } from "@/app/api/schedule";
import { ScheduleCard } from "@/components/calendar/ScheduleCard";

function isSameCRDay(a: Date, b: Date) {
  return getDateKeyCR(a) === getDateKeyCR(b);
}

function formatDayTitle(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    timeZone: "America/Costa_Rica",
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(date);
}

export function ScheduleColumn({ date }: { date: Date }) {
  const { i18n, t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];

  const locale =
    i18n.language?.startsWith("es") ? "es-CR" : i18n.language?.startsWith("en") ? "en-US" : i18n.language;

  const [items, setItems] = React.useState<ScheduleItem[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const dateKey = React.useMemo(() => getDateKeyCR(date), [date]);

  React.useEffect(() => {
    const ac = new AbortController();
    let alive = true;

    setLoading(true);
    setError(null);

    fetchScheduleForCRDate(date, ac.signal)
      .then((res) => {
        if (!alive) return;
        setItems(res);
        setLoading(false);
      })
      .catch((e) => {
        if (!alive) return;
        if (e?.name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Error");
        setLoading(false);
      });

    return () => {
      alive = false;
      ac.abort();
    };
  }, [dateKey]);

  const today = React.useMemo(() => isSameCRDay(date, new Date()), [dateKey]);

  return (
    <ThemedView
      style={[
        styles.container,
        { borderColor: c.cardBorder, backgroundColor: c.background },
      ]}
    >
      <View style={styles.header}>
        <ThemedText
          style={[
            styles.headerText,
            { color: today ? c.tint : c.text },
          ]}
        >
          {formatDayTitle(date, locale)}
        </ThemedText>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
          <ThemedText style={[styles.helper, { color: c.icon }]}>
            {t("common.loading", { defaultValue: "Cargando..." })}
          </ThemedText>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <ThemedText style={[styles.helper, { color: c.icon }]}>
            {t("common.error", { defaultValue: "Error" })}: {error}
          </ThemedText>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <ThemedText style={[styles.helper, { color: c.icon }]}>
            {t("calendar.noEvents", { defaultValue: "No hay eventos programados" })}
          </ThemedText>
        </View>
      ) : (
        <View style={styles.list}>
          {items.map((it) => (
            <ScheduleCard key={String(it.id)} item={it} />
          ))}
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  header: {
    marginBottom: 10,
  },
  headerText: {
    fontSize: 22,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  center: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  helper: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  list: {
    gap: 10,
  },
});
