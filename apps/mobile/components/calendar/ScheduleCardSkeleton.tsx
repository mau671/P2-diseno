import * as React from "react";
import { StyleSheet, View, Animated } from "react-native";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

const POSTER_WIDTH = 54;
const POSTER_HEIGHT = 81;
const ROW_HEIGHT = 81;

export function ScheduleCardSkeleton() {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const opacity = React.useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.6,
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
    <View style={styles.wrap}>
      <View style={styles.timelineCol}>
        <Animated.View style={[styles.dot, { backgroundColor: c.icon, opacity }]} />
        <Animated.View style={[styles.line, { backgroundColor: c.divider, opacity }]} />
      </View>

      <View style={styles.contentRow}>
        <Animated.View style={[styles.poster, { backgroundColor: c.secondary, opacity }]} />

        <View style={styles.textCol}>
          <Animated.View style={[styles.time, { backgroundColor: c.secondary, opacity }]} />
          <Animated.View style={[styles.title, { backgroundColor: c.secondary, opacity }]} />
          <Animated.View style={[styles.meta, { backgroundColor: c.secondary, opacity }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    gap: 12,
    height: ROW_HEIGHT,
    alignItems: "center",
  },
  timelineCol: {
    width: 16,
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  line: {
    width: 2,
    flex: 1,
    borderRadius: 999,
    marginTop: 6,
  },
  contentRow: {
    flex: 1,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    height: POSTER_HEIGHT,
  },
  poster: {
    width: POSTER_WIDTH,
    height: POSTER_HEIGHT,
    borderRadius: 8,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    height: POSTER_HEIGHT,
    justifyContent: "center",
  },
  time: {
    width: 48,
    height: 16,
    borderRadius: 4,
    marginBottom: 2,
  },
  title: {
    width: "100%",
    height: 18,
    borderRadius: 4,
    marginBottom: 2,
  },
  meta: {
    width: "60%",
    height: 14,
    borderRadius: 4,
  },
});
