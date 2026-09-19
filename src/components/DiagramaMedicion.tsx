import React from "react";
import { View, Text, StyleSheet } from "react-native";
import {
  CriterioMedicion,
  PatronMedicion,
  etiquetaPatron,
} from "../data/criterioMedicion";
import { COLORS, RADIUS } from "../theme";

type Props = {
  criterio: CriterioMedicion;
  /** Valor numérico opcional (p. ej. "23") para anclar el mínimo en el diagrama. */
  valorMinimo?: string | null;
  compact?: boolean;
};

function Silueta({ patron }: { patron: PatronMedicion }) {
  const cuerpo = COLORS.water;
  const borde = COLORS.waterDark;
  const vientre = COLORS.waterLight;

  if (patron === "pulpo_peso") {
    return (
      <View style={styles.silCaja} accessibilityElementsHidden>
        <View style={[styles.pulpoCabeza, { backgroundColor: cuerpo, borderColor: borde }]} />
        <View style={styles.pulpoBrazos}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View
              key={i}
              style={[
                styles.pulpoBrazo,
                { backgroundColor: i % 2 ? vientre : cuerpo, transform: [{ rotate: `${(i - 2) * 7}deg` }] },
              ]}
            />
          ))}
        </View>
      </View>
    );
  }

  if (patron === "cefalopodo_manto") {
    return (
      <View style={styles.silCaja} accessibilityElementsHidden>
        <View style={[styles.manto, { backgroundColor: cuerpo, borderColor: borde }]} />
        <View style={[styles.mantoAleta, { backgroundColor: vientre }]} />
        <View style={styles.mantoTent}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.mantoTentItem, { backgroundColor: borde }]} />
          ))}
        </View>
      </View>
    );
  }

  if (patron === "cangrejo_caparazon") {
    return (
      <View style={styles.silCaja} accessibilityElementsHidden>
        <View style={styles.cangrejoFila}>
          <View style={[styles.cangrejoPinza, { backgroundColor: borde, transform: [{ rotate: "-20deg" }] }]} />
          <View style={[styles.cangrejoCap, { backgroundColor: cuerpo, borderColor: borde }]} />
          <View style={[styles.cangrejoPinza, { backgroundColor: borde, transform: [{ rotate: "20deg" }] }]} />
        </View>
      </View>
    );
  }

  if (patron === "anguila") {
    return (
      <View style={styles.silCaja} accessibilityElementsHidden>
        <View style={[styles.anguilaCuerpo, { backgroundColor: cuerpo, borderColor: borde }]} />
      </View>
    );
  }

  // pez_total / pez_horquilla
  return (
    <View style={[styles.silCaja, styles.pezFila]} accessibilityElementsHidden>
      <View style={styles.pezHocicoDot} />
      <View style={[styles.pezCuerpo, { backgroundColor: cuerpo, borderColor: borde }]}>
        <View style={[styles.pezVientre, { backgroundColor: vientre }]} />
        <View style={styles.pezOjo} />
      </View>
      <View style={styles.pezColaWrap}>
        <View style={[styles.pezColaLobo, { borderLeftColor: borde, transform: [{ rotate: "-18deg" }] }]} />
        <View style={[styles.pezColaLobo, { borderLeftColor: borde, transform: [{ rotate: "18deg" }], marginTop: -10 }]} />
        {patron === "pez_horquilla" ? <View style={styles.horquillaMark} /> : null}
      </View>
    </View>
  );
}

function BarraMedicion({
  criterio,
  valorMinimo,
}: {
  criterio: CriterioMedicion;
  valorMinimo?: string | null;
}) {
  const esPeso = criterio.patron === "pulpo_peso" || criterio.unidad === "kg";
  return (
    <View style={styles.barraWrap}>
      <View style={styles.extremos}>
        <View style={styles.extremo}>
          <View style={styles.puntoA} />
          <Text style={styles.extremoLabel} numberOfLines={2}>
            {criterio.desde}
          </Text>
        </View>
        <View style={styles.extremoRight}>
          <View style={styles.puntoB} />
          <Text style={[styles.extremoLabel, styles.extremoLabelRight]} numberOfLines={2}>
            {criterio.hasta}
          </Text>
        </View>
      </View>
      <View style={styles.lineaFila}>
        <View style={styles.tick} />
        <View style={styles.linea}>
          {valorMinimo ? (
            <View style={styles.badgeMin}>
              <Text style={styles.badgeMinTxt}>
                mín. {valorMinimo} {criterio.unidad}
              </Text>
            </View>
          ) : (
            <Text style={styles.flechaTxt}>{esPeso ? "peso" : "medida"}</Text>
          )}
        </View>
        <View style={styles.tick} />
      </View>
    </View>
  );
}

/**
 * Diagrama A→B: de dónde a dónde se mide el ejemplar para la talla/peso mínimo.
 */
export default function DiagramaMedicion({ criterio, valorMinimo, compact }: Props) {
  const a11y = `Cómo medir: ${criterio.desde} hasta ${criterio.hasta}. ${criterio.detalle}`;

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
      <View style={styles.visual}>
        <Silueta patron={criterio.patron} />
        <BarraMedicion criterio={criterio} valorMinimo={valorMinimo} />
      </View>
      <Text style={styles.detalle}>{criterio.detalle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 10,
    marginHorizontal: 16,
    marginBottom: 4,
    backgroundColor: COLORS.waterLight,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
  },
  cardCompact: {
    marginHorizontal: 0,
    marginTop: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    gap: 8,
  },
  kicker: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.waterDark,
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  patronTag: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textSecondary,
    flexShrink: 1,
    textAlign: "right",
  },
  visual: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  silCaja: {
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  pezFila: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 0,
  },
  pezHocicoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginRight: 2,
    zIndex: 2,
  },
  pezCuerpo: {
    width: 110,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    overflow: "hidden",
  },
  pezVientre: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "40%",
  },
  pezOjo: {
    position: "absolute",
    left: 14,
    top: 10,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.textPrimary,
  },
  pezColaWrap: {
    width: 28,
    height: 36,
    marginLeft: -2,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  pezColaLobo: {
    width: 0,
    height: 0,
    borderTopWidth: 10,
    borderBottomWidth: 10,
    borderLeftWidth: 22,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
  },
  horquillaMark: {
    position: "absolute",
    left: 0,
    width: 3,
    height: 30,
    backgroundColor: COLORS.gold,
    borderRadius: 1,
  },
  anguilaCuerpo: {
    width: 160,
    height: 18,
    borderRadius: 10,
    borderWidth: 2,
    transform: [{ rotate: "-4deg" }],
  },
  manto: {
    width: 90,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
  },
  mantoAleta: {
    position: "absolute",
    width: 70,
    height: 14,
    borderRadius: 8,
    top: 28,
  },
  mantoTent: {
    flexDirection: "row",
    gap: 4,
    marginTop: 4,
  },
  mantoTentItem: {
    width: 5,
    height: 14,
    borderRadius: 2,
  },
  pulpoCabeza: {
    width: 44,
    height: 34,
    borderRadius: 22,
    borderWidth: 2,
  },
  pulpoBrazos: {
    flexDirection: "row",
    gap: 5,
    marginTop: 2,
  },
  pulpoBrazo: {
    width: 7,
    height: 22,
    borderRadius: 4,
  },
  cangrejoFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cangrejoCap: {
    width: 72,
    height: 36,
    borderRadius: 10,
    borderWidth: 2,
  },
  cangrejoPinza: {
    width: 14,
    height: 20,
    borderRadius: 4,
  },
  barraWrap: {
    paddingHorizontal: 4,
  },
  extremos: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  extremo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  extremoRight: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "flex-end",
    gap: 6,
  },
  puntoA: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    marginTop: 2,
  },
  puntoB: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.waterDark,
    marginTop: 2,
  },
  extremoLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textPrimary,
    lineHeight: 14,
    flexShrink: 1,
    maxWidth: 120,
  },
  extremoLabelRight: {
    textAlign: "right",
  },
  lineaFila: {
    flexDirection: "row",
    alignItems: "center",
  },
  tick: {
    width: 2,
    height: 12,
    backgroundColor: COLORS.waterDark,
    borderRadius: 1,
  },
  linea: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.waterDark,
    marginHorizontal: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  flechaTxt: {
    fontSize: 12,
    color: COLORS.waterDark,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 6,
    marginTop: -1,
  },
  badgeMin: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: -8,
  },
  badgeMinTxt: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },
  detalle: {
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
});
