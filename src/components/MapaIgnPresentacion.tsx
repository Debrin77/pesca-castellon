import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Platform, Easing } from "react-native";
import { COLORS, FONTS, RADIUS } from "../theme";

type Marcador = {
  x: number; // % 0–100
  y: number;
  color: string;
  etiqueta: string;
  tipo?: "libre" | "coto" | "privado" | "yo" | "neutro";
};

const nativo = Platform.OS !== "web";

/**
 * Mapa estilizado tipo IGN/topográfico: rejilla UTM, curvas de nivel,
 * cauce y marcadores con halo. Solo presentación visual (no cartografía real).
 */
export default function MapaIgnPresentacion({
  titulo = "Cartografía de campo",
  subtitulo,
  marcadores,
  compacto,
  animar,
}: {
  titulo?: string;
  subtitulo?: string;
  marcadores: Marcador[];
  compacto?: boolean;
  animar?: boolean;
}) {
  const h = compacto ? 122 : 156;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animar) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: nativo,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: nativo,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [animar, pulse]);

  const haloScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.55] });
  const haloOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0.12] });

  return (
    <View style={[styles.wrap, { height: h }]}>
      <View style={styles.base} />
      <View style={styles.bosque} />
      <View style={styles.bosque2} />

      {/* Rejilla tipo UTM */}
      {[16, 32, 48, 64, 80].map((p) => (
        <View key={`v${p}`} style={[styles.gridV, { left: `${p}%` as `${number}%` }]} />
      ))}
      {[22, 44, 66, 88].map((p) => (
        <View key={`h${p}`} style={[styles.gridH, { top: `${p}%` as `${number}%` }]} />
      ))}

      {/* Etiquetas de cuadrícula */}
      <Text style={[styles.coord, { left: 6, top: 4 }]}>30T</Text>
      <Text style={[styles.coord, { right: 28, top: 4 }]}>YK</Text>

      {/* Curvas de nivel */}
      <View style={[styles.curva, styles.curva1]} />
      <View style={[styles.curva, styles.curva2]} />
      <View style={[styles.curva, styles.curva3]} />
      <View style={[styles.curva, styles.curva4]} />
      <View style={[styles.curva, styles.curva5]} />

      {/* Cauce / embalse */}
      <View style={styles.embalse} />
      <View style={styles.agua} />
      <View style={styles.afluente} />
      <View style={styles.orilla} />

      {/* Camino de servicio */}
      <View style={styles.camino} />

      {marcadores.map((m, idx) => (
        <View
          key={m.etiqueta}
          style={[
            styles.pinWrap,
            { left: `${m.x}%` as `${number}%`, top: `${m.y}%` as `${number}%` },
          ]}
        >
          {animar && idx === 0 ? (
            <Animated.View
              style={[
                styles.pinHaloPulse,
                {
                  borderColor: m.color,
                  transform: [{ scale: haloScale }],
                  opacity: haloOpacity,
                },
              ]}
            />
          ) : (
            <View style={[styles.pinHalo, { borderColor: m.color }]} />
          )}
          <View style={[styles.pin, { backgroundColor: m.color }]} />
          <View style={styles.label}>
            <View style={[styles.labelDot, { backgroundColor: m.color }]} />
            <Text style={styles.labelTxt} numberOfLines={1}>
              {m.etiqueta}
            </Text>
          </View>
        </View>
      ))}

      <View style={styles.barra}>
        <Text style={styles.barraTit}>{titulo}</Text>
        {subtitulo ? <Text style={styles.barraSub}>{subtitulo}</Text> : null}
      </View>
      <View style={styles.escala}>
        <View style={styles.escalaBar}>
          <View style={styles.escalaTick} />
          <View style={[styles.escalaTick, { right: 0 }]} />
        </View>
        <Text style={styles.escalaTxt}>1 km</Text>
      </View>
      <View style={styles.norte}>
        <Text style={styles.norteArrow}>▲</Text>
        <Text style={styles.norteTxt}>N</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    overflow: "hidden",
    backgroundColor: "#d6dfc6",
    position: "relative",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(80,100,60,0.35)",
  },
  base: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#d4dec2",
  },
  bosque: {
    position: "absolute",
    left: "55%",
    top: "8%",
    width: "48%",
    height: "42%",
    borderRadius: 80,
    backgroundColor: "rgba(90,130,70,0.16)",
  },
  bosque2: {
    position: "absolute",
    left: "-5%",
    bottom: "10%",
    width: "40%",
    height: "36%",
    borderRadius: 70,
    backgroundColor: "rgba(100,140,80,0.12)",
  },
  gridV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(70,90,50,0.32)",
  },
  gridH: {
    position: "absolute",
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(70,90,50,0.32)",
  },
  coord: {
    position: "absolute",
    fontSize: 8,
    fontFamily: FONTS.bold,
    fontWeight: "700",
    color: "rgba(70,90,50,0.55)",
    letterSpacing: 0.6,
    zIndex: 2,
  },
  curva: {
    position: "absolute",
    borderWidth: 1.15,
    borderColor: "rgba(150,105,55,0.48)",
    borderRadius: 999,
  },
  curva1: { width: 170, height: 96, top: 14, left: 28 },
  curva2: { width: 210, height: 124, top: 4, left: 10 },
  curva3: {
    width: 128,
    height: 74,
    bottom: 14,
    right: 18,
    borderColor: "rgba(150,105,55,0.36)",
  },
  curva4: {
    width: 78,
    height: 48,
    top: 32,
    right: 44,
    borderColor: "rgba(150,105,55,0.32)",
  },
  curva5: {
    width: 54,
    height: 34,
    top: 48,
    left: 70,
    borderColor: "rgba(150,105,55,0.28)",
    borderWidth: 1,
  },
  embalse: {
    position: "absolute",
    left: "10%",
    top: "38%",
    width: "46%",
    height: 46,
    borderRadius: 50,
    backgroundColor: "rgba(55,125,150,0.28)",
    transform: [{ rotate: "-10deg" }],
  },
  agua: {
    position: "absolute",
    left: "12%",
    top: "42%",
    width: "52%",
    height: 26,
    borderRadius: 40,
    backgroundColor: "rgba(60,130,155,0.62)",
    borderWidth: 1,
    borderColor: "rgba(30,90,110,0.5)",
    transform: [{ rotate: "-9deg" }],
  },
  afluente: {
    position: "absolute",
    left: "46%",
    top: "24%",
    width: 9,
    height: 56,
    borderRadius: 8,
    backgroundColor: "rgba(60,130,155,0.42)",
    transform: [{ rotate: "26deg" }],
  },
  orilla: {
    position: "absolute",
    left: "14%",
    top: "40%",
    width: "48%",
    height: 30,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: "rgba(40,90,70,0.25)",
    backgroundColor: "transparent",
    transform: [{ rotate: "-9deg" }],
  },
  camino: {
    position: "absolute",
    left: "8%",
    top: "72%",
    width: "70%",
    height: 2,
    backgroundColor: "rgba(120,95,55,0.35)",
    borderStyle: "dashed",
    borderWidth: 0,
    transform: [{ rotate: "4deg" }],
  },
  pinWrap: {
    position: "absolute",
    marginLeft: -8,
    marginTop: -8,
    zIndex: 5,
  },
  pinHalo: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    top: -4,
    left: -4,
    opacity: 0.5,
  },
  pinHaloPulse: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    top: -4,
    left: -4,
  },
  pin: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2.5,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  label: {
    position: "absolute",
    left: 18,
    top: -3,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.14)",
    maxWidth: 118,
  },
  labelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  labelTxt: {
    fontSize: 9,
    fontFamily: FONTS.bold,
    fontWeight: "700",
    color: COLORS.textPrimary,
    letterSpacing: 0.1,
  },
  barra: {
    position: "absolute",
    left: 8,
    bottom: 8,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 5,
    maxWidth: "58%",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.08)",
  },
  barraTit: {
    fontSize: 10,
    fontFamily: FONTS.extrabold,
    fontWeight: "800",
    color: COLORS.primaryDark,
    letterSpacing: 0.15,
  },
  barraSub: {
    fontSize: 9,
    fontFamily: FONTS.semibold,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  escala: {
    position: "absolute",
    right: 8,
    bottom: 8,
    alignItems: "center",
  },
  escalaBar: {
    width: 40,
    height: 3,
    backgroundColor: COLORS.primaryDark,
    borderRadius: 1,
    position: "relative",
  },
  escalaTick: {
    position: "absolute",
    top: -2,
    left: 0,
    width: 2,
    height: 7,
    backgroundColor: COLORS.primaryDark,
  },
  escalaTxt: {
    fontSize: 8,
    fontFamily: FONTS.bold,
    fontWeight: "700",
    color: COLORS.primaryDark,
    marginTop: 2,
  },
  norte: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 26,
    height: 28,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  norteArrow: {
    fontSize: 8,
    color: COLORS.danger,
    marginBottom: -2,
  },
  norteTxt: {
    fontSize: 10,
    fontFamily: FONTS.extrabold,
    fontWeight: "800",
    color: COLORS.primaryDark,
  },
});
