import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { HORARIO_LEGAL_PESCA } from "../data/normativa2026";
import { HORARIO_LEGAL_ORILLA_MAR } from "../data/normativaMaritima";
import { HORARIO_ORIENTATIVO_ANDALUCIA } from "../provincias/sevilla/normativa";
import { getProvinciaActiva } from "../provincias/runtime";
import { COLORS, RADIUS } from "../theme";

export type MejorHora = {
  resumen: string;
  verano?: string;
  invierno?: string;
  noche?: string;
};

type EspecieHora = {
  mejorHora?: MejorHora;
  ventanas?: string;
};

type Props = {
  especie: EspecieHora;
  /** Si es costa, no mostrar el horario continental (±1 h). */
  ambito?: "continental" | "maritimo";
};

export default function MejorHoraPesca({ especie, ambito = "continental" }: Props) {
  const h = especie.mejorHora;
  if (!h && !especie.ventanas) return null;

  const horarioLegal =
    ambito === "maritimo"
      ? HORARIO_LEGAL_ORILLA_MAR
      : getProvinciaActiva().id === "sevilla" || getProvinciaActiva().id === "cordoba"
        ? HORARIO_ORIENTATIVO_ANDALUCIA
        : HORARIO_LEGAL_PESCA;

  return (
    <View
      style={styles.box}
      accessibilityRole="text"
      accessibilityLabel={`Mejor hora de pesca. ${h?.resumen ?? especie.ventanas}. ${horarioLegal}`}
    >
      <Text style={styles.title}>Mejor hora del día</Text>
      <Text style={styles.body}>{h?.resumen ?? especie.ventanas}</Text>
      {h?.verano ? (
        <>
          <Text style={styles.label}>Verano (orientativo)</Text>
          <Text style={styles.body}>{h.verano}</Text>
        </>
      ) : null}
      {h?.invierno ? (
        <>
          <Text style={styles.label}>Invierno / agua fría</Text>
          <Text style={styles.body}>{h.invierno}</Text>
        </>
      ) : null}
      {h?.noche ? (
        <>
          <Text style={styles.label}>Noche</Text>
          <Text style={styles.body}>{h.noche}</Text>
        </>
      ) : null}
      <Text style={styles.legal}>{horarioLegal}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginTop: 10,
    backgroundColor: COLORS.waterLight,
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: { fontSize: 16, fontWeight: "800", color: COLORS.waterDark },
  label: { fontSize: 14, fontWeight: "800", color: COLORS.waterDark, marginTop: 10 },
  body: { fontSize: 16, color: COLORS.textPrimary, marginTop: 4, lineHeight: 24 },
  legal: { fontSize: 14, color: COLORS.textSecondary, marginTop: 12, lineHeight: 20 },
});
