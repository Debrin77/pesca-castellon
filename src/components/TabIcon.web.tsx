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

/** Emojis en orbe liquid-glass (vidrio tintado + brillo). */
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

export default function TabIcon({ nombre, size = 30, focused }: Props) {
  const tint = COLOR_TAB[nombre];
  const { r, g, b } = hexToRgb(tint);
  const box = size + 22;
  const fill = focused ? `rgba(${r},${g},${b},0.55)` : `rgba(${r},${g},${b},0.32)`;

  return (
    <View
      style={[
        styles.wrap,
        {
          width: box,
          height: box,
          borderRadius: box / 2,
          backgroundColor: fill,
          borderColor: focused ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.55)",
          transform: [{ scale: focused ? 1.08 : 1 }],
          ...(Platform.OS === "web"
            ? ({
                backdropFilter: "blur(10px) saturate(160%)",
                WebkitBackdropFilter: "blur(10px) saturate(160%)",
                boxShadow: focused
                  ? `0 8px 18px rgba(${r},${g},${b},0.35), inset 0 1px 0 rgba(255,255,255,0.85), inset 0 -6px 12px rgba(${r},${g},${b},0.25)`
                  : `0 4px 12px rgba(${r},${g},${b},0.22), inset 0 1px 0 rgba(255,255,255,0.7)`,
              } as any)
            : {
                shadowColor: tint,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: focused ? 0.35 : 0.2,
                shadowRadius: 8,
                elevation: focused ? 6 : 3,
              }),
        },
      ]}
    >
      <View style={styles.shine} pointerEvents="none" />
      <Text style={{ fontSize: size - 4, lineHeight: size }}>{EMOJI[nombre]}</Text>
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
    left: "18%",
    right: "18%",
    height: "38%",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.45)",
  },
});
