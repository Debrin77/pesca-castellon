import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { DiaSolunar } from "../services/solunarService";
import { ResumenMarea } from "../services/tideService";
import { COLORS, RADIUS } from "../theme";

interface Props {
  solunar: DiaSolunar | null;
  marea?: ResumenMarea | null;
  oleajeNota?: string | null;
  /** En Previsión (fondo degradado): tarjeta contrastada. */
  variante?: "clara" | "glass";
  notaContinental?: string | null;
}

export default function VentanasSolunarMarea({
  solunar,
  marea,
  oleajeNota,
  variante = "clara",
  notaContinental,
}: Props) {
  const ventanas = useMemo(() => solunar?.ventanas ?? [], [solunar]);
  if (!solunar && !marea) return null;
  const glass = variante === "glass";

  return (
    <View
      style={[styles.wrap, glass && styles.wrapGlass]}
      accessibilityLabel="Ventanas solunar y marea"
    >
      {solunar ? (
        <>
          <Text style={[styles.title, glass && styles.textGlass]} accessibilityRole="header">
            Solunar · {solunar.iconoLuna} {solunar.fase}
          </Text>
          <Text style={[styles.sub, glass && styles.subGlass]}>
            Mejor ventana orientativa: {solunar.mejorHoraInicio}–{solunar.mejorHoraFin}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {ventanas.map((v, i) => (
              <View
                key={`${v.inicio}-${i}`}
                style={[styles.chip, v.tipo === "mayor" ? styles.chipMayor : styles.chipMenor, glass && styles.chipGlass]}
              >
                <Text style={[styles.chipTipo, glass && styles.chipTipoGlass]}>
                  {v.tipo === "mayor" ? "MAYOR" : "MENOR"}
                </Text>
                <Text style={[styles.chipHora, glass && styles.textGlass]}>
                  {v.inicio}–{v.fin}
                </Text>
                <Text style={[styles.chipLabel, glass && styles.subGlass]}>{v.etiqueta}</Text>
              </View>
            ))}
          </ScrollView>
        </>
      ) : null}

      {marea ? (
        <View style={styles.mareaBox}>
          <Text style={[styles.title, glass && styles.textGlass]}>Marea · {marea.puerto}</Text>
          <Text style={[styles.sub, glass && styles.subGlass]}>{marea.nota}</Text>
          <Text style={[styles.meta, glass && styles.metaGlass]}>
            Rango típico ±{(marea.rangoTipicoM / 2).toFixed(2)} m
            {marea.proximaPleamar ? ` · Próx. pleamar ${marea.proximaPleamar}` : ""}
            {marea.proximaBajamar ? ` · bajamar ${marea.proximaBajamar}` : ""}
          </Text>
        </View>
      ) : notaContinental ? (
        <Text style={[styles.sub, glass && styles.subGlass, { marginTop: 10 }]}>{notaContinental}</Text>
      ) : null}

      {oleajeNota ? <Text style={[styles.oleaje, glass && styles.subGlass]}>{oleajeNota}</Text> : null}
      <Text style={[styles.disclaimer, glass && styles.subGlass]}>
        Orientativo (solunar/marea astronómica). No sustituye AEMET ni cartas oficiales.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 12,
  },
  wrapGlass: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderColor: "rgba(255,255,255,0.35)",
  },
  title: { fontSize: 14, fontWeight: "800", color: COLORS.textPrimary },
  textGlass: { color: "#fff" },
  sub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4, marginBottom: 8 },
  subGlass: { color: "rgba(255,255,255,0.88)" },
  row: { gap: 8, paddingVertical: 4 },
  chip: { borderRadius: RADIUS.md, padding: 10, minWidth: 120 },
  chipMayor: { backgroundColor: COLORS.primaryLight },
  chipMenor: { backgroundColor: COLORS.waterLight },
  chipGlass: { backgroundColor: "rgba(255,255,255,0.22)" },
  chipTipo: { fontSize: 10, fontWeight: "800", color: COLORS.textMuted, letterSpacing: 0.5 },
  chipTipoGlass: { color: "rgba(255,255,255,0.75)" },
  chipHora: { fontSize: 15, fontWeight: "800", color: COLORS.textPrimary, marginTop: 2 },
  chipLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  mareaBox: { marginTop: 12 },
  meta: { fontSize: 12, color: COLORS.waterDark, fontWeight: "600", marginTop: 4 },
  metaGlass: { color: "#dff3ff", fontWeight: "700" },
  oleaje: { fontSize: 12, color: COLORS.textSecondary, marginTop: 8 },
  disclaimer: { fontSize: 10, color: COLORS.textMuted, marginTop: 10, fontStyle: "italic" },
});
