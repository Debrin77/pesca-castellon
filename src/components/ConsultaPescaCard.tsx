import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { ConsultaPesca } from "../services/consultaPescaService";
import { FUENTE_NORMATIVA } from "../data/normativa2026";
import { COLORS, RADIUS } from "../theme";

interface Props {
  consulta: ConsultaPesca;
  onFicha?: () => void;
  onAparejos?: (especieId: string) => void;
}

export default function ConsultaPescaCard({ consulta, onFicha, onAparejos }: Props) {
  const especieDestacada = consulta.tramo?.especies?.[0];
  return (
    <View style={[styles.card, { borderLeftColor: consulta.color }]}>
      <View style={[styles.pill, { backgroundColor: consulta.color }]}>
        <Text style={styles.pillText}>
          {consulta.sePuedePescarHoy ? "Consulta del punto" : "Restricción activa"}
        </Text>
      </View>
      <Text style={styles.title}>{consulta.titulo}</Text>
      {consulta.tramo && (
        <Text style={styles.meta}>
          Tramo {consulta.tramo.codigo} · {consulta.tramo.rio} · {consulta.tramo.vocacion}
        </Text>
      )}

      {consulta.permisos.map((p, i) => (
        <Text key={`p-${i}`} style={styles.ok}>
          {p}
        </Text>
      ))}
      {consulta.restriccionesHoy.map((p, i) => (
        <Text key={`r-${i}`} style={styles.warn}>
          {p}
        </Text>
      ))}

      {consulta.tramo?.especies?.length ? (
        <Text style={styles.especies}>Especies habituales: {consulta.tramo.especies.join(" · ")}</Text>
      ) : null}

      <Text style={styles.fuente}>{FUENTE_NORMATIVA.titulo}</Text>

      <View style={styles.row}>
        {consulta.tramo?.fichaId && onFicha ? (
          <TouchableOpacity onPress={onFicha} style={styles.btn}>
            <Text style={styles.btnText}>Ficha del agua</Text>
          </TouchableOpacity>
        ) : null}
        {especieDestacada && onAparejos ? (
          <TouchableOpacity onPress={() => onAparejos(especieDestacada)} style={styles.btnGhost}>
            <Text style={styles.btnGhostText}>Aparejo</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderLeftWidth: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pill: { alignSelf: "flex-start", borderRadius: RADIUS.pill, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 8 },
  pillText: { color: "#fff", fontSize: 10, fontWeight: "800", letterSpacing: 0.4, textTransform: "uppercase" },
  title: { fontSize: 15, fontWeight: "800", color: COLORS.textPrimary, lineHeight: 20 },
  meta: { fontSize: 11.5, color: COLORS.textMuted, marginTop: 4, marginBottom: 8 },
  ok: { fontSize: 12.5, color: COLORS.textSecondary, lineHeight: 18, marginBottom: 4 },
  warn: { fontSize: 12.5, color: COLORS.danger, lineHeight: 18, marginBottom: 4, fontWeight: "600" },
  especies: { fontSize: 12, color: COLORS.water, marginTop: 6, fontWeight: "600" },
  fuente: { fontSize: 10, color: COLORS.textMuted, marginTop: 10, fontStyle: "italic" },
  row: { flexDirection: "row", gap: 8, marginTop: 12 },
  btn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.sm, paddingHorizontal: 12, paddingVertical: 8 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  btnGhost: { borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.sm, paddingHorizontal: 12, paddingVertical: 8 },
  btnGhostText: { color: COLORS.primary, fontWeight: "700", fontSize: 12 },
});
