import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, LayoutAnimation, Platform, UIManager } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { obtenerUbicacionActual, solicitarPermisoUbicacion } from "../services/locationService";
import { obtenerPrevision, descripcionTiempo, detectarAlertas, PrevisionDia } from "../services/weatherService";
import { calcularIndicePesca, IndicePescaDia, CATEGORIA_INFO } from "../services/fishingIndexService";
import { COLORS, RADIUS, SHADOW, SPACING } from "../theme";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const DIAS_CORTOS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

function formatearDia(fechaIso: string, index: number): string {
  const d = new Date(fechaIso + "T00:00:00");
  if (index === 0) return "Hoy";
  if (index === 1) return "Mañana";
  return `${DIAS_CORTOS[d.getDay()]} ${d.getDate()}`;
}

export default function PrevisionScreen() {
  const [dias, setDias] = useState<PrevisionDia[]>([]);
  const [indice, setIndice] = useState<IndicePescaDia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [permisoDenegado, setPermisoDenegado] = useState(false);
  const [expandido, setExpandido] = useState<string | null>(null);

  async function cargar() {
    setCargando(true);
    const ok = await solicitarPermisoUbicacion();
    if (!ok) {
      setPermisoDenegado(true);
      setCargando(false);
      return;
    }
    setPermisoDenegado(false);
    const loc = await obtenerUbicacionActual();
    if (loc) {
      const [prevision, ind] = await Promise.all([
        obtenerPrevision(loc.lat, loc.lng, 7),
        calcularIndicePesca(loc.lat, loc.lng, 7),
      ]);
      setDias(prevision);
      setIndice(ind);
    }
    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  function toggleExpandido(fecha: string) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandido(expandido === fecha ? null : fecha);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 100 }}>
      <Text style={styles.title}>Previsión de 7 días</Text>
      <Text style={styles.subtitle}>Clima + índice de pesca para planear tu próxima jornada</Text>

      {cargando && <ActivityIndicator color={COLORS.water} style={{ marginTop: 30 }} />}

      {permisoDenegado && !cargando && (
        <View style={styles.center}>
          <Text style={styles.centerText}>Activa la ubicación para ver la previsión de tu zona.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={cargar}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}

      {!cargando &&
        dias.map((d, i) => {
          const tiempo = descripcionTiempo(d.codigoTiempo);
          const ind = indice.find((x) => x.fecha === d.fecha);
          const catInfo = ind ? CATEGORIA_INFO[ind.categoria] : null;
          const abierto = expandido === d.fecha;

          return (
            <TouchableOpacity
              key={d.fecha}
              activeOpacity={0.85}
              style={styles.dayCardWrap}
              onPress={() => ind && toggleExpandido(d.fecha)}
            >
              <LinearGradient
                colors={
                  ind?.categoria === "excelente"
                    ? ["#2e7d32", "#1b5e20"]
                    : ind?.categoria === "buena"
                    ? ["#f9a825", "#e65100"]
                    : ind?.categoria === "regular"
                    ? ["#78909c", "#455a64"]
                    : ind?.categoria === "mala"
                    ? ["#8d6e63", "#5d4037"]
                    : ["#90a4ae", "#607d8b"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.dayCard}
              >
                <View style={styles.dayTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dayLabel}>{formatearDia(d.fecha, i)}</Text>
                    <Text style={styles.dayDesc}>{tiempo.icono} {tiempo.texto}</Text>
                  </View>
                  <View style={styles.tempBlock}>
                    <Text style={styles.tempMax}>{Math.round(d.tempMax)}°</Text>
                    <Text style={styles.tempMin}>{Math.round(d.tempMin)}°</Text>
                  </View>
                </View>

                {catInfo && ind && (
                  <View style={styles.indexRow}>
                    <Text style={styles.indexBadge}>
                      {catInfo.icono} Pesca: {catInfo.texto} ({ind.puntuacion}/100)
                    </Text>
                    <Text style={styles.chevron}>{abierto ? "▲" : "▼"}</Text>
                  </View>
                )}

                <View style={styles.extraRow}>
                  {d.probabilidadLluvia !== null && <Text style={styles.extraText}>💧 {d.probabilidadLluvia}%</Text>}
                  {d.vientoMaxKmh !== null && <Text style={styles.extraText}>🌬️ {Math.round(d.vientoMaxKmh)} km/h</Text>}
                  {ind && <Text style={styles.extraText}>{ind.iconoLuna} {ind.faseLunar}</Text>}
                </View>

                {detectarAlertas({
                  codigoTiempo: d.codigoTiempo,
                  vientoMaxKmh: d.vientoMaxKmh,
                  probabilidadLluvia: d.probabilidadLluvia,
                  tempMax: d.tempMax,
                  tempMin: d.tempMin,
                }).map((alerta, idx) => (
                  <View key={idx} style={styles.alertBadge}>
                    <Text style={styles.alertBadgeText}>
                      {alerta.icono} {alerta.texto}
                    </Text>
                  </View>
                ))}

                {abierto && ind && (
                  <View style={styles.desgloseBox}>
                    {ind.desglose.map((motivo, idx) => (
                      <Text key={idx} style={styles.desgloseItem}>• {motivo}</Text>
                    ))}
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  title: { fontSize: 22, fontWeight: "800", color: COLORS.textPrimary },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, marginBottom: 18 },
  center: { alignItems: "center", marginTop: 30 },
  centerText: { fontSize: 13.5, color: COLORS.textSecondary, textAlign: "center" },
  retryButton: { backgroundColor: COLORS.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: RADIUS.md, marginTop: 12 },
  retryButtonText: { color: "#fff", fontWeight: "700" },
  dayCardWrap: { marginBottom: 12, borderRadius: RADIUS.lg, ...SHADOW },
  dayCard: { borderRadius: RADIUS.lg, padding: 16 },
  dayTopRow: { flexDirection: "row", alignItems: "center" },
  dayLabel: { fontSize: 16, fontWeight: "800", color: "#fff", textTransform: "capitalize" },
  dayDesc: { fontSize: 12.5, color: "rgba(255,255,255,0.85)", marginTop: 2 },
  tempBlock: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  tempMax: { fontSize: 22, fontWeight: "800", color: "#fff" },
  tempMin: { fontSize: 16, color: "rgba(255,255,255,0.7)" },
  indexRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
  },
  indexBadge: { fontSize: 12.5, fontWeight: "700", color: "#fff" },
  chevron: { fontSize: 11, color: "#fff" },
  extraRow: { flexDirection: "row", gap: 14, marginTop: 10 },
  extraText: { fontSize: 11.5, color: "rgba(255,255,255,0.9)" },
  alertBadge: {
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: RADIUS.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  alertBadgeText: { fontSize: 11.5, color: "#fff", fontWeight: "700" },
  desgloseBox: { marginTop: 10, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.25)", paddingTop: 10 },
  desgloseItem: { fontSize: 11.5, color: "rgba(255,255,255,0.95)", marginBottom: 5, lineHeight: 16 },
});
