import React, { useCallback, useEffect, useState } from "react";
import { Text, StyleSheet, TouchableOpacity, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { COLORS, RADIUS, SHADOW_SOFT } from "../theme";
import { resumenLicenciasCortas } from "../services/storageService";

interface Props {
  onPress: () => void;
  compact?: boolean;
}

const CLAVE_PLEGADO = "@pesca_castellon/banner_licencia_plegado";

/**
 * Aviso GVA: continental + marítima recreativa desde tierra.
 * Se puede plegar para liberar pantalla en Inicio.
 */
export default function LicenseBanner({ onPress, compact }: Props) {
  const [plegado, setPlegado] = useState(false);
  const [resumen, setResumen] = useState("Sin licencias guardadas en el móvil");

  useEffect(() => {
    AsyncStorage.getItem(CLAVE_PLEGADO).then((v) => {
      if (v === "1") setPlegado(true);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      resumenLicenciasCortas().then(setResumen);
    }, [])
  );

  async function alternarPlegado() {
    const siguiente = !plegado;
    setPlegado(siguiente);
    await AsyncStorage.setItem(CLAVE_PLEGADO, siguiente ? "1" : "0");
  }

  if (plegado) {
    return (
      <View style={[styles.wrap, compact && { marginBottom: 8 }]}>
        <View style={styles.collapsed}>
          <TouchableOpacity
            onPress={alternarPlegado}
            style={styles.collapsedMain}
            accessibilityRole="button"
            accessibilityLabel="Expandir aviso de licencias GVA"
          >
            <View style={styles.badge}>
              <Text style={styles.badgeText}>GVA</Text>
            </View>
            <Text style={styles.collapsedText} numberOfLines={1}>
              Licencias · continental y marítima desde tierra
            </Text>
            <Text style={styles.chevronDown}>▾</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onPress} style={styles.collapsedGo} accessibilityLabel="Abrir ficha de licencias">
            <Text style={styles.collapsedGoTxt}>Ver</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, compact && { marginBottom: 8 }]}>
      <View style={styles.banner}>
        <View style={styles.topRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>GVA</Text>
          </View>
          <Text style={styles.title}>Licencias de pesca en vigor</Text>
          <TouchableOpacity
            onPress={alternarPlegado}
            style={styles.minimize}
            accessibilityRole="button"
            accessibilityLabel="Minimizar aviso de licencias"
          >
            <Text style={styles.minimizeTxt}>Minimizar ▴</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.text}>
          En ríos y embalses: <Text style={styles.em}>licencia de pesca continental</Text>. En la orilla del mar:{" "}
          <Text style={styles.em}>licencia de pesca marítima recreativa desde tierra</Text>. No se sustituyen entre sí.
        </Text>

        <Text style={styles.resumen}>{resumen}</Text>

        <TouchableOpacity onPress={onPress} style={styles.cta} activeOpacity={0.85}>
          <Text style={styles.ctaTxt}>Consultar tasas, normativa y mis licencias</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14, borderRadius: RADIUS.md, ...SHADOW_SOFT },
  banner: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  topRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  badge: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginRight: 8,
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "800", letterSpacing: 0.6 },
  title: { flex: 1, color: COLORS.textPrimary, fontSize: 13, fontWeight: "800" },
  minimize: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: COLORS.mist,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  minimizeTxt: { fontSize: 11, fontWeight: "700", color: COLORS.textSecondary },
  text: { color: COLORS.textSecondary, fontSize: 12.5, lineHeight: 18, fontWeight: "500" },
  em: { color: COLORS.textPrimary, fontWeight: "700" },
  resumen: {
    marginTop: 8,
    fontSize: 11.5,
    color: COLORS.waterDark,
    fontWeight: "700",
  },
  cta: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.sm,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  ctaTxt: { flex: 1, color: COLORS.primaryDark, fontSize: 12.5, fontWeight: "700" },
  chevron: { color: COLORS.primaryDark, fontSize: 20, marginLeft: 6 },
  collapsed: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  collapsedMain: { flex: 1, flexDirection: "row", alignItems: "center" },
  collapsedText: { flex: 1, color: COLORS.textPrimary, fontSize: 12, fontWeight: "700" },
  chevronDown: { color: COLORS.textMuted, fontSize: 14, marginHorizontal: 6 },
  collapsedGo: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: COLORS.primaryLight,
  },
  collapsedGoTxt: { fontSize: 12, fontWeight: "800", color: COLORS.primaryDark },
});
