import React from "react";
import { View, Text, StyleSheet } from "react-native";
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

const GLIFO: Record<NombreIcono, string> = {
  home: "⌂",
  water: "≋",
  fish: "◉",
  construct: "⚒",
  "partly-sunny": "☀",
  bookmark: "★",
  book: "☰",
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
      <Text style={{ fontSize: size - 2, lineHeight: size, color: focused ? "#fff" : tint, fontWeight: "800" }}>
        {GLIFO[nombre]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center", borderWidth: 1.5 },
});
