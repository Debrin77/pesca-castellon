import React, { ReactNode } from "react";
import { View, StyleSheet, Platform, ViewStyle, StyleProp } from "react-native";
import { BlurView } from "expo-blur";
import { RADIUS } from "../theme";

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Intensidad del blur nativo (expo-blur). */
  intensity?: number;
  tint?: "light" | "dark" | "default";
  /** Variante más compacta (chips / barras del mapa). */
  compacto?: boolean;
  /** Tinte más oscuro (mapas costa / overlays). */
  oscuro?: boolean;
  accessibilityLabel?: string;
};

const webBlurLight: ViewStyle =
  Platform.OS === "web"
    ? ({
        backdropFilter: "blur(18px) saturate(170%)",
        WebkitBackdropFilter: "blur(18px) saturate(170%)",
      } as ViewStyle)
    : {};

const webBlurDark: ViewStyle =
  Platform.OS === "web"
    ? ({
        backdropFilter: "blur(20px) saturate(160%)",
        WebkitBackdropFilter: "blur(20px) saturate(160%)",
      } as ViewStyle)
    : {};

function esFondoTransparente(bg: ViewStyle["backgroundColor"]): boolean {
  if (bg == null) return false;
  if (bg === "transparent") return true;
  if (typeof bg !== "string") return false;
  const n = bg.replace(/\s/g, "").toLowerCase();
  return n === "rgba(0,0,0,0)" || n === "hsla(0,0%,0%,0)" || n === "#0000";
}

/** Layout va al contenedor de hijos; el resto (margen, borde…) al chrome. */
function partirEstilo(style?: StyleProp<ViewStyle>): {
  chrome: ViewStyle;
  contenido: ViewStyle;
} {
  const flat = (StyleSheet.flatten(style) ?? {}) as ViewStyle;
  const {
    flexDirection,
    alignItems,
    justifyContent,
    flexWrap,
    gap,
    rowGap,
    columnGap,
    padding,
    paddingTop,
    paddingBottom,
    paddingLeft,
    paddingRight,
    paddingHorizontal,
    paddingVertical,
    paddingStart,
    paddingEnd,
    minHeight,
    maxHeight,
    flex,
    flexGrow,
    flexShrink,
    flexBasis,
    width,
    height,
    ...chromeRaw
  } = flat;

  // `transparent` en el style del caller no debe anular el velo glass.
  const chrome: ViewStyle = { ...chromeRaw };
  if (esFondoTransparente(chrome.backgroundColor)) {
    delete chrome.backgroundColor;
  }

  return {
    chrome,
    contenido: {
      flexDirection,
      alignItems,
      justifyContent,
      flexWrap,
      gap,
      rowGap,
      columnGap,
      padding,
      paddingTop,
      paddingBottom,
      paddingLeft,
      paddingRight,
      paddingHorizontal,
      paddingVertical,
      paddingStart,
      paddingEnd,
      minHeight,
      maxHeight,
      flex,
      flexGrow,
      flexShrink,
      flexBasis,
      width,
      height,
    },
  };
}

/**
 * Liquid Glass ligero: blur + borde + velo translúcido.
 * Web: backdrop-filter. Nativo: BlurView.
 */
export default function GlassCard({
  children,
  style,
  intensity = 42,
  tint = "light",
  compacto = false,
  oscuro = false,
  accessibilityLabel,
}: Props) {
  const { chrome, contenido } = partirEstilo(style);

  if (Platform.OS === "web") {
    return (
      <View
        accessibilityLabel={accessibilityLabel}
        style={[
          styles.base,
          compacto && styles.compacto,
          oscuro ? styles.webOscuro : styles.webClaro,
          oscuro ? webBlurDark : webBlurLight,
          chrome,
          contenido,
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.base,
        compacto && styles.compacto,
        oscuro ? styles.nativoOscuro : styles.nativoClaro,
        chrome,
      ]}
    >
      <BlurView
        intensity={intensity}
        tint={oscuro ? "dark" : tint}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={[styles.velo, oscuro && styles.veloOscuro]} pointerEvents="none" />
      <View style={[styles.contenido, contenido]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: "rgba(255,255,255,0.55)",
  },
  compacto: {
    borderRadius: RADIUS.md,
  },
  webClaro: {
    backgroundColor: "rgba(255,255,255,0.42)",
  },
  webOscuro: {
    backgroundColor: "rgba(12,36,42,0.42)",
    borderColor: "rgba(255,255,255,0.22)",
  },
  nativoClaro: {
    backgroundColor: "rgba(255,255,255,0.28)",
  },
  nativoOscuro: {
    backgroundColor: "rgba(12,36,42,0.35)",
    borderColor: "rgba(255,255,255,0.22)",
  },
  velo: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(248,252,250,0.28)",
  },
  veloOscuro: {
    backgroundColor: "rgba(8,24,28,0.22)",
  },
  contenido: {
    position: "relative",
  },
});
