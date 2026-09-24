import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Platform,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

/**
 * Mark pequeño (favicons / chips). El wordmark bordado apenas se lee bajo ~72 px.
 * Para splash / Inicio / puerta usamos logo.png (hi-res) nitido y comprimido.
 */
const LOGO_MARK = require("../../assets/brand/mark.png");
const LOGO_HI = require("../../assets/brand/logo.png");

/** Umbral: a partir de aquí el wordmark del parche debe leerse. */
const HIRES_MIN = 72;

function resolverUri(mod: number): string | null {
  try {
    const resolved = Image.resolveAssetSource(mod) as { uri?: string } | null;
    return resolved?.uri ?? null;
  } catch {
    return null;
  }
}


/** Precarga el parche hi-res (y el mark) para que splash / Inicio no salgan en vacío. */
export function prefetchLogoMarca(): void {
  for (const mod of [LOGO_HI, LOGO_MARK]) {
    const uri = resolverUri(mod);
    if (!uri) continue;
    Image.prefetch(uri).catch(() => {
      /* red lenta / offline: onLoad del Image sigue siendo la fuente de verdad */
    });
  }
}

type Props = {
  /** Diámetro en px. */
  size?: number;
  /** Entrada suave (splash / puerta). */
  animar?: boolean;
  /** Fuerza logo.png hi-res (wordmark legible). */
  hiRes?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
  /** Se llama cuando el PNG ya está decodificado (o falla la carga). */
  onListo?: () => void;
};

/**
 * Marca del parche bordado: pez al atardecer + «VÁMONOS DE PESCA».
 * En Inicio y apertura usar tamaño ≥88 y hiRes para que se lea el texto.
 */
export default function LogoMarca({
  size = 72,
  animar = false,
  hiRes = false,
  style,
  accessibilityLabel = "Vámonos de pesca",
  onListo,
}: Props) {
  const opacity = useRef(new Animated.Value(animar ? 0 : 1)).current;
  const scale = useRef(new Animated.Value(animar ? 0.92 : 1)).current;
  const source = hiRes || size >= HIRES_MIN ? LOGO_HI : LOGO_MARK;
  const sombraGrande = size >= 200;
  const [cargado, setCargado] = useState(!animar);
  const listoRef = useRef(false);

  const avisarListo = () => {
    if (listoRef.current) return;
    listoRef.current = true;
    setCargado(true);
    onListo?.();
  };

  useEffect(() => {
    if (!animar || !cargado) return;
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 780,
        easing: Easing.out(Easing.cubic),
        // En web, native driver + overflow/radius en el mismo nodo a veces no pinta el PNG.
        useNativeDriver: Platform.OS !== "web",
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 8,
        tension: 52,
        useNativeDriver: Platform.OS !== "web",
      }),
    ]).start();
  }, [animar, cargado, opacity, scale]);

  // Red de seguridad: si onLoad no dispara (caché rara / web), no bloquear la apertura.
  useEffect(() => {
    if (!animar) {
      avisarListo();
      return;
    }
    const t = setTimeout(avisarListo, 2800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al montar
  }, [animar]);

  return (
    <Animated.View
      style={[
        sombraGrande ? styles.sombraHero : styles.sombra,
        { width: size, height: size, opacity, transform: [{ scale }] },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      {/* Clip circular separado del transform: evita pantallas en blanco en Safari iOS. */}
      <View style={[styles.clip, { width: size, height: size, borderRadius: size / 2 }]}>
        <Image
          source={source}
          style={{ width: size, height: size }}
          resizeMode="contain"
          onLoad={avisarListo}
          onError={avisarListo}
          accessibilityIgnoresInvertColors
        />
      </View>
    </Animated.View>
  );
}

/** Variante estática (headers / Inicio). Usa hi-res si el tamaño permite leer el wordmark. */
export function LogoMarcaEstatico({
  size = 36,
  style,
  accessibilityLabel = "Vámonos de pesca",
}: {
  size?: number;
  style?: ViewStyle;
  accessibilityLabel?: string;
}) {
  const source = size >= HIRES_MIN ? LOGO_HI : LOGO_MARK;
  return (
    <View
      style={[styles.sombra, { width: size, height: size }, style]}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      <View style={[styles.clip, { width: size, height: size, borderRadius: size / 2 }]}>
        <Image source={source} style={{ width: size, height: size }} resizeMode="contain" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  sombra: {
    // Sombra suave: el parche «flota» sin parecer pegatina.
    shadowColor: "#0c2c20",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  sombraHero: {
    shadowColor: "#0c2c20",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 10,
  },
});
