import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import {
  CriterioMedicion,
  PatronMedicion,
  etiquetaPatron,
} from "../data/criterioMedicion";
import { COLORS, RADIUS } from "../theme";

/** Diagrama técnico NOAA (dominio público): SL / FL / TL. En UE/RD 560 se usa TL. */
const DIAGRAMA_LONGITUD_NOAA = require("../../assets/medicion/longitud_total_noaa.jpg");

type Props = {
  criterio: CriterioMedicion;
  /** Valor numérico opcional (p. ej. "23") para anclar el mínimo en el diagrama. */
  valorMinimo?: string | null;
  compact?: boolean;
};

/** Punta de flecha (triángulo) apuntando a izquierda o derecha. */
function Flecha({ direccion }: { direccion: "izq" | "der" }) {
  const punta = direccion === "izq" ? styles.flechaIzq : styles.flechaDer;
  return <View style={punta} />;
}

/**
 * Esquema de cota A→B para patrones sin diagrama anatómico (peso, manto, caparazón).
 */
function CotaConFlechas({
  criterio,
  valorMinimo,
}: {
  criterio: CriterioMedicion;
  valorMinimo?: string | null;
}) {
  const esPeso = criterio.patron === "pulpo_peso" || criterio.unidad === "kg";
  const esAncho = criterio.patron === "cangrejo_caparazon";
  const esHorquilla = criterio.patron === "pez_horquilla";

  const badge =
    valorMinimo != null && valorMinimo !== ""
      ? `mín. ${valorMinimo} ${criterio.unidad}`
      : esPeso
        ? "peso"
        : esAncho
          ? "anchura"
          : "longitud";

  return (
    <View style={styles.cotaBox} accessibilityElementsHidden>
      <View style={styles.marcadoresFila}>
        <View style={styles.marcadorCol}>
          <View style={[styles.chipExtremo, styles.chipA]}>
            <Text style={styles.chipExtremoTxt}>A</Text>
          </View>
          <View style={styles.guiaVertical} />
        </View>
        <View style={styles.marcadorColEnd}>
          <View style={[styles.chipExtremo, styles.chipB]}>
            <Text style={styles.chipExtremoTxt}>B</Text>
          </View>
          <View style={styles.guiaVertical} />
        </View>
      </View>

      <View style={styles.cotaFila}>
        <Flecha direccion="izq" />
        <View style={styles.cotaLinea}>
          <View style={styles.badgeMin}>
            <Text style={styles.badgeMinTxt}>{badge}</Text>
          </View>
          {esHorquilla ? <View style={styles.marcaHorquilla} /> : null}
        </View>
        <Flecha direccion="der" />
      </View>

      <View style={styles.leyendaFila}>
        <Text style={styles.leyendaA} numberOfLines={2}>
          {criterio.desde}
        </Text>
        <Text style={styles.leyendaFlecha} accessibilityElementsHidden>
          →
        </Text>
        <Text style={styles.leyendaB} numberOfLines={2}>
          {criterio.hasta}
        </Text>
      </View>
    </View>
  );
}

function usaDiagramaTecnico(patron: PatronMedicion): boolean {
  return patron === "pez_total" || patron === "pez_horquilla" || patron === "anguila";
}

/**
 * Cómo medir: diagrama técnico oficial (NOAA Fish Length) para peces,
 * o cota A→B para manto / peso / caparazón.
 */
export default function DiagramaMedicion({ criterio, valorMinimo, compact }: Props) {
  const a11y = `Cómo medir: de ${criterio.desde} a ${criterio.hasta}. ${criterio.detalle}`;
  const conDiagrama = usaDiagramaTecnico(criterio.patron);
  const esHorquilla = criterio.patron === "pez_horquilla";

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

      {conDiagrama ? (
        <View style={styles.diagramaBox}>
          <Image
            source={DIAGRAMA_LONGITUD_NOAA}
            style={styles.diagramaImg}
            resizeMode="contain"
            accessibilityLabel="Diagrama de longitudes de pez: estándar, horquilla y total"
          />
          <View style={styles.destacadoTl}>
            <Text style={styles.destacadoTlTxt}>
              {esHorquilla
                ? "En esta especie: longitud a la horquilla (FL)"
                : "En UE / RD 560: longitud total (TL) · hocico → extremo de la cola"}
            </Text>
          </View>
          {valorMinimo != null && valorMinimo !== "" ? (
            <Text style={styles.minimoLine}>
              Mínimo legal: {valorMinimo} {criterio.unidad}
            </Text>
          ) : null}
          <Text style={styles.fuente}>
            Diagrama: NOAA Fisheries (dominio público) · Fish Length
          </Text>
        </View>
      ) : (
        <CotaConFlechas criterio={criterio} valorMinimo={valorMinimo} />
      )}

      <Text style={styles.detalle}>{criterio.detalle}</Text>
    </View>
  );
}

export type { PatronMedicion };

const ARROW = 9;
const LINE = COLORS.waterDark;

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
  diagramaBox: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    backgroundColor: "#f7f9fb",
    paddingTop: 8,
    paddingBottom: 10,
    paddingHorizontal: 8,
    marginBottom: 10,
    overflow: "hidden",
  },
  diagramaImg: {
    width: "100%",
    height: 168,
    alignSelf: "center",
  },
  destacadoTl: {
    marginTop: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  destacadoTlTxt: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16,
    textAlign: "center",
  },
  minimoLine: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.waterDark,
    textAlign: "center",
  },
  fuente: {
    marginTop: 6,
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: "500",
    textAlign: "center",
  },
  cotaBox: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.mist,
    paddingTop: 10,
    paddingBottom: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  marcadoresFila: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  marcadorCol: {
    alignItems: "flex-start",
    width: 36,
  },
  marcadorColEnd: {
    alignItems: "flex-end",
    width: 36,
  },
  chipExtremo: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  chipA: { backgroundColor: COLORS.primary },
  chipB: { backgroundColor: COLORS.waterDark },
  chipExtremoTxt: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  guiaVertical: {
    width: 1,
    height: 10,
    backgroundColor: LINE,
    marginTop: 2,
    alignSelf: "center",
    opacity: 0.55,
  },
  cotaFila: {
    flexDirection: "row",
    alignItems: "center",
    height: 28,
  },
  flechaIzq: {
    width: 0,
    height: 0,
    borderTopWidth: ARROW,
    borderBottomWidth: ARROW,
    borderRightWidth: ARROW + 2,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderRightColor: LINE,
  },
  flechaDer: {
    width: 0,
    height: 0,
    borderTopWidth: ARROW,
    borderBottomWidth: ARROW,
    borderLeftWidth: ARROW + 2,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: LINE,
  },
  cotaLinea: {
    flex: 1,
    height: 2,
    backgroundColor: LINE,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeMin: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeMinTxt: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  marcaHorquilla: {
    position: "absolute",
    right: 0,
    width: 2,
    height: 16,
    backgroundColor: COLORS.gold,
    borderRadius: 1,
    top: -7,
  },
  leyendaFila: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 12,
    gap: 8,
  },
  leyendaA: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textPrimary,
    lineHeight: 16,
  },
  leyendaFlecha: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.waterDark,
    marginTop: 0,
  },
  leyendaB: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textPrimary,
    lineHeight: 16,
    textAlign: "right",
  },
  detalle: {
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
});
