import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  Modal,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { SearchFilters, Format, Status, Season, Genre, fetchGenres } from "@/lib/api/home";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

const SEASONS: Season[] = ["winter", "spring", "summer", "fall"];
const FORMATS: Format[] = ["tv", "movie", "ova", "special", "ona", "music", "cm", "pv", "tv_special"];
const STATUSES: Status[] = ["airing", "complete", "upcoming"];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1980 + 1 }, (_, i) =>
  String(CURRENT_YEAR - i)
);

type FiltersModalProps = {
  visible: boolean;
  filters: SearchFilters;
  onClose: () => void;
  onApply: (filters: SearchFilters) => void;
  onClear: () => void;
};

export function FiltersModal({
  visible,
  filters,
  onClose,
  onApply,
  onClear,
}: FiltersModalProps) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];

  const [local, setLocal] = useState<SearchFilters>(filters);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loadingGenres, setLoadingGenres] = useState(false);

  useEffect(() => {
    if (visible) {
      setLocal(filters);
    }
  }, [visible, filters]);

  useEffect(() => {
    if (visible && genres.length === 0) {
      setLoadingGenres(true);
      fetchGenres()
        .then((res) => {
          setGenres(res.data || []);
        })
        .catch((err) => {
          console.error("Failed to load genres:", err);
        })
        .finally(() => {
          setLoadingGenres(false);
        });
    }
  }, [visible, genres.length]);

  const toggleGenre = (genreId: number) => {
    const current = local.genres ?? [];
    if (current.includes(genreId)) {
      setLocal({ ...local, genres: current.filter((id) => id !== genreId) });
    } else {
      setLocal({ ...local, genres: [...current, genreId] });
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <ThemedView style={styles.container}>
        <View style={[styles.header, { borderBottomColor: c.divider, backgroundColor: c.surface }]}>
          <Pressable onPress={onClose} hitSlop={10}>
            <Text style={[styles.headerButton, { color: c.text }]}>
              {t("common.cancel")}
            </Text>
          </Pressable>
          <ThemedText style={styles.headerTitle}>
            {t("search.filters.title")}
          </ThemedText>
          <Pressable onPress={() => { onClear(); setLocal({}); }} hitSlop={10}>
            <Text style={[styles.headerButton, { color: c.tint, fontWeight: "600" }]}>
              {t("search.clear")}
            </Text>
          </Pressable>
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <FilterSection title={t("search.filters.year")}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {YEARS.map((year) => {
                  const isActive = local.year === parseInt(year);
                  return (
                    <Pressable
                      key={year}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isActive ? c.tint : "transparent",
                          borderColor: isActive ? c.tint : c.divider,
                          borderWidth: 1,
                        },
                        isActive && styles.chipActive,
                      ]}
                      onPress={() =>
                        setLocal({
                          ...local,
                          year: isActive ? undefined : parseInt(year),
                        })
                      }
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: isActive ? "#fff" : c.text },
                        ]}
                      >
                        {year}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </FilterSection>

          <FilterSection title={t("search.filters.season")}>
            <View style={styles.chipRow}>
              {SEASONS.map((s) => {
                const isActive = local.season === s;
                return (
                  <Pressable
                    key={s}
                    style={[
                      styles.chip,
                      { backgroundColor: isActive ? c.tint : c.secondary },
                      isActive && styles.chipActive,
                    ]}
                    onPress={() =>
                      setLocal({
                        ...local,
                        season: isActive ? undefined : s,
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: isActive ? "#fff" : c.textSecondary },
                      ]}
                    >
                      {t(`search.seasons.${s}`)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </FilterSection>

          <FilterSection title={t("search.filters.format")}>
            <View style={styles.chipRow}>
              {FORMATS.map((f) => {
                const isActive = local.type === f;
                return (
                  <Pressable
                    key={f}
                    style={[
                      styles.chip,
                      { backgroundColor: isActive ? c.tint : c.secondary },
                      isActive && styles.chipActive,
                    ]}
                    onPress={() =>
                      setLocal({
                        ...local,
                        type: isActive ? undefined : f,
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: isActive ? "#fff" : c.textSecondary },
                      ]}
                    >
                      {t(`search.formats.${f}`)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </FilterSection>

          <FilterSection title={t("search.filters.status")}>
            <View style={styles.chipRow}>
              {STATUSES.map((s) => {
                const isActive = local.status === s;
                return (
                  <Pressable
                    key={s}
                    style={[
                      styles.chip,
                      { backgroundColor: isActive ? c.tint : c.secondary },
                      isActive && styles.chipActive,
                    ]}
                    onPress={() =>
                      setLocal({
                        ...local,
                        status: isActive ? undefined : s,
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: isActive ? "#fff" : c.textSecondary },
                      ]}
                    >
                      {t(`search.statuses.${s}`)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </FilterSection>

          <View style={styles.section}>
            <View style={styles.rowBetween}>
              <ThemedText style={styles.label}>
                {t("search.filters.nsfw")}
              </ThemedText>
              <Pressable
                onPress={() => setLocal({ ...local, sfw: !local.sfw })}
              >
                <Ionicons
                  name={local.sfw === false ? "checkbox" : "square-outline"}
                  size={28}
                  color={c.tint}
                />
              </Pressable>
            </View>
          </View>

          <FilterSection title={t("search.filters.genres")}>
            {loadingGenres ? (
              <ActivityIndicator color={c.tint} style={styles.loader} />
            ) : (
              <View style={styles.chipRow}>
                {genres.map((genre) => {
                  const isActive = local.genres?.includes(genre.mal_id);
                  return (
                    <Pressable
                      key={genre.mal_id}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isActive ? c.tint : "transparent",
                          borderColor: isActive ? c.tint : c.divider,
                          borderWidth: 1,
                        },
                        isActive && styles.chipActive,
                      ]}
                      onPress={() => toggleGenre(genre.mal_id)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: isActive ? "#fff" : c.text },
                        ]}
                      >
                        {genre.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </FilterSection>
        </ScrollView>

        <ThemedView style={[styles.footer, { borderTopColor: c.divider }]}>
          <Pressable
            style={[styles.applyButton, { backgroundColor: c.tint }]}
            onPress={() => {
              onApply(local);
              onClose();
            }}
          >
            <Text style={styles.applyButtonText}>{t("search.apply")}</Text>
          </Pressable>
        </ThemedView>
      </ThemedView>
    </Modal>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText style={styles.label}>{title}</ThemedText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  headerButton: {
    fontSize: 16,
  },
  scroll: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  label: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 14,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  chipActive: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chipText: {
    fontSize: 15,
    fontWeight: "600",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  loader: {
    marginVertical: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  applyButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  applyButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
});
