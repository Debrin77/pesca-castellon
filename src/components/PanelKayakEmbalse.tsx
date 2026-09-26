import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking } from "react-native";
import {
  colorNavegacionKayak,
  etiquetaNavegacionKayak,
  navegacionKayakDeZona,
} from "../data/navegacionKayakEmbalses";
import { COLORS, RADIUS, TYPE } from "../theme";

type Props = { zoneId: string };

/**
 * Ficha explícita: navegación kayak + pesca desde kayak + documentación,
 * según organismo de cuenca y licencia autonómica.
 */
export default function PanelKayakEmbalse({ zoneId }: Props) {
  const ficha = navegacionKayakDeZona(zoneId);
  if (!ficha) return null;

  const colorNav = colorNavegacionKayak(ficha.navegacion);
  const colorPesca = colorNavegacionKayak(ficha.pescaDesdeKayak);

  return (
    <View style={styles.box} accessibilityLabel={`Kayak en ${ficha.nombre}`}>
      <Text style={styles.kicker}>KAYAK · EMBALSE</Text>
      <Text style={styles.title}>{ficha.nombre}</Text>
      <Text style={styles.sub}>
        Navegación la marca el organismo de cuenca ({ficha.organismo.toUpperCase()}). La pesca
        continental, la licencia de la provincia. No se sustituyen.
      </Text>

      <View style={styles.rowBadges}>
        <View style={[styles.badge, { borderColor: colorNav }]}>
          <Text style={styles.badgeLbl}>Navegación kayak</Text>
          <Text style={[styles.badgeVal, { color: colorNav }]}>
            {etiquetaNavegacionKayak(ficha.navegacion)}
          </Text>
        </View>
        <View style={[styles.badge, { borderColor: colorPesca }]}>
          <Text style={styles.badgeLbl}>Pesca desde kayak</Text>
          <Text style={[styles.badgeVal, { color: colorPesca }]}>
            {etiquetaNavegacionKayak(ficha.pescaDesdeKayak)}
          </Text>
        </View>
      </View>

      <Text style={styles.section}>Documentación / permisos</Text>
      {ficha.documentacion.map((d, i) => (
        <Text key={i} style={styles.bullet}>
          • {d}
        </Text>
      ))}

      <Text style={styles.section}>Limitaciones del vaso</Text>
      {ficha.limitaciones.map((d, i) => (
        <Text key={i} style={styles.bullet}>
          • {d}
        </Text>
      ))}

      {ficha.nota ? <Text style={styles.nota}>{ficha.nota}</Text> : null}

      <Text style={styles.avisoLegal}>
        Orientativo según fuentes oficiales consultadas ({ficha.actualizado}). Confirma siempre en
        la web del organismo antes de botar.
      </Text>

      {ficha.fuentes.map((f) => (
        <TouchableOpacity
          key={f.url}
          onPress={() => Linking.openURL(f.url)}
          accessibilityRole="link"
          accessibilityLabel={f.etiqueta}
        >
          <Text style={styles.link}>{f.etiqueta} ›</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 14,
  },
  kicker: {
    ...TYPE.overline,
    color: COLORS.waterDark,
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  sub: {
    fontSize: 12.5,
    lineHeight: 17,
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  rowBadges: { flexDirection: "row", gap: 8, marginBottom: 10 },
  badge: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  badgeLbl: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  badgeVal: { fontSize: 13, fontWeight: "800" },
  section: {
    marginTop: 6,
    marginBottom: 4,
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  bullet: {
    fontSize: 12.5,
    lineHeight: 17,
    color: COLORS.textSecondary,
    marginBottom: 3,
  },
  nota: {
    marginTop: 8,
    fontSize: 12.5,
    lineHeight: 17,
    color: COLORS.waterDark,
    fontWeight: "600",
  },
  avisoLegal: {
    marginTop: 10,
    fontSize: 11,
    lineHeight: 15,
    color: COLORS.textMuted,
    fontStyle: "italic",
  },
  link: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.water,
  },
});
