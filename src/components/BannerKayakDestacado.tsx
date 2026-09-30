/**
 * Panel destacado cuando el modo global es kayak (embalse o mar).
 * Deja explícito qué papeles pedir y por qué no es lo mismo que barco/orilla.
 */
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import type { ModoPescaGlobal } from "../data/modoPesca";
import { esModoKayak, subtituloModo } from "../data/modoPesca";
import { documentacionKayakDeProvincia } from "../data/documentacionKayak";
import { COLORS, RADIUS, TYPE } from "../theme";

type Props = {
  modo: ModoPescaGlobal;
  provinciaId: string;
  /** Abrir pantalla Licencia (bloque kayak). */
  onVerDocumentacion?: () => void;
  compacto?: boolean;
};

export default function BannerKayakDestacado({
  modo,
  provinciaId,
  onVerDocumentacion,
  compacto,
}: Props) {
  if (!esModoKayak(modo)) return null;
  const doc = documentacionKayakDeProvincia(provinciaId);
  const mar = modo === "kayak_mar";

  const resumen = mar
    ? doc?.mar?.resumen ??
      "En mar el kayak es artefacto flotante: licencia desde tierra, no la de embarcación."
    : doc?.embalse?.resumen ??
      "En embalse: el organismo de cuenca autoriza navegar; la licencia autonómica permite pescar.";

  if (compacto) {
    return (
      <View style={styles.chip} accessibilityRole="summary">
        <Text style={styles.chipStar}>★</Text>
        <Text style={styles.chipTxt} numberOfLines={2}>
          {mar ? "Kayak en mar · artefacto flotante" : "Kayak en embalse · remo + licencia"}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.box} accessibilityRole="summary" accessibilityLabel="Pesca en kayak">
      <View style={styles.cab}>
        <Text style={styles.kicker}>★ PESCA EN KAYAK</Text>
        <Text style={styles.badge}>{mar ? "MAR" : "EMBALSE / RÍO"}</Text>
      </View>
      <Text style={styles.title}>
        {mar ? "Desde kayak en el mar" : "Desde kayak en aguas continentales"}
      </Text>
      <Text style={styles.sub}>{subtituloModo(modo)}</Text>
      <Text style={styles.body}>{resumen}</Text>
      {!mar ? (
        <Text style={styles.tip}>
          Elige un embalse en el mapa: verás si la navegación y la pesca desde kayak están
          permitidas, condicionadas o hay que consultar.
        </Text>
      ) : (
        <Text style={styles.tip}>
          No confundas con «desde barco»: el barco matriculado pide otra licencia. El kayak remado
          usa la de pesca marítima desde tierra (artefacto flotante) + PescaREC si aplica.
        </Text>
      )}
      {onVerDocumentacion ? (
        <TouchableOpacity
          style={styles.cta}
          onPress={onVerDocumentacion}
          accessibilityRole="button"
          accessibilityLabel="Ver qué documentación pedir para kayak"
        >
          <Text style={styles.ctaTxt}>Qué documentación pedir ›</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.kayakLight,
    borderWidth: 1,
    borderColor: COLORS.kayak,
  },
  chipStar: { color: COLORS.kayakDark, fontWeight: "800", fontSize: 12 },
  chipTxt: { flex: 1, fontSize: 12, fontWeight: "700", color: COLORS.kayakDark },
  box: {
    marginBottom: 14,
    padding: 14,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.kayakLight,
    borderWidth: 1.5,
    borderColor: COLORS.kayak,
  },
  cab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
    gap: 8,
  },
  kicker: {
    ...TYPE.overline,
    color: COLORS.kayakDark,
    letterSpacing: 0.8,
  },
  badge: {
    fontSize: 10,
    fontWeight: "800",
    color: "#fff",
    backgroundColor: COLORS.kayak,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    overflow: "hidden",
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.kayakDark,
    marginBottom: 4,
  },
  sub: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.kayak,
    marginBottom: 8,
    lineHeight: 16,
  },
  body: {
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 19,
    marginBottom: 8,
  },
  tip: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
    marginBottom: 10,
  },
  cta: {
    alignSelf: "flex-start",
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.kayakDark,
  },
  ctaTxt: { color: "#fff", fontWeight: "800", fontSize: 13 },
});
