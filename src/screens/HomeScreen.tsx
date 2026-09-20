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
import BannerLicenciaPendiente from "../components/BannerLicenciaPendiente";
import BloqueAprende from "../components/BloqueAprende";
import SheetPermisoGps from "../components/SheetPermisoGps";
import ConsultaPescaCard from "../components/ConsultaPescaCard";
import { etiquetaHoy } from "../components/SemaforoVeredicto";
import TemporadaBanner from "../components/TemporadaBanner";
import PanelAvisosSeguridad from "../components/PanelAvisosSeguridad";
import BannerOffline from "../components/BannerOffline";
import PulsePress from "../components/PulsePress";
import ListaAnimada from "../components/ListaAnimada";
import PanelCampoHoy from "../components/PanelCampoHoy";
import RecomendacionHoyCard from "../components/RecomendacionHoyCard";
import TerminoAyuda from "../components/TerminoAyuda";
import type { RecomendacionHoy } from "../utils/recomendacionHoy";
import { consultarCosta, consultarToqueMapa } from "../services/consultaCostaService";
import { consultarEmbarcacion } from "../services/consultaEmbarcacionService";
import { colorSemaforo, consultarPuntoPesca } from "../services/consultaPescaService";
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
import { useModoPesca } from "../context/ModoPescaContext";
import SelectorModoPesca from "../components/SelectorModoPesca";
import TarjetaPuntoHoy from "../components/TarjetaPuntoHoy";
import { etiquetaModoLarga, etiquetaModo } from "../data/modoPesca";
import { getProvinciaActiva } from "../provincias/runtime";
import { primeraSalidaHecha } from "../services/primeraSalidaService";
import { etiquetaFuente } from "../services/puntoConsultaService";
import { resolverPoblacionCercana } from "../services/poblacionCercanaService";
import { irAEspeciesDelPunto, irAConsejos } from "../navigation/irATab";
import { consejoIdMontajeEspecie } from "../data/montajesEspecie";
import { EJE_LEGAL, EJE_METEO } from "../data/ejesLegalMeteo";
import { certezaDeConsulta } from "../data/certezaConsulta";
import { confirmarCambiarProvincia } from "../utils/confirmarCambiarProvincia";
import { COLORS, FONTS, GRADIENTS, RADIUS, SHADOW_SOFT, SPACING, TYPE } from "../theme";
import AtmosferaMeteo from "../components/AtmosferaMeteo";
import OndaAgua from "../components/OndaAgua";
import SiguientePasoCard from "../components/SiguientePasoCard";
import type { SiguientePasoAccion } from "../components/SiguientePasoCard";

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
  const { provincia: provinciaCtx, cambiarProvincia, restauradaAlArrancar } = useProvincia();
  const provincia = provinciaCtx ?? getProvinciaActiva();
  const { punto, listo: puntoListo, fijarPunto } = usePuntoConsulta();
  const { modo, disponibles, setModo } = useModoPesca();
  const scrollRef = useRef<ScrollView>(null);
  const heroHRef = useRef(0);
  const tramoYRef = useRef(0);
  const tramoAnchorRef = useRef<View>(null);
  const scrollYRef = useRef(0);
  useScrollToTop(scrollRef);
  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null);
  const [clima, setClima] = useState<ClimaActual | null>(null);
  const [indiceHoy, setIndiceHoy] = useState<IndicePescaDia | null>(null);
  const [cargando, setCargando] = useState(true);
  /** Refresco en segundo plano tras mostrar caché (no tapa el hero). */
  const [actualizando, setActualizando] = useState(false);
  const [permisoDenegado, setPermisoDenegado] = useState(false);
  const [sheetGps, setSheetGps] = useState(false);
  const gpsResolver = useRef<((ok: boolean) => void) | null>(null);
  const [favoritos, setFavoritos] = useState<FavoritoZona[]>([]);
  const [puntos, setPuntos] = useState<PuntoGuardado[]>([]);
  const [saihPanel, setSaihPanel] = useState<SaihChip[]>([]);
  const [avisosSeguridad, setAvisosSeguridad] = useState<AvisoSeguridad[]>([]);
  const [avisosCargando, setAvisosCargando] = useState(true);
  const [avisosError, setAvisosError] = useState<string | null>(null);
  const [online, setOnline] = useState(true);
  const [cache, setCache] = useState<CacheOffline | null>(null);
  const [detalleTramo, setDetalleTramo] = useState(false);
  const [antesAbierto, setAntesAbierto] = useState(false);
  /** Bloque «Aprende» solo si aún no completó la primera salida (menos ruido). */
  const [mostrarAprende, setMostrarAprende] = useState(false);
  /** Aviso «Sigues en…» solo al reanudar sesión; se puede cerrar en esta sesión. */
  const [avisoSesionVisible, setAvisoSesionVisible] = useState(restauradaAlArrancar);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: provincia.nombreApp,
      headerRight: () => (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginRight: 4 }}>
          <TouchableOpacity
            onPress={() => navigation.navigate("License")}
            accessibilityRole="button"
            accessibilityLabel="Licencia de pesca"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{ paddingHorizontal: 8, paddingVertical: 6 }}
          >
            <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700" }}>Licencia</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate("Ajustes")}
            accessibilityRole="button"
            accessibilityLabel="Ajustes"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{ paddingHorizontal: 8, paddingVertical: 6 }}
          >
            <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700" }}>Ajustes</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, provincia.nombreApp]);

  const coordsFavorito = useCallback(
    (zonaId: string) => {
      const z = (provincia.zones as { id: string; lat?: number; lng?: number }[]).find(
        (x) => x.id === zonaId
      );
      if (z?.lat == null || z?.lng == null) return null;
      return { lat: z.lat, lng: z.lng };
    },
    [provincia.zones]
  );


  useEffect(() => {
    let vivo = true;
    primeraSalidaHecha().then((hecha) => {
      if (!vivo) return;
      // No forzar el wizard: se invita desde «Siguiente paso» / Aprende.
      setMostrarAprende(!hecha);
    });
    return () => {
      vivo = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      let vivo = true;
      primeraSalidaHecha().then((hecha) => {
        if (vivo) setMostrarAprende(!hecha);
      });
      obtenerFavoritos().then(setFavoritos);
      obtenerPuntosGuardados().then(setPuntos);
      return () => {
        vivo = false;
      };
    }, [])
  );

  // Al cambiar de punto, el detalle vuelve a plegarse (gesto = expandir)
  useEffect(() => {
    setDetalleTramo(false);
  }, [punto?.lat, punto?.lng, punto?.fuente]);

  // Mostrar clima/índice de la última sesión al instante (antes incluso de puntoListo).
  useEffect(() => {
    let vivo = true;
    (async () => {
      const cacheLocal = await leerCacheOffline();
      if (!vivo || !cacheLocal) return;
      setCache(cacheLocal);
      if (cacheLocal.clima || cacheLocal.indiceHoy) {
        aplicarCache(cacheLocal, {
          setClima,
          setIndiceHoy,
          setSaihPanel,
          setAvisosSeguridad,
          setUbicacion,
        });
        setCargando(false);
      }
    })();
    return () => {
      vivo = false;
    };
  }, [provincia.id]);


  useEffect(() => {
    if (!puntoListo) return;
    let vivo = true;
    const embalsesPanel = provincia.embalsesPanel;
    const tieneSaih = provincia.tieneSaih;

    async function bootstrap() {
      const [conectado, cacheLocal] = await Promise.all([hayConexion(), leerCacheOffline()]);
      if (!vivo) return;
      setOnline(conectado);
      setCache(cacheLocal);

      const hayPulsoCache = !!(cacheLocal?.clima || cacheLocal?.indiceHoy);
      if (cacheLocal && hayPulsoCache) {
        // Stale-while-revalidate: pintar ya y refrescar en segundo plano.
        aplicarCache(cacheLocal, {
          setClima,
          setIndiceHoy,
          setSaihPanel,
          setAvisosSeguridad,
          setUbicacion,
        });
        setCargando(false);
      }

      if (!conectado) {
        setAvisosCargando(false);
        setAvisosError(null);
        setCargando(false);
        setActualizando(false);
        return;
      }

      setActualizando(true);

      const cerca =
        punto && (punto.fuente === "mapa" || punto.fuente === "zona" || punto.fuente === "gps")
          ? { lat: punto.lat, lng: punto.lng }
          : null;

      async function cargarAvisos() {
        setAvisosCargando(true);
        try {
          const lista = await obtenerAvisosSeguridadPesca(cerca);
          if (!vivo) return;
          setAvisosSeguridad(lista);
          setAvisosError(null);
          await guardarCacheOffline({ avisos: lista });
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
      }

      async function cargarSaih() {
        if (!tieneSaih || embalsesPanel.length === 0) {
          if (vivo) setSaihPanel([]);
          return;
        }
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
          await guardarCacheOffline({ saih: panel });
        } catch {
          if (!vivo) return;
          if (cacheLocal && Array.isArray(cacheLocal.saih)) {
            setSaihPanel(cacheLocal.saih as SaihChip[]);
          }
        }
      }

      // Clima/índice en paralelo con avisos y SAIH (no esperar a los avisos).
      await Promise.all([
        cargar(true, () => vivo, { silencioso: hayPulsoCache }),
        cargarAvisos(),
        cargarSaih(),
      ]);
      if (vivo) setActualizando(false);
    }

    bootstrap();
    return () => {
      vivo = false;
    };
  }, [provincia.id, provincia.tieneSaih, provincia.embalsesPanel, punto?.lat, punto?.lng, punto?.actualizadoEn, puntoListo]);

  async function cargar(
    conectadoParam?: boolean,
    sigueVivo?: () => boolean,
    opts?: { silencioso?: boolean }
  ) {
    const okVivo = () => !sigueVivo || sigueVivo();
    const silencioso = !!opts?.silencioso;
    if (!silencioso) setCargando(true);
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

    // Prioridad: punto del mapa → GPS solo si ya hay punto gps → centro provincia.
    // No pedimos GPS ni notificaciones al entrar: el usuario lo pide al salir / chip.
    let loc: { lat: number; lng: number } | null = null;
    if (punto && (punto.fuente === "mapa" || punto.fuente === "zona" || punto.fuente === "gps")) {
      loc = { lat: punto.lat, lng: punto.lng };
      setPermisoDenegado(false);
    } else {
      loc = {
        lat: provincia.regionMapa.latitude,
        lng: provincia.regionMapa.longitude,
      };
      // Sin diálogo: el centro basta para pintar clima/índice. GPS = gesto explícito.
      setPermisoDenegado(true);
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
      if (dia) setIndiceHoy(dia);
      // Pintar ya: los permisos de notificación no deben bloquear el hero.
      if (okVivo()) setCargando(false);

      void (async () => {
        try {
          // Cachear sin pedir notificaciones. solicitarPermisoNotificaciones
          // solo vía activarAlertasBuenDia (gesto del usuario).
          void activarAlertasBuenDia;
        } catch {
          /* no bloquear el pulso */
        }
        if (!okVivo()) return;
        await guardarCacheOffline({
          clima: c,
          indiceHoy: dia,
          ubicacion: loc,
        });
        const cacheActualizado = await leerCacheOffline();
        if (!okVivo()) return;
        setCache(cacheActualizado);
      })();
      return;
    }
    if (okVivo()) setCargando(false);
  }

  const tiempo = clima ? descripcionTiempo(clima.codigoTiempo) : null;
  const catInfo = indiceHoy ? CATEGORIA_INFO[indiceHoy.categoria] : null;
  /** Solo veredicto legal si el usuario eligió punto (GPS/mapa/zona), no el centro de provincia. */
  const puntoExplicito = !!(
    punto &&
    (punto.fuente === "gps" || punto.fuente === "mapa" || punto.fuente === "zona")
  );
  const consultaViva = puntoExplicito
    ? modo === "barco"
      ? consultarEmbarcacion(punto!.lat, punto!.lng)
      : modo === "orilla"
        ? consultarCosta(punto!.lat, punto!.lng)
        : consultarPuntoPesca(punto!.lat, punto!.lng)
    : null;
  const hoyEtiqueta = consultaViva ? etiquetaHoy(consultaViva) : null;
  const certezaHero = consultaViva
    ? certezaDeConsulta(consultaViva, { provinciaId: provincia.id })
    : null;
  const heroNoOficial = !!(certezaHero && certezaHero.nivel !== "oficial");
  /** Punto continental con modo mar / barco (o viceversa): no confundir con veda. */
  const puntoNoEncajaModo =
    !!consultaViva &&
    consultaViva.veredicto === "fuera_catalogo" &&
    modo !== "rio";
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

  function scrollADetalleTramo(animated = true) {
    const margen = 10;
    const ancla = tramoAnchorRef.current;
    const scroll = scrollRef.current;
    if (ancla && scroll) {
      ancla.measureInWindow((_ax, anclaY) => {
        scroll.measureInWindow((_sx, scrollY) => {
          // Y en contenido = offset actual + posición visible del ancla respecto al ScrollView
          const y = Math.max(0, scrollYRef.current + (anclaY - scrollY) - margen);
          tramoYRef.current = y + margen;
          scroll.scrollTo({ y, animated });
        });
      });
      return;
    }
    if (tramoYRef.current > 0) {
      scroll?.scrollTo({ y: Math.max(0, tramoYRef.current - margen), animated });
    }
  }

  function abrirVeredictoRapido() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDetalleTramo(true);
    // Doble pase: tras pintar el expandido y tras LayoutAnimation (web/nativo).
    requestAnimationFrame(() => scrollADetalleTramo(true));
    setTimeout(() => scrollADetalleTramo(true), Platform.OS === "web" ? 90 : 220);
  }

  function toggleDetalleTramo() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDetalleTramo((v) => !v);
  }

  async function pedirGpsConSheet(): Promise<boolean> {
    const { gpsSheetVisto, marcarGpsSheetVisto } = await import("../services/primeraSalidaService");
    if (await gpsSheetVisto()) {
      return solicitarPermisoUbicacion();
    }
    return new Promise((resolve) => {
      gpsResolver.current = async (continuar) => {
        setSheetGps(false);
        if (!continuar) {
          resolve(false);
          return;
        }
        await marcarGpsSheetVisto();
        resolve(await solicitarPermisoUbicacion());
      };
      setSheetGps(true);
    });
  }

  /** GPS solo cuando el usuario lo pide (no al entrar). */
  async function usarMiUbicacion() {
    const ok = await pedirGpsConSheet();
    if (!ok) return;
    const loc = await obtenerUbicacionActual();
    if (!loc) return;
    setPermisoDenegado(false);
    setUbicacion(loc);
    await fijarPunto({ lat: loc.lat, lng: loc.lng, fuente: "gps", etiqueta: "Tu ubicación" });
    setCargando(true);
    try {
      const [c, indice] = await Promise.all([
        obtenerClimaActual(loc.lat, loc.lng),
        calcularIndicePesca(loc.lat, loc.lng, 3),
      ]);
      setClima(c);
      const dia = indice.length > 0 ? indice[0] : null;
      if (dia) setIndiceHoy(dia);
      await guardarCacheOffline({ clima: c, indiceHoy: dia, ubicacion: loc });
    } finally {
      setCargando(false);
    }
  }

  /** Notificaciones solo bajo gesto (no al cargar). */
  async function activarAlertasBuenDia() {
    if (!indiceHoy || !ubicacion) return;
    const permisoNotif = await solicitarPermisoNotificaciones();
    if (!permisoNotif) return;
    const indice = await calcularIndicePesca(ubicacion.lat, ubicacion.lng, 3);
    await programarAlertasPesca(indice);
  }

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 120 }}
      scrollEventThrottle={16}
      onScroll={(e) => {
        scrollYRef.current = e.nativeEvent.contentOffset.y;
      }}
    >
      <SheetPermisoGps
        visible={sheetGps}
        onCancelar={() => gpsResolver.current?.(false)}
        onContinuar={() => gpsResolver.current?.(true)}
      />
      <LinearGradient
        colors={[...GRADIENTS.primary]}
        style={styles.hero}
        onLayout={(e) => {
          heroHRef.current = e.nativeEvent.layout.height;
        }}
      >
        <AtmosferaMeteo codigo={clima?.codigoTiempo ?? 2} />
        <OndaAgua intensidad={0.85} />
        <Text style={styles.brandPulse}>{provincia.nombreApp}</Text>
        <Text style={styles.dateText}>{fechaLegible(new Date())}</Text>
        {actualizando ? (
          <Text style={styles.actualizandoTxt} accessibilityLabel="Actualizando clima e índice">
            Actualizando…
          </Text>
        ) : null}

        <SelectorModoPesca
          modo={modo}
          disponibles={disponibles}
          onChange={(m) => void setModo(m)}
          sobreOscuro
        />

        {cargando && !clima && !indiceHoy && !consultaViva ? (
          <ActivityIndicator color="#fff" style={{ marginVertical: 16 }} />
        ) : null}

        {consultaViva && hoyEtiqueta && certezaHero ? (
          <TouchableOpacity
            style={[
              styles.veredictoRapido,
              { backgroundColor: colorSemaforo(consultaViva) },
              heroNoOficial && styles.veredictoRapidoAprox,
            ]}
            onPress={abrirVeredictoRapido}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={`${EJE_LEGAL.a11y} ${hoyEtiqueta.texto}. ${hoyEtiqueta.sub}. ${certezaHero.a11y}. Abrir detalle`}
          >
            <View style={styles.veredictoRapidoTxt}>
              <View style={styles.veredictoRapidoSelloRow}>
                <Text style={styles.veredictoRapidoKicker}>{EJE_LEGAL.tituloCorto}</Text>
                <Text
                  style={[
                    styles.veredictoRapidoSello,
                    heroNoOficial ? styles.veredictoRapidoSelloAprox : styles.veredictoRapidoSelloOficial,
                  ]}
                >
                  {certezaHero.sello}
                </Text>
              </View>
              <Text style={styles.veredictoRapidoTitulo}>{hoyEtiqueta.texto}</Text>
              <Text style={styles.veredictoRapidoSub} numberOfLines={puntoNoEncajaModo ? 2 : 1}>
                {puntoNoEncajaModo
                  ? `No encaja con ${etiquetaModoLarga(modo)} · elige punto en el mapa`
                  : `${hoyEtiqueta.sub}${consultaViva.titulo ? ` · ${consultaViva.titulo}` : ""}`}
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
            <Text style={styles.veredictoRapidoKicker}>{EJE_LEGAL.tituloCorto}</Text>
            <Text style={styles.veredictoRapidoTitulo}>Elige un punto</Text>
            <Text style={styles.veredictoRapidoSub}>
              Pulsa el mapa o usa GPS · {etiquetaModoLarga(modo)}
            </Text>
          </TouchableOpacity>
        ) : null}

        {!puntoExplicito ? (
          <TouchableOpacity
            style={styles.gpsChip}
            onPress={() => void usarMiUbicacion()}
            accessibilityRole="button"
            accessibilityLabel="Usar mi ubicación"
          >
            <Text style={styles.gpsChipTxt}>Usar mi ubicación</Text>
          </TouchableOpacity>
        ) : null}

        <PulsePress
          onPress={() => {
            if (modo === "barco") navigation.navigate("SalgoEnBarco");
            else navigation.navigate("SalgoAPescar");
          }}
          style={styles.ctaSalgo}
          accessibilityRole="button"
          accessibilityLabel={modo === "barco" ? "Salgo en barco" : "Salgo a pescar"}
        >
          <LinearGradient
            colors={[...(modo === "barco" ? GRADIENTS.dusk : GRADIENTS.water)]}
            style={styles.ctaSalgoInner}
          >
            <OndaAgua intensidad={0.9} />
            <View style={styles.ctaSalgoRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.ctaSalgoKicker}>Preparar salida · {etiquetaModoLarga(modo)}</Text>
                <Text style={styles.ctaSalgoTitle}>
                  {modo === "barco" ? "Salgo en barco" : "Salgo a pescar"}
                </Text>
                <Text style={styles.ctaSalgoSub}>
                  {modo === "barco"
                    ? "Legal · oleaje · qué llevar · Columbretes"
                    : "Punto del día y qué llevar"}
                </Text>
              </View>
              <View style={styles.ctaSalgoArrow} accessibilityElementsHidden>
                <Text style={styles.ctaSalgoArrowTxt}>→</Text>
              </View>
            </View>
          </LinearGradient>
        </PulsePress>

        {consultaViva ? (
          <View style={styles.atajosPunto}>
            <TouchableOpacity
              style={styles.atajoChip}
              onPress={() =>
                navigation.navigate("Aparejos", {
                  ambitoEmbarcacion: modo === "barco",
                  ambitoModo: modo,
                })
              }
              accessibilityRole="button"
              accessibilityLabel="Ver aparejos"
            >
              <Text style={styles.atajoChipTxt}>Aparejos</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.atajoChip}
              onPress={() => irAConsejos(navigation, { categoria: "montajes" })}
              accessibilityRole="button"
              accessibilityLabel="Ver consejos y montajes"
            >
              <Text style={styles.atajoChipTxt}>Consejos</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.atajoChip}
              onPress={() => irAEspeciesDelPunto(navigation)}
              accessibilityRole="button"
              accessibilityLabel="Ver especies del punto"
            >
              <Text style={styles.atajoChipTxt}>Especies</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </LinearGradient>

      <View style={styles.body}>
        <BannerOffline mensaje={mensajeOffline} />

        {avisoSesionVisible ? (
          <View
            style={styles.sesionBanner}
            accessibilityRole="summary"
            accessibilityLabel={`Sigues en ${provincia.nombre}, modo ${etiquetaModo(modo)}`}
          >
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.sesionKicker}>Sesión anterior</Text>
              <Text style={styles.sesionTitulo}>
                Sigues en {provincia.nombre} · {etiquetaModo(modo)}
              </Text>
              <Text style={styles.sesionSub}>
                Capturas y rutas se mantienen. Cambia solo si pescas en otra provincia.
              </Text>
            </View>
            <View style={styles.sesionAcciones}>
              <TouchableOpacity
                onPress={() =>
                  confirmarCambiarProvincia(provincia.nombre, () => cambiarProvincia())
                }
                accessibilityRole="button"
                accessibilityLabel="Cambiar provincia"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.sesionCambiar}>Cambiar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setAvisoSesionVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Cerrar aviso de sesión"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.sesionCerrar}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.provinciaRow}>
            <Text style={styles.provinciaLbl}>
              Provincia · <Text style={styles.provinciaNombre}>{provincia.nombre}</Text>
              {" · "}
              <Text style={styles.provinciaNombre}>{etiquetaModo(modo)}</Text>
            </Text>
            <TouchableOpacity
              onPress={() =>
                confirmarCambiarProvincia(provincia.nombre, () => cambiarProvincia())
              }
              accessibilityRole="button"
              accessibilityLabel="Cambiar provincia"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.provinciaCambio}>Cambiar</Text>
            </TouchableOpacity>
          </View>
        )}

        {consultaViva ? (
          <TarjetaPuntoHoy
            consulta={consultaViva}
            indice={indiceHoy}
            etiquetaPunto={etiquetaClima}
            onPuedo={abrirVeredictoRapido}
            onPinta={() => navigation.navigate("Previsión")}
            onEquipo={() =>
              navigation.navigate("Aparejos", {
                ambitoEmbarcacion: modo === "barco",
                ambitoModo: modo,
              })
            }
            onEspecies={() => irAEspeciesDelPunto(navigation)}
          />
        ) : null}

        <View style={styles.pulsoCard} accessibilityLabel="Pulso del día">
          <Text style={styles.pulsoCardTitle}>Pulso del día</Text>
          <Text style={styles.pulsoCardSub}>Orientativo · el permiso está arriba en el veredicto</Text>
          {indiceHoy && catInfo ? (
            <View style={styles.pulsoRow}>
              <View
                style={[
                  styles.pulsoIndice,
                  { backgroundColor: catInfo.fondo, borderColor: catInfo.color },
                ]}
                accessibilityLabel={`Condiciones ${indiceHoy.puntuacion} de 100, ${catInfo.texto}`}
              >
                <Text style={[styles.pulsoIndexLabel, { color: catInfo.color }]}>
                  {EJE_METEO.indexLabel}
                </Text>
                <View style={[styles.pulsoScoreBadge, { backgroundColor: catInfo.color }]}>
                  <Text style={styles.pulsoIndexScore}>{indiceHoy.puntuacion}</Text>
                </View>
                <View style={[styles.indexCatPill, { backgroundColor: "rgba(255,255,255,0.72)" }]}>
                  <Text style={[styles.indexCategoria, { color: catInfo.color }]}>
                    {catInfo.icono} {catInfo.texto}
                    <Text style={[styles.indexMoon, { color: catInfo.color }]}>
                      {" "}
                      · {indiceHoy.iconoLuna}
                    </Text>
                  </Text>
                </View>
                {indiceHoy.mejorFranjaInicio && indiceHoy.mejorFranjaFin ? (
                  <Text style={[styles.pulsoFranja, { color: catInfo.color }]} numberOfLines={1}>
                    Mejor franja ~ {indiceHoy.mejorFranjaInicio}–{indiceHoy.mejorFranjaFin}
                  </Text>
                ) : null}
              </View>
              <View style={styles.pulsoClimaCard}>
                {tiempo && clima ? (
                  <>
                    <Text style={styles.pulsoWeatherIcon}>{tiempo.icono}</Text>
                    <Text style={styles.pulsoWeatherTemp}>{Math.round(clima.temperatura)}°</Text>
                    <Text style={styles.pulsoWeatherDesc} numberOfLines={2}>
                      {tiempo.texto}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.pulsoFallback}>Sin clima</Text>
                )}
              </View>
            </View>
          ) : clima && tiempo ? (
            <View style={styles.pulsoRow}>
              <View style={styles.pulsoIndice}>
                <Text style={styles.pulsoFallback}>Sin índice aún</Text>
              </View>
              <View style={styles.pulsoClimaCard}>
                <Text style={styles.pulsoWeatherIcon}>{tiempo.icono}</Text>
                <Text style={styles.pulsoWeatherTemp}>{Math.round(clima.temperatura)}°</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.pulsoFallback}>
              Activa la ubicación o toca un tramo en el mapa
            </Text>
          )}
          {clima ? (
            <Text style={styles.pulsoMeta} numberOfLines={1}>
              Viento {Math.round(clima.velocidadVientoKmh)} km/h
              {clima.rafagaKmh != null ? ` · ráfaga ${Math.round(clima.rafagaKmh)}` : ""}
              {clima.precipitacionMm != null && clima.precipitacionMm > 0
                ? ` · ${clima.precipitacionMm.toFixed(1)} mm`
                : ""}
            </Text>
          ) : null}
          {alertasClima.length > 0 ? (
            <View style={styles.alertRow}>
              {alertasClima.slice(0, 1).map((alerta, idx) => (
                <View
                  key={idx}
                  style={[styles.weatherAlert, alerta.nivel === "peligro" && styles.weatherAlertDanger]}
                >
                  <Text style={styles.weatherAlertText}>
                    {alerta.icono} {alerta.texto}
                    {alertasClima.length > 1 ? ` · +${alertasClima.length - 1}` : ""}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        <View>
                    <SiguientePasoCard
            provinciaId={provincia.id}
            checklistTextos={provincia.checklistAntesDePescar}
            tienePunto={puntoExplicito && !!consultaViva}
            tieneSitios={favoritos.length > 0 || puntos.length > 0}
            invitarPrimeraSalida={mostrarAprende}
            etiquetaPunto={etiquetaClima}
            veredictoTexto={hoyEtiqueta?.texto ?? null}
            veredictoSub={hoyEtiqueta?.sub ?? null}
            tituloTramo={consultaViva?.titulo ?? null}
            lat={ubicacion?.lat}
            lng={ubicacion?.lng}
            onAccion={(accion: SiguientePasoAccion) => {
              if (accion.tipo === "mapa") {
                navigation.navigate("Mapa");
                return;
              }
              if (accion.tipo === "primera_salida") {
                navigation.navigate("PrimeraSalida");
                return;
              }
              if (accion.tipo === "captura") {
                navigation.navigate("Capturas", {
                  screen: "CapturasMain",
                  params: { abrirCapturaRapida: true },
                });
                return;
              }
              if (accion.tipo === "salgo") {
                if (modo === "barco") {
                  navigation.navigate("SalgoEnBarco");
                  return;
                }
                navigation.navigate("SalgoAPescar", {
                  irAChecklist: !!accion.irAChecklist,
                });
              }
            }}
          />
        </View>

        <BannerLicenciaPendiente onAbrirLicencias={() => navigation.navigate("License")} />

        {/* Detalle del tramo justo tras el CTA: el chip HOY SÍ cae aquí sin saltar a medias */}
        <View
          ref={tramoAnchorRef}
          collapsable={false}
          onLayout={(e) => {
            // Hijo directo de body → y relativo al body (no a ListaAnimada ≈ 0).
            tramoYRef.current =
              heroHRef.current + e.nativeEvent.layout.y - SPACING.md;
          }}
        >
          <ListaAnimada index={1}>
            <View style={styles.bloque}>
              <TouchableOpacity
                onPress={toggleDetalleTramo}
                accessibilityRole="button"
                accessibilityState={{ expanded: detalleTramo }}
                accessibilityLabel={
                  detalleTramo
                    ? "Ocultar detalle del tramo"
                    : "Desplegar detalle del tramo"
                }
                style={styles.bloqueCabecera}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.bloqueTitulo}>Detalle del tramo</Text>
                  <Text style={styles.bloqueSub}>
                    {consultaViva
                      ? detalleTramo
                        ? "Normativa y fichas del punto"
                        : `${consultaViva.titulo} · toca para ver`
                      : "Sin punto aún · usa Salgo a pescar o el mapa"}
                  </Text>
                </View>
                <Text style={styles.chevron}>{detalleTramo ? "▲" : "▼"}</Text>
              </TouchableOpacity>
              {detalleTramo ? (
                consultaViva ? (
                  <View style={{ marginBottom: 12 }}>
                    <ConsultaPescaCard
                      consulta={consultaViva}
                      compacto
                      ocultarVeredictoCompacto
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
                      onMontaje={(id) => {
                        const consejoId = consejoIdMontajeEspecie(id, { provinciaId: getProvinciaActiva()?.id, soloContinental: !!getProvinciaActiva()?.continentalOnly });
                        if (!consejoId) return;
                        irAConsejos(navigation, { consejoId, categoria: "montajes" });
                      }}
                    />
                  </View>
                ) : (
                  <Text style={styles.sinConsulta}>
                    Sin punto aún. Usa «Salgo a pescar» o el mapa.
                  </Text>
                )
              ) : null}

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
        </View>

        <ListaAnimada index={2}>
          <RecomendacionHoyCard
            favoritos={favoritos}
            puntos={puntos}
            actual={
              ubicacion
                ? { lat: ubicacion.lat, lng: ubicacion.lng, nombre: etiquetaClima }
                : null
            }
            coordsFavorito={coordsFavorito}
            onExplorarMapa={() => navigation.navigate("Mapa")}
            onAbrir={(r: RecomendacionHoy) => {
              if (r.candidato.zoneId) {
                navigation.navigate("ZoneDetail", { zoneId: r.candidato.zoneId });
                return;
              }
              navigation.navigate("Mapa", {
                screen: "ZonasLibresMain",
                params: {
                  centrarEn: {
                    lat: r.candidato.lat,
                    lng: r.candidato.lng,
                    nombre: r.candidato.nombre,
                  },
                },
              });
            }}
          />
        </ListaAnimada>

        {mostrarAprende ? (
          <BloqueAprende
            onCana={() => irAConsejos(navigation, { consejoId: "ap-cana-carrete", categoria: "aparejos" })}
            onKit={() => irAConsejos(navigation, { consejoId: "ap-kit-principiante", categoria: "aparejos" })}
            onNudo={() => irAConsejos(navigation, { consejoId: "nudo-palomar", categoria: "nudos" })}
            onSitios={() => navigation.navigate("PrimeraSalida")}
            onPrimeraSalida={() => navigation.navigate("PrimeraSalida")}
          />
        ) : null}

        {/* Seguridad compacta */}
        <ListaAnimada index={3}>
          <View style={styles.bloque}>
            <TouchableOpacity
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setAntesAbierto((v) => !v);
              }}
              accessibilityRole="button"
              accessibilityState={{ expanded: antesAbierto }}
              style={{ flexDirection: "row", alignItems: "center" }}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.bloqueTitulo}>Antes de salir</Text>
                <Text style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: -2, marginBottom: 4 }}>
                  {avisosCargando
                    ? "Consultando avisos…"
                    : avisosSeguridad.length === 0
                      ? "Sin avisos activos · licencia y temporada"
                      : `${avisosSeguridad.length} aviso${avisosSeguridad.length === 1 ? "" : "s"} · toca para ver`}
                </Text>
              </View>
              <Text style={styles.chevron}>{antesAbierto ? "▲" : "▼"}</Text>
            </TouchableOpacity>
            {antesAbierto ? (
              <>
            <TemporadaBanner />
            <PanelAvisosSeguridad
              avisos={avisosSeguridad}
              cargando={avisosCargando}
              error={avisosError}
              compacto
            />
            <LicenseBanner onPress={() => navigation.navigate("License")} />
              </>
            ) : null}
          </View>
        </ListaAnimada>

        {/* Sitios personales / embalses */}
        {(saihPanel.length > 0 || favoritos.length > 0 || puntos.length > 0) && (
          <ListaAnimada index={4}>
            <View style={styles.bloque}>
              <Text style={styles.bloqueTitulo}>Tus sitios</Text>

              {saihPanel.length > 0 && (
                <View style={{ marginBottom: favoritos.length > 0 || puntos.length > 0 ? 12 : 0 }}>
                  <View style={styles.sectionRow}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={styles.sectionTitle}>Embalses</Text>
                      <TerminoAyuda id="saih" />
                    </View>
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
                      onPress={() => navigation.navigate("Capturas", {
                screen: "CapturasMain",
                params: { abrirCapturaRapida: true },
              })}
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

        <ListaAnimada index={5}>
          <PanelCampoHoy navigation={navigation} />
        </ListaAnimada>

        <View style={styles.linksRow}>
          <TouchableOpacity
            style={styles.linkChip}
            onPress={() =>
              navigation.navigate("Capturas", {
                screen: "CapturasMain",
                params: { abrirCapturaRapida: true },
              })
            }
            accessibilityRole="button"
            accessibilityLabel="Captura rápida"
          >
            <Text style={styles.linkChipTxt}>+ Captura</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.linkChip}
            onPress={() => irAConsejos(navigation, { categoria: "montajes" })}
            accessibilityRole="button"
            accessibilityLabel="Consejos: montajes por especie, nudos y aparejos"
          >
            <Text style={styles.linkChipTxt}>Montajes</Text>
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
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.lg + 2,
    paddingHorizontal: SPACING.lg,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
    overflow: "hidden",
  },
  brandPulse: { ...TYPE.displayHero, color: "#fff", marginBottom: 2, zIndex: 1 },
  dateText: {
    ...TYPE.meta,
    color: "rgba(255,255,255,0.92)",
    textTransform: "capitalize",
    marginBottom: 4,
    zIndex: 1,
  },
  actualizandoTxt: {
    ...TYPE.caption,
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
  },
  climaOrigen: {
    color: "rgba(255,255,255,0.95)",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 8,
  },
  gpsChip: {
    alignSelf: "center",
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  gpsChipTxt: {
    color: "#fff",
    fontSize: 12.5,
    fontWeight: "800",
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
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  pulsoScoreBadge: {
    marginTop: 6,
    marginBottom: 8,
    minWidth: 88,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
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
    ...TYPE.overline,
    color: "rgba(255,255,255,0.9)",
  },
  indexHint: {
    ...TYPE.caption,
    fontSize: 12,
    lineHeight: 16,
    color: "rgba(255,255,255,0.78)",
    marginTop: 2,
    marginBottom: 2,
    textAlign: "center",
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
  veredictoRapidoAprox: {
    borderWidth: 2,
    borderColor: COLORS.warning,
    borderStyle: "dashed",
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
  veredictoRapidoSelloRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  veredictoRapidoSello: {
    ...TYPE.overline,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
    overflow: "hidden",
  },
  veredictoRapidoSelloOficial: {
    color: "#fff",
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  veredictoRapidoSelloAprox: {
    color: "#fff",
    backgroundColor: COLORS.warning,
  },
  veredictoRapidoAviso: {
    ...TYPE.caption,
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  veredictoRapidoKicker: {
    ...TYPE.overline,
    color: "rgba(255,255,255,0.88)",
    flexShrink: 1,
  },
  veredictoRapidoTitulo: {
    ...TYPE.displayTitle,
    color: "#fff",
    fontSize: 24,
    lineHeight: 30,
    marginTop: 2,
  },
  veredictoRapidoSub: {
    ...TYPE.caption,
    color: "rgba(255,255,255,0.95)",
    marginTop: 2,
  },
  veredictoRapidoChevron: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "300",
    marginTop: -2,
  },
  atajosPunto: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
    zIndex: 1,
  },
  atajoChip: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: RADIUS.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  atajoChipTxt: {
    ...TYPE.caption,
    color: "#fff",
  },
  pulsoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW_SOFT,
  },
  pulsoCardTitle: {
    ...TYPE.title,
    color: COLORS.textPrimary,
  },
  pulsoCardSub: {
    ...TYPE.caption,
    color: COLORS.textMuted,
    marginTop: 2,
    marginBottom: 10,
  },
  pulsoIndexLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  pulsoFranja: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: "600",
    opacity: 0.9,
  },
  pulsoIndexScore: {
    fontSize: 44,
    fontWeight: "800",
    fontFamily: FONTS.extrabold,
    color: "#fff",
    letterSpacing: -1,
    lineHeight: 48,
  },
  pulsoClimaCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.mist,
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pulsoWeatherIcon: { fontSize: 26 },
  pulsoWeatherTemp: {
    fontSize: 28,
    fontWeight: "200",
    color: COLORS.textPrimary,
  },
  pulsoWeatherDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 2,
  },
  pulsoFallback: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  pulsoMeta: {
    marginTop: 10,
    fontSize: 12.5,
    color: COLORS.textSecondary,
    fontWeight: "600",
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
    flex: 1,
    paddingRight: 8,
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
  sesionBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  sesionKicker: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: COLORS.primary,
    marginBottom: 2,
  },
  sesionTitulo: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  sesionSub: {
    fontSize: 12.5,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 17,
  },
  sesionAcciones: {
    alignItems: "flex-end",
    gap: 10,
    paddingTop: 2,
  },
  sesionCambiar: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.water,
  },
  sesionCerrar: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textMuted,
    paddingHorizontal: 4,
  },
  ctaSalgo: {
    marginTop: 12,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    marginBottom: SPACING.md,
    ...SHADOW_SOFT,
  },
  ctaSalgoInner: {
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
  },
  ctaSalgoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    zIndex: 1,
  },
  ctaSalgoKicker: {
    fontSize: 11,
    fontWeight: "800",
    fontFamily: FONTS.extrabold,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.82)",
    marginBottom: 2,
  },
  ctaSalgoTitle: {
    fontSize: 22,
    fontWeight: "800",
    fontFamily: FONTS.extrabold,
    color: "#fff",
    letterSpacing: 0.2,
  },
  ctaSalgoSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.95)",
    fontWeight: "700",
    fontFamily: FONTS.bold,
    marginTop: 3,
  },
  ctaSalgoArrow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  ctaSalgoArrowTxt: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "300",
    marginTop: -1,
  },
  bloque: {
    marginBottom: SPACING.xl,
  },
  bloqueCabecera: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
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
  bloqueSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: -2,
    marginBottom: 4,
    fontWeight: "600",
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: SPACING.sm,
  },
  sectionTitle: { ...TYPE.title, color: COLORS.textPrimary },
  sectionMeta: { ...TYPE.meta, color: COLORS.textMuted },
  linkMini: { ...TYPE.caption, fontSize: 13, lineHeight: 18, color: COLORS.water },
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
  saihName: { ...TYPE.caption, fontSize: 12, lineHeight: 16, color: COLORS.textSecondary },
  saihPct: { ...TYPE.title, fontSize: 18, lineHeight: 22, color: COLORS.waterDark, marginTop: 2 },
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
  mapaCtaSub: { ...TYPE.caption, color: COLORS.textSecondary, marginTop: 2 },
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
