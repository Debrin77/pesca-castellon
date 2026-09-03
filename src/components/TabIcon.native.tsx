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

export default function TabIcon({ nombre, size = 30, focused }: Props) {
  const tint = COLOR_TAB[nombre];
  const box = size + 22;
  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: focused ? tint : tint,
          opacity: focused ? 1 : 0.88,
          borderColor: focused ? "#fff" : `${tint}aa`,
          width: box,
          height: box,
          borderRadius: box / 2,
          transform: [{ scale: focused ? 1.06 : 1 }],
        },
      ]}
    >
      <Ionicons name={ION[nombre]} size={size} color="#fff" />
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
