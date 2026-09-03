import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { COLOR_TAB, NombreIcono } from "./tabTheme";

export type { NombreIcono };
export { COLOR_TAB };

interface Props {
  nombre: NombreIcono;
  size?: number;
  focused?: boolean;
  color?: string;
}

/** Emojis en orbe tintado (menos brillo, más producto). */
const EMOJI: Record<NombreIcono, string> = {
  home: "🏠",
  water: "🗺️",
  fish: "🐟",
  construct: "🎣",
  "partly-sunny": "⛅",
  bookmark: "⭐",
  book: "📖",
};

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export default function TabIcon({ nombre, size = 24, focused }: Props) {
  const tint = COLOR_TAB[nombre];
  const { r, g, b } = hexToRgb(tint);
  const box = size + 16;
  const fill = focused ? `rgba(${r},${g},${b},0.42)` : `rgba(${r},${g},${b},0.16)`;

  return (
    <View
      style={[
        styles.wrap,
        {
          width: box,
          height: box,
          borderRadius: box / 2,
          backgroundColor: fill,
          borderColor: focused ? `rgba(${r},${g},${b},0.35)` : "rgba(255,255,255,0.65)",
          transform: [{ scale: focused ? 1.04 : 1 }],
          ...(Platform.OS === "web"
            ? ({
                boxShadow: focused
                  ? `0 4px 12px rgba(${r},${g},${b},0.22), inset 0 1px 0 rgba(255,255,255,0.7)`
                  : `inset 0 1px 0 rgba(255,255,255,0.55)`,
              } as any)
            : {
                shadowColor: tint,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: focused ? 0.22 : 0.08,
                shadowRadius: 5,
                elevation: focused ? 3 : 1,
              }),
        },
      ]}
    >
      <Text style={{ fontSize: size - 2, lineHeight: size + 2 }}>{EMOJI[nombre]}</Text>
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
