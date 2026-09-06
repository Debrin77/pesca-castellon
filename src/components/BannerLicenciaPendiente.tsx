import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { obtenerLicencias } from "../services/storageService";
import { licenciaMarcadaOk, marcarLicenciaOk } from "../services/primeraSalidaService";
import { COLORS, RADIUS } from "../theme";

type Props = {
  onAbrirLicencias: () => void;
};

/**
 * Visible arriba en Inicio hasta que haya licencia guardada
 * o el usuario marque «Ya la tengo».
 */
export default function BannerLicenciaPendiente({ onAbrirLicencias }: Props) {
  const [visible, setVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let vivo = true;
      (async () => {
        const [lista, ok] = await Promise.all([obtenerLicencias(), licenciaMarcadaOk()]);
        if (!vivo) return;
        setVisible(lista.length === 0 && !ok);
      })();
      return () => {
        vivo = false;
      };
    }, [])
  );

  if (!visible) return null;

  return (
    <View style={styles.wrap} accessibilityRole="summary">
      <Text style={styles.kicker}>ANTES DE LANZAR</Text>
      <Text style={styles.title}>¿Tienes la licencia en vigor?</Text>
      <Text style={styles.body}>
        Sin ella no puedes pescar legalmente. Guárdala en la app o márcala si ya la llevas encima.
      </Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.cta}
          onPress={onAbrirLicencias}
          accessibilityRole="button"
          accessibilityLabel="Abrir licencias"
        >
          <Text style={styles.ctaTxt}>Ver licencias</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.ghost}
          onPress={async () => {
            await marcarLicenciaOk(true);
            setVisible(false);
          }}
          accessibilityRole="button"
          accessibilityLabel="Marcar que ya tengo la licencia"
        >
          <Text style={styles.ghostTxt}>Ya la tengo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
    padding: 14,
    borderRadius: RADIUS.md,
    backgroundColor: "#fff7e8",
    borderWidth: 1.5,
    borderColor: COLORS.warning,
  },
  kicker: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: COLORS.warning,
    marginBottom: 4,
  },
  title: { fontSize: 16, fontWeight: "800", color: COLORS.textPrimary },
  body: { marginTop: 4, fontSize: 13, lineHeight: 18, color: COLORS.textSecondary, fontWeight: "600" },
  row: { flexDirection: "row", gap: 8, marginTop: 12, flexWrap: "wrap" },
  cta: {
    backgroundColor: COLORS.warning,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  ctaTxt: { color: "#fff", fontWeight: "800", fontSize: 13 },
  ghost: {
    borderWidth: 1,
    borderColor: COLORS.warning,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  ghostTxt: { color: COLORS.warning, fontWeight: "800", fontSize: 13 },
});
