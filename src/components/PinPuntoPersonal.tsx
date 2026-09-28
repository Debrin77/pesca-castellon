import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { glyphIconoPunto, hexColorPunto } from "../data/iconosPunto";

type Props = {
  color?: string | null;
  icono?: string | null;
  /** Captura del diario: fuerza terracota si no hay color propio. */
  captura?: boolean;
  size?: number;
};

/**
 * Pin custom para spots personales (mapa nativo).
 * En web el mapa Leaflet usa HTML equivalente vía identifier/pinColor+title.
 */
export default function PinPuntoPersonal({
  color,
  icono,
  captura = false,
  size = 32,
}: Props) {
  const hex = color ? hexColorPunto(color) : captura ? "#a84828" : hexColorPunto("oro");
  const glyph = glyphIconoPunto(icono ?? "spot");
  const r = size / 2;
  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size + 8,
        },
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View
        style={[
          styles.bubble,
          {
            width: size,
            height: size,
            borderRadius: r,
            backgroundColor: hex,
          },
        ]}
      >
        <Text style={[styles.glyph, { fontSize: size * 0.42 }]}>{glyph}</Text>
      </View>
      <View style={[styles.tip, { borderTopColor: hex }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center" },
  bubble: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.92)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.35,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  glyph: {
    color: "#fff",
    fontWeight: "800",
    textAlign: "center",
    marginTop: -1,
  },
  tip: {
    width: 0,
    height: 0,
    marginTop: -2,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
});
