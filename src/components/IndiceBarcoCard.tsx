import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { IndiceBarco } from "../services/boatIndexService";
import { CATEGORIA_BARCO_INFO } from "../services/boatIndexService";
import { COLORS, FONTS, RADIUS, SPACING } from "../theme";

type Props = {
  indice: IndiceBarco | null;
  cargando?: boolean;
  compacto?: boolean;
};

/** Tarjeta del índice «Salgo en barco» (oleaje + viento). */
export default function IndiceBarcoCard({ indice, cargando, compacto }: Props) {
  if (cargando) {
    return (
      <View style={[styles.card, compacto && styles.cardCompact]}>
        <Text style={styles.kicker}>SALGO EN BARCO</Text>
        <Text style={styles.muted}>Calculando oleaje y viento…</Text>
      </View>
    );
  }
  if (!indice) return null;
  const cat = CATEGORIA_BARCO_INFO[indice.categoria];
  return (
    <View
      style={[styles.card, compacto && styles.cardCompact, { borderColor: cat.color }]}
      accessibilityLabel={`Salgo en barco: ${indice.puntuacion}, ${cat.texto}`}
    >
      <Text style={styles.kicker}>SALGO EN BARCO · CLIMA MARINO</Text>
      <View style={styles.row}>
        <View style={[styles.badge, { backgroundColor: cat.fondo }]}>
          <Text style={[styles.score, { color: cat.color }]}>{indice.puntuacion}</Text>
          <Text style={[styles.cat, { color: cat.color }]}>{cat.texto}</Text>
        </View>
        <View style={styles.metrics}>
          <Text style={styles.metric}>
            Oleaje {indice.oleajeM != null ? `${indice.oleajeM.toFixed(1)} m` : "—"}
            {indice.periodoS != null ? ` · ${indice.periodoS.toFixed(0)} s` : ""}
          </Text>
          <Text style={styles.metric}>
            Viento {indice.vientoKmh != null ? `${Math.round(indice.vientoKmh)} km/h` : "—"}
            {indice.rachasKmh != null ? ` · rachas ${Math.round(indice.rachasKmh)}` : ""}
          </Text>
        </View>
      </View>
      {indice.alertaSalida ? (
        <Text style={styles.alerta}>Alerta: oleaje o viento por encima del umbral orientativo.</Text>
      ) : null}
      {!compacto
        ? indice.desglose.slice(0, 3).map((d) => (
            <Text key={d} style={styles.motivo}>
              · {d}
            </Text>
          ))
        : null}
      <Text style={styles.pie}>Orientativo · no autoriza a zarpar · micromareal Castellón</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: 6,
  },
  cardCompact: { padding: SPACING.sm },
  kicker: {
    fontFamily: FONTS.semibold,
    fontSize: 11,
    letterSpacing: 0.6,
    color: COLORS.textMuted,
  },
  muted: { fontFamily: FONTS.regular, color: COLORS.textMuted, fontSize: 14 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  badge: {
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
    minWidth: 72,
  },
  score: { fontFamily: FONTS.display, fontSize: 28, lineHeight: 32 },
  cat: { fontFamily: FONTS.semibold, fontSize: 12 },
  metrics: { flex: 1, gap: 2 },
  metric: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.textPrimary },
  alerta: { fontFamily: FONTS.semibold, fontSize: 13, color: COLORS.danger },
  motivo: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textMuted },
  pie: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.textMuted, marginTop: 4 },
});
