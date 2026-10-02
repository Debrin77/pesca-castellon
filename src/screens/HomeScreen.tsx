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
import GlassCard from "../components/GlassCard";
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
import PanelExplorarSitios from "../components/PanelExplorarSitios";
import TarjetaPuntoHoy from "../components/TarjetaPuntoHoy";
import GraficoIndiceScrubable from "../components/GraficoIndiceScrubable";
import { consultarCosta } from "../services/consultaCostaService";
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
import BannerKayakDestacado from "../components/BannerKayakDestacado";
import {
  etiquetaModoLarga,
  etiquetaModo,
  esModoEmbarcado,
  esModoKayak,
  modoEsMar,
  textoPedirModo,
} from "../data/modoPesca";
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
import { LogoMarcaEstatico } from "../components/LogoMarca";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
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
  setAvisosSeguridad: (v: AvisoSeguridad[]) => void;
  setUbicacion: (v: { lat: number; lng: number } | null) => void;
}) {
  if (cache.clima) setters.setClima(cache.clima as ClimaActual);
  if (cache.indiceHoy) setters.setIndiceHoy(cache.indiceHoy as IndicePescaDia);
  if (Array.isArray(cache.avisos)) setters.setAvisosSeguridad(cache.avisos as AvisoSeguridad[]);
  if (cache.ubicacion) setters.setUbicacion(cache.ubicacion);
}

export default function HomeScreen({ navigation }: Props) {
  const { provincia: provinciaCtx, cambiarProvincia, restauradaAlArrancar } = useProvincia();
  const provincia = provinciaCtx ?? getProvinciaActiva();
  const {
    punto,
    listo: puntoListo,
    puntoElegido,
    fijarPunto,
    confirmarPuntoGuardado,
  } = usePuntoConsulta();
  const { modo, modoElegido, modoRecordado, listo: modoListo, disponibles, setModo } = useModoPesca();
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
  const [avisosSeguridad, setAvisosSeguridad] = useState<AvisoSeguridad[]>([]);
  const [avisosCargando, setAvisosCargando] = useState(true);
  const [avisosError, setAvisosError] = useState<string | null>(null);
  const [online, setOnline] = useState(true);
  const [cache, setCache] = useState<CacheOffline | null>(null);
  const [detalleTramo, setDetalleTramo] = useState(false);
  const [antesAbierto, setAntesAbierto] = useState(false);
  /** Modalidad abierta solo si aún no eligió; si ya hay modo, va plegada. */
  const [modoPanelAbierto, setModoPanelAbierto] = useState(false);
  /** Bloque «Aprende» si aún no completó la primera salida. */
  const [mostrarAprende, setMostrarAprende] = useState(false);
  /** Aviso «Sigues en…» solo al reanudar sesión; se puede cerrar en esta sesión. */
  const [avisoSesionVisible, setAvisoSesionVisible] = useState(restauradaAlArrancar);

  useEffect(() => {
    // Sin modalidad: el panel debe verse. Con modalidad: plegado (un toque lo abre).
    setModoPanelAbierto(!modoElegido);
  }, [modoElegido]);

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

      // Clima/índice en paralelo con avisos (SAIH/recomendaciones en Ideas y sitios).
      await Promise.all([
        cargar(true, () => vivo, { silencioso: hayPulsoCache }),
        cargarAvisos(),
      ]);
      if (vivo) setActualizando(false);
    }

    bootstrap();
    return () => {
      vivo = false;
    };
  }, [
    provincia.id,
    punto?.lat,
    punto?.lng,
    punto?.actualizadoEn,
    puntoListo,
  ]);

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

  const catInfo = indiceHoy ? CATEGORIA_INFO[indiceHoy.categoria] : null;
  /**
   * Solo veredicto legal si eligió punto en esta sesión (GPS/mapa/zona/recomendación).
   * Un punto restaurado de la sesión anterior no desbloquea «¿Puedo?» ni «Tu punto de hoy».
   */
  const puntoExplicito = !!(
    punto &&
    puntoElegido &&
    (punto.fuente === "gps" || punto.fuente === "mapa" || punto.fuente === "zona")
  );
  /** Punto guardado de antes, aún no confirmado en esta sesión. */
  const puntoAnterior =
    !puntoElegido &&
    !!punto &&
    (punto.fuente === "gps" || punto.fuente === "mapa" || punto.fuente === "zona")
      ? punto
      : null;
  const etiquetaPuntoAnterior =
    puntoAnterior?.etiqueta ||
    puntoAnterior?.poblacion ||
    (puntoAnterior ? etiquetaFuente(puntoAnterior.fuente) : null);
  /**
   * Un solo gesto reanuda modalidad + punto de la sesión anterior
   * (evita dos toques ¿Seguir en…? + Último).
   */
  const continuarSesion =
    !modoElegido &&
    !!modoRecordado &&
    disponibles.includes(modoRecordado) &&
    !!puntoAnterior &&
    !!etiquetaPuntoAnterior
      ? { modo: modoRecordado, etiqueta: etiquetaPuntoAnterior }
      : null;
  async function reanudarSesion() {
    if (!continuarSesion) return;
    await setModo(continuarSesion.modo);
    confirmarPuntoGuardado();
  }
  /**
   * Consulta legal solo con modalidad confirmada: si aún no eligió río/orilla/barco,
   * no usar el fallback técnico (río) — evita veredictos/duplicados incorrectos.
   */
  const consultaViva =
    modoListo && modoElegido && puntoExplicito
      ? esModoEmbarcado(modo)
        ? consultarEmbarcacion(punto!.lat, punto!.lng, {
            variante: modo === "kayak_mar" ? "kayak" : "barco",
          })
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
    modoEsMar(modo);
  const mensajeOffline = mensajeOfflineCorto(online, cache);
  const tiempo = clima ? descripcionTiempo(clima.codigoTiempo) : null;
  const alertasClima = clima ? detectarAlertas(clima) : [];
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
    setAntesAbierto(true);
    // Doble pase: tras pintar el expandido y tras LayoutAnimation (web/nativo).
    requestAnimationFrame(() => scrollADetalleTramo(true));
    setTimeout(() => scrollADetalleTramo(true), Platform.OS === "web" ? 90 : 220);
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
        <View style={styles.brandRow} accessibilityLabel="Vámonos de pesca">
          <LogoMarcaEstatico size={132} style={styles.brandMark} />
          <Text style={styles.dateText}>{fechaLegible(new Date())}</Text>
        </View>
        {actualizando ? (
          <Text style={styles.actualizandoTxt} accessibilityLabel="Actualizando clima e índice">
            Actualizando…
          </Text>
        ) : null}

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
        ) : modoListo && !modoElegido ? (
          <View style={styles.veredictoRapidoBloque}>
            <View
              style={styles.veredictoRapidoVacio}
              accessibilityRole="summary"
              accessibilityLabel={textoPedirModo(disponibles)}
            >
              <Text style={styles.veredictoRapidoKicker}>{EJE_LEGAL.tituloCorto}</Text>
              <Text style={styles.veredictoRapidoTitulo}>{textoPedirModo(disponibles)}</Text>
              <Text style={styles.veredictoRapidoSub}>
                {continuarSesion
                  ? "Un toque recupera modalidad y punto de la última salida"
                  : puntoExplicito || puntoAnterior
                    ? "Tienes un punto guardado · el veredicto sale al elegir modalidad"
                    : "Así alineamos mapa, especies, aparejos y tu punto de hoy"}
              </Text>
            </View>
            {continuarSesion ? (
              <TouchableOpacity
                style={styles.continuarSesionChip}
                onPress={() => void reanudarSesion()}
                accessibilityRole="button"
                accessibilityLabel={`Continuar en ${etiquetaModo(continuarSesion.modo)} · ${continuarSesion.etiqueta}`}
              >
                <Text style={styles.continuarSesionTxt} numberOfLines={2}>
                  Continuar · {etiquetaModo(continuarSesion.modo)} · {continuarSesion.etiqueta}
                </Text>
                <Text style={styles.continuarSesionCta}>Sí ›</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : !cargando && modoListo ? (
          <View style={styles.veredictoRapidoBloque}>
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
                {puntoAnterior
                  ? "Mapa, GPS o una recomendación · o reutiliza el último"
                  : `Pulsa el mapa, GPS o una recomendación · ${etiquetaModoLarga(modo)}`}
              </Text>
            </TouchableOpacity>
            {puntoAnterior && etiquetaPuntoAnterior ? (
              <TouchableOpacity
                style={styles.ultimoPuntoChip}
                onPress={() => confirmarPuntoGuardado()}
                accessibilityRole="button"
                accessibilityLabel={`Usar último punto: ${etiquetaPuntoAnterior}`}
              >
                <Text style={styles.ultimoPuntoTxt} numberOfLines={1}>
                  Último · {etiquetaPuntoAnterior}
                </Text>
                <Text style={styles.ultimoPuntoCta}>Usar ›</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {indiceHoy && catInfo ? (
          <TouchableOpacity
            onPress={() => navigation.navigate("Previsión")}
            accessibilityRole="button"
            accessibilityLabel={`${EJE_METEO.pregunta} ${indiceHoy.puntuacion}, ${catInfo.texto}. ${EJE_METEO.indexLabel}. Abrir Previsión`}
            hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
          >
            <Text style={styles.pintaHeroLine} numberOfLines={1}>
              ¿Pinta? · {indiceHoy.puntuacion} · {catInfo.texto}
              {indiceHoy.mejorFranjaInicio ? ` · ${indiceHoy.mejorFranjaInicio}` : ""}
              {"  ›"}
            </Text>
          </TouchableOpacity>
        ) : null}

        <PulsePress
          onPress={() => {
            if (esModoEmbarcado(modo)) navigation.navigate("SalgoEnBarco");
            else navigation.navigate("SalgoAPescar");
          }}
          style={styles.ctaSalgo}
          accessibilityRole="button"
          accessibilityLabel={
            !modoElegido
              ? "Salgo a pescar"
              : modo === "barco"
                ? "Salgo en barco"
                : modo === "kayak_mar"
                  ? "Salgo en kayak"
                  : esModoKayak(modo)
                    ? "Salgo a pescar en kayak"
                    : "Salgo a pescar"
          }
        >
          <LinearGradient
            colors={[
              ...(modoElegido && esModoKayak(modo)
                ? GRADIENTS.kayak
                : modoElegido && modo === "barco"
                  ? GRADIENTS.dusk
                  : GRADIENTS.water),
            ]}
            style={styles.ctaSalgoInner}
          >
            <OndaAgua intensidad={0.9} />
            <View style={styles.ctaSalgoRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.ctaSalgoKicker}>
                  {modoElegido
                    ? `Preparar salida · ${etiquetaModoLarga(modo)}`
                    : "Preparar salida"}
                </Text>
                <Text style={styles.ctaSalgoTitle}>
                  {modoElegido && modo === "barco"
                    ? "Salgo en barco"
                    : modoElegido && modo === "kayak_mar"
                      ? "Salgo en kayak"
                      : modoElegido && modo === "kayak"
                        ? "Salgo en kayak"
                        : "Salgo a pescar"}
                </Text>
                <Text style={styles.ctaSalgoSub}>
                  {!modoElegido
                    ? `${textoPedirModo(disponibles)} o sigue desde aquí`
                    : modo === "barco"
                      ? "Legal · oleaje · qué llevar · Columbretes"
                      : modo === "kayak_mar"
                        ? "Artefacto flotante · legal · oleaje · qué llevar"
                        : modo === "kayak"
                          ? "Embalse · navegación · licencia · qué llevar"
                          : "Punto del día y qué llevar"}
                </Text>
              </View>
              <View style={styles.ctaSalgoArrow} accessibilityElementsHidden>
                <Text style={styles.ctaSalgoArrowTxt}>→</Text>
              </View>
            </View>
          </LinearGradient>
        </PulsePress>
      </LinearGradient>

      <View style={styles.body}>
        <BannerOffline mensaje={mensajeOffline} />

        {/* Meta mínima: provincia + GPS. Sin banners ni filas competidoras. */}
        <View style={styles.metaHoy}>
          <TouchableOpacity
            style={styles.metaChip}
            onPress={() =>
              confirmarCambiarProvincia(provincia.nombre, () => cambiarProvincia())
            }
            accessibilityRole="button"
            accessibilityLabel={`Provincia ${provincia.nombre}. Cambiar`}
          >
            <Text style={styles.metaChipTxt} numberOfLines={1}>
              {provincia.nombre}
              {modoElegido ? ` · ${etiquetaModo(modo)}` : ""}
            </Text>
            <Text style={styles.metaChipCta}>Cambiar</Text>
          </TouchableOpacity>
          {!puntoExplicito ? (
            <TouchableOpacity
              style={styles.metaChipSec}
              onPress={() => void usarMiUbicacion()}
              accessibilityRole="button"
              accessibilityLabel="Usar mi ubicación"
            >
              <Text style={styles.metaChipSecTxt}>GPS</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {avisoSesionVisible ? (
          <TouchableOpacity
            style={styles.sesionMini}
            onPress={() => setAvisoSesionVisible(false)}
            accessibilityRole="button"
            accessibilityLabel="Cerrar aviso de sesión anterior"
          >
            <Text style={styles.sesionMiniTxt} numberOfLines={1}>
              Sesión anterior en {provincia.nombre}
              {modoElegido ? ` · ${etiquetaModo(modo)}` : ""} · toca para ocultar
            </Text>
          </TouchableOpacity>
        ) : null}

        {/* Modalidad: solo ocupa sitio si aún no eligió (o al expandir). */}
        <GlassCard style={styles.modoBajoHero} compacto>
          <TouchableOpacity
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setModoPanelAbierto((v) => !v);
            }}
            accessibilityRole="button"
            accessibilityState={{ expanded: modoPanelAbierto }}
            accessibilityLabel={
              modoPanelAbierto
                ? "Ocultar selector de modalidad"
                : modoElegido
                  ? `Modalidad ${etiquetaModoLarga(modo)}. Cambiar`
                  : textoPedirModo(disponibles)
            }
            style={styles.modoCabecera}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.modoCabeceraKicker}>Cómo pescas</Text>
              <Text style={styles.modoCabeceraTitulo}>
                {modoElegido ? etiquetaModoLarga(modo) : textoPedirModo(disponibles)}
              </Text>
            </View>
            <Text style={styles.chevron}>{modoPanelAbierto ? "▲" : "▼"}</Text>
          </TouchableOpacity>
          {modoPanelAbierto ? (
            <>
              <SelectorModoPesca
                modo={modoElegido ? modo : null}
                disponibles={disponibles}
                modoRecordado={!modoElegido && !continuarSesion ? modoRecordado : null}
                onChange={(m) => void setModo(m)}
                compacto
              />
              {modoElegido && esModoKayak(modo) ? (
                <BannerKayakDestacado
                  modo={modo}
                  provinciaId={provincia.id}
                  onVerDocumentacion={() => navigation.navigate("License")}
                />
              ) : null}
            </>
          ) : null}
          {modoElegido && consultaViva ? (
            <View style={styles.atajosPunto}>
              <TouchableOpacity
                style={styles.atajoChipClaro}
                onPress={() =>
                  navigation.navigate("Aparejos", {
                    ambitoEmbarcacion: modo === "barco" || modo === "kayak_mar",
                    ambitoModo: modo,
                  })
                }
                accessibilityRole="button"
                accessibilityLabel="Ver aparejos"
              >
                <Text style={styles.atajoChipClaroTxt}>Aparejos</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.atajoChipClaro}
                onPress={() => irAConsejos(navigation, { categoria: "montajes" })}
                accessibilityRole="button"
                accessibilityLabel="Ver consejos y montajes"
              >
                <Text style={styles.atajoChipClaroTxt}>Consejos</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.atajoChipClaro}
                onPress={() => irAEspeciesDelPunto(navigation)}
                accessibilityRole="button"
                accessibilityLabel="Ver especies del punto"
              >
                <Text style={styles.atajoChipClaroTxt}>Especies</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </GlassCard>

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
              navigation.navigate("Mapa", {
                screen: "ZonasLibresMain",
                params: { abrirExplorar: true },
              });
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
              if (esModoEmbarcado(modo)) {
                navigation.navigate("SalgoEnBarco");
                return;
              }
              navigation.navigate("SalgoAPescar", {
                irAChecklist: !!accion.irAChecklist,
              });
            }
          }}
        />

        {modoElegido && consultaViva ? (
          <TarjetaPuntoHoy
            consulta={consultaViva}
            indice={indiceHoy}
            etiquetaPunto={etiquetaClima}
            onPuedo={abrirVeredictoRapido}
            onPinta={() => navigation.navigate("Previsión")}
            onEquipo={() =>
              navigation.navigate("Aparejos", {
                ambitoEmbarcacion: modo === "barco" || modo === "kayak_mar",
                ambitoModo: modo,
              })
            }
            onEspecies={() => irAEspeciesDelPunto(navigation)}
          />
        ) : null}

        <GlassCard style={styles.pulsoCard} accessibilityLabel="Pulso del día">
          <Text style={styles.pulsoCardTitle}>Pulso del día</Text>
          <Text style={styles.pulsoCardSub}>
            {modoElegido
              ? "Orientativo · el permiso está arriba en el veredicto"
              : "Clima e índice · elige modalidad arriba para el veredicto legal"}
          </Text>
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
          {indiceHoy?.horasIndice?.length ? (
            <GraficoIndiceScrubable
              horas={indiceHoy.horasIndice}
              puntuacionDia={indiceHoy.puntuacion}
              titulo="Arrastra el día · ¿Pinta?"
            />
          ) : null}
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
              {alertasClima.slice(0, 3).map((alerta, idx) => (
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
          ) : null}
          <TouchableOpacity
            style={styles.pulsoVerDia}
            onPress={() => navigation.navigate("Previsión")}
            accessibilityRole="button"
            accessibilityLabel="Ver el día en Previsión"
          >
            <Text style={styles.pulsoVerDiaTxt}>Ver el día en Previsión ›</Text>
          </TouchableOpacity>
        </GlassCard>

        {/* SAIH, Quiero pescar, Hoy te conviene, Panel campo — plegable, sin omitir */}
        <PanelExplorarSitios navigation={navigation} />

        {mostrarAprende ? (
          <BloqueAprende
            onCana={() =>
              irAConsejos(navigation, { consejoId: "ap-cana-carrete", categoria: "aparejos" })
            }
            onKit={() =>
              irAConsejos(navigation, { consejoId: "ap-kit-principiante", categoria: "aparejos" })
            }
            onNudo={() =>
              irAConsejos(navigation, { consejoId: "nudo-palomar", categoria: "nudos" })
            }
            onSitios={() => navigation.navigate("PrimeraSalida")}
            onPrimeraSalida={() => navigation.navigate("PrimeraSalida")}
          />
        ) : null}

        {/* Un solo bloque «Más de hoy»: normativa, avisos, licencia y guía */}
        <View
          ref={tramoAnchorRef}
          collapsable={false}
          onLayout={(e) => {
            tramoYRef.current =
              heroHRef.current + e.nativeEvent.layout.y - SPACING.md;
          }}
        >
          <View style={styles.bloque}>
            <TouchableOpacity
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                const next = !(detalleTramo || antesAbierto);
                setDetalleTramo(next);
                setAntesAbierto(next);
              }}
              accessibilityRole="button"
              accessibilityState={{ expanded: detalleTramo || antesAbierto }}
              accessibilityLabel={
                detalleTramo || antesAbierto
                  ? "Ocultar más de hoy"
                  : "Desplegar más de hoy: detalle, avisos y guía"
              }
              style={styles.bloqueCabecera}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.bloqueTitulo}>Más de hoy</Text>
                <Text style={styles.bloqueSub}>
                  {consultaViva
                    ? detalleTramo || antesAbierto
                      ? "Normativa, avisos, licencia y guía"
                      : `${consultaViva.titulo} · toca para ver`
                    : "Detalle, avisos, licencia y guía · toca para ver"}
                </Text>
              </View>
              <Text style={styles.chevron}>{detalleTramo || antesAbierto ? "▲" : "▼"}</Text>
            </TouchableOpacity>
            {detalleTramo || antesAbierto ? (
              <>
                <BannerLicenciaPendiente onAbrirLicencias={() => navigation.navigate("License")} />
                {consultaViva ? (
                  <View style={{ marginBottom: 12 }}>
                    <ConsultaPescaCard
                      consulta={consultaViva}
                      compacto
                      ocultarVeredictoCompacto
                      expandido={detalleTramo}
                      onToggleDetalle={() => {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        setDetalleTramo(false);
                        setAntesAbierto(false);
                      }}
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
                        const consejoId = consejoIdMontajeEspecie(id, {
                          provinciaId: getProvinciaActiva()?.id,
                          soloContinental: !!getProvinciaActiva()?.continentalOnly,
                        });
                        if (!consejoId) return;
                        irAConsejos(navigation, { consejoId, categoria: "montajes" });
                      }}
                    />
                  </View>
                ) : (
                  <Text style={styles.sinConsulta}>
                    Sin punto aún. Usa «Salgo a pescar» o el mapa.
                  </Text>
                )}
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
        </View>

        <Text style={styles.herramientasKicker}>Herramientas</Text>
        <View style={styles.linksRow}>
          <TouchableOpacity
            style={styles.linkChip}
            onPress={() =>
              navigation.navigate("Aparejos", {
                ambitoEmbarcacion: modoElegido && esModoEmbarcado(modo),
                ambitoModo: modoElegido ? modo : undefined,
              })
            }
            accessibilityRole="button"
            accessibilityLabel="Aparejos y montajes"
          >
            <Text style={styles.linkChipTxt}>Aparejos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.linkChip}
            onPress={() => irAConsejos(navigation)}
            accessibilityRole="button"
            accessibilityLabel="Consejos y montajes"
          >
            <Text style={styles.linkChipTxt}>Consejos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.linkChip}
            onPress={() => navigation.navigate("License")}
            accessibilityRole="button"
            accessibilityLabel="Licencia de pesca"
          >
            <Text style={styles.linkChipTxt}>Licencia</Text>
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
  brandRow: {
    alignItems: "center",
    zIndex: 1,
    marginBottom: 6,
  },
  brandMark: {
    shadowOpacity: 0.4,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.92)",
    textTransform: "capitalize",
    marginBottom: 0,
    fontWeight: "600",
    fontFamily: FONTS.semibold,
    letterSpacing: 0.2,
    textAlign: "center",
  },
  actualizandoTxt: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
    letterSpacing: 0.2,
  },
  climaOrigen: {
    color: "rgba(255,255,255,0.95)",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 8,
  },
  pintaHeroLine: {
    marginTop: 8,
    marginBottom: 2,
    textAlign: "center",
    color: "rgba(255,255,255,0.9)",
    fontFamily: FONTS.semibold,
    fontSize: 13,
    zIndex: 1,
  },
  modoBajoHero: {
    marginHorizontal: SPACING.md,
    marginTop: 10,
    marginBottom: 4,
    paddingHorizontal: SPACING.md,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 8,
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
  gpsChipClaro: {
    alignSelf: "flex-start",
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  gpsChipClaroTxt: {
    color: COLORS.primaryDark,
    fontSize: 12.5,
    fontFamily: FONTS.bold,
    fontWeight: "700",
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
    fontSize: 11,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  indexHint: {
    fontSize: 11,
    color: "rgba(255,255,255,0.78)",
    fontWeight: "600",
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
  veredictoRapidoBloque: {
    marginTop: 14,
  },
  veredictoRapidoVacio: {
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
  },
  ultimoPuntoChip: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    maxWidth: "100%",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: RADIUS.pill,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.32)",
  },
  ultimoPuntoTxt: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.92)",
  },
  ultimoPuntoCta: {
    fontSize: 13,
    fontWeight: "800",
    color: "#fff",
  },
  continuarSesionChip: {
    marginTop: 10,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.55)",
  },
  continuarSesionTxt: {
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
    lineHeight: 18,
  },
  continuarSesionCta: {
    fontSize: 15,
    fontWeight: "900",
    color: "#fff",
  },
  veredictoRapidoTxt: { flex: 1 },
  veredictoRapidoSelloRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  veredictoRapidoSello: {
    fontSize: 10,
    fontWeight: "900",
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
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  veredictoRapidoKicker: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.7,
    textTransform: "uppercase",
    flexShrink: 1,
  },
  veredictoRapidoTitulo: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    fontFamily: FONTS.display,
    letterSpacing: -0.2,
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
  atajoChipClaro: {
    backgroundColor: COLORS.mist,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  atajoChipClaroTxt: {
    color: COLORS.primaryDark,
    fontSize: 13,
    fontWeight: "800",
    fontFamily: FONTS.extrabold,
  },
  atajoChipTxt: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
    fontFamily: FONTS.extrabold,
  },
  pulsoCard: {
    padding: 14,
    marginBottom: SPACING.sm,
  },
  pulsoCardTitle: {
    fontSize: 17,
    fontWeight: "700",
    fontFamily: FONTS.display,
    color: COLORS.textPrimary,
  },
  pulsoCardSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
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
  pulsoVerDia: {
    alignSelf: "flex-start",
    marginTop: 12,
    paddingVertical: 6,
  },
  pulsoVerDiaTxt: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.waterDark,
  },
  explorarRow: {
    marginHorizontal: 0,
    marginBottom: SPACING.lg,
    gap: 8,
  },
  metaHoy: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  metaChip: {
    flex: 1,
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metaChipTxt: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textPrimary,
    paddingRight: 8,
  },
  metaChipCta: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.primaryDark,
  },
  metaChipSec: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  metaChipSecTxt: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.primaryDark,
  },
  sesionMini: {
    marginBottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    backgroundColor: "rgba(22,74,54,0.08)",
  },
  sesionMiniTxt: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  modoCabecera: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  modoCabeceraKicker: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  modoCabeceraTitulo: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  ideasCta: {
    marginBottom: SPACING.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.waterLight,
    borderWidth: 1,
    borderColor: "#b7d4de",
    ...SHADOW_SOFT,
  },
  ideasCtaTitulo: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.waterDark,
  },
  ideasCtaSub: {
    marginTop: 3,
    fontSize: 12.5,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  guiaRow: {
    marginHorizontal: 0,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    paddingTop: 4,
  },
  guiaKicker: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 8,
  },
  guiaChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  guiaChip: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOW_SOFT,
  },
  guiaChipTxt: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primaryDark,
  },
  explorarChip: {
    minHeight: 46,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    ...SHADOW_SOFT,
  },
  explorarChipTxt: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.primaryDark,
  },
  explorarChipSec: {
    flex: 1,
    minHeight: 42,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  explorarMiniRow: {
    flexDirection: "row",
    gap: 8,
  },
  explorarChipSecTxt: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textSecondary,
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
    paddingHorizontal: SPACING.md,
    paddingTop: 10,
    paddingBottom: 14,
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
  sectionTitle: { ...TYPE.displayTitle, fontSize: 18, color: COLORS.textPrimary },
  sectionMeta: { fontSize: 11, color: COLORS.textMuted, fontWeight: "600" },
  linkMini: { fontSize: 12, fontWeight: "700", color: COLORS.water },
  saihChip: {
    backgroundColor: "rgba(255,255,255,0.72)",
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.85)",
    minWidth: 88,
    ...SHADOW_SOFT,
  },
  saihName: { fontSize: 11, fontWeight: "700", color: COLORS.textSecondary },
  saihPct: { fontSize: 18, fontWeight: "800", color: COLORS.waterDark, marginTop: 2 },
  aforoChip: {
    backgroundColor: "rgba(255,255,255,0.72)",
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    minWidth: 104,
    ...SHADOW_SOFT,
  },
  aforoCaudal: { fontSize: 18, fontWeight: "800", marginTop: 2 },
  aforoUnidad: { fontSize: 11, fontWeight: "700" },
  aforoRio: { fontSize: 10, fontWeight: "600", color: COLORS.textMuted, marginTop: 2 },
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
  herramientasKicker: {
    ...TYPE.overline,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
    marginBottom: 6,
  },
  linksRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: SPACING.md,
  },
  linkChip: {
    flexGrow: 1,
    flexBasis: "22%",
    minWidth: 72,
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
