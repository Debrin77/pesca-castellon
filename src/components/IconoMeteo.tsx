import React, { useEffect, useRef } from "react";
import { Animated, Easing, Platform, StyleSheet, View } from "react-native";
import { tipoMeteoDeCodigo, TipoMeteo } from "./meteoSky";

export type { TipoMeteo };
export { tipoMeteoDeCodigo };

interface Props {
  codigo: number;
  size?: number;
  etiqueta: string;
  /** Conservado por compatibilidad; los iconos van siempre a color. */
  sobreOscuro?: boolean;
}

const nativo = Platform.OS !== "web";

const PALETTE = {
  sol: "#FFD60A",
  solRayo: "#FFCC00",
  solBorde: "#F5A623",
  nube: "#FFFFFF",
  nubeSombra: "#E8EEF4",
  nubeGris: "#D5DEE8",
  nubeOscura: "#9AADC0",
  lluvia: "#5AC8FA",
  lluviaFuerte: "#0A84FF",
  rayo: "#FFD60A",
  nieve: "#F2F7FC",
  nieveBorde: "#A8C0D8",
  niebla: "rgba(255,255,255,0.55)",
};

/** Icono meteo a todo color, estilo app Tiempo, con animación continua. */
export default function IconoMeteo({ codigo, size = 56, etiqueta }: Props) {
  const tipo = tipoMeteoDeCodigo(codigo);
  const rot = useRef(new Animated.Value(0)).current;
  const nubesX = useRef(new Animated.Value(0)).current;
  const gota = useRef(new Animated.Value(0)).current;
  const flash = useRef(new Animated.Value(1)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const running: Animated.CompositeAnimation[] = [];

    if (tipo === "sol" || tipo === "solNubes") {
      const a = Animated.loop(
        Animated.timing(rot, {
          toValue: 1,
          duration: 14000,
          easing: Easing.linear,
          useNativeDriver: nativo,
        })
      );
      a.start();
      running.push(a);
    }

    if (tipo !== "sol") {
      const a = Animated.loop(
        Animated.sequence([
          Animated.timing(nubesX, {
            toValue: 1,
            duration: 2800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: nativo,
          }),
          Animated.timing(nubesX, {
            toValue: 0,
            duration: 2800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: nativo,
          }),
        ])
      );
      a.start();
      running.push(a);
    }

    if (tipo === "lluvia" || tipo === "tormenta" || tipo === "nieve") {
      const a = Animated.loop(
        Animated.timing(gota, {
          toValue: 1,
          duration: tipo === "nieve" ? 1600 : 900,
          easing: Easing.linear,
          useNativeDriver: nativo,
        })
      );
      a.start();
      running.push(a);
    }

    if (tipo === "tormenta") {
      const a = Animated.loop(
        Animated.sequence([
          Animated.timing(flash, { toValue: 0.15, duration: 80, useNativeDriver: nativo }),
          Animated.timing(flash, { toValue: 1, duration: 120, useNativeDriver: nativo }),
          Animated.delay(1400),
          Animated.timing(flash, { toValue: 0.35, duration: 60, useNativeDriver: nativo }),
          Animated.timing(flash, { toValue: 1, duration: 100, useNativeDriver: nativo }),
          Animated.delay(2200),
        ])
      );
      a.start();
      running.push(a);
    }

    if (tipo === "niebla") {
      const a = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 2200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: nativo,
          }),
          Animated.timing(pulse, {
            toValue: 0,
            duration: 2200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: nativo,
          }),
        ])
      );
      a.start();
      running.push(a);
    }

    return () => running.forEach((a) => a.stop());
  }, [flash, gota, nubesX, pulse, rot, tipo]);

  const spin = rot.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const drift = nubesX.interpolate({ inputRange: [0, 1], outputRange: [-size * 0.06, size * 0.06] });
  const fall = gota.interpolate({ inputRange: [0, 1], outputRange: [0, Math.max(12, size * 0.28)] });
  const fallOp = gota.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 0.85, 0] });
  const fogOp = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.9] });

  const s = size;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={etiqueta}
      style={{ width: s, height: s, alignItems: "center", justifyContent: "center" }}
    >
      {(tipo === "sol" || tipo === "solNubes") && (
        <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                alignItems: "center",
                justifyContent: "center",
                transform: [{ rotate: spin }],
                opacity: tipo === "solNubes" ? 0.95 : 1,
              },
            ]}
          >
            {[0, 30, 60, 90, 120, 150].map((deg) => (
              <View
                key={deg}
                style={{
                  position: "absolute",
                  left: s / 2 - Math.max(2, s * 0.035),
                  top: s * 0.04,
                  width: Math.max(3, s * 0.07),
                  height: s * 0.92,
                  borderRadius: 99,
                  backgroundColor: PALETTE.solRayo,
                  opacity: 0.85,
                  transform: [{ rotate: `${deg}deg` }],
                }}
              />
            ))}
          </Animated.View>
          <View
            style={{
              width: s * (tipo === "solNubes" ? 0.38 : 0.46),
              height: s * (tipo === "solNubes" ? 0.38 : 0.46),
              borderRadius: s,
              backgroundColor: PALETTE.sol,
              borderWidth: Math.max(2, s * 0.04),
              borderColor: PALETTE.solBorde,
              marginRight: tipo === "solNubes" ? s * 0.18 : 0,
              marginBottom: tipo === "solNubes" ? s * 0.12 : 0,
              ...(Platform.OS === "web"
                ? ({ boxShadow: `0 0 ${s * 0.2}px rgba(255,214,10,0.55)` } as any)
                : {
                    shadowColor: PALETTE.sol,
                    shadowOpacity: 0.55,
                    shadowRadius: s * 0.12,
                    shadowOffset: { width: 0, height: 0 },
                  }),
            }}
          />
        </View>
      )}

      {tipo !== "sol" && (
        <Animated.View
          style={{
            alignItems: "center",
            justifyContent: "center",
            transform: [{ translateX: drift }],
            marginTop: tipo === "solNubes" ? s * 0.12 : 0,
          }}
        >
          <Nube
            width={s * (tipo === "solNubes" ? 0.72 : 0.78)}
            height={s * 0.42}
            color={tipo === "tormenta" || tipo === "nubes" ? PALETTE.nubeOscura : PALETTE.nube}
            shade={tipo === "tormenta" ? "#6B7F94" : PALETTE.nubeSombra}
          />

          {(tipo === "lluvia" || tipo === "tormenta") && (
            <View style={{ flexDirection: "row", gap: Math.max(4, s * 0.08), marginTop: 2, height: s * 0.32 }}>
              {[0, 1, 2, 3].map((i) => (
                <Animated.View
                  key={i}
                  style={{
                    width: Math.max(3, s * 0.055),
                    height: Math.max(10, s * 0.2),
                    borderRadius: 99,
                    backgroundColor: tipo === "tormenta" ? PALETTE.lluviaFuerte : PALETTE.lluvia,
                    opacity: fallOp,
                    transform: [{ translateY: fall }, { rotate: "12deg" }],
                    marginTop: (i % 2) * 4,
                  }}
                />
              ))}
            </View>
          )}

          {tipo === "nieve" && (
            <View style={{ flexDirection: "row", gap: Math.max(6, s * 0.1), marginTop: 2, height: s * 0.28 }}>
              {[0, 1, 2].map((i) => (
                <Animated.View
                  key={i}
                  style={{
                    width: Math.max(7, s * 0.12),
                    height: Math.max(7, s * 0.12),
                    borderRadius: 99,
                    backgroundColor: PALETTE.nieve,
                    borderWidth: 1.5,
                    borderColor: PALETTE.nieveBorde,
                    opacity: fallOp,
                    transform: [{ translateY: fall }],
                  }}
                />
              ))}
            </View>
          )}

          {tipo === "tormenta" && (
            <Animated.View
              style={{
                position: "absolute",
                top: s * 0.28,
                opacity: flash,
                ...(Platform.OS === "web"
                  ? ({ filter: "drop-shadow(0 0 6px rgba(255,214,10,0.8))" } as any)
                  : null),
              }}
            >
              <View
                style={{
                  width: 0,
                  height: 0,
                  borderLeftWidth: s * 0.1,
                  borderRightWidth: s * 0.1,
                  borderTopWidth: s * 0.22,
                  borderLeftColor: "transparent",
                  borderRightColor: "transparent",
                  borderTopColor: PALETTE.rayo,
                  transform: [{ rotate: "180deg" }],
                }}
              />
              <View
                style={{
                  width: 0,
                  height: 0,
                  marginTop: -s * 0.06,
                  marginLeft: s * 0.04,
                  borderLeftWidth: s * 0.08,
                  borderRightWidth: s * 0.08,
                  borderTopWidth: s * 0.18,
                  borderLeftColor: "transparent",
                  borderRightColor: "transparent",
                  borderTopColor: PALETTE.rayo,
                  transform: [{ rotate: "180deg" }],
                }}
              />
            </Animated.View>
          )}

          {tipo === "niebla" && (
            <Animated.View style={{ marginTop: s * 0.06, width: s * 0.7, opacity: fogOp }}>
              <View style={styles.fogLine} />
              <View style={[styles.fogLine, { width: "82%", alignSelf: "center", marginTop: 5 }]} />
              <View style={[styles.fogLine, { width: "64%", alignSelf: "center", marginTop: 5 }]} />
            </Animated.View>
          )}
        </Animated.View>
      )}
    </View>
  );
}

function Nube({
  width,
  height,
  color,
  shade,
}: {
  width: number;
  height: number;
  color: string;
  shade: string;
}) {
  return (
    <View style={{ width, height, alignItems: "center", justifyContent: "flex-end" }}>
      <View
        style={{
          position: "absolute",
          left: width * 0.08,
          bottom: height * 0.08,
          width: width * 0.42,
          height: height * 0.72,
          borderRadius: width,
          backgroundColor: shade,
        }}
      />
      <View
        style={{
          position: "absolute",
          right: width * 0.05,
          bottom: height * 0.1,
          width: width * 0.48,
          height: height * 0.78,
          borderRadius: width,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          position: "absolute",
          left: width * 0.28,
          top: 0,
          width: width * 0.46,
          height: height * 0.85,
          borderRadius: width,
          backgroundColor: color,
          ...(Platform.OS === "web"
            ? ({ boxShadow: "0 4px 12px rgba(20,40,60,0.18)" } as any)
            : {
                shadowColor: "#14283c",
                shadowOpacity: 0.18,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 3 },
              }),
        }}
      />
      <View
        style={{
          width: width * 0.92,
          height: height * 0.48,
          borderRadius: height,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fogLine: {
    height: 5,
    borderRadius: 3,
    backgroundColor: PALETTE.niebla,
    width: "100%",
  },
});
