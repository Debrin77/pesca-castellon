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
export const LOGO_APERTURA_MS = 4200;

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

  // Solo wordmark abajo: el logo ocupa casi todo el alto útil.
  const padTop = Math.max(insets.top, 8);
  const padBottom = Math.max(insets.bottom, 16);
  const textoBudget = 88;
  const usableH = Math.max(280, height - padTop - padBottom - textoBudget);
  const logoSize = Math.min(width * 0.98, usableH);

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
    <View style={styles.root} accessibilityLabel="Bitácora de pesca">
      <StatusBar style="light" />
      <LinearGradient colors={[...GRADIENTS.primary]} style={StyleSheet.absoluteFill} />
      <OndaAgua intensidad={0.9} />
      <Animated.View
        style={[
          styles.centro,
          {
            opacity,
            paddingTop: padTop,
            paddingBottom: padBottom,
          },
        ]}
      >
        <View style={styles.logoStage}>
          <LogoMarca
            size={logoSize}
            animar
            hiRes
            accessibilityLabel="Logo Bitácora de pesca"
          />
        </View>
        <View style={styles.textoBlock} accessibilityRole="header">
          <Text style={styles.marcaLead}>Bitácora</Text>
          <Text style={styles.marcaTrail}>de pesca</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.primaryDark,
  },
  centro: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logoStage: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  textoBlock: {
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 24,
    paddingBottom: 10,
    maxWidth: 440,
  },
  /** Syne: geométrica moderna, contraste con el parche bordado. */
  marcaLead: {
    fontFamily: FONTS.brand,
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -0.8,
    color: "#fff6e8",
    textAlign: "center",
    fontWeight: "800",
  },
  marcaTrail: {
    fontFamily: FONTS.brandSemi,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 4.2,
    textTransform: "lowercase",
    color: "rgba(255, 246, 232, 0.72)",
    textAlign: "center",
    fontWeight: "600",
  },
});
