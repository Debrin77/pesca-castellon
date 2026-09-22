import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LogoMarca from "./LogoMarca";
import OndaAgua from "./OndaAgua";
import { COLORS, FONTS, GRADIENTS } from "../theme";

/** Duración mínima a pantalla completa en cada apertura (ms). */
export const LOGO_APERTURA_MS = 2200;

type Props = {
  /** Si true, el logo ya puede empezar a desvanecerse (listo backend). */
  listoParaSalir?: boolean;
  onFin?: () => void;
};

/**
 * Presentación de marca a pantalla completa al abrir la app
 * (y antes de la presentación de virtudes, si toca).
 */
export default function PantallaLogoApertura({ listoParaSalir = false, onFin }: Props) {
  const opacity = useRef(new Animated.Value(1)).current;
  const finLanzado = useRef(false);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Logo protagonista: casi a pantalla completa, con margen para tipografía.
  const usableH = Math.max(320, height - insets.top - insets.bottom);
  const logoSize = Math.min(width * 0.92, usableH * 0.72, Math.min(width, height) * 0.88);

  useEffect(() => {
    if (!listoParaSalir || finLanzado.current) return;
    finLanzado.current = true;
    Animated.timing(opacity, {
      toValue: 0,
      duration: 420,
      delay: 80,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onFin?.();
    });
  }, [listoParaSalir, onFin, opacity]);

  return (
    <View style={styles.root} accessibilityLabel="Cuaderno de pesca">
      <StatusBar style="light" />
      <LinearGradient colors={[...GRADIENTS.primary]} style={StyleSheet.absoluteFill} />
      <OndaAgua intensidad={0.9} />
      <Animated.View
        style={[
          styles.centro,
          {
            opacity,
            paddingTop: Math.max(insets.top, 12),
            paddingBottom: Math.max(insets.bottom, 20),
          },
        ]}
      >
        <LogoMarca
          size={logoSize}
          animar
          hiRes
          accessibilityLabel="Logo Cuaderno de pesca"
        />
        <View style={styles.textoBlock}>
          <Text style={styles.marca} accessibilityRole="header">
            Cuaderno de pesca
          </Text>
          <Text style={styles.eslogan}>Tu cuaderno de orilla · con criterio</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.primaryDark,
    alignItems: "center",
    justifyContent: "center",
  },
  centro: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    gap: 20,
  },
  textoBlock: {
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    maxWidth: 420,
  },
  /** Literata: tipografía de cuaderno / lectura de campo, sector pesca. */
  marca: {
    fontFamily: FONTS.brand,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: 0.2,
    color: "#f4f7f2",
    textAlign: "center",
    fontWeight: "700",
  },
  eslogan: {
    fontFamily: FONTS.displayItalic,
    fontSize: 15,
    lineHeight: 20,
    color: "rgba(255,255,255,0.82)",
    textAlign: "center",
    fontWeight: "600",
  },
});
