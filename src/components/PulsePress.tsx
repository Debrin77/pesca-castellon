import React, { useRef, useEffect } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleProp,
  TouchableOpacity,
  ViewStyle,
} from "react-native";

/** Pulsación suave al tocar. En web: TouchableOpacity (Pressable+transform falla el hit-test). */
export default function PulsePress({
  onPress,
  children,
  style,
  disabled,
  accessibilityRole,
  accessibilityLabel,
}: {
  onPress?: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  accessibilityRole?: "button" | "link" | "none";
  accessibilityLabel?: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    return () => scale.stopAnimation();
  }, [scale]);

  if (Platform.OS === "web") {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.88}
        accessibilityRole={accessibilityRole ?? "button"}
        accessibilityLabel={accessibilityLabel}
        style={style}
      >
        {children}
      </TouchableOpacity>
    );
  }

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
    <Pressable
      onPress={onPress}
      onPressIn={down}
      onPressOut={up}
      disabled={disabled}
      accessibilityRole={accessibilityRole ?? "button"}
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}
