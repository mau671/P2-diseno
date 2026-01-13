import React from "react";
import { StyleSheet, View, Animated } from "react-native";
import { ScheduleCardSkeleton } from "./ScheduleCardSkeleton";

export function ScheduleColumnSkeleton() {
  const opacity = React.useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.6,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  return (
    <View style={styles.list}>
      {Array.from({ length: 5 }).map((_, i) => (
        <ScheduleCardSkeleton key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 16,
  },
});
