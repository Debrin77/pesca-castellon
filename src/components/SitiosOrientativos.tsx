import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { avisoSitiosComunidad, SitioOrientativo } from "../services/sitiosComunidad";
import { COLORS, RADIUS } from "../theme";

export default function SitiosOrientativos({
  sitios,
  titulo,
  aviso,
}: {
  sitios: SitioOrientativo[];
  titulo?: string;
  aviso?: string;
}) {
  if (!sitios.length) return null;
  return (
    <View style={styles.box} accessibilityRole="text">
      <Text style={styles.title}>{titulo ?? "Sitios que más se citan"}</Text>
      {sitios.map((s) => (
        <View key={s.nombre} style={styles.item}>
          <Text style={styles.nombre}>{s.nombre}</Text>
          <Text style={styles.meta}>
            {s.especies} · {s.cuando}
          </Text>
          <Text style={styles.detalle}>{s.detalle}</Text>
        </View>
      ))}
      <Text style={styles.aviso}>{aviso ?? avisoSitiosComunidad()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginTop: 12,
    backgroundColor: COLORS.mist,
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: { fontSize: 16, fontWeight: "800", color: COLORS.textPrimary, marginBottom: 8 },
  item: { marginBottom: 12 },
  nombre: { fontSize: 16, fontWeight: "700", color: COLORS.waterDark, lineHeight: 22 },
  meta: { fontSize: 14, fontWeight: "600", color: COLORS.textSecondary, marginTop: 4, lineHeight: 20 },
  detalle: { fontSize: 16, color: COLORS.textPrimary, marginTop: 4, lineHeight: 24 },
  aviso: { fontSize: 13, color: COLORS.textMuted, lineHeight: 18, marginTop: 4 },
});
