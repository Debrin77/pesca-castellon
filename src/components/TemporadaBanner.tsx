import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking } from "react-native";
import { resumenTemporadaActual } from "../services/vedaService";
import { getProvinciaActiva } from "../provincias/runtime";
import { periodoBarboAbierto, periodoBogaAbierto } from "../provincias/sevilla/normativa";
import { COLORS, RADIUS, SHADOW_SOFT } from "../theme";

interface Props {
  compact?: boolean;
}

export default function TemporadaBanner({ compact }: Props) {
  const provincia = getProvinciaActiva();

  if (provincia.id === "sevilla") {
    const barboOk = periodoBarboAbierto();
    const bogaOk = periodoBogaAbierto();
    const alerta = !barboOk || !bogaOk;
    return (
      <View style={[styles.box, alerta ? styles.boxOff : styles.boxOk, compact && styles.compact]}>
        <Text style={styles.kicker}>Orden 13/01/2023 · {provincia.nombre}</Text>
        <Text style={[styles.title, alerta ? styles.titleOff : styles.titleOk]}>
          {alerta ? "Autóctonos en veda parcial" : "Aguas libres · exóticas todo el año"}
        </Text>
        <Text style={styles.body}>
          Barbo (captura y suelta): {barboOk ? "hábil (1 jul–25 feb)" : "veda (26 feb–30 jun)"}. Boga
          (captura y suelta): {bogaOk ? "hábil (1 may–31 ene)" : "veda (1 feb–30 abr)"}. Refugios
          Anexo IV: pesca prohibida. Tenca y cacho: no se pescan.
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
