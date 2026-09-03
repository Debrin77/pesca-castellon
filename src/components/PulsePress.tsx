import React, { useRef, useEffect } from "react";
import { Animated, Easing, Pressable, StyleProp, ViewStyle } from "react-native";

/** Pulsación suave al tocar (motion premium ligero). */
export default function PulsePress({
  onPress,
  children,
  style,
  disabled,
}: {
  onPress?: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    return () => scale.stopAnimation();
  }, [scale]);

  function down() {
    Animated.timing(scale, {
      toValue: 0.97,
      duration: 90,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }
  function up() {
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 160,
      useNativeDriver: true,
    }).start();
  }

  return (
    <Pressable onPress={onPress} onPressIn={down} onPressOut={up} disabled={disabled}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}
