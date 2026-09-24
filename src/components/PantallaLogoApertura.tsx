import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LogoMarca from "./LogoMarca";
import OndaAgua from "./OndaAgua";
import { COLORS, GRADIENTS } from "../theme";

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
 * El wordmark «Vámonos de pesca» va bordado en el propio parche.
 */
export default function PantallaLogoApertura({ listoParaSalir = false, onFin }: Props) {
  const opacity = useRef(new Animated.Value(1)).current;
  const finLanzado = useRef(false);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const padTop = Math.max(insets.top, 8);
  const padBottom = Math.max(insets.bottom, 16);
  const usableH = Math.max(280, height - padTop - padBottom);
  const logoSize = Math.min(width * 0.92, usableH * 0.92);

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
    <View style={styles.root} accessibilityLabel="Vámonos de pesca">
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
            accessibilityLabel="Logo Vámonos de pesca"
          />
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
    justifyContent: "center",
  },
  logoStage: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
});
