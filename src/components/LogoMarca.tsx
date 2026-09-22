import React, { useEffect, useRef } from "react";
import { Animated, Easing, Image, StyleSheet, View, ViewStyle } from "react-native";

const LOGO_MARK = require("../../assets/brand/mark.png");
/** Alta resolución (1024) para splash / puerta a tamaño pantalla. */
const LOGO_HI = require("../../assets/brand/logo.png");

type Props = {
  /** Diámetro en px. */
  size?: number;
  /** Entrada suave (splash / puerta). */
  animar?: boolean;
  /** Usa logo.png nitido cuando el tamaño es grande (pantalla completa). */
  hiRes?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
};

/**
 * Marca del parche bordado: pez al atardecer.
 * Usar grande (hiRes) en puerta/splash; pequeño en Inicio (no compite con el veredicto).
 */
export default function LogoMarca({
  size = 72,
  animar = false,
  hiRes = false,
  style,
  accessibilityLabel = "Pesca · marca",
}: Props) {
  const opacity = useRef(new Animated.Value(animar ? 0 : 1)).current;
  const scale = useRef(new Animated.Value(animar ? 0.92 : 1)).current;
  const source = hiRes || size >= 160 ? LOGO_HI : LOGO_MARK;
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
      <Image source={source} style={{ width: size, height: size }} resizeMode="contain" />
    </Animated.View>
  );
}

/** Variante estática (headers / chips) sin animación. */
export function LogoMarcaEstatico({ size = 36, style }: { size?: number; style?: ViewStyle }) {
  return (
    <View
      style={[styles.wrap, { width: size, height: size, borderRadius: size / 2 }, style]}
      accessibilityRole="image"
      accessibilityLabel="Pesca"
    >
      <Image source={LOGO_MARK} style={{ width: size, height: size }} resizeMode="contain" />
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
