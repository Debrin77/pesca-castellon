import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS, RADIUS } from "../theme";

type Tipo = "cana" | "carrete" | "linea" | "senuelo" | "tecnica" | "habitat";

const META: Record<Tipo, { color: string; fondo: string; label: string; glyph: string }> = {
  cana: { color: "#0E4456", fondo: "#E6F3F7", label: "Caña", glyph: "🎣" },
  carrete: { color: "#164A36", fondo: "#E4EFE8", label: "Carrete", glyph: "◎" },
  linea: { color: "#1A6F8A", fondo: "#E6F3F7", label: "Línea", glyph: "⌇" },
  senuelo: { color: "#9A4A0A", fondo: "#FEF3E6", label: "Señuelo", glyph: "◆" },
  tecnica: { color: "#5A3D82", fondo: "#F0EAF8", label: "Técnica", glyph: "✦" },
  habitat: { color: "#246B3D", fondo: "#E4EFE8", label: "Hábitat", glyph: "◉" },
};

/** Chip gráfico a color para filas de aparejo / equipo. */
export default function IconoAparejo({
  tipo,
  size = 36,
}: {
  tipo: Tipo;
  size?: number;
}) {
  const m = META[tipo];
  return (
    <View
      style={[
        styles.orb,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: m.fondo,
          borderColor: m.color,
        },
      ]}
      accessibilityLabel={m.label}
    >
      <Text style={{ fontSize: size * 0.42, color: m.color, fontWeight: "800" }}>{m.glyph}</Text>
    </View>
  );
}

export function FilaAparejo({
  tipo,
  titulo,
  children,
}: {
  tipo: Tipo;
  titulo: string;
  children: React.ReactNode;
}) {
  const m = META[tipo];
  return (
    <View style={styles.fila}>
      <IconoAparejo tipo={tipo} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.titulo, { color: m.color }]}>{titulo}</Text>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  orb: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    marginRight: 12,
  },
  fila: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 14,
    paddingVertical: 4,
  },
  titulo: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: 2,
  },
});
