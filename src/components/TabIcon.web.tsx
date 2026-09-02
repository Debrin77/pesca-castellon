import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLOR_TAB, NombreIcono } from "./tabTheme";

export type { NombreIcono };
export { COLOR_TAB };

interface Props {
  nombre: NombreIcono;
  size?: number;
  focused?: boolean;
  color?: string;
}

/** Emojis a todo color: se identifican al instante en móvil/web. */
const EMOJI: Record<NombreIcono, string> = {
  home: "🏠",
  water: "🗺️",
  fish: "🐟",
  construct: "🎣",
  "partly-sunny": "⛅",
  bookmark: "⭐",
  book: "📖",
};

export default function TabIcon({ nombre, size = 30, focused }: Props) {
  const tint = COLOR_TAB[nombre];
  const box = size + 22;
  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: tint,
          opacity: focused ? 1 : 0.9,
          borderColor: focused ? "#ffffff" : `${tint}cc`,
          width: box,
          height: box,
          borderRadius: box / 2,
          transform: [{ scale: focused ? 1.08 : 1 }],
        },
      ]}
    >
      <Text style={{ fontSize: size - 4, lineHeight: size }}>{EMOJI[nombre]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
});
