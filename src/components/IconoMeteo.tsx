import React, { useEffect, useRef } from "react";
import { Animated, Easing, Platform, StyleSheet, View } from "react-native";

export type TipoMeteo = "sol" | "nubes" | "lluvia" | "tormenta" | "niebla" | "nieve";

export function tipoMeteoDeCodigo(codigo: number): TipoMeteo {
  if (codigo === 0 || codigo === 1) return "sol";
  if (codigo === 2 || codigo === 3) return "nubes";
  if (codigo === 45 || codigo === 48) return "niebla";
  if ([71, 73, 75].includes(codigo)) return "nieve";
  if ([95, 96, 99, 82].includes(codigo)) return "tormenta";
  if ([51, 53, 55, 61, 63, 65, 80, 81].includes(codigo)) return "lluvia";
  return "nubes";
}

interface Props {
  codigo: number;
  size?: number;
  etiqueta: string;
  sobreOscuro?: boolean;
}

const nativo = Platform.OS !== "web";

/** Icono climático vectorial (no emoji) con animación. Contraste sobre fondo claro. */
export default function IconoMeteo({ codigo, size = 56, etiqueta, sobreOscuro = false }: Props) {
  const tipo = tipoMeteoDeCodigo(codigo);
  const tinta = sobreOscuro ? "#f4f7f4" : "#2a3832";
  const tintaSuave = sobreOscuro ? "#c5d0c8" : "#6b7c74";
  const sol = sobreOscuro ? "#f6e7b8" : "#a87b12";
  const solBorde = sobreOscuro ? "#fff8e1" : "#5c4308";
  const rayo = sobreOscuro ? "#f6e7b8" : "#c4921a";
  const agua = sobreOscuro ? "#d7eef5" : "#0e4456";
  const rot = useRef(new Animated.Value(0)).current;
  const nubesX = useRef(new Animated.Value(0)).current;
  const gota = useRef(new Animated.Value(0)).current;
  const flash = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const running: Animated.CompositeAnimation[] = [];
    if (tipo === "sol") {
      const a = Animated.loop(
        Animated.timing(rot, { toValue: 1, duration: 16000, easing: Easing.linear, useNativeDriver: nativo })
      );
      a.start();
      running.push(a);
    } else {
      const a = Animated.loop(
        Animated.sequence([
          Animated.timing(nubesX, {
            toValue: 1,
            duration: 2600,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: nativo,
          }),
          Animated.timing(nubesX, {
            toValue: 0,
            duration: 2600,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: nativo,
          }),
        ])
      );
      a.start();
      running.push(a);
    }
    if (tipo === "lluvia" || tipo === "tormenta" || tipo === "nieve") {
      const a = Animated.loop(
        Animated.timing(gota, { toValue: 1, duration: 1100, easing: Easing.linear, useNativeDriver: nativo })
      );
      a.start();
      running.push(a);
    }
    if (tipo === "tormenta") {
      const a = Animated.loop(
        Animated.sequence([
          Animated.timing(flash, { toValue: 0.25, duration: 90, useNativeDriver: nativo }),
          Animated.timing(flash, { toValue: 1, duration: 160, useNativeDriver: nativo }),
          Animated.delay(1600),
        ])
      );
      a.start();
      running.push(a);
    }
    return () => running.forEach((a) => a.stop());
  }, [flash, gota, nubesX, rot, tipo]);

  const spin = rot.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const drift = nubesX.interpolate({ inputRange: [0, 1], outputRange: [-4, 4] });
  const fall = gota.interpolate({ inputRange: [0, 1], outputRange: [0, Math.max(10, size * 0.2)] });
  const fallOp = gota.interpolate({ inputRange: [0, 0.75, 1], outputRange: [1, 0.75, 0] });

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={etiqueta}
      style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}
    >
      {tipo === "sol" ? (
        <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
          <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: spin }] }]}>
            {[0, 45, 90, 135].map((deg) => (
              <View
                key={deg}
                style={{
                  position: "absolute",
                  left: size / 2 - 2,
                  top: size * 0.06,
                  width: 4,
                  height: size * 0.88,
                  borderRadius: 2,
                  backgroundColor: rayo,
                  transform: [{ rotate: `${deg}deg` }],
                }}
              />
            ))}
          </Animated.View>
          <View
            style={{
              width: size * 0.42,
              height: size * 0.42,
              borderRadius: size,
              backgroundColor: sol,
              borderWidth: 3,
              borderColor: solBorde,
            }}
          />
        </View>
      ) : (
        <Animated.View style={{ alignItems: "center", transform: [{ translateX: drift }] }}>
          <View
            style={{
              width: size * 0.7,
              height: size * 0.38,
              borderRadius: size,
              backgroundColor: tipo === "niebla" ? tintaSuave : tinta,
            }}
          />
          <View
            style={{
              width: size * 0.42,
              height: size * 0.28,
              borderRadius: size,
              backgroundColor: sobreOscuro ? "#9aada4" : "#2a3832",
              marginTop: -size * 0.22,
              marginLeft: -size * 0.18,
            }}
          />
          {(tipo === "lluvia" || tipo === "tormenta") && (
            <View style={{ flexDirection: "row", gap: 6, marginTop: 4, height: size * 0.28 }}>
              {[0, 1, 2].map((i) => (
                <Animated.View
                  key={i}
                  style={{
                    width: 5,
                    height: 12,
                    borderRadius: 3,
                    backgroundColor: agua,
                    opacity: fallOp,
                    transform: [{ translateY: fall }],
                    marginTop: i * 3,
                  }}
                />
              ))}
            </View>
          )}
          {tipo === "nieve" && (
            <View style={{ flexDirection: "row", gap: 8, marginTop: 4, height: size * 0.24 }}>
              {[0, 1, 2].map((i) => (
                <Animated.View
                  key={i}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: agua,
                    borderWidth: 1.5,
                    borderColor: sobreOscuro ? "#0c2c20" : "#ffffff",
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
                width: 0,
                height: 0,
                marginTop: -size * 0.08,
                borderLeftWidth: 7,
                borderRightWidth: 7,
                borderBottomWidth: 16,
                borderLeftColor: "transparent",
                borderRightColor: "transparent",
                borderBottomColor: sol,
                opacity: flash,
              }}
            />
          )}
          {tipo === "niebla" && (
            <View style={{ marginTop: 6, width: size * 0.62 }}>
              <View style={{ height: 4, borderRadius: 2, backgroundColor: tinta, marginBottom: 4 }} />
              <View style={{ height: 4, borderRadius: 2, backgroundColor: tinta, width: "78%", alignSelf: "center" }} />
            </View>
          )}
        </Animated.View>
      )}
    </View>
  );
}
