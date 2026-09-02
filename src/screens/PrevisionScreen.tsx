import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { useScrollToTop } from "@react-navigation/native";
import { obtenerUbicacionActual, solicitarPermisoUbicacion } from "../services/locationService";
import {
  obtenerPrevision,
  obtenerHorario,
  descripcionTiempo,
  detectarAlertas,
  PrevisionDia,
  PrevisionHora,
} from "../services/weatherService";
import { calcularIndicePesca, IndicePescaDia, CATEGORIA_INFO } from "../services/fishingIndexService";
import { COLORS, RADIUS, SHADOW, SHADOW_SOFT, SPACING } from "../theme";
import ListaAnimada from "../components/ListaAnimada";
import IconoMeteo from "../components/IconoMeteo";

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const DIAS_CORTOS = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function fechaLarga(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}`;
}

function etiquetaCorta(iso: string, index: number): { top: string; num: string } {
  const d = new Date(iso + "T12:00:00");
  if (index === 0) return { top: "HOY", num: String(d.getDate()) };
  if (index === 1) return { top: "MAÑ", num: String(d.getDate()) };
  return { top: DIAS_CORTOS[d.getDay()], num: String(d.getDate()) };
}

/** Etiqueta corta para que quepa a 16 px bajo el icono del día. */
function climaCorto(texto: string): string {
  const mapa: Record<string, string> = {
    "Cielo despejado": "Despejado",
    "Mayormente despejado": "Poco nublado",
    "Parcialmente nublado": "Intervalos",
    "Nublado": "Nublado",
    "Niebla": "Niebla",
    "Niebla helada": "Niebla",
    "Llovizna ligera": "Llovizna",
    "Llovizna": "Llovizna",
    "Llovizna intensa": "Llovizna",
    "Lluvia ligera": "Lluvia",
    "Lluvia": "Lluvia",
    "Lluvia intensa": "Lluvia",
    "Nieve ligera": "Nieve",
    "Nieve": "Nieve",
    "Nieve intensa": "Nieve",
    "Chubascos ligeros": "Chubascos",
    "Chubascos": "Chubascos",
    "Chubascos fuertes": "Chubascos",
    "Tormenta": "Tormenta",
    "Tormenta con granizo": "Granizo",
    "Tormenta fuerte con granizo": "Granizo",
    "Sin datos": "Sin datos",
  };
  return mapa[texto] ?? texto;
}

export default function PrevisionScreen() {
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);
  const [dias, setDias] = useState<PrevisionDia[]>([]);
  const [horas, setHoras] = useState<PrevisionHora[]>([]);
  const [indice, setIndice] = useState<IndicePescaDia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [permisoDenegado, setPermisoDenegado] = useState(false);
  const [seleccion, setSeleccion] = useState<string | null>(null);

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
      const [prevision, horario, ind] = await Promise.all([
        obtenerPrevision(loc.lat, loc.lng, 7),
        obtenerHorario(loc.lat, loc.lng, 7),
        calcularIndicePesca(loc.lat, loc.lng, 7),
      ]);
      setDias(prevision);
      setHoras(horario);
      setIndice(ind);
      setSeleccion(prevision[0]?.fecha ?? null);
    }
    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  const dia = dias.find((d) => d.fecha === seleccion) ?? dias[0];
  const ind = dia ? indice.find((x) => x.fecha === dia.fecha) : undefined;
  const cat = ind ? CATEGORIA_INFO[ind.categoria] : null;
  const tiempo = dia ? descripcionTiempo(dia.codigoTiempo) : null;
  const alertas = dia
    ? detectarAlertas({
        codigoTiempo: dia.codigoTiempo,
        vientoMaxKmh: dia.vientoMaxKmh,
        probabilidadLluvia: dia.probabilidadLluvia,
        tempMax: dia.tempMax,
        tempMin: dia.tempMin,
      })
    : [];

  const horasDia = useMemo(() => {
    if (!dia) return [];
    const ahora = new Date();
    const esHoy = dia.fecha === ahora.toISOString().slice(0, 10);
    const lista = horas.filter((h) => h.fecha === dia.fecha);
    if (!esHoy) return lista.filter((_, i) => i % 2 === 0).slice(0, 8);
    const hh = ahora.getHours();
    return lista.filter((h) => parseInt(h.hora.slice(0, 2), 10) >= hh).slice(0, 10);
  }, [dia, horas]);

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={styles.content}
      accessibilityLabel="Previsión meteorológica de 7 días"
    >
      <Text style={styles.kicker} accessibilityRole="header">
        Previsión
      </Text>
      <Text style={styles.title}>Siete días en tu zona</Text>
      <Text style={styles.subtitle}>
        Tiempo hora a hora, avisos y el índice de pesca. Texto y colores pensados para leerse con claridad.
      </Text>

      {cargando && (
        <View style={styles.loadingBox} accessibilityLiveRegion="polite">
          <ActivityIndicator color={COLORS.waterDark} size="large" />
          <Text style={styles.loadingText}>Cargando el tiempo de tu ubicación…</Text>
        </View>
      )}

      {permisoDenegado && !cargando && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Hace falta la ubicación</Text>
          <Text style={styles.emptyText}>
            Con el permiso de ubicación te mostramos la previsión del sitio donde estás.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={cargar}
            accessibilityRole="button"
            accessibilityLabel="Reintentar permiso de ubicación"
          >
            <Text style={styles.retryButtonText}>Permitir y recargar</Text>
          </TouchableOpacity>
        </View>
      )}

      {!cargando && dias.length > 0 && dia && tiempo && (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.strip}
            accessibilityRole="tablist"
          >
            {dias.map((d, i) => {
              const lab = etiquetaCorta(d.fecha, i);
              const t = descripcionTiempo(d.codigoTiempo);
              const activo = d.fecha === dia.fecha;
              const iDia = indice.find((x) => x.fecha === d.fecha);
              return (
                <Pressable
                  key={d.fecha}
                  onPress={() => setSeleccion(d.fecha)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: activo }}
                  accessibilityLabel={`${lab.top} ${lab.num}, ${t.texto}, máxima ${Math.round(d.tempMax)} grados, mínima ${Math.round(d.tempMin)}`}
                  style={[styles.dayChip, activo && styles.dayChipOn]}
                >
                  <Text style={[styles.dayChipTop, activo && styles.dayChipTopOn]}>{lab.top}</Text>
                  <Text style={[styles.dayChipNum, activo && styles.dayChipNumOn]}>{lab.num}</Text>
                  <IconoMeteo codigo={d.codigoTiempo} size={40} etiqueta={t.texto} sobreOscuro={activo} />
                  <Text style={[styles.dayChipTemp, activo && styles.dayChipTempOn]}>
                    {Math.round(d.tempMax)}°
                  </Text>
                  <Text
                    style={[styles.dayChipCond, activo && styles.dayChipCondOn]}
                    numberOfLines={2}
                  >
                    {climaCorto(t.texto)}
                  </Text>
                  {iDia ? (
                    <View
                      style={[
                        styles.dot,
                        { backgroundColor: CATEGORIA_INFO[iDia.categoria].color },
                        activo && styles.dotOn,
                      ]}
                      accessibilityLabel={`Índice de pesca ${CATEGORIA_INFO[iDia.categoria].texto}`}
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>

          <ListaAnimada replayKey={dia.fecha} index={0}>
            <View style={styles.hero}>
              <Text style={styles.heroDate}>{fechaLarga(dia.fecha)}</Text>
              <View style={styles.heroRow}>
                <IconoMeteo codigo={dia.codigoTiempo} size={88} etiqueta={tiempo.texto} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroTemp}>{Math.round(dia.tempMax)}°</Text>
                  <Text style={styles.heroRange}>
                    Máxima {Math.round(dia.tempMax)}° · Mínima {Math.round(dia.tempMin)}°
                  </Text>
                  <Text style={styles.heroCond}>{tiempo.texto}</Text>
                </View>
              </View>
            </View>
          </ListaAnimada>

          {cat && ind ? (
            <ListaAnimada replayKey={`idx-${dia.fecha}`} index={1}>
              <View style={[styles.indexCard, { backgroundColor: cat.fondo }]}>
                <View style={styles.indexHead}>
                  <Text style={[styles.indexLabel, { color: cat.color }]}>Índice de pesca</Text>
                  <Text style={[styles.indexScore, { color: cat.color }]}>
                    {ind.puntuacion} de 100
                  </Text>
                </View>
                <Text style={[styles.indexCat, { color: cat.color }]}>{cat.texto}</Text>
                <View style={styles.meterTrack} accessibilityLabel={`Puntuación ${ind.puntuacion} de 100`}>
                  <View style={[styles.meterFill, { width: `${ind.puntuacion}%`, backgroundColor: cat.color }]} />
                </View>
                <Text style={styles.indexHint}>
                  Orientativo (presión, nubes, viento, lluvia y luna). No es un aviso oficial.
                </Text>
              </View>
            </ListaAnimada>
          ) : null}

          <View style={styles.metrics}>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Lluvia</Text>
              <Text style={styles.metricValue}>
                {dia.probabilidadLluvia !== null ? `${dia.probabilidadLluvia} %` : "—"}
              </Text>
              <Text style={styles.metricHelp}>Probabilidad máxima</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Viento</Text>
              <Text style={styles.metricValue}>
                {dia.vientoMaxKmh !== null ? `${Math.round(dia.vientoMaxKmh)}` : "—"}
              </Text>
              <Text style={styles.metricHelp}>km/h racha máxima</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Luna</Text>
              <Text style={styles.metricValueSmall}>{ind?.faseLunar ?? "—"}</Text>
              <Text style={styles.metricHelp}>Fase del día</Text>
            </View>
          </View>

          {alertas.length > 0 && (
            <View style={styles.alertsBlock}>
              <Text style={styles.sectionTitle}>Avisos del día</Text>
              {alertas.map((a, i) => (
                <View
                  key={i}
                  style={[styles.alert, a.nivel === "peligro" ? styles.alertDanger : styles.alertWarn]}
                  accessibilityRole="alert"
                >
                  <Text style={a.nivel === "peligro" ? styles.alertDangerText : styles.alertWarnText}>
                    {a.nivel === "peligro" ? "Peligro: " : "Aviso: "}
                    {a.texto}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {horasDia.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>Por horas</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hours}>
                {horasDia.map((h) => {
                  const th = descripcionTiempo(h.codigoTiempo);
                  return (
                    <View key={`${h.fecha}-${h.hora}`} style={styles.hourCard}>
                      <Text style={styles.hourTime}>{h.hora}</Text>
                      <IconoMeteo codigo={h.codigoTiempo} size={44} etiqueta={th.texto} />
                      <Text style={styles.hourTemp}>{Math.round(h.temperatura)}°</Text>
                      <Text style={styles.hourRain} numberOfLines={2}>
                        {h.probabilidadLluvia !== null ? `${h.probabilidadLluvia}% lluvia` : climaCorto(th.texto)}
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {ind?.desglose?.length ? (
            <View style={styles.why}>
              <Text style={styles.sectionTitle}>Por qué este índice</Text>
              {ind.desglose.map((motivo, i) => (
                <ListaAnimada key={i} index={i} replayKey={dia.fecha}>
                  <View style={styles.whyRow}>
                    <View style={styles.whyMark} />
                    <Text style={styles.whyText}>{motivo}</Text>
                  </View>
                </ListaAnimada>
              ))}
            </View>
          ) : null}

          <Text style={styles.fuente}>Datos de Open-Meteo. Los avisos no sustituyen a AEMET.</Text>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingBottom: 120 },
  kicker: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: COLORS.waterDark,
    textTransform: "uppercase",
  },
  title: { fontSize: 28, fontWeight: "800", color: COLORS.textPrimary, marginTop: 4, lineHeight: 34 },
  subtitle: { fontSize: 16, color: COLORS.textSecondary, marginTop: 8, marginBottom: 20, lineHeight: 24 },
  loadingBox: { alignItems: "center", paddingVertical: 40 },
  loadingText: { marginTop: 12, fontSize: 16, color: COLORS.textSecondary },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: COLORS.textPrimary },
  emptyText: { fontSize: 16, color: COLORS.textSecondary, marginTop: 8, lineHeight: 24 },
  retryButton: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    minHeight: 48,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  retryButtonText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  strip: { gap: 10, paddingBottom: 8 },
  dayChip: {
    width: 102,
    minHeight: 178,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  dayChipOn: {
    backgroundColor: COLORS.primaryDark,
    borderColor: COLORS.primaryDark,
  },
  dayChipTop: { fontSize: 16, fontWeight: "800", color: COLORS.textSecondary, letterSpacing: 0.3 },
  dayChipTopOn: { color: "#ffffff" },
  dayChipNum: { fontSize: 22, fontWeight: "800", color: COLORS.textPrimary, marginBottom: 2 },
  dayChipNumOn: { color: "#ffffff" },
  dayChipTemp: { fontSize: 18, fontWeight: "800", color: COLORS.textPrimary, marginTop: 4 },
  dayChipTempOn: { color: "#ffffff" },
  dayChipCond: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
    textAlign: "center",
    marginTop: 4,
    lineHeight: 20,
    minHeight: 40,
  },
  dayChipCondOn: { color: "#ffffff" },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  dotOn: { borderWidth: 2, borderColor: "#ffffff" },
  hero: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 20,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW,
  },
  heroDate: { fontSize: 16, fontWeight: "700", color: COLORS.textSecondary, textTransform: "capitalize" },
  heroRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8 },
  heroTemp: { fontSize: 52, fontWeight: "800", color: COLORS.textPrimary, lineHeight: 58 },
  heroRange: { fontSize: 18, color: COLORS.textSecondary, marginTop: 4, lineHeight: 26 },
  heroCond: { fontSize: 20, fontWeight: "700", color: COLORS.waterDark, marginTop: 8, lineHeight: 28 },
  indexCard: {
    marginTop: 14,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  indexHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  indexLabel: { fontSize: 16, fontWeight: "800", letterSpacing: 0.3, textTransform: "uppercase" },
  indexScore: { fontSize: 18, fontWeight: "800" },
  indexCat: { fontSize: 22, fontWeight: "800", marginTop: 4 },
  meterTrack: {
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(18,32,24,0.12)",
    marginTop: 12,
    overflow: "hidden",
  },
  meterFill: { height: "100%", borderRadius: 6 },
  indexHint: { fontSize: 16, color: COLORS.textSecondary, marginTop: 10, lineHeight: 24 },
  metrics: { flexDirection: "row", gap: 10, marginTop: 14 },
  metric: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 108,
    ...SHADOW_SOFT,
  },
  metricLabel: { fontSize: 16, fontWeight: "800", color: COLORS.textSecondary, textTransform: "uppercase" },
  metricValue: { fontSize: 24, fontWeight: "800", color: COLORS.textPrimary, marginTop: 8 },
  metricValueSmall: { fontSize: 16, fontWeight: "800", color: COLORS.textPrimary, marginTop: 8, lineHeight: 22 },
  metricHelp: { fontSize: 16, color: COLORS.textSecondary, marginTop: 6, lineHeight: 22 },
  alertsBlock: { marginTop: 18 },
  sectionTitle: { fontSize: 20, fontWeight: "800", color: COLORS.textPrimary, marginBottom: 10, marginTop: 8 },
  alert: { borderRadius: RADIUS.md, padding: 14, marginBottom: 8, borderWidth: 2 },
  alertWarn: { backgroundColor: COLORS.warningLight, borderColor: COLORS.warning },
  alertDanger: { backgroundColor: COLORS.dangerLight, borderColor: COLORS.danger },
  alertWarnText: { fontSize: 16, fontWeight: "700", color: "#7a3b08", lineHeight: 24 },
  alertDangerText: { fontSize: 16, fontWeight: "700", color: "#7a1414", lineHeight: 24 },
  hours: { gap: 10, paddingBottom: 4 },
  hourCard: {
    width: 118,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 176,
  },
  hourTime: { fontSize: 16, fontWeight: "800", color: COLORS.textSecondary },
  hourTemp: { fontSize: 22, fontWeight: "800", color: COLORS.textPrimary, marginTop: 6 },
  hourRain: { fontSize: 16, fontWeight: "600", color: COLORS.textPrimary, textAlign: "center", marginTop: 6, lineHeight: 22 },
  why: { marginTop: 18 },
  whyRow: { flexDirection: "row", gap: 12, marginBottom: 12, alignItems: "flex-start" },
  whyMark: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.waterDark, marginTop: 8 },
  whyText: { flex: 1, fontSize: 18, color: COLORS.textPrimary, lineHeight: 26 },
  fuente: { fontSize: 16, color: COLORS.textSecondary, marginTop: 20, lineHeight: 24 },
});
