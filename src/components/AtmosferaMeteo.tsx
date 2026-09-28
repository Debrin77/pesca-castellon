import React, { useEffect, useRef } from "react";
import { Animated, Easing, Platform, StyleSheet, View } from "react-native";
import { tipoMeteoDeCodigo } from "./meteoSky";

type Props = {
  codigo: number;
  /** Si hay ráfagas/viento fuerte, anima trazos de viento. */
  vientoKmh?: number | null;
  rafagaKmh?: number | null;
};

/** Capas atmosféricas animadas detrás del contenido (estilo Weather.app). */
export default function AtmosferaMeteo({ codigo, vientoKmh, rafagaKmh }: Props) {
  const tipo = tipoMeteoDeCodigo(codigo);
  const driftA = useRef(new Animated.Value(0)).current;
  const driftB = useRef(new Animated.Value(0)).current;
  const rain = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const wind = useRef(new Animated.Value(0)).current;

  const picoViento = Math.max(vientoKmh ?? 0, rafagaKmh ?? 0);
  const hayViento = picoViento >= 18 || tipo === "tormenta";

  useEffect(() => {
    const running: Animated.CompositeAnimation[] = [];
    const nativo = Platform.OS !== "web";

    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(driftA, {
          toValue: 1,
          duration: hayViento ? 10000 : 18000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: nativo,
        }),
        Animated.timing(driftA, {
          toValue: 0,
          duration: hayViento ? 10000 : 18000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: nativo,
        }),
      ])
    );
    a.start();
    running.push(a);

    const b = Animated.loop(
      Animated.sequence([
        Animated.timing(driftB, {
          toValue: 1,
          duration: hayViento ? 14000 : 24000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: nativo,
        }),
        Animated.timing(driftB, {
          toValue: 0,
          duration: hayViento ? 14000 : 24000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: nativo,
        }),
      ])
    );
    b.start();
    running.push(b);

    if (tipo === "lluvia" || tipo === "tormenta" || tipo === "nieve") {
      const r = Animated.loop(
        Animated.timing(rain, {
          toValue: 1,
          duration: tipo === "nieve" ? 3500 : 1400,
          easing: Easing.linear,
          useNativeDriver: nativo,
        })
      );
      r.start();
      running.push(r);
    }

    if (tipo === "sol" || tipo === "solNubes") {
      const g = Animated.loop(
        Animated.sequence([
          Animated.timing(glow, {
            toValue: 1,
            duration: 4000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: nativo,
          }),
          Animated.timing(glow, {
            toValue: 0,
            duration: 4000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: nativo,
          }),
        ])
      );
      g.start();
      running.push(g);
    }

    if (hayViento) {
      const w = Animated.loop(
        Animated.timing(wind, {
          toValue: 1,
          duration: picoViento >= 45 ? 900 : 1600,
          easing: Easing.linear,
          useNativeDriver: nativo,
        })
      );
      w.start();
      running.push(w);
    } else {
      wind.setValue(0);
    }

    return () => running.forEach((x) => x.stop());
  }, [driftA, driftB, glow, rain, wind, tipo, hayViento, picoViento]);

  const xA = driftA.interpolate({
    inputRange: [0, 1],
    outputRange: hayViento ? [-50, 60] : [-30, 40],
  });
  const xB = driftB.interpolate({
    inputRange: [0, 1],
    outputRange: hayViento ? [55, -65] : [35, -45],
  });
  const rainY = rain.interpolate({ inputRange: [0, 1], outputRange: [-40, 120] });
  const glowOp = glow.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.55] });
  const windX = wind.interpolate({ inputRange: [0, 1], outputRange: [-80, 320] });

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {(tipo === "sol" || tipo === "solNubes") && (
        <Animated.View
          style={[
            styles.sunGlow,
            {
              opacity: glowOp,
              ...(Platform.OS === "web"
                ? ({
                    background:
                      "radial-gradient(circle, rgba(255,214,10,0.55) 0%, rgba(255,214,10,0) 70%)",
                  } as any)
                : { backgroundColor: "rgba(255,214,10,0.35)" }),
            },
          ]}
        />
      )}

      <Animated.View style={[styles.cloudBlob, styles.cloudA, { transform: [{ translateX: xA }] }]} />
      <Animated.View style={[styles.cloudBlob, styles.cloudB, { transform: [{ translateX: xB }] }]} />
      <Animated.View style={[styles.cloudBlob, styles.cloudC, { transform: [{ translateX: xA }] }]} />

      {hayViento ? (
        <Animated.View style={[styles.windLayer, { transform: [{ translateX: windX }] }]}>
          {Array.from({ length: 10 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.windStreak,
                {
                  top: 48 + (i % 5) * 52,
                  left: (i % 3) * 36,
                  opacity: 0.18 + (i % 3) * 0.08,
                  width: 36 + (i % 4) * 14,
                },
              ]}
            />
          ))}
        </Animated.View>
      ) : null}

      {(tipo === "lluvia" || tipo === "tormenta") && (
        <Animated.View style={[styles.rainLayer, { transform: [{ translateY: rainY }] }]}>
          {Array.from({ length: 18 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.rainDrop,
                {
                  left: `${(i * 17) % 100}%`,
                  top: (i % 5) * 28,
                  opacity: 0.35 + (i % 3) * 0.15,
                  backgroundColor: tipo === "tormenta" ? "#7EC8FF" : "#A8E0FF",
                },
              ]}
            />
          ))}
        </Animated.View>
      )}

      {tipo === "nieve" && (
        <Animated.View style={[styles.rainLayer, { transform: [{ translateY: rainY }] }]}>
          {Array.from({ length: 14 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.snowFlake,
                {
                  left: `${(i * 19) % 100}%`,
                  top: (i % 4) * 36,
                  opacity: 0.45 + (i % 3) * 0.15,
                },
              ]}
            />
          ))}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sunGlow: {
    position: "absolute",
    top: -40,
    right: -20,
    width: 260,
    height: 260,
    borderRadius: 130,
  },
  cloudBlob: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 999,
  },
  cloudA: { top: 70, left: -40, width: 220, height: 70 },
  cloudB: { top: 160, right: -50, width: 260, height: 80 },
  cloudC: { top: 280, left: 40, width: 180, height: 56, opacity: 0.7 },
  windLayer: {
    ...StyleSheet.absoluteFillObject,
    top: 20,
  },
  windStreak: {
    position: "absolute",
    height: 2,
    borderRadius: 2,
    backgroundColor: "rgba(230,245,255,0.85)",
    transform: [{ rotate: "-12deg" }],
  },
  rainLayer: {
    ...StyleSheet.absoluteFillObject,
    top: 40,
  },
  rainDrop: {
    position: "absolute",
    width: 2,
    height: 18,
    borderRadius: 2,
    transform: [{ rotate: "15deg" }],
  },
  snowFlake: {
    position: "absolute",
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.85)",
  },
});
