import React from "react";
import { View, Text, StyleSheet } from "react-native";
import {
  CriterioMedicion,
  PatronMedicion,
  etiquetaPatron,
} from "../data/criterioMedicion";
import PlacaMedicionEspecie from "./PlacaMedicionEspecie";
import { COLORS, RADIUS } from "../theme";

type Props = {
  criterio: CriterioMedicion;
  /** Valor numérico opcional (p. ej. "23") para anclar el mínimo en el diagrama. */
  valorMinimo?: string | null;
  compact?: boolean;
  /** Id de especie: placa con silueta reconocible de esa especie. */
  especieId?: string | null;
  nombre?: string | null;
};

/**
 * Cómo medir: placa técnica por especie (silueta + cota en español, cm/kg).
 * Norma: longitud total UE / RD 560 para peces óseos.
 */
export default function DiagramaMedicion({
  criterio,
  valorMinimo,
  compact,
  especieId,
  nombre,
}: Props) {
  const a11y = `Cómo medir: de ${criterio.desde} a ${criterio.hasta}. ${criterio.detalle}`;

  return (
    <View
      style={[styles.card, compact && styles.cardCompact]}
      accessibilityRole="summary"
      accessibilityLabel={a11y}
    >
      <View style={styles.headerRow}>
        <Text style={styles.kicker}>Cómo medir</Text>
        <Text style={styles.patronTag}>{etiquetaPatron(criterio.patron)}</Text>
      </View>

      <PlacaMedicionEspecie
        especieId={especieId}
        nombre={nombre}
        criterio={criterio}
        valorMinimo={valorMinimo}
      />

      <Text style={styles.detalle}>{criterio.detalle}</Text>
    </View>
  );
}

export type { PatronMedicion };

const styles = StyleSheet.create({
  card: {
    marginTop: 10,
    marginHorizontal: 16,
    marginBottom: 4,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  cardCompact: {
    marginHorizontal: 0,
    marginTop: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 8,
  },
  kicker: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.waterDark,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  patronTag: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textSecondary,
    flexShrink: 1,
    textAlign: "right",
  },
  detalle: {
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
});
