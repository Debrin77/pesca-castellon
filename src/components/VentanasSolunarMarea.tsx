import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { DiaSolunar } from "../services/solunarService";
import { ResumenMarea } from "../services/tideService";
import { COLORS, RADIUS } from "../theme";

interface Props {
  solunar: DiaSolunar | null;
  marea?: ResumenMarea | null;
  oleajeNota?: string | null;
}

export default function VentanasSolunarMarea({ solunar, marea, oleajeNota }: Props) {
  const ventanas = useMemo(() => solunar?.ventanas ?? [], [solunar]);
  if (!solunar && !marea) return null;

  return (
    <View style={styles.wrap} accessibilityLabel="Ventanas solunar y marea">
      {solunar ? (
        <>
          <Text style={styles.title} accessibilityRole="header">
            Solunar · {solunar.iconoLuna} {solunar.fase}
          </Text>
          <Text style={styles.sub}>
            Mejor ventana orientativa: {solunar.mejorHoraInicio}–{solunar.mejorHoraFin}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {ventanas.map((v, i) => (
              <View
                key={`${v.inicio}-${i}`}
                style={[styles.chip, v.tipo === "mayor" ? styles.chipMayor : styles.chipMenor]}
              >
                <Text style={styles.chipTipo}>{v.tipo === "mayor" ? "MAYOR" : "MENOR"}</Text>
                <Text style={styles.chipHora}>
                  {v.inicio}–{v.fin}
                </Text>
                <Text style={styles.chipLabel}>{v.etiqueta}</Text>
              </View>
            ))}
          </ScrollView>
        </>
      ) : null}

      {marea ? (
        <View style={styles.mareaBox}>
          <Text style={styles.title}>Marea · {marea.puerto}</Text>
          <Text style={styles.sub}>{marea.nota}</Text>
          <Text style={styles.meta}>
            Rango típico ±{(marea.rangoTipicoM / 2).toFixed(2)} m
            {marea.proximaPleamar ? ` · Próx. pleamar ${marea.proximaPleamar}` : ""}
            {marea.proximaBajamar ? ` · bajamar ${marea.proximaBajamar}` : ""}
          </Text>
        </View>
      ) : null}

      {oleajeNota ? <Text style={styles.oleaje}>{oleajeNota}</Text> : null}
      <Text style={styles.disclaimer}>Orientativo (solunar/marea astronómica). No sustituye AEMET ni cartas oficiales.</Text>
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
  title: { fontSize: 14, fontWeight: "800", color: COLORS.textPrimary },
  sub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4, marginBottom: 8 },
  row: { gap: 8, paddingVertical: 4 },
  chip: { borderRadius: RADIUS.md, padding: 10, minWidth: 120 },
  chipMayor: { backgroundColor: COLORS.primaryLight },
  chipMenor: { backgroundColor: COLORS.waterLight },
  chipTipo: { fontSize: 10, fontWeight: "800", color: COLORS.textMuted, letterSpacing: 0.5 },
  chipHora: { fontSize: 15, fontWeight: "800", color: COLORS.textPrimary, marginTop: 2 },
  chipLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  mareaBox: { marginTop: 12 },
  meta: { fontSize: 12, color: COLORS.waterDark, fontWeight: "600", marginTop: 4 },
  oleaje: { fontSize: 12, color: COLORS.textSecondary, marginTop: 8 },
  disclaimer: { fontSize: 10, color: COLORS.textMuted, marginTop: 10, fontStyle: "italic" },
});
