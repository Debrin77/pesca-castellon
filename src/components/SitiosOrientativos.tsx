import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { AVISO_SITIOS_COMUNIDAD, SitioOrientativo } from "../services/sitiosComunidad";
import { COLORS, RADIUS, SPACING, TYPE } from "../theme";

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
      <Text style={styles.aviso}>{aviso ?? AVISO_SITIOS_COMUNIDAD}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.mist,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: { ...TYPE.bodyStrong, color: COLORS.textPrimary, marginBottom: SPACING.sm, fontSize: 14 },
  item: { marginBottom: SPACING.md },
  nombre: { fontSize: 14.5, fontWeight: "700", color: COLORS.waterDark, lineHeight: 20 },
  meta: { ...TYPE.caption, color: COLORS.textSecondary, marginTop: 3 },
  detalle: { ...TYPE.body, color: COLORS.textPrimary, marginTop: 3 },
  aviso: { ...TYPE.caption, color: COLORS.textMuted, marginTop: 2, fontStyle: "italic", fontWeight: "500" },
});
