import React, { useEffect, useRef } from "react";
import { Animated, Easing, Platform, ViewStyle } from "react-native";

interface Props {
  index?: number;
  replayKey?: string | number;
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Entrada escalonada de filas. En web nativeDriver no pinta bien:
 * usamos JS driver. Failsafe: si la animación no arranca, forzamos opacidad 1.
 */
export default function ListaAnimada({ index = 0, replayKey, children, style }: Props) {
  const op = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(22)).current;
  const nativo = Platform.OS !== "web";

  useEffect(() => {
    op.setValue(0);
    y.setValue(22);
    const delay = Math.min(index, 10) * 55;
    const anim = Animated.parallel([
      Animated.timing(op, {
        toValue: 1,
        duration: 420,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: nativo,
      }),
      Animated.timing(y, {
        toValue: 0,
        duration: 420,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: nativo,
      }),
    ]);
    anim.start();
    const failsafe = setTimeout(() => {
      op.setValue(1);
      y.setValue(0);
    }, delay + 600);
    return () => {
      clearTimeout(failsafe);
      anim.stop();
    };
  }, [index, nativo, op, replayKey, y]);

  return (
    <Animated.View style={[{ opacity: op, transform: [{ translateY: y }] }, style]}>
      {children}
    </Animated.View>
  );
}
