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
  /** @deprecated Ignorado: el color lo marca la pestaña. */
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

export default function TabIcon({ nombre, size = 26, focused }: Props) {
  const tint = COLOR_TAB[nombre];
  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: focused ? tint : `${tint}22`,
          borderColor: focused ? tint : `${tint}55`,
          width: size + 18,
          height: size + 18,
          borderRadius: (size + 18) / 2.4,
        },
      ]}
    >
      <Ionicons name={ION[nombre]} size={size} color={focused ? "#fff" : tint} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center", borderWidth: 1.5 },
});
