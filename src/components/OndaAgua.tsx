import React, { useEffect, useRef } from "react";
import { Animated, Easing, Platform, StyleSheet, View } from "react-native";

type Props = {
  /** Intensidad de las capas (0–1). */
  intensidad?: number;
  /** Variante clara sobre degradados oscuros. */
  tono?: "claro" | "agua";
};

/**
 * Capas de agua animadas: presencia sin ruido. Pensado para heroes de salida.
 */
export default function OndaAgua({ intensidad = 1, tono = "claro" }: Props) {
  const a = useRef(new Animated.Value(0)).current;
  const b = useRef(new Animated.Value(0)).current;
  const nativo = Platform.OS !== "web";

  useEffect(() => {
    const loop = (v: Animated.Value, dur: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, {
            toValue: 1,
            duration: dur,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: nativo,
          }),
          Animated.timing(v, {
            toValue: 0,
            duration: dur,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: nativo,
          }),
        ])
      );
    const la = loop(a, 9000);
    const lb = loop(b, 14000);
    la.start();
    lb.start();
    return () => {
      la.stop();
      lb.stop();
    };
  }, [a, b, nativo]);

  const xA = a.interpolate({ inputRange: [0, 1], outputRange: [-28, 36] });
  const xB = b.interpolate({ inputRange: [0, 1], outputRange: [40, -48] });
  const fill =
    tono === "agua" ? "rgba(26,111,138,0.18)" : "rgba(255,255,255,0.12)";
  const fillStrong =
    tono === "agua" ? "rgba(14,68,86,0.22)" : "rgba(255,255,255,0.18)";

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: intensidad }]}>
      <Animated.View
        style={[
          styles.blob,
          styles.blobA,
          { backgroundColor: fillStrong, transform: [{ translateX: xA }] },
        ]}
      />
      <Animated.View
        style={[
          styles.blob,
          styles.blobB,
          { backgroundColor: fill, transform: [{ translateX: xB }] },
        ]}
      />
      <Animated.View
        style={[
          styles.blob,
          styles.blobC,
          { backgroundColor: fill, transform: [{ translateX: xA }] },
        ]}
      />
      <View style={[styles.shore, { backgroundColor: tono === "agua" ? "rgba(230,243,247,0.55)" : "rgba(255,255,255,0.08)" }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  blob: {
    position: "absolute",
    borderRadius: 999,
  },
  blobA: { bottom: 18, left: -60, width: 240, height: 70 },
  blobB: { bottom: -10, right: -70, width: 280, height: 90 },
  blobC: { top: 36, right: -40, width: 160, height: 52, opacity: 0.75 },
  shore: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
    opacity: 0.9,
  },
});
