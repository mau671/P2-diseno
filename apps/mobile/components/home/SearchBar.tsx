import React from "react";
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  Keyboard,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  onFilterPress: () => void;
};

export function SearchBar({ value, onChangeText, onFilterPress }: SearchBarProps) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];

  return (
    <View style={styles.container}>
      <View style={[styles.inputWrapper, { backgroundColor: c.inputBackground }]}>
        <Ionicons name="search" size={20} color={c.textSecondary} style={styles.icon} />
        <TextInput
          style={[styles.input, { color: c.text }]}
          placeholder={t("search.placeholder")}
          placeholderTextColor={c.textMuted}
          value={value}
          onChangeText={onChangeText}
          returnKeyType="search"
          onSubmitEditing={() => Keyboard.dismiss()}
        />
        {value.length > 0 && (
          <Pressable onPress={() => onChangeText("")}>
            <Ionicons name="close-circle" size={18} color={c.textSecondary} />
          </Pressable>
        )}
      </View>
      <Pressable
        style={[styles.filterButton, { backgroundColor: c.inputBackground }]}
        onPress={onFilterPress}
      >
        <Ionicons name="options" size={20} color={c.tint} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
});
