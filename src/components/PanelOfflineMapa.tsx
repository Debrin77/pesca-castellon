import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import {
  EstadoOfflineMapa,
  leerEstadoOfflineMapa,
  prepararMapaOffline,
} from "../services/offlineMapService";
import { COLORS, RADIUS } from "../theme";

export default function PanelOfflineMapa() {
  const [estado, setEstado] = useState<EstadoOfflineMapa | null>(null);
  const [cargando, setCargando] = useState(false);
  const [progreso, setProgreso] = useState("");

  useEffect(() => {
    void leerEstadoOfflineMapa().then(setEstado);
  }, []);

  async function preparar() {
    setCargando(true);
    setProgreso("0 %");
    try {
      const e = await prepararMapaOffline((ok, total) => {
        setProgreso(`${Math.round((ok / Math.max(total, 1)) * 100)} %`);
      });
      setEstado(e);
    } finally {
      setCargando(false);
    }
  }

  return (
    <View style={styles.box} accessibilityLabel="Mapa offline">
      <Text style={styles.title} accessibilityRole="header">
        Mapa offline
      </Text>
      <Text style={styles.sub}>
        Calienta teselas de la provincia en caché. Normativa, especies y tramos ya van empaquetados en la app.
      </Text>
      {estado ? (
        <Text style={styles.meta}>
          {estado.preparadoEn
            ? `Última prep.: ${estado.preparadoEn.slice(0, 16).replace("T", " ")} · ${estado.teselasOk}/${estado.teselasPedidas} teselas`
            : "Sin preparar aún"}
        </Text>
      ) : null}
      {estado?.nota ? <Text style={styles.nota}>{estado.nota}</Text> : null}
      <TouchableOpacity
        style={[styles.btn, cargando && styles.btnDisabled]}
        onPress={() => void preparar()}
        disabled={cargando}
        accessibilityRole="button"
        accessibilityLabel="Preparar mapa offline"
      >
        {cargando ? (
          <View style={styles.row}>
            <ActivityIndicator color="#fff" />
            <Text style={styles.btnText}>  {progreso}</Text>
          </View>
        ) : (
          <Text style={styles.btnText}>Preparar zona (Wi‑Fi)</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 12,
  },
  title: { fontSize: 15, fontWeight: "800", color: COLORS.textPrimary },
  sub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4, lineHeight: 17 },
  meta: { fontSize: 11.5, color: COLORS.primary, fontWeight: "700", marginTop: 8 },
  nota: { fontSize: 11.5, color: COLORS.textMuted, marginTop: 4, lineHeight: 16 },
  btn: {
    marginTop: 12,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.sm,
    paddingVertical: 10,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  row: { flexDirection: "row", alignItems: "center" },
});
