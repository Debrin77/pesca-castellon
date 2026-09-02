import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from "react-native";
import { LICENCIA_INFO } from "../data/license";
import {
  CHECKLIST_ANTES_DE_PESCAR,
  FUENTE_NORMATIVA,
  REGLAS_GENERALES,
  TALLAS_OFICIALES,
  textoVigenciaNormativa,
} from "../data/normativa2026";
import TemporadaBanner from "../components/TemporadaBanner";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, GRADIENTS, RADIUS, SHADOW } from "../theme";

const TALLA_LABELS: Record<string, string> = {
  trucha_comun: "Trucha común",
  trucha_arcoiris: "Trucha arcoíris",
  barbo: "Barbo",
  carpa: "Carpa",
  carpin: "Carpín",
  tenca: "Tenca",
  anguila: "Anguila",
  black_bass: "Black bass",
  lucio: "Lucio",
  siluro: "Siluro",
  mugilidos: "Mújoles / llisses",
};

export default function LicenseScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
      <LinearGradient colors={GRADIENTS.primary} style={styles.headerCard}>
        <Text style={styles.headerIcon}>🎫</Text>
        <Text style={styles.headerTitle}>Licencia y normativa</Text>
        <Text style={styles.headerSubtitle}>Obligatoria en toda la provincia de Castellón</Text>
      </LinearGradient>

      <TemporadaBanner />

      <Text style={styles.resumen}>{LICENCIA_INFO.resumen}</Text>
      <Text style={styles.vigencia}>{textoVigenciaNormativa()}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Reglas generales (Orden 30/2016)</Text>
        {REGLAS_GENERALES.map((e, i) => (
          <Text key={i} style={styles.bullet}>
            • {e}
          </Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Checklist antes de salir</Text>
        {CHECKLIST_ANTES_DE_PESCAR.map((e, i) => (
          <Text key={i} style={styles.bullet}>
            • {e}
          </Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tallas y régimen por especie</Text>
        {Object.entries(TALLAS_OFICIALES).map(([id, texto]) => (
          <View key={id} style={styles.tallaRow}>
            <Text style={styles.tallaName}>{TALLA_LABELS[id] ?? id}</Text>
            <Text style={styles.tallaVal}>{texto}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tasas 2026</Text>
        {LICENCIA_INFO.tasas2026.map((t, i) => (
          <View key={i} style={styles.row}>
            <Text style={styles.rowLabel}>{t.concepto}</Text>
            <Text style={styles.rowValue}>{t.precio}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Exenciones de la tasa</Text>
        {LICENCIA_INFO.exentos.map((e, i) => (
          <Text key={i} style={styles.bullet}>
            • {e}
          </Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>A tener en cuenta</Text>
        {LICENCIA_INFO.notas.map((n, i) => (
          <Text key={i} style={styles.bullet}>
            • {n}
          </Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Oficina en Castellón</Text>
        <Text style={styles.cardText}>{LICENCIA_INFO.oficinaCastellon}</Text>
      </View>

      <TouchableOpacity style={styles.ctaButton} onPress={() => Linking.openURL(LICENCIA_INFO.tramiteOnline)}>
        <Text style={styles.ctaText}>Tramitar licencia continental (Sede GVA)</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.ctaButtonSecondary} onPress={() => Linking.openURL(FUENTE_NORMATIVA.urlOrden)}>
        <Text style={styles.ctaTextSecondary}>Consultar resolución de tramos (DOGV)</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Pesca marítima desde tierra</Text>
        <Text style={styles.cardText}>
          En la orilla del mar hace falta la licencia de pesca marítima recreativa desde tierra. No sustituye a la
          continental, ni al revés. Decreto 41/2013: no puertos, no a menos de 100 m de bañistas, no vender capturas.
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
        Los importes, vedas y anexos pueden actualizarse cada temporada. Confirma siempre los datos vigentes en la sede
        electrónica y el DOGV antes de pescar.
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
  resumen: { fontSize: 14, color: COLORS.textPrimary, marginBottom: 8, lineHeight: 20 },
  vigencia: { fontSize: 11.5, color: COLORS.textMuted, marginBottom: 14, lineHeight: 16, fontStyle: "italic" },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 12,
    ...SHADOW,
  },
  cardTitle: { fontSize: 15, fontWeight: "700", marginBottom: 8, color: COLORS.textPrimary },
  cardText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  rowLabel: { fontSize: 13, color: COLORS.textSecondary, flex: 1 },
  rowValue: { fontSize: 13, fontWeight: "700", color: COLORS.primary },
  bullet: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 4, lineHeight: 18 },
  tallaRow: { marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tallaName: { fontSize: 13, fontWeight: "700", color: COLORS.textPrimary },
  tallaVal: { fontSize: 12.5, color: COLORS.textSecondary, marginTop: 2, lineHeight: 17 },
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
