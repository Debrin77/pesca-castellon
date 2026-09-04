import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useScrollToTop } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { obtenerUbicacionActual, solicitarPermisoUbicacion } from "../services/locationService";
import {
  obtenerPrevision,
  obtenerHorario,
  descripcionTiempo,
  detectarAlertas,
  obtenerOleaje,
  PrevisionDia,
  PrevisionHora,
} from "../services/weatherService";
import { NOTA_MAREAS_CASTELLON } from "../data/normativaMaritima";
import { calcularIndicePesca, IndicePescaDia, CATEGORIA_INFO } from "../services/fishingIndexService";
import { useProvincia } from "../context/ProvinciaContext";
import { usePuntoConsulta } from "../context/PuntoConsultaContext";
import { getProvinciaActiva } from "../provincias/runtime";
import { textoOrigenPrevision, type FuentePuntoConsulta } from "../services/puntoConsultaService";
import { resolverPoblacionCercana } from "../services/poblacionCercanaService";
import { COLORS, RADIUS, SPACING } from "../theme";
import ListaAnimada from "../components/ListaAnimada";
import IconoMeteo from "../components/IconoMeteo";
import { cieloDeCodigo } from "../components/meteoSky";
import AtmosferaMeteo from "../components/AtmosferaMeteo";

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
  const { provincia: provinciaCtx } = useProvincia();
  const provincia = provinciaCtx ?? getProvinciaActiva();
  const { punto, fijarPunto, limpiarPunto, listo: puntoListo } = usePuntoConsulta();
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);
  const insets = useSafeAreaInsets();
  const [dias, setDias] = useState<PrevisionDia[]>([]);
  const [horas, setHoras] = useState<PrevisionHora[]>([]);
  const [indice, setIndice] = useState<IndicePescaDia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [permisoDenegado, setPermisoDenegado] = useState(false);
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [oleaje, setOleaje] = useState<{ hora: string; alturaM: number }[]>([]);
  const [origen, setOrigen] = useState<{
    lat: number;
    lng: number;
    fuente: FuentePuntoConsulta;
    etiqueta?: string;
    poblacion?: string;
  } | null>(null);
  const cargaIdRef = useRef(0);

  const cargar = useCallback(async () => {
    const idCarga = ++cargaIdRef.current;
    setCargando(true);
    setPermisoDenegado(false);

    // Prioridad: punto del mapa → GPS → centro de provincia.
    let lat: number | null = null;
    let lng: number | null = null;
    let fuente: FuentePuntoConsulta = "centro";
    let etiqueta: string | undefined;
    let poblacion: string | undefined;

    if (punto && (punto.fuente === "mapa" || punto.fuente === "zona" || punto.fuente === "gps")) {
      lat = punto.lat;
      lng = punto.lng;
      fuente = punto.fuente;
      etiqueta = punto.etiqueta;
      poblacion = punto.poblacion;
    } else {
      const ok = await solicitarPermisoUbicacion();
      if (idCarga !== cargaIdRef.current) return;
      if (ok) {
        const loc = await obtenerUbicacionActual();
        if (idCarga !== cargaIdRef.current) return;
        if (loc) {
          lat = loc.lat;
          lng = loc.lng;
          fuente = "gps";
          etiqueta = "Tu ubicación";
        }
      } else if (!punto) {
        setPermisoDenegado(true);
      }
    }

    if (lat == null || lng == null) {
      lat = provincia.regionMapa.latitude;
      lng = provincia.regionMapa.longitude;
      fuente = "centro";
      etiqueta = `Centro de ${provincia.nombre}`;
      setPermisoDenegado(false);
    }

    if (!poblacion && fuente !== "gps") {
      poblacion = resolverPoblacionCercana(lat, lng, 35, provincia.id)?.nombre;
    }

    const oleajeCfg = provincia.oleaje;
    // Oleaje: si el punto es costero (Castellón), usa sus coords; si no, Grao por defecto.
    const oleajeLat = oleajeCfg ? (fuente === "mapa" || fuente === "zona" ? lat : oleajeCfg.lat) : null;
    const oleajeLng = oleajeCfg ? (fuente === "mapa" || fuente === "zona" ? lng : oleajeCfg.lng) : null;

    const [prevision, horario, ind, mar] = await Promise.all([
      obtenerPrevision(lat, lng, 7),
      obtenerHorario(lat, lng, 7),
      calcularIndicePesca(lat, lng, 7),
      oleajeLat != null && oleajeLng != null
        ? obtenerOleaje(oleajeLat, oleajeLng)
        : Promise.resolve([] as { hora: string; alturaM: number }[]),
    ]);
    if (idCarga !== cargaIdRef.current) return;
    setDias(prevision);
    setHoras(horario);
    setIndice(ind);
    setOleaje(mar.filter((o) => o.alturaM != null).slice(0, 12));
    setSeleccion(prevision[0]?.fecha ?? null);
    setOrigen({ lat, lng, fuente, etiqueta, poblacion });
    setCargando(false);
  }, [punto, provincia]);

  useEffect(() => {
    if (!puntoListo) return;
    cargar();
  }, [provincia.id, punto?.lat, punto?.lng, punto?.actualizadoEn, puntoListo, cargar]);

  async function usarMiGps() {
    const ok = await solicitarPermisoUbicacion();
    if (!ok) {
      setPermisoDenegado(true);
      return;
    }
    const loc = await obtenerUbicacionActual();
    if (loc) {
      await fijarPunto({ lat: loc.lat, lng: loc.lng, fuente: "gps", etiqueta: "Tu ubicación" });
    } else {
      await limpiarPunto();
    }
  }

  const dia = dias.find((d) => d.fecha === seleccion) ?? dias[0];
  const ind = dia ? indice.find((x) => x.fecha === dia.fecha) : undefined;
  const cat = ind ? CATEGORIA_INFO[ind.categoria] : null;
  const tiempo = dia ? descripcionTiempo(dia.codigoTiempo) : null;
  const cielo = dia ? cieloDeCodigo(dia.codigoTiempo) : cieloDeCodigo(2);
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

  const body = (
    <ScrollView
      ref={scrollRef}
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 12) + 52 }]}
      accessibilityLabel="Previsión meteorológica de 7 días"
    >
      <View style={[styles.introCard, { backgroundColor: cielo.glass, borderColor: cielo.glassBorder }]}>
        <Text style={styles.kicker} accessibilityRole="header">
          Previsión
        </Text>
        <Text style={styles.title}>
          {origen?.etiqueta
            ? `Siete días · ${origen.etiqueta}`
            : "Siete días en tu zona"}
        </Text>
        {origen?.poblacion && origen.fuente !== "gps" ? (
          <Text style={styles.poblacionLine} accessibilityRole="text">
            Población de referencia: {origen.poblacion}
          </Text>
        ) : null}
        <Text style={styles.subtitle}>
          {origen
            ? `${textoOrigenPrevision(origen)}. ${
                origen.fuente === "gps"
                  ? "También puedes tocar un tramo en el mapa."
                  : "Toca otro tramo en el mapa para cambiar el punto."
              }`
            : "Cielo animado, hora a hora e índice de pesca según el día elegido."}
        </Text>
        {origen && origen.fuente !== "gps" ? (
          <TouchableOpacity
            style={styles.origenBtn}
            onPress={usarMiGps}
            accessibilityRole="button"
            accessibilityLabel="Usar mi ubicación GPS"
          >
            <Text style={styles.origenBtnTxt}>Usar mi GPS</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {cargando && (
        <View style={styles.loadingBox} accessibilityLiveRegion="polite">
          <ActivityIndicator color="#fff" size="large" />
          <Text style={styles.loadingText}>
            {origen?.poblacion && origen.fuente !== "gps"
              ? `Cargando el tiempo en ${origen.poblacion}…`
              : origen?.etiqueta
                ? `Cargando el tiempo en ${origen.etiqueta}…`
                : "Cargando el tiempo…"}
          </Text>
        </View>
      )}

      {permisoDenegado && !cargando && dias.length === 0 && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Sin punto de consulta</Text>
          <Text style={styles.emptyText}>
            Activa la ubicación o toca un tramo en el Mapa / Especies: la previsión y los avisos locales seguirán esas coordenadas.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={cargar}
            accessibilityRole="button"
            accessibilityLabel="Reintentar"
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}

      {!cargando && dias.length > 0 && dia && tiempo && (
        <>
          <ListaAnimada replayKey={dia.fecha} index={0}>
            <View style={[styles.hero, { backgroundColor: cielo.glass, borderColor: cielo.glassBorder }]}>
              <Text style={styles.heroDate}>{fechaLarga(dia.fecha)}</Text>
              <View style={styles.heroMain}>
                <IconoMeteo codigo={dia.codigoTiempo} size={112} etiqueta={tiempo.texto} />
                <Text style={styles.heroTemp}>{Math.round(dia.tempMax)}°</Text>
              </View>
              <Text style={styles.heroCond}>{tiempo.texto}</Text>
              <Text style={styles.heroRange}>
                Máx. {Math.round(dia.tempMax)}° · Mín. {Math.round(dia.tempMin)}°
              </Text>
            </View>
          </ListaAnimada>

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
                  style={[
                    styles.dayChip,
                    { backgroundColor: cielo.chip, borderColor: cielo.glassBorder },
                    activo && { backgroundColor: cielo.chipOn, borderColor: 'rgba(255,255,255,0.55)' },
                  ]}
                >
                  <Text style={[styles.dayChipTop, activo && styles.dayChipTopOn]}>{lab.top}</Text>
                  <Text style={styles.dayChipNum}>{lab.num}</Text>
                  <IconoMeteo codigo={d.codigoTiempo} size={42} etiqueta={t.texto} />
                  <Text style={styles.dayChipTemp}>{Math.round(d.tempMax)}°</Text>
                  <Text style={styles.dayChipCond} numberOfLines={2}>
                    {climaCorto(t.texto)}
                  </Text>
                  {iDia ? (
                    <View
                      style={[
                        styles.dot,
                        { backgroundColor: CATEGORIA_INFO[iDia.categoria].fondo },
                        { borderColor: CATEGORIA_INFO[iDia.categoria].color },
                      ]}
                      accessibilityLabel={`Índice de pesca ${CATEGORIA_INFO[iDia.categoria].texto}`}
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>

          {cat && ind ? (
            <ListaAnimada replayKey={`idx-${dia.fecha}`} index={1}>
              <View style={[styles.glassCard, { backgroundColor: cielo.glass, borderColor: cielo.glassBorder }]}>
                <View style={styles.indexHead}>
                  <Text style={styles.glassLabel}>Índice de pesca</Text>
                  <Text style={styles.glassStrong}>
                    {ind.puntuacion} · {cat.texto}
                  </Text>
                </View>
                <View style={styles.meterTrack} accessibilityLabel={`Puntuación ${ind.puntuacion} de 100`}>
                  <View
                    style={[
                      styles.meterFill,
                      { width: `${ind.puntuacion}%`, backgroundColor: cat.fondo },
                    ]}
                  />
                </View>
                <Text style={styles.glassHint}>
                  Orientativo (presión, nubes, viento, lluvia y luna). No es un aviso oficial.
                </Text>
              </View>
            </ListaAnimada>
          ) : null}

          <View style={styles.metrics}>
            <View style={[styles.metric, { backgroundColor: cielo.glass, borderColor: cielo.glassBorder }]}>
              <Text style={styles.glassLabel}>Lluvia</Text>
              <Text style={styles.metricValue}>
                {dia.probabilidadLluvia !== null ? `${dia.probabilidadLluvia}%` : "—"}
              </Text>
              <Text style={styles.glassHint}>Prob. máxima</Text>
            </View>
            <View style={[styles.metric, { backgroundColor: cielo.glass, borderColor: cielo.glassBorder }]}>
              <Text style={styles.glassLabel}>Viento</Text>
              <Text style={styles.metricValue}>
                {dia.vientoMaxKmh !== null ? `${Math.round(dia.vientoMaxKmh)}` : "—"}
              </Text>
              <Text style={styles.glassHint}>km/h racha</Text>
            </View>
            <View style={[styles.metric, { backgroundColor: cielo.glass, borderColor: cielo.glassBorder }]}>
              <Text style={styles.glassLabel}>Luna</Text>
              <Text style={styles.metricValueSmall}>{ind?.faseLunar ?? "—"}</Text>
              <Text style={styles.glassHint}>Fase del día</Text>
            </View>
          </View>

          {alertas.length > 0 && (
            <View style={styles.alertsBlock}>
              <Text style={styles.sectionTitle}>Avisos del día en este punto</Text>
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
            <View style={{ marginTop: 8 }}>
              <Text style={styles.sectionTitle}>Por horas</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hours}>
                {horasDia.map((h) => {
                  const th = descripcionTiempo(h.codigoTiempo);
                  return (
                    <View
                      key={`${h.fecha}-${h.hora}`}
                      style={[styles.hourCard, { backgroundColor: cielo.glass, borderColor: cielo.glassBorder }]}
                    >
                      <Text style={styles.hourTime}>{h.hora}</Text>
                      <IconoMeteo codigo={h.codigoTiempo} size={48} etiqueta={th.texto} />
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
            <View style={[styles.why, { backgroundColor: cielo.glass, borderColor: cielo.glassBorder }]}>
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

          {provincia.oleaje && oleaje.length > 0 ? (
            <View style={{ marginTop: 16 }}>
              <Text style={styles.sectionTitle}>{provincia.oleaje.etiqueta}</Text>
              <Text style={styles.subtitleSoft}>{NOTA_MAREAS_CASTELLON}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hours}>
                {oleaje.map((o) => (
                  <View
                    key={o.hora}
                    style={[styles.hourCard, { backgroundColor: cielo.glass, borderColor: cielo.glassBorder }]}
                  >
                    <Text style={styles.hourTime}>{o.hora}</Text>
                    <Text style={styles.hourTemp}>{o.alturaM.toFixed(1)} m</Text>
                    <Text style={styles.hourRain}>altura de ola</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : null}

          <Text style={styles.fuente}>Datos de Open-Meteo. Los avisos no sustituyen a AEMET.</Text>
        </>
      )}
    </ScrollView>
  );

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[...cielo.gradient]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={["rgba(10,20,35,0.35)", "transparent"]}
        style={styles.topVeil}
        pointerEvents="none"
      />
      <AtmosferaMeteo codigo={dia?.codigoTiempo ?? 2} />
      {/* Veladura inferior para anclar el contenido como en Weather.app */}
      <LinearGradient
        colors={["transparent", "rgba(10,20,35,0.45)"]}
        style={styles.bottomVeil}
        pointerEvents="none"
      />
      {body}
    </View>
  );
}

const glassText = "#ffffff";

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#3a7fc4" },
  scroll: { flex: 1, backgroundColor: "transparent" },
  content: { padding: SPACING.lg, paddingBottom: 120 },
  topVeil: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 140,
  },
  bottomVeil: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 220,
  },
  hero: {
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  introCard: {
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  kicker: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.4,
    color: "#ffffff",
    textTransform: "uppercase",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: glassText,
    marginTop: 4,
    lineHeight: 34,
    letterSpacing: -0.4,
  },
  poblacionLine: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
    marginTop: 8,
    lineHeight: 22,
  },
  subtitle: {
    fontSize: 14.5,
    color: "#ffffff",
    marginTop: 6,
    marginBottom: 0,
    lineHeight: 21,
    fontWeight: "600",
  },
  origenBtn: {
    alignSelf: "flex-start",
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.45)",
  },
  origenBtnTxt: { color: "#fff", fontWeight: "800", fontSize: 13 },
  subtitleSoft: {
    fontSize: 13,
    color: "#ffffff",
    marginBottom: 10,
    lineHeight: 19,
    fontWeight: "600",
  },
  loadingBox: { alignItems: "center", paddingVertical: 40 },
  loadingText: { marginTop: 12, fontSize: 16, color: "#ffffff", fontWeight: "700" },
  emptyCard: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: RADIUS.lg,
    padding: 20,
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
  heroDate: {
    fontSize: 15,
    fontWeight: "800",
    color: "#ffffff",
    textTransform: "capitalize",
    marginBottom: 4,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  heroMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  heroTemp: {
    fontSize: 86,
    fontWeight: "200",
    color: glassText,
    letterSpacing: -3,
    lineHeight: 92,
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  heroCond: {
    fontSize: 22,
    fontWeight: "800",
    color: glassText,
    marginTop: 4,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  heroRange: {
    fontSize: 16,
    color: "#ffffff",
    marginTop: 4,
    fontWeight: "700",
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  strip: { gap: 10, paddingVertical: 10 },
  dayChip: {
    width: 100,
    minHeight: 168,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    borderWidth: 1,
  },
  dayChipOn: {
    borderWidth: 2,
  },
  dayChipTop: { fontSize: 13, fontWeight: "800", color: "#ffffff", letterSpacing: 0.4 },
  dayChipTopOn: { color: "#fff" },
  dayChipNum: { fontSize: 20, fontWeight: "800", color: glassText, marginBottom: 2 },
  dayChipTemp: { fontSize: 17, fontWeight: "800", color: glassText, marginTop: 4 },
  dayChipCond: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
    marginTop: 4,
    lineHeight: 15,
    minHeight: 30,
  },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 6, borderWidth: 1.5 },
  glassCard: {
    borderRadius: RADIUS.lg,
    padding: 16,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
  },
  indexHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  glassLabel: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "#ffffff",
  },
  glassStrong: { fontSize: 17, fontWeight: "800", color: glassText },
  meterTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.28)",
    marginTop: 12,
    overflow: "hidden",
  },
  meterFill: { height: "100%", borderRadius: 5 },
  glassHint: {
    fontSize: 13,
    color: "#ffffff",
    marginTop: 10,
    lineHeight: 18,
    fontWeight: "600",
  },
  metrics: { flexDirection: "row", gap: 10, marginTop: 12 },
  metric: {
    flex: 1,
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
    minHeight: 100,
  },
  metricValue: { fontSize: 24, fontWeight: "800", color: glassText, marginTop: 8 },
  metricValueSmall: { fontSize: 14, fontWeight: "800", color: glassText, marginTop: 8, lineHeight: 18 },
  alertsBlock: { marginTop: 16 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: glassText,
    marginBottom: 10,
    marginTop: 8,
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  alert: { borderRadius: RADIUS.md, padding: 14, marginBottom: 8, borderWidth: 2 },
  alertWarn: { backgroundColor: "rgba(254,243,230,0.97)", borderColor: COLORS.warning },
  alertDanger: { backgroundColor: "rgba(253,236,234,0.97)", borderColor: COLORS.danger },
  alertWarnText: { fontSize: 15, fontWeight: "700", color: "#7a3b08", lineHeight: 22 },
  alertDangerText: { fontSize: 15, fontWeight: "700", color: "#7a1414", lineHeight: 22 },
  hours: { gap: 10, paddingBottom: 4 },
  hourCard: {
    width: 108,
    borderRadius: RADIUS.md,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    minHeight: 158,
  },
  hourTime: { fontSize: 14, fontWeight: "800", color: "#ffffff" },
  hourTemp: { fontSize: 22, fontWeight: "800", color: glassText, marginTop: 6 },
  hourRain: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 16,
  },
  why: {
    marginTop: 16,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
  },
  whyRow: { flexDirection: "row", gap: 12, marginBottom: 10, alignItems: "flex-start" },
  whyMark: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FFD60A", marginTop: 7 },
  whyText: { flex: 1, fontSize: 15, color: glassText, lineHeight: 22, fontWeight: "700" },
  fuente: {
    fontSize: 13,
    color: "#ffffff",
    marginTop: 20,
    lineHeight: 19,
    fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
