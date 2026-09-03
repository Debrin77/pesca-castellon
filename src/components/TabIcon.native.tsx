import React from "react";
import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLOR_TAB, NombreIcono } from "./tabTheme";

export type { NombreIcono };
export { COLOR_TAB };

interface Props {
  nombre: NombreIcono;
  size?: number;
  focused?: boolean;
  color?: string;
}

const ION: Record<NombreIcono, keyof typeof Ionicons.glyphMap> = {
  home: "home",
  water: "water",
  fish: "fish",
  construct: "construct",
  "partly-sunny": "partly-sunny",
  bookmark: "bookmark",
  book: "library",
};

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

/** Orbe liquid-glass nativo: tint + brillo + icono claro. */
export default function TabIcon({ nombre, size = 30, focused }: Props) {
  const tint = COLOR_TAB[nombre];
  const { r, g, b } = hexToRgb(tint);
  const box = size + 22;
  const fill = focused ? `rgba(${r},${g},${b},0.72)` : `rgba(${r},${g},${b},0.48)`;

  return (
    <View
      style={[
        styles.wrap,
        {
          width: box,
          height: box,
          borderRadius: box / 2,
          backgroundColor: fill,
          borderColor: focused ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.5)",
          transform: [{ scale: focused ? 1.06 : 1 }],
          shadowColor: tint,
          shadowOffset: { width: 0, height: 5 },
          shadowOpacity: focused ? 0.4 : 0.22,
          shadowRadius: 10,
          elevation: focused ? 7 : 4,
        },
      ]}
    >
      <View style={styles.shine} pointerEvents="none" />
      <Ionicons name={ION[nombre]} size={size - 2} color="#fff" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    overflow: "hidden",
  },
  shine: {
    position: "absolute",
    top: 2,
    left: "16%",
    right: "16%",
    height: "36%",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
});
