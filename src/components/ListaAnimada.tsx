import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Platform, View, ViewStyle } from "react-native";

interface Props {
  index?: number;
  replayKey?: string | number;
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Entrada escalonada de filas.
 * En web, transform+opacity animados rompen el hit-testing (botones «muertos»).
 * Por eso en web pintamos sin animación de transform y con pointerEvents auto.
 */
export default function ListaAnimada({ index = 0, replayKey, children, style }: Props) {
  const op = useRef(new Animated.Value(Platform.OS === "web" ? 1 : 0)).current;
  const y = useRef(new Animated.Value(Platform.OS === "web" ? 0 : 22)).current;
  const nativo = Platform.OS !== "web";
  const [listoWeb] = useState(Platform.OS === "web");

  useEffect(() => {
    if (!nativo) {
      // Web: sin animación de posición — los toques llegan al botón.
      op.setValue(1);
      y.setValue(0);
      return;
    }
    op.setValue(0);
    y.setValue(22);
    const delay = Math.min(index, 10) * 55;
    const anim = Animated.parallel([
      Animated.timing(op, {
        toValue: 1,
        duration: 420,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(y, {
        toValue: 0,
        duration: 420,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    anim.start(({ finished }) => {
      if (!finished) {
        op.setValue(1);
        y.setValue(0);
      }
    });
    return () => {
      anim.stop();
      op.setValue(1);
      y.setValue(0);
    };
  }, [index, nativo, op, replayKey, y]);

  if (listoWeb) {
    return (
      <View pointerEvents="auto" style={style}>
        {children}
      </View>
    );
  }

  return (
    <Animated.View
      pointerEvents="auto"
      style={[{ opacity: op, transform: [{ translateY: y }] }, style]}
    >
      {children}
    </Animated.View>
  );
}
