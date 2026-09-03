import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking } from "react-native";
import { resumenTemporadaActual } from "../services/vedaService";
import { FUENTE_NORMATIVA } from "../data/normativa2026";
import { COLORS, RADIUS, SHADOW_SOFT } from "../theme";

interface Props {
  compact?: boolean;
}

export default function TemporadaBanner({ compact }: Props) {
  const t = resumenTemporadaActual();
  const abierta = t.truchaAbierta;

  return (
    <View style={[styles.box, abierta ? styles.boxOk : styles.boxOff, compact && styles.compact]}>
      <Text style={styles.kicker}>Temporada {new Date().getFullYear()}</Text>
      <Text style={[styles.title, abierta ? styles.titleOk : styles.titleOff]}>
        {abierta ? "Trucha en temporada" : "Trucha en veda"}
      </Text>
      <Text style={styles.body}>{t.texto}</Text>
      {!compact && (
        <TouchableOpacity onPress={() => Linking.openURL(FUENTE_NORMATIVA.urlOrden)} accessibilityRole="link">
          <Text style={styles.link}>Ver fuente normativa →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    ...SHADOW_SOFT,
  },
  compact: { paddingVertical: 10 },
  boxOk: { backgroundColor: COLORS.primaryLight, borderColor: "#b7d4c4" },
  boxOff: { backgroundColor: COLORS.warningLight, borderColor: "#f0d2b0" },
  kicker: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  title: { fontSize: 15, fontWeight: "800", marginBottom: 4 },
  titleOk: { color: COLORS.primaryDark },
  titleOff: { color: COLORS.warning },
  body: { fontSize: 12.5, color: COLORS.textSecondary, lineHeight: 18 },
  link: { marginTop: 8, fontSize: 12.5, fontWeight: "700", color: COLORS.waterDark },
});
