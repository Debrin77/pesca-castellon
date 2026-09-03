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

/** Orbe tintado nativo, más contenido y menos brillo. */
export default function TabIcon({ nombre, size = 24, focused }: Props) {
  const tint = COLOR_TAB[nombre];
  const { r, g, b } = hexToRgb(tint);
  const box = size + 16;
  const fill = focused ? `rgba(${r},${g},${b},0.78)` : `rgba(${r},${g},${b},0.42)`;

  return (
    <View
      style={[
        styles.wrap,
        {
          width: box,
          height: box,
          borderRadius: box / 2,
          backgroundColor: fill,
          borderColor: focused ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.4)",
          transform: [{ scale: focused ? 1.04 : 1 }],
          shadowColor: tint,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: focused ? 0.28 : 0.12,
          shadowRadius: 6,
          elevation: focused ? 4 : 2,
        },
      ]}
    >
      <Ionicons name={ION[nombre]} size={size - 2} color="#fff" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    overflow: "hidden",
  },
});
