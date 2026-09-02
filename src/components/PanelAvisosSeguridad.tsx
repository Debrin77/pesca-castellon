import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking, ActivityIndicator } from "react-native";
import {
  AvisoSeguridad,
  colorSeveridad,
  etiquetaSeveridad,
  formatearCuando,
} from "../services/avisosSeguridadService";
import { COLORS, RADIUS, SHADOW_SOFT } from "../theme";

interface Props {
  avisos: AvisoSeguridad[];
  cargando?: boolean;
  error?: string | null;
}

export default function PanelAvisosSeguridad({ avisos, cargando, error }: Props) {
  if (cargando) {
    return (
      <View style={styles.box}>
        <Text style={styles.kicker}>Seguridad · avisos oficiales</Text>
        <ActivityIndicator color={COLORS.warning} />
        <Text style={styles.meta}>Consultando AEMET / MeteoAlarm y caudales…</Text>
      </View>
    );
  }

  if (error && avisos.length === 0) {
    return (
      <View style={[styles.box, styles.boxMuted]}>
        <Text style={styles.kicker}>Seguridad · avisos oficiales</Text>
        <Text style={styles.meta}>No se pudo actualizar ahora. Revisa AEMET si vas a pescar con mal tiempo.</Text>
        <TouchableOpacity onPress={() => Linking.openURL("https://www.aemet.es/es/eltiempo/prediccion/avisos")}>
          <Text style={styles.link}>Abrir avisos AEMET →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (avisos.length === 0) {
    return (
      <View style={[styles.box, styles.boxOk]}>
        <Text style={styles.kicker}>Seguridad · avisos oficiales</Text>
        <Text style={styles.tituloOk}>Sin avisos activos de tormenta ni crecida en Castellón</Text>
        <Text style={styles.meta}>
          Fuente: AEMET vía MeteoAlarm + modelo de caudal. Sigue mirando el cielo: una tormenta local puede formarse sin aviso.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.box}>
      <Text style={styles.kicker}>Seguridad · avisos oficiales</Text>
      <Text style={styles.lead}>Hay avisos que afectan a quien pesca en río, embalse u orilla. Léelos antes de salir.</Text>
      {avisos.map((a) => {
        const color = colorSeveridad(a.severidad);
        return (
          <View key={a.id} style={[styles.card, { borderLeftColor: color }]}>
            <View style={styles.row}>
              <Text style={[styles.badge, { backgroundColor: color }]}>{etiquetaSeveridad(a.severidad)}</Text>
              <Text style={styles.tipo}>
                {a.tipo === "tormenta"
                  ? "⛈️ Tormenta"
                  : a.tipo === "crecida" || a.tipo === "lluvia"
                    ? "🌊 Caudal / lluvia"
                    : a.tipo === "viento"
                      ? "💨 Viento"
                      : a.tipo === "costero"
                        ? "🌊 Costa"
                        : "⚠️ Aviso"}
              </Text>
            </View>
            <Text style={styles.titulo}>{a.titulo}</Text>
            <Text style={styles.zona}>{a.zona}</Text>
            <Text style={styles.detalle}>{a.detalle}</Text>
            {(a.desde || a.hasta) && (
              <Text style={styles.cuando}>
                {a.desde ? `Desde ${formatearCuando(a.desde)}` : ""}
                {a.desde && a.hasta ? " · " : ""}
                {a.hasta ? `Hasta ${formatearCuando(a.hasta)}` : ""}
              </Text>
            )}
            <Text style={styles.fuente}>
              {a.fuente === "aemet_meteoalarm"
                ? "Oficial: AEMET (MeteoAlarm)"
                : a.fuente === "caudal_modelo"
                  ? "Modelo de caudal (Open-Meteo / GloFAS) · confirma en SAIH CHJ"
                  : "Meteo local"}
            </Text>
            {a.url ? (
              <TouchableOpacity onPress={() => Linking.openURL(a.url!)}>
                <Text style={[styles.link, { color }]}>Ver aviso completo →</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW_SOFT,
  },
  boxOk: { backgroundColor: COLORS.primaryLight, borderColor: "#b7d4c4" },
  boxMuted: { backgroundColor: COLORS.mist },
  kicker: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.7,
    textTransform: "uppercase",
    color: COLORS.textMuted,
    marginBottom: 6,
  },
  lead: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18, marginBottom: 10 },
  tituloOk: { fontSize: 14.5, fontWeight: "800", color: COLORS.primaryDark, marginBottom: 4 },
  meta: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 17 },
  card: {
    borderLeftWidth: 5,
    backgroundColor: COLORS.mist,
    borderRadius: RADIUS.sm,
    padding: 12,
    marginBottom: 8,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  badge: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "900",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    overflow: "hidden",
  },
  tipo: { fontSize: 12, fontWeight: "700", color: COLORS.textSecondary },
  titulo: { fontSize: 15, fontWeight: "800", color: COLORS.textPrimary },
  zona: { fontSize: 12.5, color: COLORS.textSecondary, marginTop: 2, fontWeight: "600" },
  detalle: { fontSize: 13, color: COLORS.textPrimary, lineHeight: 18, marginTop: 6 },
  cuando: { fontSize: 11.5, color: COLORS.textMuted, marginTop: 6 },
  fuente: { fontSize: 11, color: COLORS.textMuted, marginTop: 4, fontStyle: "italic" },
  link: { marginTop: 8, fontSize: 13, fontWeight: "700", color: COLORS.water },
});
