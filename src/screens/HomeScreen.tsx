import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useScrollToTop } from "@react-navigation/native";
import MapView, { Marker, Circle } from "../components/map";
import { obtenerUbicacionActual, solicitarPermisoUbicacion } from "../services/locationService";
import { obtenerClimaActual, descripcionTiempo, detectarAlertas, ClimaActual } from "../services/weatherService";
import { calcularIndicePesca, IndicePescaDia, CATEGORIA_INFO } from "../services/fishingIndexService";
import { solicitarPermisoNotificaciones, programarAlertasPesca } from "../services/notificationService";
import { getResumenEmbalsesCastellon } from "../services/saihService";
import { FavoritoZona, obtenerFavoritos, obtenerPuntosGuardados, PuntoGuardado } from "../services/storageService";
import LicenseBanner from "../components/LicenseBanner";
import ConsultaPescaCard from "../components/ConsultaPescaCard";
import BotonMiPosicion from "../components/BotonMiPosicion";
import CapaPoligonosIcv from "../components/CapaPoligonosIcv";
import TemporadaBanner from "../components/TemporadaBanner";
import { consultarPuntoPesca, colorAprovechamiento, todosLosTramos, tramoUsaRadioAnexo } from "../services/consultaPescaService";
import { COLORS, PIN, GRADIENTS, RADIUS, SHADOW, SHADOW_SOFT, SPACING } from "../theme";
import LeyendaMapa from "../components/LeyendaMapa";

const EMBALSES_PANEL = [
  { nombre: "EMBALSE DE ARENÓS", fichaId: 266, etiqueta: "Arenós", zoneId: "embalse_arenos" },
  { nombre: "EMBALSE DE SICHAR", fichaId: 247, etiqueta: "Sichar", zoneId: "embalse_sichar" },
  { nombre: "EMBALSE DE MARÍA CRISTINA", fichaId: 248, etiqueta: "M. Cristina", zoneId: "embalse_maria_cristina" },
  { nombre: "EMBALSE DE REGAJO", fichaId: 221, etiqueta: "Regajo", zoneId: "rio_palancia_regajo" },
  { nombre: "EMBALSE DE ULLDECONA", fichaId: 243, etiqueta: "Ulldecona", zoneId: "embalse_ulldecona" },
];

interface Props {
  navigation: any;
}

const CASTELLON_REGION = {
  latitude: 40.12,
  longitude: -0.38,
  latitudeDelta: 1.15,
  longitudeDelta: 1.15,
};

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function fechaLegible(d: Date): string {
  return `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}`;
}

export default function HomeScreen({ navigation }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);
  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null);
  const [clima, setClima] = useState<ClimaActual | null>(null);
  const [indiceHoy, setIndiceHoy] = useState<IndicePescaDia | null>(null);
  const [cargando, setCargando] = useState(true);
  const [permisoDenegado, setPermisoDenegado] = useState(false);
  const [localizando, setLocalizando] = useState(false);
  const [camara, setCamara] = useState<{ latitude: number; longitude: number; zoom: number; nonce: number } | undefined>();
  const [favoritos, setFavoritos] = useState<FavoritoZona[]>([]);
  const [puntos, setPuntos] = useState<PuntoGuardado[]>([]);
  const [saihPanel, setSaihPanel] = useState<{ etiqueta: string; zoneId: string; pct: number | null; fuente: string }[]>([]);

  useFocusEffect(
    useCallback(() => {
      obtenerFavoritos().then(setFavoritos);
      obtenerPuntosGuardados().then(setPuntos);
    }, [])
  );

  useEffect(() => {
    getResumenEmbalsesCastellon(EMBALSES_PANEL).then((rows) => {
      setSaihPanel(
        rows.map((r) => {
          const meta = EMBALSES_PANEL.find((e) => e.nombre === r.nombre) ?? EMBALSES_PANEL.find((e) => e.etiqueta === r.etiqueta)!;
          return {
            etiqueta: r.etiqueta,
            zoneId: meta.zoneId,
            pct: r.estacion.porcentajeLleno,
            fuente: r.estacion.fuente,
          };
        })
      );
    });
  }, []);

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
      setUbicacion(loc);
      const [c, indice] = await Promise.all([
        obtenerClimaActual(loc.lat, loc.lng),
        calcularIndicePesca(loc.lat, loc.lng, 3),
      ]);
      setClima(c);
      if (indice.length > 0) {
        setIndiceHoy(indice[0]);
        const permisoNotif = await solicitarPermisoNotificaciones();
        if (permisoNotif) await programarAlertasPesca(indice);
      }
    }
    setCargando(false);
  }

  async function irAMiPosicion() {
    setLocalizando(true);
    const ok = await solicitarPermisoUbicacion();
    if (!ok) {
      setPermisoDenegado(true);
      setLocalizando(false);
      return;
    }
    const loc = await obtenerUbicacionActual();
    setLocalizando(false);
    if (!loc) return;
    setUbicacion(loc);
    setCamara({ latitude: loc.lat, longitude: loc.lng, zoom: 14, nonce: Date.now() });
    const [c, indice] = await Promise.all([
      obtenerClimaActual(loc.lat, loc.lng),
      calcularIndicePesca(loc.lat, loc.lng, 3),
    ]);
    setClima(c);
    if (indice.length > 0) setIndiceHoy(indice[0]);
  }

  useEffect(() => {
    cargar();
  }, []);

  const tiempo = clima ? descripcionTiempo(clima.codigoTiempo) : null;
  const catInfo = indiceHoy ? CATEGORIA_INFO[indiceHoy.categoria] : null;
  const tramos = todosLosTramos();
  const fitMapa = tramos.map((z) => ({ latitude: z.lat, longitude: z.lng }));
  const consultaViva = ubicacion ? consultarPuntoPesca(ubicacion.lat, ubicacion.lng) : null;

  return (
    <ScrollView ref={scrollRef} style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <LinearGradient colors={GRADIENTS.primary} style={styles.hero}>
        <Text style={styles.dateText}>{fechaLegible(new Date())}</Text>

        {cargando ? (
          <ActivityIndicator color="#fff" style={{ marginVertical: 24 }} />
        ) : permisoDenegado ? (
          <View style={{ alignItems: "center", marginVertical: 16 }}>
            <Text style={styles.weatherFallback}>📍 Activa la ubicación para ver el clima y el índice de pesca</Text>
            <TouchableOpacity style={styles.retryChip} onPress={cargar}>
              <Text style={styles.retryChipText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.weatherRow}>
              {tiempo && clima && (
                <>
                  <Text style={styles.weatherIcon}>{tiempo.icono}</Text>
                  <View>
                    <Text style={styles.weatherTemp}>{Math.round(clima.temperatura)}°C</Text>
                    <Text style={styles.weatherDesc}>{tiempo.texto}</Text>
                  </View>
                </>
              )}
            </View>

            {indiceHoy && catInfo && (
              <View style={styles.indexCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.indexLabel}>Índice de pesca hoy</Text>
                  <Text style={[styles.indexCategoria, { color: catInfo.color, backgroundColor: catInfo.fondo }]}>
                    {catInfo.icono} {catInfo.texto} · {indiceHoy.puntuacion}/100
                  </Text>
                </View>
                <Text style={styles.indexMoon}>{indiceHoy.iconoLuna}</Text>
              </View>
            )}

            {clima &&
              detectarAlertas({
                codigoTiempo: clima.codigoTiempo,
                vientoMaxKmh: clima.velocidadVientoKmh,
              }).map((alerta, idx) => (
                <View
                  key={idx}
                  style={[styles.weatherAlert, alerta.nivel === "peligro" && styles.weatherAlertDanger]}
                >
                  <Text style={styles.weatherAlertText}>
                    {alerta.icono} {alerta.texto}
                  </Text>
                </View>
              ))}
          </>
        )}
      </LinearGradient>

      <View style={styles.body}>
        <TemporadaBanner />
        <LicenseBanner onPress={() => navigation.navigate("License")} />

        {saihPanel.length > 0 && (
          <View style={{ marginBottom: 12 }}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Embalses SAIH</Text>
              <Text style={styles.sectionMeta}>
                {saihPanel.some((s) => s.fuente === "saih_chj") ? "en vivo" : "ejemplo / reintentar"}
              </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {saihPanel.map((s) => (
                <TouchableOpacity
                  key={s.zoneId}
                  style={styles.saihChip}
                  onPress={() => navigation.navigate("ZoneDetail", { zoneId: s.zoneId })}
                >
                  <Text style={styles.saihName}>{s.etiqueta}</Text>
                  <Text style={styles.saihPct}>{s.pct != null ? `${s.pct.toFixed(0)}%` : "—"}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {(favoritos.length > 0 || puntos.length > 0) && (
          <View style={{ marginBottom: 8 }}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Tus favoritos</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Capturas")}>
                <Text style={styles.linkMini}>Ver todo</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
              {favoritos.map((f) => (
                <TouchableOpacity
                  key={f.zonaId}
                  style={styles.favChip}
                  onPress={() => navigation.navigate("ZoneDetail", { zoneId: f.zonaId })}
                >
                  <Text style={styles.favChipStar}>★</Text>
                  <Text style={styles.favChipTxt} numberOfLines={2}>
                    {f.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
              {puntos.slice(0, 6).map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.puntoChip}
                  onPress={() =>
                    navigation.navigate("Mapa", {
                      screen: "ZonasLibresMain",
                    })
                  }
                >
                  <Text style={styles.favChipStar}>●</Text>
                  <Text style={styles.favChipTxt} numberOfLines={2}>
                    {p.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <TouchableOpacity style={styles.myCatchesButton} onPress={() => navigation.navigate("Capturas")}>
          <View style={styles.myCatchesGlyph}>
            <Text style={styles.myCatchesIcon}>★</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.myCatchesTitle}>Favoritos, puntos y capturas</Text>
            <Text style={styles.myCatchesSubtitle}>
              {favoritos.length} zonas · {puntos.length} puntos · toca para gestionar
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.consejosButton}
          onPress={() => navigation.navigate("Consejos")}
        >
          <Text style={styles.consejosTitle}>Consejos · nudos, anzuelos y vocabulario</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Dónde estás ahora</Text>
          <Text style={styles.sectionMeta}>polígono ICV · pulsa un tramo</Text>
        </View>
        {consultaViva ? (
          <View style={{ marginBottom: 12 }}>
            <ConsultaPescaCard
              consulta={consultaViva}
              onFicha={
                consultaViva.tramo?.fichaId
                  ? () => navigation.navigate("ZoneDetail", { zoneId: consultaViva.tramo!.fichaId })
                  : undefined
              }
              onAparejos={(id) =>
                navigation.navigate("Aparejos", { screen: "AparejosMain", params: { especieId: id } })
              }
            />
          </View>
        ) : null}
        <View style={styles.mapWrap}>
          <MapView
            style={styles.map}
            initialRegion={CASTELLON_REGION}
            fitCoordinates={fitMapa}
            cameraTarget={camara}
          >
            <CapaPoligonosIcv />
            {tramos.filter(tramoUsaRadioAnexo).map((z) => {
              const color = colorAprovechamiento(z.aprovechamiento);
              return (
                <Circle
                  key={`r-${z.id}`}
                  center={{ latitude: z.lat, longitude: z.lng }}
                  radius={z.radioKm * 1000}
                  strokeColor={color}
                  fillColor={color + "33"}
                />
              );
            })}
            {tramos.map((z) => (
              <Marker
                key={z.id}
                coordinate={{ latitude: z.lat, longitude: z.lng }}
                pinColor={colorAprovechamiento(z.aprovechamiento)}
                identifier={z.aprovechamiento === "ZPL" ? "libre" : z.aprovechamiento === "ZPC" ? "coto" : "vedado"}
                title={`${z.aprovechamiento} · ${z.nombre}`}
                onPress={() => {
                  if (z.fichaId) navigation.navigate("ZoneDetail", { zoneId: z.fichaId });
                }}
              />
            ))}
            {ubicacion && (
              <Marker
                coordinate={{ latitude: ubicacion.lat, longitude: ubicacion.lng }}
                pinColor={PIN.yo}
                identifier="user"
                title="Tú"
              />
            )}
          </MapView>
          <BotonMiPosicion onPress={irAMiPosicion} cargando={localizando} />
        </View>
        <LeyendaMapa modo="continental" />
        <Text style={styles.mapHint}>Polígono ICV = límite oficial de coto/reserva. Círculo = tramo ZPL/VP del anexo (aprox.). Pulsa «Ir a mí» y consulta el veredicto grande.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  hero: {
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
  },
  dateText: { fontSize: 14, color: "#cfe8db", textTransform: "capitalize", marginBottom: 6, fontWeight: "600" },
  weatherRow: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 6 },
  weatherIcon: { fontSize: 48 },
  weatherTemp: { fontSize: 34, fontWeight: "800", color: "#fff" },
  weatherDesc: { fontSize: 14, color: "#dfeee5", marginTop: -2 },
  weatherFallback: { color: "#fff", fontSize: 13, textAlign: "center" },
  retryChip: { marginTop: 12, backgroundColor: "rgba(255,255,255,0.22)", paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.pill },
  retryChipText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  indexCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: RADIUS.md,
    padding: 14,
    marginTop: 18,
  },
  indexLabel: { fontSize: 11.5, color: "#cfe8db", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  indexCategoria: { fontSize: 16, fontWeight: "800", marginTop: 3, backgroundColor: "#fff", alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 3, borderRadius: RADIUS.pill, overflow: "hidden" },
  indexMoon: { fontSize: 30 },
  weatherAlert: {
    backgroundColor: "rgba(249,168,37,0.25)",
    borderRadius: RADIUS.sm,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  weatherAlertDanger: { backgroundColor: "rgba(198,40,40,0.35)" },
  weatherAlertText: { fontSize: 12.5, color: "#fff", fontWeight: "700" },
  body: { paddingHorizontal: SPACING.lg, marginTop: -SPACING.lg },
  myCatchesButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW_SOFT,
  },
  myCatchesGlyph: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  myCatchesIcon: { fontSize: 16, color: COLORS.gold, fontWeight: "800" },
  myCatchesTitle: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary },
  myCatchesSubtitle: { fontSize: 11.5, color: COLORS.textSecondary, marginTop: 2 },
  chevron: { fontSize: 22, color: COLORS.textMuted },
  consejosButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.waterLight,
    borderRadius: RADIUS.md,
    padding: 12,
    marginTop: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "#b7d4de",
  },
  consejosTitle: { flex: 1, fontSize: 13, fontWeight: "700", color: COLORS.waterDark },
  linkMini: { fontSize: 12, fontWeight: "700", color: COLORS.water },
  saihChip: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 88,
    ...SHADOW_SOFT,
  },
  saihName: { fontSize: 11, fontWeight: "700", color: COLORS.textSecondary },
  saihPct: { fontSize: 18, fontWeight: "800", color: COLORS.waterDark, marginTop: 2 },
  favChip: {
    width: 130,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e8d9a8",
    ...SHADOW_SOFT,
  },
  puntoChip: {
    width: 130,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW_SOFT,
  },
  favChipStar: { color: COLORS.gold, fontWeight: "800", marginBottom: 4 },
  favChipTxt: { fontSize: 12, fontWeight: "700", color: COLORS.textPrimary, lineHeight: 16 },
  sectionRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginTop: SPACING.lg, marginBottom: SPACING.sm },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: COLORS.textPrimary },
  sectionMeta: { fontSize: 11, color: COLORS.textMuted, fontWeight: "600" },
  mapWrap: { height: 420, borderRadius: RADIUS.lg, overflow: "hidden", borderWidth: 1, borderColor: COLORS.border, ...SHADOW, position: "relative" },
  map: { flex: 1 },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 10, justifyContent: "center" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
  legendText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: "600" },
  mapHint: { fontSize: 11.5, color: COLORS.textMuted, marginTop: 8, textAlign: "center", lineHeight: 16 },
});
