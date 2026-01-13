import React from "react";
import { StyleSheet, View, Animated } from "react-native";
import { Colors } from "@/constants/theme";
import { useThemePreference } from "@/context/theme-preference";

export function AnimeCardSkeleton({ width: customWidth }: { width?: number }) {
  const { resolvedScheme } = useThemePreference();
  const c = Colors[resolvedScheme];
  const opacity = React.useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  return (
    <View style={[styles.container, customWidth ? { width: customWidth } : null]}>
      <Animated.View
        style={[
          styles.poster,
          { backgroundColor: c.secondary, opacity },
          customWidth ? { width: customWidth, height: customWidth * 1.4 } : null,
        ]}
      />
      <View style={styles.info}>
        <View style={styles.titleWrapper}>
          <Animated.View style={styles.titleBlock}>
            <Animated.View
              style={[styles.titleLine, { backgroundColor: c.secondary, opacity }]}
            />
            <Animated.View
              style={[styles.titleLineSecondary, { backgroundColor: c.secondary, opacity }]}
            />
          </Animated.View>
        </View>
        <View style={styles.metaRow}>
          <Animated.View
            style={[styles.metaLine, { backgroundColor: c.secondary, opacity }]}
          />
          <Animated.View
            style={[styles.metaLineSecondary, { backgroundColor: c.secondary, opacity }]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 140,
    marginRight: 12,
  },
  poster: {
    width: 140,
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },
  info: {
    gap: 4,
    minHeight: 52,
  },
  titleWrapper: {
    height: 36,
  },
  titleBlock: {
    gap: 0,
    height: 36,
  },
  titleLine: {
    height: 18,
    borderRadius: 4,
    width: "90%",
  },
  titleLineSecondary: {
    height: 18,
    borderRadius: 4,
    width: "75%",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaLine: {
    height: 14,
    borderRadius: 4,
    width: 28,
  },
  metaLineSecondary: {
    height: 14,
    borderRadius: 4,
    width: 40,
  },
});
