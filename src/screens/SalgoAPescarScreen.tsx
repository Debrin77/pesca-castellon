import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { obtenerUbicacionActual, solicitarPermisoUbicacion } from "../services/locationService";
import { calcularIndicePesca, CATEGORIA_INFO, IndicePescaDia } from "../services/fishingIndexService";
import { consultarPuntoPesca } from "../services/consultaPescaService";
import { CHECKLIST_ANTES_DE_PESCAR } from "../data/normativa2026";
import SemaforoVeredicto from "../components/SemaforoVeredicto";
import ConsultaPescaCard from "../components/ConsultaPescaCard";
import ListaAnimada from "../components/ListaAnimada";
import { COLORS, GRADIENTS, RADIUS, SHADOW, SPACING } from "../theme";

interface Props {
  navigation: any;
}

/**
 * Flujo corto “Salgo a pescar”: ubicación → veredicto → índice → checklist.
 */
export default function SalgoAPescarScreen({ navigation }: Props) {
  const [paso, setPaso] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [consulta, setConsulta] = useState<ReturnType<typeof consultarPuntoPesca> | null>(null);
  const [indice, setIndice] = useState<IndicePescaDia | null>(null);

  useEffect(() => {
    (async () => {
      setCargando(true);
      setError(null);
      const ok = await solicitarPermisoUbicacion();
      if (!ok) {
        setError("Necesitas activar la ubicación para este modo.");
        setCargando(false);
        return;
      }
      const loc = await obtenerUbicacionActual();
      if (!loc) {
        setError("No se pudo obtener tu posición. Inténtalo de nuevo al aire libre.");
        setCargando(false);
        return;
      }
      const c = consultarPuntoPesca(loc.lat, loc.lng);
      const dias = await calcularIndicePesca(loc.lat, loc.lng, 2);
      setConsulta(c);
      setIndice(dias[0] ?? null);
      setCargando(false);
    })();
  }, []);

  const cat = indice ? CATEGORIA_INFO[indice.categoria] : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
      <LinearGradient colors={[...GRADIENTS.primary]} style={styles.hero}>
        <Text style={styles.kicker}>Modo salida</Text>
        <Text style={styles.title}>Salgo a pescar</Text>
        <Text style={styles.sub}>En 10 segundos: dónde estás, cómo pinta y qué llevar.</Text>
        <View style={styles.steps}>
          {["Ubicación", "Veredicto", "Checklist"].map((t, i) => (
            <View key={t} style={[styles.step, paso >= i && styles.stepOn]}>
              <Text style={[styles.stepTxt, paso >= i && styles.stepTxtOn]}>{i + 1}. {t}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {cargando ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : error ? (
        <View style={styles.card}>
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity style={styles.btn} onPress={() => navigation.goBack()}>
            <Text style={styles.btnTxt}>Volver</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ListaAnimada index={0}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>1 · Dónde estás</Text>
              {consulta ? (
                <>
                  <SemaforoVeredicto consulta={consulta} />
                  <ConsultaPescaCard
                    consulta={consulta}
                    onFicha={
                      consulta.tramo?.fichaId
                        ? () => navigation.navigate("ZoneDetail", { zoneId: consulta.tramo!.fichaId })
                        : undefined
                    }
                    onAparejos={(id) =>
                      navigation.navigate("Aparejos", { screen: "AparejosMain", params: { especieId: id } })
                    }
                  />
                </>
              ) : (
                <Text style={styles.muted}>No hay tramo reconocido en este punto.</Text>
              )}
              <TouchableOpacity style={styles.btnGhost} onPress={() => setPaso(1)}>
                <Text style={styles.btnGhostTxt}>Continuar →</Text>
              </TouchableOpacity>
            </View>
          </ListaAnimada>

          {paso >= 1 && (
            <ListaAnimada index={1}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>2 · Cómo pinta hoy</Text>
                {indice && cat ? (
                  <View style={[styles.indexBox, { backgroundColor: cat.fondo }]}>
                    <Text style={[styles.indexBig, { color: cat.color }]}>
                      {cat.icono} {cat.texto}
                    </Text>
                    <Text style={styles.indexMeta}>
                      {indice.puntuacion}/100 · {indice.faseLunar} {indice.iconoLuna}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.muted}>Sin índice (revisa conexión o ubicación).</Text>
                )}
                <TouchableOpacity
                  style={styles.btnGhost}
                  onPress={() => {
                    setPaso(2);
                    navigation.navigate("Previsión");
                  }}
                >
                  <Text style={styles.btnGhostTxt}>Ver previsión completa</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnGhost} onPress={() => setPaso(2)}>
                  <Text style={styles.btnGhostTxt}>Ir al checklist →</Text>
                </TouchableOpacity>
              </View>
            </ListaAnimada>
          )}

          {paso >= 2 && (
            <ListaAnimada index={2}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>3 · Checklist rápido</Text>
                {CHECKLIST_ANTES_DE_PESCAR.map((item, i) => (
                  <Text key={i} style={styles.check}>
                    ☐ {item}
                  </Text>
                ))}
                <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate("Mapa")}>
                  <Text style={styles.btnTxt}>Abrir mapa</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.btnSecondary}
                  onPress={() => navigation.navigate("License")}
                >
                  <Text style={styles.btnSecondaryTxt}>Revisar licencias</Text>
                </TouchableOpacity>
              </View>
            </ListaAnimada>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  hero: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: 14,
    ...SHADOW,
  },
  kicker: { color: "#e8f5ee", fontWeight: "800", fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase" },
  title: { color: "#fff", fontSize: 28, fontWeight: "800", marginTop: 4 },
  sub: { color: "#eef7f1", marginTop: 6, fontSize: 14, lineHeight: 20 },
  steps: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 14 },
  step: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  stepOn: { backgroundColor: "rgba(255,255,255,0.35)" },
  stepTxt: { color: "#e8f5ee", fontSize: 11, fontWeight: "700" },
  stepTxtOn: { color: "#fff" },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW,
  },
  cardTitle: { fontSize: 15, fontWeight: "800", color: COLORS.textPrimary, marginBottom: 10 },
  muted: { color: COLORS.textSecondary, fontSize: 13 },
  error: { color: COLORS.danger, fontWeight: "700", marginBottom: 12 },
  indexBox: { borderRadius: RADIUS.md, padding: 14 },
  indexBig: { fontSize: 22, fontWeight: "800" },
  indexMeta: { marginTop: 4, color: COLORS.textSecondary, fontWeight: "700" },
  check: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 6 },
  btn: {
    marginTop: 12,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 13,
    alignItems: "center",
  },
  btnTxt: { color: "#fff", fontWeight: "800" },
  btnSecondary: {
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnSecondaryTxt: { color: COLORS.primary, fontWeight: "800" },
  btnGhost: { marginTop: 10, alignItems: "flex-end" },
  btnGhostTxt: { color: COLORS.water, fontWeight: "800" },
});
