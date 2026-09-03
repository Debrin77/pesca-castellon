import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking } from "react-native";
import { resumenTemporadaActual } from "../services/vedaService";
import { getProvinciaActiva } from "../provincias/runtime";
import { COLORS, RADIUS, SHADOW_SOFT } from "../theme";

interface Props {
  compact?: boolean;
}

export default function TemporadaBanner({ compact }: Props) {
  const provincia = getProvinciaActiva();

  if (provincia.id === "sevilla") {
    return (
      <View style={[styles.box, styles.boxOk, compact && styles.compact]}>
        <Text style={styles.kicker}>Normativa · {provincia.nombre}</Text>
        <Text style={[styles.title, styles.titleOk]}>Pesca continental Andalucía</Text>
        <Text style={styles.body}>
          Aguas ciprinícolas: temporada abierta salvo veda puntual del tramo o coto. Confirma la orden
          de vedas de la Junta.
        </Text>
        {!compact && (
          <TouchableOpacity
            onPress={() => Linking.openURL(provincia.fuenteNormativa.urlOrden)}
            accessibilityRole="link"
          >
            <Text style={styles.link}>Ver fuente normativa →</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

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
        <TouchableOpacity
          onPress={() => Linking.openURL(provincia.fuenteNormativa.urlOrden)}
          accessibilityRole="link"
        >
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
  boxOff: { backgroundColor: COLORS.warningLight, borderColor: "#f0d2a8" },
  kicker: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  title: { fontSize: 17, fontWeight: "700", marginBottom: 4 },
  titleOk: { color: COLORS.success },
  titleOff: { color: COLORS.warning },
  body: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  link: { marginTop: 8, color: COLORS.primary, fontWeight: "700", fontSize: 14 },
});
