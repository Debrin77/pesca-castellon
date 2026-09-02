import React from "react";
import { Text } from "react-native";

export type NombreIcono = "home" | "water" | "fish" | "construct" | "partly-sunny" | "bookmark";

const MAPA: Record<NombreIcono, string> = {
  home: "⌂",
  water: "≋",
  fish: "◉",
  construct: "⚒",
  "partly-sunny": "☀",
  bookmark: "✦",
};

interface Props {
  nombre: NombreIcono;
  color: string;
  size: number;
}

export default function TabIcon({ nombre, color, size }: Props) {
  return (
    <Text style={{ fontSize: size - 2, lineHeight: size + 2, color, fontWeight: "700" }}>
      {MAPA[nombre]}
    </Text>
  );
}
