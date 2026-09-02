import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from "react-native";
import { LICENCIA_INFO } from "../data/license";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, GRADIENTS, RADIUS, SHADOW } from "../theme";

export default function LicenseScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
      <LinearGradient colors={GRADIENTS.primary} style={styles.headerCard}>
        <Text style={styles.headerIcon}>🎫</Text>
        <Text style={styles.headerTitle}>Licencia de pesca continental</Text>
        <Text style={styles.headerSubtitle}>Obligatoria en toda la provincia de Castellón</Text>
      </LinearGradient>

      <Text style={styles.resumen}>{LICENCIA_INFO.resumen}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>💶 Tasas 2026</Text>
        {LICENCIA_INFO.tasas2026.map((t, i) => (
          <View key={i} style={styles.row}>
            <Text style={styles.rowLabel}>{t.concepto}</Text>
            <Text style={styles.rowValue}>{t.precio}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>✅ Exenciones de la tasa</Text>
        {LICENCIA_INFO.exentos.map((e, i) => (
          <Text key={i} style={styles.bullet}>• {e}</Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>📋 A tener en cuenta</Text>
        {LICENCIA_INFO.notas.map((n, i) => (
          <Text key={i} style={styles.bullet}>• {n}</Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>📍 Oficina en Castellón</Text>
        <Text style={styles.cardText}>{LICENCIA_INFO.oficinaCastellon}</Text>
      </View>

      <TouchableOpacity
        style={styles.ctaButton}
        onPress={() => Linking.openURL(LICENCIA_INFO.tramiteOnline)}
      >
        <Text style={styles.ctaText}>Tramitar licencia continental (Sede GVA)</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Pesca marítima desde tierra</Text>
        <Text style={styles.cardText}>
          En la orilla del mar hace falta la licencia de pesca marítima recreativa desde tierra. No sustituye a la continental, ni al revés. Decreto 41/2013: no puertos, no a menos de 100 m de bañistas, no vender capturas.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.ctaButtonSecondary}
        onPress={() => Linking.openURL("https://sede.gva.es/es/inicio/procedimientos?id_proc=17170")}
      >
        <Text style={styles.ctaTextSecondary}>Licencia marítima desde tierra (GVA)</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.ctaButtonSecondary}
        onPress={() => Linking.openURL(LICENCIA_INFO.tramiteAlternativo)}
      >
        <Text style={styles.ctaTextSecondary}>Vía alternativa sin certificado digital</Text>
      </TouchableOpacity>

      <Text style={styles.footnote}>
        Los importes y trámites pueden actualizarse cada temporada. Confirma siempre los datos vigentes en la sede electrónica antes de pagar.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerCard: {
    borderRadius: RADIUS.lg,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
    ...SHADOW,
  },
  headerIcon: { fontSize: 32, marginBottom: 6 },
  headerTitle: { color: "#fff", fontSize: 19, fontWeight: "700" },
  headerSubtitle: { color: "#dfeee5", fontSize: 13, marginTop: 4 },
  resumen: { fontSize: 14, color: COLORS.textPrimary, marginBottom: 16, lineHeight: 20 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 12,
    ...SHADOW,
  },
  cardTitle: { fontSize: 15, fontWeight: "700", marginBottom: 8, color: COLORS.textPrimary },
  cardText: { fontSize: 13, color: COLORS.textSecondary },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  rowLabel: { fontSize: 13, color: COLORS.textSecondary, flex: 1 },
  rowValue: { fontSize: 13, fontWeight: "700", color: COLORS.primary },
  bullet: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 4, lineHeight: 18 },
  ctaButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  ctaButtonSecondary: {
    borderColor: COLORS.primary,
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 10,
  },
  ctaTextSecondary: { color: COLORS.primary, fontWeight: "600", fontSize: 13 },
  footnote: { fontSize: 11, color: COLORS.textMuted, marginTop: 14, textAlign: "center", lineHeight: 16 },
});
