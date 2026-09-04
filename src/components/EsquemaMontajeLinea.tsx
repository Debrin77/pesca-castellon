import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { MontajeEspecie, PiezaMontaje } from "../data/montajesEspecie";
import { COLORS, RADIUS } from "../theme";

type Props = {
  montaje: MontajeEspecie;
  width?: number;
};

const COLOR_PIEZA: Record<PiezaMontaje["tipo"], string> = {
  linea: COLORS.waterDark,
  emerillon: "#6B7280",
  snap: "#4B5563",
  boya: COLORS.danger,
  plomo: "#7A8690",
  anzuelo: COLORS.gold,
  senuelo: COLORS.primary,
  cebo: "#C45C12",
};

/**
 * Esquema vertical de la línea: de la caña al señuelo/cebo.
 * Pensado para que un principiante vea el orden de un vistazo.
 */
export default function EsquemaMontajeLinea({ montaje, width = 320 }: Props) {
  return (
    <View
      style={[styles.wrap, { width }]}
      accessibilityLabel={`Montaje: ${montaje.titulo}. ${montaje.piezas.map((p) => p.etiqueta).join(", ")}`}
    >
      <Text style={styles.kicker}>Orden del aparejo (de la caña al final)</Text>
      {montaje.piezas.map((p, i) => (
        <View key={`${p.etiqueta}-${i}`} style={styles.row}>
          <View style={styles.rail}>
            <View style={[styles.dot, { backgroundColor: COLOR_PIEZA[p.tipo] }]} />
            {i < montaje.piezas.length - 1 ? <View style={styles.line} /> : null}
          </View>
          <View style={[styles.chip, { borderColor: COLOR_PIEZA[p.tipo] }]}>
            <Text style={styles.tipo}>{etiquetaTipo(p.tipo)}</Text>
            <Text style={styles.etiqueta}>{p.etiqueta}</Text>
            {p.detalle ? <Text style={styles.detalle}>{p.detalle}</Text> : null}
          </View>
        </View>
      ))}
      <Text style={styles.alt}>Alternativa: {montaje.alternativa}</Text>
      {montaje.regulacion.length > 0 ? (
        <View style={styles.regBox}>
          <Text style={styles.regTitle}>Cómo regular</Text>
          {montaje.regulacion.map((r, i) => (
            <Text key={i} style={styles.regItem}>
              · {r}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function etiquetaTipo(t: PiezaMontaje["tipo"]): string {
  switch (t) {
    case "linea":
      return "Línea";
    case "emerillon":
      return "Emerillón";
    case "snap":
      return "Snap";
    case "boya":
      return "Boya";
    case "plomo":
      return "Plomo";
    case "anzuelo":
      return "Anzuelo";
    case "senuelo":
      return "Señuelo";
    case "cebo":
      return "Cebo";
    default:
      return "Pieza";
  }
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "center",
    backgroundColor: COLORS.mist,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    marginTop: 10,
  },
  kicker: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.waterDark,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  row: { flexDirection: "row", alignItems: "stretch", minHeight: 52 },
  rail: { width: 18, alignItems: "center" },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 14,
    borderWidth: 2,
    borderColor: "#fff",
  },
  line: {
    flex: 1,
    width: 3,
    backgroundColor: COLORS.water,
    marginTop: 2,
    marginBottom: 0,
    borderRadius: 2,
  },
  chip: {
    flex: 1,
    marginLeft: 8,
    marginBottom: 8,
    backgroundColor: "#fff",
    borderRadius: RADIUS.sm,
    borderLeftWidth: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  tipo: { fontSize: 10, fontWeight: "800", color: COLORS.textMuted, textTransform: "uppercase" },
  etiqueta: { fontSize: 14, fontWeight: "800", color: COLORS.textPrimary, marginTop: 1 },
  detalle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2, lineHeight: 16 },
  alt: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  regBox: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  regTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.primaryDark,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  regItem: { fontSize: 12, lineHeight: 17, color: COLORS.textSecondary, marginBottom: 2 },
});
