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
 * usamos JS driver para que se vea el fade + el desplazamiento.
 */
export default function ListaAnimada({ index = 0, replayKey, children, style }: Props) {
  const op = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(22)).current;
  const nativo = Platform.OS !== "web";

  useEffect(() => {
    op.setValue(0);
    y.setValue(22);
    const delay = Math.min(index, 10) * 55;
    Animated.parallel([
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
    ]).start();
  }, [index, nativo, op, replayKey, y]);

  return (
    <Animated.View style={[{ opacity: op, transform: [{ translateY: y }] }, style]}>
      {children}
    </Animated.View>
  );
}
