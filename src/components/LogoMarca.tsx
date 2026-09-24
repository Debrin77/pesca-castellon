import React, { useEffect, useRef } from "react";
import { Animated, Easing, Image, StyleSheet, View, ViewStyle } from "react-native";

/**
 * Mark pequeño (favicons / chips). El wordmark bordado apenas se lee bajo ~72 px.
 * Para splash / Inicio / puerta usamos siempre logo.png (1024) nitido.
 */
const LOGO_MARK = require("../../assets/brand/mark.png");
const LOGO_HI = require("../../assets/brand/logo.png");

/** Umbral: a partir de aquí el wordmark del parche debe leerse. */
const HIRES_MIN = 72;

type Props = {
  /** Diámetro en px. */
  size?: number;
  /** Entrada suave (splash / puerta). */
  animar?: boolean;
  /** Fuerza logo.png 1024 (wordmark legible). */
  hiRes?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
};

/**
 * Marca del parche bordado: pez al atardecer + «BITÁCORA DE PESCA».
 * En Inicio y apertura usar tamaño ≥88 y hiRes para que se lea el texto.
 */
export default function LogoMarca({
  size = 72,
  animar = false,
  hiRes = false,
  style,
  accessibilityLabel = "Bitácora de pesca",
}: Props) {
  const opacity = useRef(new Animated.Value(animar ? 0 : 1)).current;
  const scale = useRef(new Animated.Value(animar ? 0.92 : 1)).current;
  const source = hiRes || size >= HIRES_MIN ? LOGO_HI : LOGO_MARK;
  const sombraGrande = size >= 200;

  useEffect(() => {
    if (!animar) return;
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 780,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 8,
        tension: 52,
        useNativeDriver: true,
      }),
    ]).start();
  }, [animar, opacity, scale]);

  return (
    <Animated.View
      style={[
        styles.wrap,
        sombraGrande ? styles.wrapHero : null,
        { width: size, height: size, borderRadius: size / 2, opacity, transform: [{ scale }] },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      <Image
        source={source}
        style={{ width: size, height: size }}
        resizeMode="contain"
        // Evita que la caché web se quede con el PNG antiguo sin wordmark.
        accessibilityIgnoresInvertColors
      />
    </Animated.View>
  );
}

/** Variante estática (headers / Inicio). Usa hi-res si el tamaño permite leer el wordmark. */
export function LogoMarcaEstatico({
  size = 36,
  style,
  accessibilityLabel = "Bitácora de pesca",
}: {
  size?: number;
  style?: ViewStyle;
  accessibilityLabel?: string;
}) {
  const source = size >= HIRES_MIN ? LOGO_HI : LOGO_MARK;
  return (
    <View
      style={[styles.wrap, { width: size, height: size, borderRadius: size / 2 }, style]}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      <Image source={source} style={{ width: size, height: size }} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    // Sombra suave: el parche «flota» sin parecer pegatina.
    shadowColor: "#0c2c20",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  wrapHero: {
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 10,
  },
});
