import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useScrollToTop } from "@react-navigation/native";
import { obtenerUbicacionActual, solicitarPermisoUbicacion } from "../services/locationService";
import { obtenerClimaActual, descripcionTiempo, detectarAlertas, ClimaActual } from "../services/weatherService";
import { calcularIndicePesca, IndicePescaDia, CATEGORIA_INFO } from "../services/fishingIndexService";
import { solicitarPermisoNotificaciones, programarAlertasPesca } from "../services/notificationService";
import { getResumenEmbalses } from "../services/saihService";
import { FavoritoZona, obtenerFavoritos, obtenerPuntosGuardados, PuntoGuardado } from "../services/storageService";
import LicenseBanner from "../components/LicenseBanner";
import ConsultaPescaCard from "../components/ConsultaPescaCard";
import { etiquetaHoy } from "../components/SemaforoVeredicto";
import TemporadaBanner from "../components/TemporadaBanner";
import PanelAvisosSeguridad from "../components/PanelAvisosSeguridad";
import BannerOffline from "../components/BannerOffline";
import PulsePress from "../components/PulsePress";
import ListaAnimada from "../components/ListaAnimada";
import PanelCampoHoy from "../components/PanelCampoHoy";
import { consultarToqueMapa } from "../services/consultaCostaService";
import { colorSemaforo } from "../services/consultaPescaService";
import {
  AvisoSeguridad,
  obtenerAvisosSeguridadPesca,
} from "../services/avisosSeguridadService";
import {
  CacheOffline,
  hayConexion,
  leerCacheOffline,
  guardarCacheOffline,
  mensajeOfflineCorto,
} from "../services/offlineService";
import { useProvincia } from "../context/ProvinciaContext";
import { usePuntoConsulta } from "../context/PuntoConsultaContext";
import { getProvinciaActiva } from "../provincias/runtime";
import { etiquetaFuente } from "../services/puntoConsultaService";
import { resolverPoblacionCercana } from "../services/poblacionCercanaService";
import { irAEspeciesDelPunto } from "../navigation/irATab";
import { COLORS, GRADIENTS, RADIUS, SHADOW_SOFT, SPACING } from "../theme";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
type SaihChip = { etiqueta: string; zoneId: string; pct: number | null; fuente: string };

interface Props {
  navigation: any;
}

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function fechaLegible(d: Date): string {
  return `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}`;
}

function aplicarCache(cache: CacheOffline, setters: {
  setClima: (v: ClimaActual | null) => void;
  setIndiceHoy: (v: IndicePescaDia | null) => void;
  setSaihPanel: (v: SaihChip[]) => void;
  setAvisosSeguridad: (v: AvisoSeguridad[]) => void;
  setUbicacion: (v: { lat: number; lng: number } | null) => void;
}) {
  if (cache.clima) setters.setClima(cache.clima as ClimaActual);
  if (cache.indiceHoy) setters.setIndiceHoy(cache.indiceHoy as IndicePescaDia);
  if (Array.isArray(cache.saih)) setters.setSaihPanel(cache.saih as SaihChip[]);
  if (Array.isArray(cache.avisos)) setters.setAvisosSeguridad(cache.avisos as AvisoSeguridad[]);
  if (cache.ubicacion) setters.setUbicacion(cache.ubicacion);
}

export default function HomeScreen({ navigation }: Props) {
  const { provincia: provinciaCtx, cambiarProvincia } = useProvincia();
  const provincia = provinciaCtx ?? getProvinciaActiva();
  const { punto, listo: puntoListo } = usePuntoConsulta();
  const scrollRef = useRef<ScrollView>(null);
  const heroHRef = useRef(0);
  const tramoYRef = useRef(0);
  useScrollToTop(scrollRef);
  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null);
  const [clima, setClima] = useState<ClimaActual | null>(null);
  const [indiceHoy, setIndiceHoy] = useState<IndicePescaDia | null>(null);
  const [cargando, setCargando] = useState(true);
  const [permisoDenegado, setPermisoDenegado] = useState(false);
  const [favoritos, setFavoritos] = useState<FavoritoZona[]>([]);
  const [puntos, setPuntos] = useState<PuntoGuardado[]>([]);
  const [saihPanel, setSaihPanel] = useState<SaihChip[]>([]);
  const [avisosSeguridad, setAvisosSeguridad] = useState<AvisoSeguridad[]>([]);
  const [avisosCargando, setAvisosCargando] = useState(true);
  const [avisosError, setAvisosError] = useState<string | null>(null);
  const [online, setOnline] = useState(true);
  const [cache, setCache] = useState<CacheOffline | null>(null);
  const [detalleTramo, setDetalleTramo] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: provincia.nombreApp });
  }, [navigation, provincia.nombreApp]);

  useFocusEffect(
    useCallback(() => {
      obtenerFavoritos().then(setFavoritos);
      obtenerPuntosGuardados().then(setPuntos);
    }, [])
  );

  // Al cambiar de punto, el detalle vuelve a plegarse (gesto = expandir)
  useEffect(() => {
    setDetalleTramo(false);
  }, [punto?.lat, punto?.lng, punto?.fuente]);

  useEffect(() => {
    if (!puntoListo) return;
    let vivo = true;
    const embalsesPanel = provincia.embalsesPanel;
    const tieneSaih = provincia.tieneSaih;

    async function bootstrap() {
      const conectado = await hayConexion();
      if (!vivo) return;
      setOnline(conectado);

      const cacheLocal = await leerCacheOffline();
      if (!vivo) return;
      setCache(cacheLocal);

      if (!conectado && cacheLocal) {
        aplicarCache(cacheLocal, {
          setClima,
          setIndiceHoy,
          setSaihPanel,
          setAvisosSeguridad,
          setUbicacion,
        });
        setAvisosCargando(false);
        setAvisosError(null);
        setCargando(false);
        return;
      }

      // En línea (o sin caché): cargar avisos + SAIH + clima/índice
      setAvisosCargando(true);
      try {
        const cerca =
          punto && (punto.fuente === "mapa" || punto.fuente === "zona" || punto.fuente === "gps")
            ? { lat: punto.lat, lng: punto.lng }
            : null;
        const lista = await obtenerAvisosSeguridadPesca(cerca);
        if (!vivo) return;
        setAvisosSeguridad(lista);
        setAvisosError(null);
        if (conectado) {
          await guardarCacheOffline({ avisos: lista });
        }
      } catch {
        if (!vivo) return;
        if (cacheLocal?.avisos) {
          setAvisosSeguridad(cacheLocal.avisos as AvisoSeguridad[]);
          setAvisosError(null);
        } else {
          setAvisosError("No se pudieron cargar los avisos");
        }
      } finally {
        if (vivo) setAvisosCargando(false);
      }

      if (tieneSaih && embalsesPanel.length > 0) {
        try {
          const rows = await getResumenEmbalses(embalsesPanel);
          if (!vivo) return;
          const panel: SaihChip[] = rows.map((r) => {
            const meta =
              embalsesPanel.find((e) => e.nombre === r.nombre) ??
              embalsesPanel.find((e) => e.etiqueta === r.etiqueta)!;
            return {
              etiqueta: r.etiqueta,
              zoneId: meta.zoneId,
              pct: r.estacion.porcentajeLleno,
              fuente: r.estacion.fuente,
            };
          });
          setSaihPanel(panel);
          if (conectado) {
            await guardarCacheOffline({ saih: panel });
          }
        } catch {
          if (!vivo) return;
          if (cacheLocal && Array.isArray(cacheLocal.saih)) {
            setSaihPanel(cacheLocal.saih as SaihChip[]);
          }
        }
      } else if (vivo) {
        setSaihPanel([]);
      }

      if (!vivo) return;
      await cargar(conectado, () => vivo);
    }

    bootstrap();
    return () => {
      vivo = false;
    };
  }, [provincia.id, provincia.tieneSaih, provincia.embalsesPanel, punto?.lat, punto?.lng, punto?.actualizadoEn, puntoListo]);

  async function cargar(conectadoParam?: boolean, sigueVivo?: () => boolean) {
    const okVivo = () => !sigueVivo || sigueVivo();
    setCargando(true);
    const conectado = conectadoParam ?? (await hayConexion());
    if (!okVivo()) return;
    setOnline(conectado);

    if (!conectado) {
      const cacheLocal = await leerCacheOffline();
      if (!okVivo()) return;
      setCache(cacheLocal);
      if (cacheLocal) {
        aplicarCache(cacheLocal, {
          setClima,
          setIndiceHoy,
          setSaihPanel,
          setAvisosSeguridad,
          setUbicacion,
        });
      }
      setCargando(false);
      return;
    }

    // Prioridad: punto del mapa → GPS → centro provincia.
    let loc: { lat: number; lng: number } | null = null;
    if (punto && (punto.fuente === "mapa" || punto.fuente === "zona" || punto.fuente === "gps")) {
      loc = { lat: punto.lat, lng: punto.lng };
      setPermisoDenegado(false);
    } else {
      const ok = await solicitarPermisoUbicacion();
      if (!okVivo()) return;
      if (!ok) {
        setPermisoDenegado(true);
        // Sin GPS: al menos centro de provincia para no dejar el inicio vacío.
        loc = {
          lat: provincia.regionMapa.latitude,
          lng: provincia.regionMapa.longitude,
        };
      } else {
        setPermisoDenegado(false);
        loc = await obtenerUbicacionActual();
        if (!okVivo()) return;
        if (!loc) {
          loc = {
            lat: provincia.regionMapa.latitude,
            lng: provincia.regionMapa.longitude,
          };
        }
      }
    }

    if (loc) {
      if (!okVivo()) return;
      setUbicacion(loc);
      const [c, indice] = await Promise.all([
        obtenerClimaActual(loc.lat, loc.lng),
        calcularIndicePesca(loc.lat, loc.lng, 3),
      ]);
      if (!okVivo()) return;
      setClima(c);
      const dia = indice.length > 0 ? indice[0] : null;
      if (dia) {
        setIndiceHoy(dia);
        const permisoNotif = await solicitarPermisoNotificaciones();
        if (!okVivo()) return;
        if (permisoNotif) await programarAlertasPesca(indice);
      }
      await guardarCacheOffline({
        clima: c,
        indiceHoy: dia,
        ubicacion: loc,
      });
      if (!okVivo()) return;
      const cacheActualizado = await leerCacheOffline();
      if (!okVivo()) return;
      setCache(cacheActualizado);
    }
    if (okVivo()) setCargando(false);
  }

  const tiempo = clima ? descripcionTiempo(clima.codigoTiempo) : null;
  const catInfo = indiceHoy ? CATEGORIA_INFO[indiceHoy.categoria] : null;
  const consultaViva = ubicacion ? consultarToqueMapa(ubicacion.lat, ubicacion.lng) : null;
  const hoyEtiqueta = consultaViva ? etiquetaHoy(consultaViva) : null;
  const mensajeOffline = mensajeOfflineCorto(online, cache);
  const alertasClima =
    clima
      ? detectarAlertas({
          codigoTiempo: clima.codigoTiempo,
          vientoMaxKmh: clima.velocidadVientoKmh,
          rafagaMaxKmh: clima.rafagaKmh,
        })
      : [];
  const etiquetaClima = (() => {
    if (punto?.fuente === "gps") return "Tu ubicación";
    if (punto?.poblacion) {
      return punto.etiqueta
        ? `${punto.etiqueta} · ${punto.poblacion}`
        : `Predicción · ${punto.poblacion}`;
    }
    if (punto?.etiqueta) return punto.etiqueta;
    if (punto) return etiquetaFuente(punto.fuente);
    if (ubicacion && permisoDenegado) {
      const p = resolverPoblacionCercana(ubicacion.lat, ubicacion.lng, 35, provincia.id)?.nombre;
      return p ? `Centro · ${p}` : `Centro de ${provincia.nombre}`;
    }
    return "Tu ubicación";
  })();

  function abrirVeredictoRapido() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDetalleTramo(true);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, tramoYRef.current - 12), animated: true });
    });
  }

  function toggleDetalleTramo() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDetalleTramo((v) => !v);
  }
  return (
    <ScrollView ref={scrollRef} style={styles.container} contentContainerStyle={{ paddingBottom: 140 }}>
      <LinearGradient
        colors={[...GRADIENTS.primary]}
        style={styles.hero}
        onLayout={(e) => {
          heroHRef.current = e.nativeEvent.layout.height;
        }}
      >
        <Text style={styles.brandPulse}>{provincia.nombreApp}</Text>
        <Text style={styles.dateText}>{fechaLegible(new Date())}</Text>

        {cargando ? (
          <ActivityIndicator color="#fff" style={{ marginVertical: 24 }} />
        ) : !clima && permisoDenegado && !punto ? (
          <View style={{ alignItems: "center", marginVertical: 12 }}>
            <Text style={styles.weatherFallback}>
              Activa la ubicación o toca un tramo en el mapa para ver el pulso del día
            </Text>
            <TouchableOpacity style={styles.retryChip} onPress={() => cargar()}>
              <Text style={styles.retryChipText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.climaOrigen} numberOfLines={1}>
              {etiquetaClima}
            </Text>

            {indiceHoy && catInfo ? (
              <View style={styles.pulsoRow}>
                <View style={styles.pulsoIndice}>
                  <Text style={styles.indexLabel}>Índice de pesca</Text>
                  <Text style={styles.indexScore}>{indiceHoy.puntuacion}</Text>
                  <View style={[styles.indexCatPill, { backgroundColor: catInfo.fondo }]}>
                    <Text style={[styles.indexCategoria, { color: catInfo.color }]}>
                      {catInfo.icono} {catInfo.texto}
                      <Text style={styles.indexMoon}> · {indiceHoy.iconoLuna}</Text>
                    </Text>
                  </View>
                </View>
                <View style={styles.pulsoClima}>
                  {tiempo && clima ? (
                    <>
                      <Text style={styles.weatherIconSm}>{tiempo.icono}</Text>
                      <Text style={styles.weatherTempSm}>{Math.round(clima.temperatura)}°</Text>
                      <Text style={styles.weatherDescSm} numberOfLines={2}>
                        {tiempo.texto}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.weatherFallback}>Sin clima</Text>
                  )}
                </View>
              </View>
            ) : (
              <View style={styles.heroClima}>
                {tiempo && clima ? (
                  <>
                    <Text style={styles.weatherIcon}>{tiempo.icono}</Text>
                    <Text style={styles.weatherTemp}>{Math.round(clima.temperatura)}°</Text>
                    <Text style={styles.weatherDesc}>{tiempo.texto}</Text>
                  </>
                ) : (
                  <Text style={styles.weatherFallback}>Sin datos de clima</Text>
                )}
              </View>
            )}

            {clima ? (
              <Text style={styles.climaMeta} numberOfLines={1}>
                Viento {Math.round(clima.velocidadVientoKmh)} km/h
                {clima.rafagaKmh != null ? ` · ráfaga ${Math.round(clima.rafagaKmh)}` : ""}
                {clima.precipitacionMm != null && clima.precipitacionMm > 0
                  ? ` · ${clima.precipitacionMm.toFixed(1)} mm`
                  : ""}
              </Text>
            ) : null}

            {alertasClima.length > 0 && (
              <View style={styles.alertRow}>
                {alertasClima.map((alerta, idx) => (
                  <View
                    key={idx}
                    style={[styles.weatherAlert, alerta.nivel === "peligro" && styles.weatherAlertDanger]}
                  >
                    <Text style={styles.weatherAlertText}>
                      {alerta.icono} {alerta.texto}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {consultaViva && hoyEtiqueta ? (
              <TouchableOpacity
                style={[styles.veredictoRapido, { backgroundColor: colorSemaforo(consultaViva) }]}
                onPress={abrirVeredictoRapido}
                activeOpacity={0.88}
                accessibilityRole="button"
                accessibilityLabel={`Veredicto del punto: ${hoyEtiqueta.texto}. ${hoyEtiqueta.sub}. Abrir detalle`}
              >
                <View style={styles.veredictoRapidoTxt}>
                  <Text style={styles.veredictoRapidoKicker}>Veredicto del punto</Text>
                  <Text style={styles.veredictoRapidoTitulo}>{hoyEtiqueta.texto}</Text>
                  <Text style={styles.veredictoRapidoSub} numberOfLines={1}>
                    {hoyEtiqueta.sub}
                    {consultaViva.titulo ? ` · ${consultaViva.titulo}` : ""}
                  </Text>
                </View>
                <Text style={styles.veredictoRapidoChevron}>›</Text>
              </TouchableOpacity>
            ) : !cargando ? (
              <TouchableOpacity
                style={styles.veredictoRapidoVacio}
                onPress={() => navigation.navigate("Mapa")}
                activeOpacity={0.88}
                accessibilityRole="button"
                accessibilityLabel="Elegir punto en el mapa para el veredicto"
              >
                <Text style={styles.veredictoRapidoKicker}>Veredicto del punto</Text>
                <Text style={styles.veredictoRapidoSub}>Toca el mapa o Salgo a pescar para decidir el punto</Text>
              </TouchableOpacity>
            ) : null}
          </>
        )}
      </LinearGradient>

      <View style={styles.body}>
        <BannerOffline mensaje={mensajeOffline} />

        <View style={styles.provinciaRow}>
          <Text style={styles.provinciaLbl}>
            Provincia · <Text style={styles.provinciaNombre}>{provincia.nombre}</Text>
          </Text>
          <TouchableOpacity
            onPress={() => cambiarProvincia()}
            accessibilityRole="button"
            accessibilityLabel="Cambiar provincia"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.provinciaCambio}>Cambiar</Text>
          </TouchableOpacity>
        </View>

        <ListaAnimada index={0}>
          <PulsePress
            onPress={() => navigation.navigate("SalgoAPescar")}
            style={styles.ctaSalgo}
          >
            <LinearGradient colors={[...GRADIENTS.water]} style={styles.ctaSalgoInner}>
              <Text style={styles.ctaSalgoTitle}>Salgo a pescar</Text>
              <Text style={styles.ctaSalgoSub}>Checklist · cambiar punto · GPS o mapa</Text>
            </LinearGradient>
          </PulsePress>
        </ListaAnimada>

        {/* Veredicto del tramo — detalle bajo demanda */}
        <ListaAnimada index={1}>
          <View
            style={styles.bloque}
            onLayout={(e) => {
              // y relativo al body; body va tras el hero con marginTop negativo
              tramoYRef.current =
                heroHRef.current + e.nativeEvent.layout.y - SPACING.md;
            }}
          >
            <Text style={styles.bloqueTitulo}>Tu tramo</Text>
            {consultaViva ? (
              <View style={{ marginBottom: 12 }}>
                <ConsultaPescaCard
                  consulta={consultaViva}
                  compacto
                  expandido={detalleTramo}
                  onToggleDetalle={toggleDetalleTramo}
                  onFicha={
                    consultaViva.tramo?.fichaId
                      ? () =>
                          navigation.navigate("ZoneDetail", {
                            zoneId: consultaViva.tramo!.fichaId,
                          })
                      : undefined
                  }
                  onEspecies={() => irAEspeciesDelPunto(navigation)}
                  onAparejos={(id) => navigation.navigate("Aparejos", { especieId: id })}
                />
              </View>
            ) : (
              <Text style={styles.sinConsulta}>
                Activa la ubicación, toca el mapa o elige zona/coordenadas en «Salgo a pescar».
              </Text>
            )}

            <PulsePress onPress={() => navigation.navigate("Mapa")} style={styles.mapaCta}>
              <View style={styles.mapaCtaRow}>
                <View style={styles.mapaCtaGlyph}>
                  <Text style={styles.mapaCtaIcon}>◉</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.mapaCtaTitle}>Abrir mapa</Text>
                  <Text style={styles.mapaCtaSub}>
                    {provincia.continentalOnly
                      ? "Cotos, vedados y consulta al pulsar"
                      : "Cotos, vedados, costa y consulta al pulsar"}
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </View>
            </PulsePress>
          </View>
        </ListaAnimada>

        {/* Seguridad compacta */}
        <ListaAnimada index={2}>
          <View style={styles.bloque}>
            <Text style={styles.bloqueTitulo}>Antes de salir</Text>
            <TemporadaBanner />
            <PanelAvisosSeguridad
              avisos={avisosSeguridad}
              cargando={avisosCargando}
              error={avisosError}
            />
            <LicenseBanner onPress={() => navigation.navigate("License")} />
          </View>
        </ListaAnimada>

        {/* Sitios personales / embalses */}
        {(saihPanel.length > 0 || favoritos.length > 0 || puntos.length > 0) && (
          <ListaAnimada index={3}>
            <View style={styles.bloque}>
              <Text style={styles.bloqueTitulo}>Tus sitios</Text>

              {saihPanel.length > 0 && (
                <View style={{ marginBottom: favoritos.length > 0 || puntos.length > 0 ? 12 : 0 }}>
                  <View style={styles.sectionRow}>
                    <Text style={styles.sectionTitle}>Embalses SAIH</Text>
                    <Text style={styles.sectionMeta}>
                      {saihPanel.some((s) => s.fuente === "saih_chj" || s.fuente === "saih_chg")
                        ? "en vivo"
                        : "ejemplo / reintentar"}
                    </Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8 }}
                  >
                    {saihPanel.map((s) => (
                      <TouchableOpacity
                        key={s.zoneId}
                        style={styles.saihChip}
                        onPress={() => navigation.navigate("ZoneDetail", { zoneId: s.zoneId })}
                      >
                        <Text style={styles.saihName}>{s.etiqueta}</Text>
                        <Text style={styles.saihPct}>
                          {s.pct != null ? `${s.pct.toFixed(0)}%` : "—"}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {(favoritos.length > 0 || puntos.length > 0) && (
                <View>
                  <View style={styles.sectionRow}>
                    <Text style={styles.sectionTitle}>Favoritos y puntos</Text>
                    <TouchableOpacity
                      onPress={() => navigation.navigate("Capturas", { screen: "CapturasMain" })}
                    >
                      <Text style={styles.linkMini}>Ver todo</Text>
                    </TouchableOpacity>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
                  >
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
                            params: { centrarEn: { lat: p.lat, lng: p.lng, nombre: p.nombre } },
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
            </View>
          </ListaAnimada>
        )}

        <ListaAnimada index={4}>
          <PanelCampoHoy navigation={navigation} />
        </ListaAnimada>

        <View style={styles.linksRow}>
          <TouchableOpacity
            style={styles.linkChip}
            onPress={() => navigation.navigate("Capturas", { screen: "CapturasMain" })}
            accessibilityRole="button"
            accessibilityLabel="Capturas"
          >
            <Text style={styles.linkChipTxt}>Capturas</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.linkChip}
            onPress={() => navigation.navigate("Consejos")}
            accessibilityRole="button"
            accessibilityLabel="Consejos: montajes por especie, nudos y aparejos"
          >
            <Text style={styles.linkChipTxt}>Nudos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.linkChip}
            onPress={() => navigation.navigate("Ajustes")}
            accessibilityRole="button"
            accessibilityLabel="Ajustes"
          >
            <Text style={styles.linkChipTxt}>Ajustes</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  hero: {
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xl + 4,
    paddingHorizontal: SPACING.lg,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
  },
  brandPulse: {
    fontSize: 13,
    fontWeight: "800",
    color: "rgba(255,255,255,0.78)",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  dateText: {
    fontSize: 15,
    color: "rgba(255,255,255,0.92)",
    textTransform: "capitalize",
    marginBottom: 4,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  climaOrigen: {
    color: "rgba(255,255,255,0.95)",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 8,
  },
  climaMeta: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 12.5,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 10,
  },
  pulsoRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 12,
    marginTop: 14,
  },
  pulsoIndice: {
    flex: 1.35,
    alignItems: "center",
    justifyContent: "center",
  },
  pulsoClima: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },
  heroClima: {
    alignItems: "center",
    marginTop: 8,
  },
  weatherIcon: { fontSize: 42, marginBottom: -4 },
  weatherIconSm: { fontSize: 28, marginBottom: 0 },
  weatherTemp: {
    fontSize: 72,
    fontWeight: "200",
    color: "#fff",
    letterSpacing: -2,
    lineHeight: 80,
  },
  weatherTempSm: {
    fontSize: 36,
    fontWeight: "200",
    color: "#fff",
    letterSpacing: -1,
    lineHeight: 40,
  },
  weatherDesc: {
    fontSize: 17,
    color: "rgba(255,255,255,0.95)",
    fontWeight: "500",
    marginTop: -2,
  },
  weatherDescSm: {
    fontSize: 12.5,
    color: "rgba(255,255,255,0.92)",
    fontWeight: "600",
    textAlign: "center",
    marginTop: 2,
  },
  weatherFallback: { color: "#fff", fontSize: 13, textAlign: "center" },
  retryChip: {
    marginTop: 12,
    backgroundColor: "rgba(255,255,255,0.22)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
  },
  retryChipText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  indexLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  indexScore: {
    fontSize: 56,
    fontWeight: "200",
    color: "#fff",
    letterSpacing: -1.5,
    lineHeight: 60,
    marginTop: 2,
  },
  indexCatPill: {
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
  },
  indexCategoria: {
    fontSize: 14,
    fontWeight: "700",
  },
  indexMoon: {
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  alertRow: {
    marginTop: 12,
    gap: 8,
  },
  weatherAlert: {
    backgroundColor: "rgba(154,74,10,0.92)",
    borderRadius: RADIUS.sm,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  weatherAlertDanger: { backgroundColor: "rgba(180,35,24,0.92)" },
  weatherAlertText: { fontSize: 12.5, color: "#fff", fontWeight: "700" },
  veredictoRapido: {
    marginTop: 14,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
  },
  veredictoRapidoVacio: {
    marginTop: 14,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
  },
  veredictoRapidoTxt: { flex: 1 },
  veredictoRapidoKicker: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  veredictoRapidoTitulo: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginTop: 2,
  },
  veredictoRapidoSub: {
    color: "rgba(255,255,255,0.95)",
    fontSize: 12.5,
    fontWeight: "600",
    marginTop: 2,
  },
  veredictoRapidoChevron: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "300",
    marginTop: -2,
  },
  body: {
    paddingHorizontal: SPACING.lg,
    marginTop: -SPACING.md,
  },
  provinciaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  provinciaLbl: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  provinciaNombre: {
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  provinciaCambio: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.water,
  },
  ctaSalgo: {
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    marginBottom: SPACING.md,
    ...SHADOW_SOFT,
  },
  ctaSalgoInner: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: RADIUS.lg,
    alignItems: "center",
  },
  ctaSalgoTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.2,
  },
  ctaSalgoSub: {
    fontSize: 12.5,
    color: "#ffffff",
    fontWeight: "700",
    marginTop: 3,
  },
  bloque: {
    marginBottom: SPACING.md,
  },
  bloqueTitulo: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: SPACING.sm,
  },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: COLORS.textPrimary },
  sectionMeta: { fontSize: 11, color: COLORS.textMuted, fontWeight: "600" },
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
  favChipStar: { color: COLORS.goldText, fontWeight: "800", marginBottom: 4 },
  favChipTxt: { fontSize: 12, fontWeight: "700", color: COLORS.textPrimary, lineHeight: 16 },
  sinConsulta: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  mapaCta: {
    backgroundColor: COLORS.waterLight,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: "#b7d4de",
    ...SHADOW_SOFT,
  },
  mapaCtaRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  mapaCtaGlyph: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  mapaCtaIcon: { fontSize: 16, color: COLORS.water, fontWeight: "800" },
  mapaCtaTitle: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary },
  mapaCtaSub: { fontSize: 11.5, color: COLORS.textSecondary, marginTop: 2 },
  chevron: { fontSize: 22, color: COLORS.textMuted },
  linksRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  linkChip: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 10,
    alignItems: "center",
  },
  linkChipTxt: {
    fontSize: 12.5,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
});
