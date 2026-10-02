import React, { useMemo, useState, useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Dimensions, Platform } from "react-native";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import MapView, { Marker, Circle, Polyline } from "../components/map";
import {
  consultarPuntoPesca,
  consultarPorTramo,
  aspectoMapaTramo,
  todosLosTramos,
  ConsultaPesca,
  TramoOficial,
  tramoUsaRadioAnexo,
} from "../services/consultaPescaService";
import {
  obtenerPuntosGuardados,
  obtenerCapturas,
  guardarPunto,
  actualizarPunto,
  PuntoGuardado,
  Captura,
} from "../services/storageService";
import {
  ftueLongpressMapaVista,
  marcarFtueLongpressMapaVista,
} from "../services/offlineService";
import { obtenerUbicacionActual, solicitarPermisoUbicacion, suscribirseUbicacion } from "../services/locationService";
import { formatearCoords } from "../services/coordsUtils";
import {
  cancelarPickUbicacion,
  hayPickUbicacion,
  motivoPickActivo,
  MotivoUbicacionPendiente,
  resolverPickUbicacion,
} from "../services/ubicacionPendiente";
import ConsultaPescaCard from "../components/ConsultaPescaCard";
import CercaMejorPintaBlock from "../components/CercaMejorPintaBlock";
import VentanaConsulta from "../components/VentanaConsulta";
import BotonMiPosicion from "../components/BotonMiPosicion";
import CapaPoligonosIcv from "../components/CapaPoligonosIcv";
import CapaPuertos from "../components/CapaPuertos";
import CapaVedadosCosta from "../components/CapaVedadosCosta";
import CapaVedadosMarinos from "../components/CapaVedadosMarinos";
import ListaAnimada from "../components/ListaAnimada";
import LeyendaMapa from "../components/LeyendaMapa";
import SelectorModalidad from "../components/SelectorModalidad";
import { consultarCosta, consultarToqueMapa, centroZona, todosLosPuertos, todosLosVedadosCosta, todasLasPlayas, aspectoMapaPlaya, aspectoMapaZonaCostaProhibida } from "../services/consultaCostaService";
import {
  consultarEmbarcacion,
  esMarConsultaEmbarcacion,
  todasLasRampas,
  todosLosVedadosMarinos,
} from "../services/consultaEmbarcacionService";
import {
  estimarProfundidadMarCastellon,
  etaAPuerto,
  guardarWaypointMarino,
  listarWaypointsMarinos,
  type WaypointMarino,
} from "../services/navegacionEmbarcacionService";
import { esModalidadEmbarcacionMar, modalidadDesdeModoGlobal } from "../data/modalidades";
import { buscarZonas, cuencasProvincia, SugerenciaBusqueda } from "../services/busquedaService";
import { asegurarCoordsEnProvincia, distanciaKm, puntoEnRegionMapa } from "../services/geoService";
import { listarSitiosPersonales } from "../services/sitiosPersonalesService";
import { consejoIdMontajeEspecie } from "../data/montajesEspecie";
import {
  etiquetaCuandoRadar,
  etiquetaFechaRadarPlaca,
  etiquetaHoraRadarCorta,
  etiquetaTipoRadar,
  frameConTipo,
  obtenerRadar,
  urlPlantillaRadar,
  type RadarFrame,
} from "../services/radarService";
import type { FrameRadarActivo } from "../services/radarService";
import {
  anadirPuntoTrack,
  finalizarTrack,
  iniciarTrack,
  obtenerTracks,
  setPausaTrack,
  trackActivo,
  TrackPesca,
} from "../services/trackService";
import type { ModalidadPesca } from "../data/modalidades";
import { useProvincia } from "../context/ProvinciaContext";
import { usePuntoConsulta } from "../context/PuntoConsultaContext";
import { useModoPesca } from "../context/ModoPescaContext";
import { esModoEmbarcado, esModoKayak, modoAMapaModo } from "../data/modoPesca";
import SelectorModoPesca from "../components/SelectorModoPesca";
import { getProvinciaActiva } from "../provincias/runtime";
import { resolverEspecie } from "../services/catalogoEspeciesService";
import { irAEspeciesDelPunto } from "../navigation/irATab";
import { COLORS, PIN, RADIUS, SHADOW, FONTS, TYPE } from "../theme";
import { glyphIconoPunto, hexColorPunto } from "../data/iconosPunto";
import GuardarPuntoSheet, { type BorradorPunto } from "../components/GuardarPuntoSheet";
import MapaFabHerramientas, { type AccionFabMapa } from "../components/MapaFabHerramientas";
import PinPuntoPersonal from "../components/PinPuntoPersonal";
import GlassCard from "../components/GlassCard";
import { nombreParaPuntoGuardado } from "../services/nombreSitioMapaService";
import PanelExplorarSitios from "../components/PanelExplorarSitios";

type LatLng = { latitude: number; longitude: number };

interface Props {
  navigation: any;
}

type ParamsMapa = {
  modoAnadirPunto?: boolean;
  motivoPick?: MotivoUbicacionPendiente;
  centrarEn?: { lat: number; lng: number; nombre?: string };
  activarRadar?: boolean;
  /** Al abrir desde «Salgo a pescar»: forzar costa o continental. */
  modoMapa?: "continental" | "costa";
  /** Desde Hoy: abrir Ideas y sitios (SAIH, recomendaciones, Quiero pescar). */
  abrirExplorar?: boolean;
};

export default function ZonasLibresScreen({ navigation }: Props) {
  const route = useRoute<any>();
  const { provincia: provinciaCtx, provinciaId } = useProvincia();
  const { fijarPunto } = usePuntoConsulta();
  const { modo: modoGlobal, modoElegido, modoRecordado, disponibles: modosDisp, setModo: setModoGlobal } = useModoPesca();
  const provincia = provinciaCtx ?? getProvinciaActiva();
  const soloContinental = provincia.continentalOnly;
  const cuencas = provincia.cuencas.length ? provincia.cuencas : cuencasProvincia();
  const tramos = todosLosTramos();
  const playas = soloContinental ? [] : todasLasPlayas();
  const [busqueda, setBusqueda] = useState("");
  const [consulta, setConsulta] = useState<ConsultaPesca | null>(null);
  const [marcador, setMarcador] = useState<LatLng | null>(null);
  const [yo, setYo] = useState<LatLng | null>(null);
  const [puntosPersonales, setPuntosPersonales] = useState<PuntoGuardado[]>([]);
  const [capturasPersonales, setCapturasPersonales] = useState<Captura[]>([]);
  const [mostrarSitios, setMostrarSitios] = useState(false);
  const [capas, setCapas] = useState({
    zpl: true,
    zpc: true,
    vedado: true,
    misPuntos: true,
    capturas: true,
    radar: false,
    batimetria: false,
    tracks: false,
  });
  const [localizando, setLocalizando] = useState(false);
  const [modo, setModo] = useState<"continental" | "costa">(modoAMapaModo(modoGlobal));
  /** Por defecto: solo consulta (sin lluvia de capas). */
  const [mapaSimple, setMapaSimple] = useState(true);
  const [camara, setCamara] = useState<{ latitude: number; longitude: number; zoom: number; nonce: number } | undefined>();
  const [fichaAbierta, setFichaAbierta] = useState(false);
  const [cuencaFiltro, setCuencaFiltro] = useState<string | null>(null);
  const [radarUrl, setRadarUrl] = useState<string | null>(null);
  const [radarFrame, setRadarFrame] = useState<FrameRadarActivo | null>(null);
  const [radarHost, setRadarHost] = useState("");
  const [radarFrames, setRadarFrames] = useState<RadarFrame[]>([]);
  const [radarPast, setRadarPast] = useState<RadarFrame[]>([]);
  const [radarNowcast, setRadarNowcast] = useState<RadarFrame[]>([]);
  const [radarIdx, setRadarIdx] = useState(0);
  const [modalidad, setModalidad] = useState<ModalidadPesca>(
    modalidadDesdeModoGlobal(modoGlobal)
  );
  const [tracks, setTracks] = useState<TrackPesca[]>([]);
  const [grabandoId, setGrabandoId] = useState<string | null>(null);
  const rutaPausada = !!(grabandoId && tracks.find((t) => t.id === grabandoId)?.pausado);
  const [modoAnadir, setModoAnadir] = useState(false);
  const [motivoPick, setMotivoPick] = useState<MotivoUbicacionPendiente | null>(null);
  const [capasExtra, setCapasExtra] = useState(false);
  const [waypoints, setWaypoints] = useState<WaypointMarino[]>([]);
  const [infoNavegacion, setInfoNavegacion] = useState<string | null>(null);
  const [basemapSatelite, setBasemapSatelite] = useState(false);
  const [basemapHibrido, setBasemapHibrido] = useState(false);
  const [borradorGuardar, setBorradorGuardar] = useState<BorradorPunto | null>(null);
  const [sheetGuardar, setSheetGuardar] = useState(false);
  const [midiendo, setMidiendo] = useState(false);
  const [medidaPts, setMedidaPts] = useState<LatLng[]>([]);
  const [ancla, setAncla] = useState<(LatLng & { radioM: number }) | null>(null);
  const [ftueLongpress, setFtueLongpress] = useState(false);
  const mar = !soloContinental && modo === "costa";
  const modoBarco = mar && (esModoEmbarcado(modoGlobal) || esModalidadEmbarcacionMar(modalidad));
  const modoKayak = esModoKayak(modoGlobal) || modalidad === "kayak" || modalidad === "kayak_embalse";
  const normativaOn = capas.zpl || capas.zpc || capas.vedado;
  const distanciaMedidaM = useMemo(() => {
    if (medidaPts.length < 2) return null;
    let total = 0;
    for (let i = 1; i < medidaPts.length; i++) {
      total +=
        distanciaKm(
          medidaPts[i - 1].latitude,
          medidaPts[i - 1].longitude,
          medidaPts[i].latitude,
          medidaPts[i].longitude
        ) * 1000;
    }
    return Math.round(total);
  }, [medidaPts]);

  useEffect(() => {
    ftueLongpressMapaVista().then((visto) => {
      if (!visto) setFtueLongpress(true);
    });
  }, []);

  // Sincronizar mapa con el modo global (Inicio / Salgo) solo si ya hay elección.
  // Al cambiar ríos ↔ costa, limpia la consulta local para no mezclar sitios.
  const mapaModoRef = useRef(modo);
  useEffect(() => {
    if (!modoElegido) return;
    const mapa = modoAMapaModo(modoGlobal);
    if (mapaModoRef.current !== mapa) {
      setConsulta(null);
      setMarcador(null);
      setFichaAbierta(false);
      setInfoNavegacion(null);
    }
    mapaModoRef.current = mapa;
    setModo(mapa);
    setModalidad(modalidadDesdeModoGlobal(modoGlobal));
  }, [modoGlobal, modoElegido]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: modoKayak && !mar
        ? `Mapa · Kayak · ${provincia.nombre}`
        : modoKayak && mar
          ? `Mapa · Kayak mar · ${provincia.nombre}`
          : modoBarco
            ? `Mapa · Barco · ${provincia.nombre}`
            : mar
              ? `Mapa · Costa · ${provincia.nombre}`
              : `Mapa · ${provincia.nombre}`,
      headerStyle: {
        backgroundColor: modoKayak
          ? COLORS.kayakDark
          : mar
            ? COLORS.waterDark
            : COLORS.primaryDark,
      },
    });
  }, [mar, modoBarco, modoKayak, navigation, provincia.nombre]);

  useEffect(() => {
    setCuencaFiltro(null);
    setBusqueda("");
    setConsulta(null);
    setMarcador(null);
    setFichaAbierta(false);
    const r = provincia.regionMapa;
    setCamara({
      latitude: r.latitude,
      longitude: r.longitude,
      zoom: 9,
      nonce: Date.now(),
    });
  }, [provinciaId, provincia.regionMapa]);

  useFocusEffect(
    useCallback(() => {
      obtenerPuntosGuardados().then(setPuntosPersonales);
      obtenerCapturas().then(setCapturasPersonales);
      obtenerTracks().then((t) => {
        setTracks(t);
        setGrabandoId(trackActivo(t)?.id ?? null);
      });

      const p = (route.params ?? {}) as ParamsMapa;
      const pickActivo = hayPickUbicacion() || !!p.modoAnadirPunto;
      const motivo = p.motivoPick ?? motivoPickActivo();
      setModoAnadir(pickActivo);
      setMotivoPick(motivo);

      // «Salgo a pescar» puede pedir costa o continental explícitamente.
      if (p.modoMapa === "costa" || p.modoMapa === "continental") {
        if (!(soloContinental && p.modoMapa === "costa")) {
          setModo(p.modoMapa);
          if (p.modoMapa === "costa") {
            const costa = provincia.regionCosta ?? {
              latitude: provincia.regionMapa.latitude,
              longitude: provincia.regionMapa.longitude,
              zoom: 10,
            };
            setCamara({
              latitude: costa.latitude,
              longitude: costa.longitude,
              zoom: costa.zoom,
              nonce: Date.now(),
            });
          }
        }
      }

      if (p.centrarEn) {
        const { lat, lng, nombre } = p.centrarEn;
        setCamara({ latitude: lat, longitude: lng, zoom: 15, nonce: Date.now() });
        setMarcador({ latitude: lat, longitude: lng });
        const c = consultarToqueMapa(lat, lng);
        setConsulta(c);
        setFichaAbierta(true);
        setCapas((prev) => ({ ...prev, misPuntos: true }));
        void fijarPunto({ lat, lng, fuente: "mapa", etiqueta: nombre ?? c.titulo });
        navigation.setParams?.({ centrarEn: undefined });
      }

      if (pickActivo) {
        navigation.setParams?.({
          modoAnadirPunto: undefined,
          motivoPick: undefined,
          modoMapa: undefined,
        });
      }
    }, [route.params, navigation, fijarPunto, soloContinental, provincia.regionCosta, provincia.regionMapa])
  );

  // Activar radar también si ya estamos en el mapa (params sin re-montar).
  useEffect(() => {
    const activar = !!(route.params as ParamsMapa | undefined)?.activarRadar;
    if (!activar) return;
    setCapas((prev) => ({ ...prev, radar: true }));
    setCapasExtra(true);
    navigation.setParams?.({ activarRadar: undefined });
  }, [route.params, navigation]);

  useEffect(() => {
    if (!(route.params as ParamsMapa | undefined)?.abrirExplorar) return;
    // Consumir param para no reabrir en cada foco.
    navigation.setParams?.({ abrirExplorar: undefined });
  }, [route.params, navigation]);

  useEffect(() => {
    if (!capas.radar) {
      setRadarUrl(null);
      setRadarFrame(null);
      setRadarFrames([]);
      setRadarHost("");
      return;
    }
    let cancel = false;
    void obtenerRadar().then((r) => {
      if (cancel) return;
      setRadarHost(r.host);
      setRadarFrames(r.frames);
      setRadarPast(r.past);
      setRadarNowcast(r.nowcast);
      const idx = r.frameActivo
        ? r.frames.findIndex((f) => f.path === r.frameActivo?.path)
        : -1;
      setRadarIdx(idx >= 0 ? idx : Math.max(0, r.past.length - 1));
      setRadarUrl(r.urlPlantilla);
      setRadarFrame(r.frameActivo);
    });
    return () => {
      cancel = true;
    };
  }, [capas.radar]);

  useEffect(() => {
    if (!capas.radar || !radarHost || !radarFrames.length) return;
    const f = radarFrames[Math.max(0, Math.min(radarIdx, radarFrames.length - 1))];
    if (!f) return;
    setRadarUrl(urlPlantillaRadar(radarHost, f.path));
    setRadarFrame(frameConTipo(f, radarPast, radarNowcast));
  }, [radarIdx, radarHost, radarFrames, radarPast, radarNowcast, capas.radar]);

  const radarCuando = etiquetaCuandoRadar(radarFrame);
  const radarHoraCorta = etiquetaHoraRadarCorta(radarFrame);
  const radarTipo = etiquetaTipoRadar(radarFrame);
  const radarFechaPlaca = etiquetaFechaRadarPlaca(radarFrame);

  useEffect(() => {
    if (modoElegido) {
      setModalidad(modalidadDesdeModoGlobal(modoGlobal));
    } else {
      setModalidad(mar ? "orilla_mar" : "orilla_continental");
    }
    setInfoNavegacion(null);
  }, [mar, modoGlobal, modoElegido]);

  useEffect(() => {
    if (!modoBarco) return;
    void listarWaypointsMarinos().then(setWaypoints);
  }, [modoBarco, provinciaId]);

  useEffect(() => {
    if (!marcador || !mar) return;
    if (esModalidadEmbarcacionMar(modalidad)) {
      // No reinterpretar un pin continental como «Fuera del mar (kayak)».
      if (!esMarConsultaEmbarcacion(marcador.latitude, marcador.longitude)) {
        setConsulta(null);
        setMarcador(null);
        setFichaAbierta(false);
        setInfoNavegacion(null);
        return;
      }
      const r = consultarEmbarcacion(marcador.latitude, marcador.longitude, {
        variante: modalidad === "kayak" || modoGlobal === "kayak_mar" ? "kayak" : "barco",
      });
      setConsulta(r);
      const prof = estimarProfundidadMarCastellon(marcador.latitude, marcador.longitude);
      const eta = etaAPuerto(marcador.latitude, marcador.longitude);
      setInfoNavegacion(
        [prof.etiqueta, eta?.etiqueta, "Orientativo · no sustituye carta náutica."].filter(Boolean).join("\n")
      );
    } else if (modalidad === "orilla_mar") {
      setConsulta(consultarCosta(marcador.latitude, marcador.longitude));
      setInfoNavegacion(null);
    }
  }, [modalidad, modoGlobal]);

  useEffect(() => {
    if (!grabandoId || !yo || rutaPausada) return;
    void anadirPuntoTrack(grabandoId, yo.latitude, yo.longitude).then(() => {
      void obtenerTracks().then(setTracks);
    });
  }, [yo?.latitude, yo?.longitude, grabandoId, rutaPausada]);

  useEffect(() => {
    let cancelar: (() => void) | undefined;
    (async () => {
      const ok = await solicitarPermisoUbicacion();
      if (!ok) return;
      const loc = await obtenerUbicacionActual();
      if (loc) {
        // Solo muestra «yo»: no marca consulta automática al arrancar
        // (el usuario elige tocando el mapa o «Último» en Inicio).
        setYo({ latitude: loc.lat, longitude: loc.lng });
      }
      cancelar = await suscribirseUbicacion((lat, lng) => {
        setYo({ latitude: lat, longitude: lng });
        setAncla((a) => {
          if (!a) return a;
          const dM = distanciaKm(a.latitude, a.longitude, lat, lng) * 1000;
          if (dM > a.radioM) {
            Alert.alert("Ancla", `Te has alejado ${Math.round(dM)} m del punto de ancla (radio ${a.radioM} m).`);
            return null;
          }
          return a;
        });
      });
    })();
    return () => cancelar?.();
  }, []);

  function toggleCapa(capa: keyof typeof capas) {
    setCapas((prev) => ({ ...prev, [capa]: !prev[capa] }));
  }

  function toggleNormativa() {
    const next = !normativaOn;
    setCapas((prev) => ({ ...prev, zpl: next, zpc: next, vedado: next }));
  }

  function abrirSheetGuardar(lat: number, lng: number, nombreSugerido?: string) {
    const enProvincia = asegurarCoordsEnProvincia(lat, lng, {
      region: provincia.regionMapa,
      nombre: provincia.nombre,
    });
    if (!enProvincia.ok) {
      Alert.alert(`Fuera de ${provincia.nombre}`, enProvincia.error);
      return;
    }
    // Siempre proponer el nombre del mapa (nunca fecha). En long-press consulta
    // puede no haberse actualizado aún → resolver por coords.
    const sugerido =
      nombreSugerido?.trim() ||
      consulta?.tramo?.nombre?.trim() ||
      consulta?.titulo?.trim() ||
      undefined;
    setBorradorGuardar({
      lat,
      lng,
      nombreSugerido: nombreParaPuntoGuardado({ lat, lng, sugerido }),
      zonaRelacionadaId: consulta?.tramo?.fichaId ?? consulta?.tramo?.id ?? null,
    });
    setSheetGuardar(true);
  }

  function abrirEditarSitio(s: {
    id: string;
    titulo: string;
    lat: number;
    lng: number;
    color?: string | null;
    icono?: string | null;
    tipo: string;
  }) {
    if (s.tipo !== "punto" || !s.id.startsWith("punto:")) {
      evaluarPunto(s.lat, s.lng);
      return;
    }
    const puntoId = s.id.slice("punto:".length);
    setBorradorGuardar({
      lat: s.lat,
      lng: s.lng,
      nombreSugerido: s.titulo,
      puntoId,
      color: s.color,
      icono: s.icono,
    });
    setSheetGuardar(true);
  }

  function alPulsarMapa(lat: number, lng: number) {
    if (midiendo) {
      // Polilínea: cada toque añade un vértice (reinicia con el botón Medir).
      setMedidaPts((prev) => [...prev, { latitude: lat, longitude: lng }]);
      return;
    }
    evaluarPunto(lat, lng);
  }

  function alLongPressMapa(lat: number, lng: number) {
    if (midiendo) {
      alPulsarMapa(lat, lng);
      return;
    }
    if (ftueLongpress) {
      setFtueLongpress(false);
      void marcarFtueLongpressMapaVista();
    }
    evaluarPunto(lat, lng);
    abrirSheetGuardar(lat, lng);
  }

  async function onAccionFab(accion: AccionFabMapa) {
    if (accion === "guardar") {
      if (marcador) {
        abrirSheetGuardar(marcador.latitude, marcador.longitude, consulta?.titulo?.trim());
      } else {
        Alert.alert("Guardar punto", "Mantén pulsado el mapa (o toca un sitio y usa + → Guardar).");
      }
      return;
    }
    if (accion === "medir") {
      setMidiendo((v) => !v);
      setMedidaPts([]);
      return;
    }
    if (accion === "ruta") {
      if (grabandoId) {
        await finalizarTrack(grabandoId);
        setGrabandoId(null);
        setTracks(await obtenerTracks());
        setCapas((prev) => ({ ...prev, tracks: true }));
        Alert.alert("Ruta", "Track guardado. Puedes exportarlo en Capturas → GPX.");
      } else {
        setMapaSimple(false);
        const t = await iniciarTrack(`Ruta ${new Date().toLocaleString("es-ES")}`, modalidad);
        setGrabandoId(t.id);
        setTracks(await obtenerTracks());
        setCapas((prev) => ({ ...prev, tracks: true }));
      }
      return;
    }
    if (accion === "ancla") {
      if (!marcador) {
        Alert.alert("Ancla", "Toca primero un punto en el mapa.");
        return;
      }
      if (ancla) {
        setAncla(null);
        Alert.alert("Ancla", "Alarma de ancla desactivada.");
        return;
      }
      setAncla({
        latitude: marcador.latitude,
        longitude: marcador.longitude,
        radioM: 40,
      });
      Alert.alert("Ancla", "Radio de 40 m. Te avisamos si te alejas (al actualizar tu GPS).");
    }
  }

  const tramosVisibles = useMemo(() => {
    return tramos.filter((t) => {
      if (t.aprovechamiento === "ZPL") return capas.zpl;
      if (t.aprovechamiento === "ZPC") return capas.zpc;
      return capas.vedado;
    });
  }, [tramos, capas]);

  const sitiosPersonales = useMemo(() => {
    const species = provincia.species as { id: string; nombre: string }[];
    return listarSitiosPersonales(puntosPersonales, capturasPersonales, {
      region: provincia.regionMapa,
      nombreEspecie: (id) => resolverEspecie(id, species)?.nombre ?? id,
      limite: 40,
    });
  }, [puntosPersonales, capturasPersonales, provincia.regionMapa, provincia.species]);

  const sugerencias = useMemo(() => {
    const haySitios = mostrarSitios || !!busqueda.trim();
    if (!busqueda.trim() && !cuencaFiltro && !haySitios) return [];
    return buscarZonas(busqueda, {
      modo,
      cuenca: modo === "continental" ? cuencaFiltro : null,
      limite: 12,
      sitiosPersonales: haySitios || !!busqueda.trim() ? sitiosPersonales : undefined,
    });
  }, [busqueda, modo, cuencaFiltro, sitiosPersonales, mostrarSitios]);

  function aplicarSugerencia(s: SugerenciaBusqueda) {
    setBusqueda(s.titulo);
    setMostrarSitios(false);
    if (s.tipo === "punto" || s.tipo === "captura") {
      if (s.lat != null && s.lng != null) {
        setCapas((prev) => ({ ...prev, misPuntos: true }));
        evaluarPunto(s.lat, s.lng);
        void fijarPunto({
          lat: s.lat,
          lng: s.lng,
          fuente: "mapa",
          etiqueta: s.titulo,
        });
      }
      return;
    }
    if (s.tipo === "playa" && s.playaId) {
      if (soloContinental) return;
      evaluarPlaya(s.playaId);
      return;
    }
    if (s.tramoId) {
      const z = tramos.find((t) => t.id === s.tramoId);
      if (z) {
        evaluarTramo(z);
        return;
      }
    }
    if (s.fichaId) {
      navigation.navigate("ZoneDetail", { zoneId: s.fichaId });
      setBusqueda("");
      return;
    }
    if (s.lat != null && s.lng != null) evaluarPunto(s.lat, s.lng);
  }

  function mostrarFicha(c: ConsultaPesca) {
    setConsulta(c);
    setFichaAbierta(true);
    setBusqueda("");
  }

  function evaluarTramo(z: TramoOficial) {
    setModo("continental");
    mostrarFicha(consultarPorTramo(z));
    setMarcador({ latitude: z.lat, longitude: z.lng });
    void fijarPunto({ lat: z.lat, lng: z.lng, fuente: "zona", etiqueta: z.nombre });
    if (!tramoUsaRadioAnexo(z)) {
      setCamara({ latitude: z.lat, longitude: z.lng, zoom: 15, nonce: Date.now() });
    }
  }

  function evaluarPunto(lat: number, lng: number) {
    if (modoBarco || (mar && esModalidadEmbarcacionMar(modalidad))) {
      const r = consultarEmbarcacion(lat, lng, {
        variante: modalidad === "kayak" || modoGlobal === "kayak_mar" ? "kayak" : "barco",
      });
      setModo("costa");
      setCamara({ latitude: lat, longitude: lng, zoom: 12, nonce: Date.now() });
      mostrarFicha(r);
      setMarcador({ latitude: lat, longitude: lng });
      const prof = estimarProfundidadMarCastellon(lat, lng);
      const eta = etaAPuerto(lat, lng);
      setInfoNavegacion(
        [prof.etiqueta, eta?.etiqueta, "Carta/batimetría: consulta orientativa, no navegar solo con esto."].filter(Boolean).join("\n")
      );
      void fijarPunto({ lat, lng, fuente: "mapa", etiqueta: r.titulo });
      return;
    }
    // En Costa (orilla): no caer al tramo continental si el toque es mar adentro.
    if (mar) {
      const r = consultarCosta(lat, lng);
      setModo("costa");
      setCamara({ latitude: lat, longitude: lng, zoom: 14, nonce: Date.now() });
      setInfoNavegacion(null);
      mostrarFicha(r);
      setMarcador({ latitude: lat, longitude: lng });
      void fijarPunto({ lat, lng, fuente: "mapa", etiqueta: r.titulo });
      return;
    }
    const r = consultarToqueMapa(lat, lng);
    if (!soloContinental && r.ambito === "maritimo") {
      setModo("costa");
      setCamara({ latitude: lat, longitude: lng, zoom: 14, nonce: Date.now() });
    } else {
      setModo("continental");
    }
    setInfoNavegacion(null);
    mostrarFicha(r);
    setMarcador({ latitude: lat, longitude: lng });
    void fijarPunto({ lat, lng, fuente: "mapa", etiqueta: r.titulo });
  }

  function evaluarPlaya(id: string) {
    if (soloContinental) return;
    const p = playas.find((x) => x.id === id);
    if (!p) return;
    setModo("costa");
    const c = consultarCosta(p.lat, p.lng);
    mostrarFicha(c);
    setMarcador({ latitude: p.lat, longitude: p.lng });
    setCamara({ latitude: p.lat, longitude: p.lng, zoom: 14, nonce: Date.now() });
    void fijarPunto({ lat: p.lat, lng: p.lng, fuente: "zona", etiqueta: p.nombre });
  }

  function cambiarModo(siguiente: "continental" | "costa") {
    if (soloContinental && siguiente === "costa") return;
    setModo(siguiente);
    if (siguiente === "costa") {
      const costaPreferida =
        modoGlobal === "barco" || modoGlobal === "kayak_mar"
          ? modoGlobal
          : "orilla";
      void setModoGlobal(costaPreferida);
      const costa = provincia.regionCosta ?? {
        latitude: provincia.regionMapa.latitude,
        longitude: provincia.regionMapa.longitude,
        zoom: 10,
      };
      setCamara({ latitude: costa.latitude, longitude: costa.longitude, zoom: costa.zoom, nonce: Date.now() });
      if (marcador) {
        setConsulta(
          esModoEmbarcado(costaPreferida) ||
            modalidad === "embarcacion" ||
            modalidad === "kayak"
            ? consultarEmbarcacion(marcador.latitude, marcador.longitude, {
                variante: costaPreferida === "kayak_mar" || modalidad === "kayak" ? "kayak" : "barco",
              })
            : consultarCosta(marcador.latitude, marcador.longitude)
        );
      }
    } else {
      const contPreferido =
        modoGlobal === "kayak" || modoGlobal === "embalse" ? modoGlobal : "rio";
      void setModoGlobal(contPreferido);
      if (marcador) {
        setConsulta(consultarPuntoPesca(marcador.latitude, marcador.longitude));
      }
    }
  }

  async function irAMiPosicion() {
    setLocalizando(true);
    const ok = await solicitarPermisoUbicacion();
    const loc = ok ? await obtenerUbicacionActual() : null;
    setLocalizando(false);
    if (!loc) return;
    const pos = { latitude: loc.lat, longitude: loc.lng };
    setYo(pos);
    if (!puntoEnRegionMapa(loc.lat, loc.lng, provincia.regionMapa)) {
      const r = provincia.regionMapa;
      setCamara({ latitude: r.latitude, longitude: r.longitude, zoom: 9, nonce: Date.now() });
      Alert.alert(
        `Fuera de ${provincia.nombre}`,
        `Tu GPS está fuera de ${provincia.nombre}. El mapa sigue mostrando esta provincia.`
      );
      return;
    }
    // Una sola escritura de punto (gps): no pasar por evaluarPunto (fuente mapa).
    const r = consultarToqueMapa(loc.lat, loc.lng);
    if (!soloContinental && r.ambito === "maritimo") {
      setModo("costa");
    } else {
      setModo("continental");
    }
    mostrarFicha(r);
    setMarcador(pos);
    setCamara({ latitude: loc.lat, longitude: loc.lng, zoom: 14, nonce: Date.now() });
    void fijarPunto({ lat: loc.lat, lng: loc.lng, fuente: "gps", etiqueta: "Tu ubicación" });
  }

  function salirModoAnadir() {
    cancelarPickUbicacion();
    setModoAnadir(false);
    setMotivoPick(null);
  }

  function guardarMarcadorComoPunto() {
    if (!marcador) {
      Alert.alert("Mapa", "Pulsa primero un sitio en el mapa.");
      return;
    }
    abrirSheetGuardar(marcador.latitude, marcador.longitude, consulta?.titulo?.trim());
  }

  async function confirmarGuardarDesdeSheet(datos: {
    nombre: string;
    color: string;
    icono: string;
    lat: number;
    lng: number;
    zonaRelacionadaId?: string | null;
    puntoId?: string | null;
  }) {
    const nombreFinal = nombreParaPuntoGuardado({
      lat: datos.lat,
      lng: datos.lng,
      sugerido: datos.nombre,
    });
    let puntoIdGuardado = datos.puntoId ?? null;
    if (datos.puntoId) {
      await actualizarPunto(datos.puntoId, {
        nombre: nombreFinal,
        color: datos.color,
        icono: datos.icono,
      });
    } else {
      const nuevo = await guardarPunto({
        nombre: nombreFinal,
        lat: datos.lat,
        lng: datos.lng,
        zonaRelacionadaId: datos.zonaRelacionadaId ?? null,
        color: datos.color,
        icono: datos.icono,
      });
      puntoIdGuardado = nuevo.id;
    }
    setPuntosPersonales(await obtenerPuntosGuardados());
    setCapas((prev) => ({ ...prev, misPuntos: true }));
    setSheetGuardar(false);
    setBorradorGuardar(null);

    if (!datos.puntoId && modoAnadir && (motivoPick === "punto" || hayPickUbicacion("punto"))) {
      resolverPickUbicacion({ lat: datos.lat, lng: datos.lng, etiqueta: nombreFinal });
      setModoAnadir(false);
      setMotivoPick(null);
      setFichaAbierta(false);
      navigation.navigate("Capturas", {
        screen: "CapturasMain",
        params: puntoIdGuardado ? { capturaEnPuntoId: puntoIdGuardado } : undefined,
      });
      return;
    }

    Alert.alert(
      datos.puntoId ? "Punto actualizado" : "Punto guardado",
      `${nombreFinal}\n${formatearCoords(datos.lat, datos.lng)}`,
      puntoIdGuardado
        ? [
            { text: "Listo", style: "cancel" },
            {
              text: "Añadir captura",
              onPress: () =>
                navigation.navigate("Capturas", {
                  screen: "CapturasMain",
                  params: { capturaEnPuntoId: puntoIdGuardado },
                }),
            },
          ]
        : undefined
    );
  }

  function usarUbicacionParaCaptura() {
    if (!marcador) {
      Alert.alert("Mapa", "Pulsa primero un sitio en el mapa.");
      return;
    }
    const lat = marcador.latitude;
    const lng = marcador.longitude;
    const enProvincia = asegurarCoordsEnProvincia(lat, lng, {
      region: provincia.regionMapa,
      nombre: provincia.nombre,
    });
    if (!enProvincia.ok) {
      Alert.alert(`Fuera de ${provincia.nombre}`, enProvincia.error);
      return;
    }
    const etiqueta = consulta?.titulo?.trim() || formatearCoords(lat, lng);
    resolverPickUbicacion({ lat, lng, etiqueta });
    setModoAnadir(false);
    setMotivoPick(null);
    setFichaAbierta(false);
    navigation.navigate("Capturas", { screen: "CapturasMain" });
  }

  async function usarUbicacionParaSalgo() {
    if (!marcador) {
      Alert.alert("Mapa", "Pulsa primero un sitio o zona en el mapa.");
      return;
    }
    const lat = marcador.latitude;
    const lng = marcador.longitude;
    const enProvincia = asegurarCoordsEnProvincia(lat, lng, {
      region: provincia.regionMapa,
      nombre: provincia.nombre,
    });
    if (!enProvincia.ok) {
      Alert.alert(`Fuera de ${provincia.nombre}`, enProvincia.error);
      return;
    }
    const etiqueta = consulta?.titulo?.trim() || formatearCoords(lat, lng);
    // Solo el singleton: SalgoAPescar consume el pick y aplica ubicación + índice.
    resolverPickUbicacion({ lat, lng, etiqueta });
    setModoAnadir(false);
    setMotivoPick(null);
    setFichaAbierta(false);
    navigation.navigate("Inicio", { screen: "SalgoAPescar" });
  }

  function confirmarPickSiProcede() {
    if (motivoPick === "salgo" || hayPickUbicacion("salgo")) {
      usarUbicacionParaSalgo();
      return;
    }
    if (motivoPick === "captura" || hayPickUbicacion("captura")) {
      usarUbicacionParaCaptura();
    }
  }

  const pickSalgo = modoAnadir && (motivoPick === "salgo" || hayPickUbicacion("salgo"));
  const pickCaptura = modoAnadir && (motivoPick === "captura" || hayPickUbicacion("captura"));
  const pickConfirmar = pickSalgo || pickCaptura;

  // Mapa protagonista pero deja ver Ideas/SAIH sin scroll eterno (~50%, mín. 380).
  const altoMapa = useMemo(() => {
    const h = Dimensions.get("window").height;
    return Math.max(Math.round(h * 0.5), 380);
  }, []);
  const abrirExplorar = !!(route.params as ParamsMapa | undefined)?.abrirExplorar;

  return (
    <View style={[styles.container, mar && styles.containerMar]}>
      {modoAnadir ? (
        <View style={styles.bannerAnadir}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={styles.bannerAnadirTitulo}>
              {pickCaptura
                ? "Ubicación de la captura"
                : pickSalgo
                  ? "Dónde vas a pescar"
                  : "Añadir punto en el mapa"}
            </Text>
            <Text style={styles.bannerAnadirTxt}>
              {pickCaptura
                ? "Pulsa el mapa y confirma la ubicación."
                : pickSalgo
                  ? `Toca una zona o cualquier punto de ${provincia.nombre} y pulsa «Usar esta ubicación».`
                  : `Toca cualquier sitio de ${provincia.nombre} y pulsa «Guardar este punto».`}
            </Text>
          </View>
          <TouchableOpacity onPress={salirModoAnadir} accessibilityRole="button" accessibilityLabel="Cancelar">
            <Text style={styles.bannerAnadirCancel}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <ScrollView
        style={styles.scrollMapa}
        contentContainerStyle={styles.scrollMapaContent}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
      >
      {/* Una sola barra superior: búsqueda + modalidad + consulta/capas (evita solapes). */}
      <GlassCard
        compacto
        style={[styles.searchBox, mar && styles.searchBoxMar]}
      >
        <TextInput
          style={[styles.searchInput, mar && styles.searchInputMar]}
          placeholder={
            mar
              ? "Busca playa o municipio (Benicàssim, Grao, Nules…)"
              : provincia.id === "sevilla" || provincia.id === "cordoba" || provincia.id === "cuenca"
                ? "Busca embalse, río o tus puntos"
                : "Busca tramo, municipio o tus puntos"
          }
          placeholderTextColor={mar ? COLORS.waterDark : COLORS.textMuted}
          value={busqueda}
          onChangeText={(t) => {
            setBusqueda(t);
            if (t.trim()) setMostrarSitios(false);
          }}
          onFocus={() => {
            if (!busqueda.trim() && sitiosPersonales.length > 0) setMostrarSitios(true);
          }}
        />
        {sitiosPersonales.length > 0 ? (
          <TouchableOpacity
            style={[styles.sitiosChip, (mostrarSitios || !!busqueda.trim()) && styles.sitiosChipOn]}
            onPress={() => {
              setMostrarSitios((v) => !v);
              if (busqueda.trim()) setBusqueda("");
            }}
            accessibilityRole="button"
            accessibilityLabel="Ver mis puntos y capturas guardados"
          >
            <Text style={[styles.sitiosChipTxt, (mostrarSitios || !!busqueda.trim()) && styles.sitiosChipTxtOn]}>
              Mis sitios ({sitiosPersonales.length})
            </Text>
          </TouchableOpacity>
        ) : null}
        {!mar && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cuencaRow}>
            <TouchableOpacity
              style={[styles.cuencaChip, !cuencaFiltro && styles.cuencaChipOn]}
              onPress={() => setCuencaFiltro(null)}
            >
              <Text style={[styles.cuencaTxt, !cuencaFiltro && styles.cuencaTxtOn]}>Todas</Text>
            </TouchableOpacity>
            {cuencas.filter((c) => c !== "Otras").map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.cuencaChip, cuencaFiltro === c && styles.cuencaChipOn]}
                onPress={() => setCuencaFiltro(cuencaFiltro === c ? null : c)}
              >
                <Text style={[styles.cuencaTxt, cuencaFiltro === c && styles.cuencaTxtOn]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
        {sugerencias.length > 0 && (
          <View style={styles.suggestionsBox}>
            {sugerencias.map((z, i) => (
              <ListaAnimada key={z.id} index={i} replayKey={`${busqueda}-${cuencaFiltro}`}>
                <TouchableOpacity style={styles.suggestionRow} onPress={() => aplicarSugerencia(z)}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.suggestionText}>{z.titulo}</Text>
                    <Text style={styles.suggestionSub}>{z.meta}</Text>
                  </View>
                  <Text style={styles.suggestionMeta}>{z.tipo}</Text>
                </TouchableOpacity>
              </ListaAnimada>
            ))}
          </View>
        )}
        {modosDisp.length > 1 ? (
          <View style={[styles.modoBarInSearch, modoKayak && !mar && styles.modoBarKayak]}>
            <SelectorModoPesca
              modo={modoElegido ? modoGlobal : null}
              disponibles={modosDisp}
              modoRecordado={!modoElegido ? modoRecordado : null}
              compacto
              onChange={(m) => {
                void setModoGlobal(m);
                setModo(modoAMapaModo(m));
                setModalidad(modalidadDesdeModoGlobal(m));
                if (modoAMapaModo(m) === "costa") {
                  const costa = provincia.regionCosta ?? {
                    latitude: provincia.regionMapa.latitude,
                    longitude: provincia.regionMapa.longitude,
                    zoom: 10,
                  };
                  setCamara({
                    latitude: costa.latitude,
                    longitude: costa.longitude,
                    zoom: costa.zoom,
                    nonce: Date.now(),
                  });
                }
              }}
            />
          </View>
        ) : null}
        <View style={styles.mapaModoRowInSearch}>
          <TouchableOpacity
            style={[styles.mapaModoBtn, mapaSimple && styles.mapaModoBtnOn]}
            onPress={() => {
              setMapaSimple(true);
              setCapasExtra(false);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: mapaSimple }}
            accessibilityLabel="Solo consulta"
          >
            <Text style={[styles.mapaModoTxt, mapaSimple && styles.mapaModoTxtOn]}>Solo consulta</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.mapaModoBtn, !mapaSimple && styles.mapaModoBtnOn]}
            onPress={() => setMapaSimple(false)}
            accessibilityRole="button"
            accessibilityState={{ selected: !mapaSimple }}
            accessibilityLabel="Capas avanzadas"
          >
            <Text style={[styles.mapaModoTxt, !mapaSimple && styles.mapaModoTxtOn]}>Capas</Text>
          </TouchableOpacity>
        </View>
      </GlassCard>

      {!mapaSimple ? (
      <>
      <GlassCard compacto style={[styles.layerBar, mar && styles.modoBarMar]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, alignItems: "center", minHeight: 44 }}>
        <TouchableOpacity
          style={[styles.layerChip, normativaOn && styles.layerChipActive]}
          onPress={toggleNormativa}
          accessibilityRole="button"
          accessibilityLabel="Capa normativa"
          accessibilityState={{ selected: normativaOn }}
        >
          <Text style={[styles.layerChipText, normativaOn && styles.layerChipTextActive]}>Normativa</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.layerChip, capas.misPuntos && styles.layerChipActive]}
          onPress={() => toggleCapa("misPuntos")}
          accessibilityRole="button"
          accessibilityLabel="Mostrar u ocultar sitios guardados"
          accessibilityState={{ selected: capas.misPuntos }}
        >
          <Text style={[styles.layerChipText, capas.misPuntos && styles.layerChipTextActive]}>
            Sitios{puntosPersonales.length ? ` (${puntosPersonales.length})` : ""}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.layerChip, capas.capturas && styles.layerChipActive]}
          onPress={() => toggleCapa("capturas")}
          accessibilityRole="button"
          accessibilityLabel="Mostrar u ocultar capturas en el mapa"
          accessibilityState={{ selected: capas.capturas }}
        >
          <Text style={[styles.layerChipText, capas.capturas && styles.layerChipTextActive]}>
            Capturas{capturasPersonales.length ? ` (${capturasPersonales.length})` : ""}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.layerChip, (basemapSatelite || basemapHibrido) && styles.layerChipActive]}
          onPress={() => {
            // Ciclo: estándar → satélite → híbrido → estándar
            if (!basemapSatelite && !basemapHibrido) {
              setBasemapSatelite(true);
              setBasemapHibrido(false);
            } else if (basemapSatelite && !basemapHibrido) {
              setBasemapSatelite(false);
              setBasemapHibrido(true);
            } else {
              setBasemapSatelite(false);
              setBasemapHibrido(false);
            }
          }}
          accessibilityRole="button"
          accessibilityLabel={
            basemapHibrido ? "Mapa híbrido" : basemapSatelite ? "Mapa satélite" : "Mapa estándar"
          }
          accessibilityState={{ selected: basemapSatelite || basemapHibrido }}
        >
          <Text
            style={[
              styles.layerChipText,
              (basemapSatelite || basemapHibrido) && styles.layerChipTextActive,
            ]}
          >
            {basemapHibrido ? "Híbrido" : basemapSatelite ? "Satélite" : "Estándar"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.layerChip, (capasExtra || capas.radar || capas.tracks || capas.batimetria) && styles.layerChipActive]}
          onPress={() => setCapasExtra((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={capasExtra ? "Cerrar más capas" : "Más capas del mapa"}
        >
          <Text style={[styles.layerChipText, capasExtra && styles.layerChipTextActive]}>
            {capasExtra ? "Cerrar ▲" : "Más capas ▼"}
          </Text>
        </TouchableOpacity>
        {capasExtra || capas.radar ? (
          <TouchableOpacity style={[styles.layerChip, capas.radar && styles.layerChipActive]} onPress={() => toggleCapa("radar")}>
            <Text style={[styles.layerChipText, capas.radar && styles.layerChipTextActive]}>
              {capas.radar
                ? radarHoraCorta
                  ? `Radar ${radarHoraCorta}`
                  : "Radar ON"
                : "Radar lluvia"}
            </Text>
          </TouchableOpacity>
        ) : null}
        {capasExtra && mar ? (
          <TouchableOpacity
            style={[styles.layerChip, capas.batimetria && styles.layerChipMar]}
            onPress={() => toggleCapa("batimetria")}
          >
            <Text style={[styles.layerChipText, capas.batimetria && { color: PIN.playa }]}>Profundidad</Text>
          </TouchableOpacity>
        ) : null}
        {capasExtra ? (
          <TouchableOpacity style={[styles.layerChip, capas.tracks && styles.layerChipActive]} onPress={() => toggleCapa("tracks")}>
            <Text style={[styles.layerChipText, capas.tracks && styles.layerChipTextActive]}>Rutas</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
      </GlassCard>

      {capasExtra ? (
        <GlassCard compacto style={[styles.capasExtraPanel, mar && styles.modoBarMar]}>
          <View style={styles.capasExtraCabecera}>
            <Text style={styles.capasExtraTitulo}>Más capas</Text>
            <TouchableOpacity
              style={styles.cerrarCapasBtn}
              onPress={() => setCapasExtra(false)}
              accessibilityRole="button"
              accessibilityLabel="Cerrar más capas"
            >
              <Text style={styles.cerrarCapasTxt}>Cerrar</Text>
            </TouchableOpacity>
          </View>
          <SelectorModalidad
            value={modalidad}
            onChange={setModalidad}
            filtroAmbito={mar ? "maritimo" : "continental"}
          />
          <View style={styles.normativaDetalle}>
            <Text style={styles.capasExtraTitulo}>Detalle normativa</Text>
            <View style={styles.rutaBtns}>
              {mar ? (
                <>
                  <TouchableOpacity style={[styles.layerChip, capas.zpl && styles.layerChipMar]} onPress={() => toggleCapa("zpl")}>
                    <Text style={[styles.layerChipText, capas.zpl && { color: PIN.playa }]}>Playa</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.layerChip, capas.vedado && styles.layerChipActive]} onPress={() => toggleCapa("vedado")}>
                    <Text style={[styles.layerChipText, capas.vedado && { color: PIN.vedado }]}>Vedado</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.layerChip, capas.zpc && styles.layerChipActive]} onPress={() => toggleCapa("zpc")}>
                    <Text style={[styles.layerChipText, capas.zpc && { color: PIN.puerto }]}>Puerto</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity style={[styles.layerChip, capas.zpl && styles.layerChipActive]} onPress={() => toggleCapa("zpl")}>
                    <Text style={[styles.layerChipText, capas.zpl && { color: PIN.libre }]}>Libre</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.layerChip, capas.zpc && styles.layerChipActive]} onPress={() => toggleCapa("zpc")}>
                    <Text style={[styles.layerChipText, capas.zpc && { color: PIN.coto }]}>Coto</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.layerChip, capas.vedado && styles.layerChipActive]} onPress={() => toggleCapa("vedado")}>
                    <Text style={[styles.layerChipText, capas.vedado && { color: PIN.vedado }]}>Vedado</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
          {modoBarco && marcador ? (
            <TouchableOpacity
              style={[styles.layerChip, { alignSelf: "flex-start", marginTop: 6 }]}
              onPress={async () => {
                const prof = estimarProfundidadMarCastellon(marcador.latitude, marcador.longitude);
                const w = await guardarWaypointMarino({
                  nombre: consulta?.titulo?.slice(0, 40) || "Waypoint",
                  lat: marcador.latitude,
                  lng: marcador.longitude,
                  profundidadM: prof.profundidadM,
                  nota: prof.etiqueta,
                });
                setWaypoints(await listarWaypointsMarinos());
                Alert.alert("Waypoint", `Guardado: ${w.nombre} (${prof.isobataAprox})`);
              }}
            >
              <Text style={styles.layerChipText}>★ Guardar waypoint</Text>
            </TouchableOpacity>
          ) : null}
          {grabandoId ? (
            <View style={styles.rutaBtns}>
              <TouchableOpacity
                style={[styles.layerChip, styles.layerChipActive]}
                onPress={async () => {
                  await setPausaTrack(grabandoId, !rutaPausada);
                  setTracks(await obtenerTracks());
                }}
                accessibilityRole="button"
                accessibilityLabel={rutaPausada ? "Reanudar ruta GPS" : "Pausar ruta GPS"}
              >
                <Text style={[styles.layerChipText, styles.layerChipTextActive]}>
                  {rutaPausada ? "▶ Reanudar" : "❚❚ Pausar"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.layerChip, styles.layerChipActive]}
                onPress={async () => {
                  await finalizarTrack(grabandoId);
                  setGrabandoId(null);
                  setTracks(await obtenerTracks());
                  Alert.alert("Ruta", "Track guardado. Puedes exportarlo en Capturas → GPX.");
                }}
                accessibilityRole="button"
                accessibilityLabel="Finalizar ruta GPS"
              >
                <Text style={[styles.layerChipText, styles.layerChipTextActive]}>■ Parar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.layerChip, { alignSelf: "flex-start", marginRight: 0 }]}
              onPress={async () => {
                const t = await iniciarTrack(`Ruta ${new Date().toLocaleString("es-ES")}`, modalidad);
                setGrabandoId(t.id);
                setTracks(await obtenerTracks());
                Alert.alert(
                  "Grabando ruta",
                  "Se añaden puntos con tu GPS. Puedes pausar o parar cuando quieras."
                );
              }}
              accessibilityRole="button"
              accessibilityLabel="Grabar ruta GPS"
            >
              <Text style={styles.layerChipText}>● Grabar ruta</Text>
            </TouchableOpacity>
          )}
        </GlassCard>
      ) : grabandoId ? (
        <View style={[styles.rutaBtns, { paddingHorizontal: 12, paddingBottom: 6 }]}>
          <TouchableOpacity
            style={[styles.layerChip, styles.layerChipActive]}
            onPress={async () => {
              await setPausaTrack(grabandoId, !rutaPausada);
              setTracks(await obtenerTracks());
            }}
            accessibilityRole="button"
            accessibilityLabel={rutaPausada ? "Reanudar ruta GPS" : "Pausar ruta GPS"}
          >
            <Text style={[styles.layerChipText, styles.layerChipTextActive]}>
              {rutaPausada ? "▶ Reanudar" : "❚❚ Pausar"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.layerChip, styles.layerChipActive]}
            onPress={async () => {
              await finalizarTrack(grabandoId);
              setGrabandoId(null);
              setTracks(await obtenerTracks());
              Alert.alert("Ruta", "Track guardado. Puedes exportarlo en Capturas → GPX.");
            }}
            accessibilityRole="button"
            accessibilityLabel="Finalizar ruta GPS"
          >
            <Text style={[styles.layerChipText, styles.layerChipTextActive]}>■ Parar</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      </>
      ) : null}

      {mapaSimple ? (
        <Text style={styles.hintSimple}>
          Toca para consultar · mantén pulsado para guardar. «Capas avanzadas» añade normativa, satélite y radar.
        </Text>
      ) : null}
      {midiendo ? (
        <View style={styles.hintMedirRow}>
          <Text style={styles.hintMedir}>
            Medir: toca varios puntos
            {medidaPts.length
              ? ` · ${medidaPts.length} pts`
              : ""}
            {distanciaMedidaM != null
              ? ` · ${distanciaMedidaM < 1000 ? `${distanciaMedidaM} m` : `${(distanciaMedidaM / 1000).toFixed(2)} km`}`
              : ""}
          </Text>
          {medidaPts.length > 0 ? (
            <TouchableOpacity
              onPress={() => setMedidaPts([])}
              accessibilityRole="button"
              accessibilityLabel="Reiniciar medición"
              style={styles.hintMedirReset}
            >
              <Text style={styles.hintMedirResetTxt}>Reiniciar</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
      {ftueLongpress && !midiendo ? (
        <TouchableOpacity
          style={styles.ftueLongpress}
          onPress={() => {
            setFtueLongpress(false);
            void marcarFtueLongpressMapaVista();
          }}
          accessibilityRole="button"
          accessibilityLabel="Mantén pulsado para guardar. Cerrar aviso"
        >
          <Text style={styles.ftueLongpressTxt}>
            Mantén pulsado el mapa para guardar un punto · toca para cerrar
          </Text>
        </TouchableOpacity>
      ) : null}

      <View style={[styles.mapWrap, { height: altoMapa }]}>
        <MapView
          key={provincia.id}
          style={styles.map}
          initialRegion={provincia.regionMapa}
          cameraTarget={camara}
          accent={mar ? "mar" : "bosque"}
          mapType={basemapHibrido ? "hybrid" : basemapSatelite ? "satellite" : "standard"}
          pescaWms={
            provincia.id === "sevilla" || provincia.id === "cordoba"
              ? "rediam"
              : provincia.id === "cuenca"
                ? "none"
                : "icv"
          }
          showRadar={capas.radar}
          radarUrl={radarUrl}
          showBathymetry={mar && capas.batimetria}
          onPress={(e) =>
            alPulsarMapa(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude)
          }
          onLongPress={(e) =>
            alLongPressMapa(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude)
          }
        >
          {provincia.tieneIcv ? (
            <CapaPoligonosIcv
              zpl={modo === "continental" && capas.zpl}
              zpc={modo === "continental" && capas.zpc}
              reservas={modo === "continental" && capas.vedado}
            />
          ) : null}
          {mar && capas.zpc ? <CapaPuertos /> : null}
          {mar && capas.vedado ? <CapaVedadosCosta /> : null}
          {modoBarco ? <CapaVedadosMarinos /> : null}
          {modoBarco &&
            todasLasRampas().map((r) => (
              <Marker
                key={r.id}
                coordinate={{ latitude: r.lat, longitude: r.lng }}
                pinColor={PIN.yo}
                title={r.nombre}
                description={r.nota}
                onPress={() => evaluarPunto(r.lat, r.lng)}
              />
            ))}
          {modoBarco &&
            waypoints.map((w) => (
              <Marker
                key={w.id}
                coordinate={{ latitude: w.lat, longitude: w.lng }}
                pinColor={PIN.spot}
                title={w.nombre}
                description={w.nota}
                onPress={() => evaluarPunto(w.lat, w.lng)}
              />
            ))}
          {modoBarco &&
            capas.vedado &&
            todosLosVedadosMarinos().map((p) => {
              const c = centroZona(p.anillo);
              return (
                <Marker
                  key={`vm-${p.id}`}
                  coordinate={{ latitude: c.lat, longitude: c.lng }}
                  pinColor={PIN.vedado}
                  identifier="vedado"
                  title={p.nombre}
                  onPress={() => evaluarPunto(c.lat, c.lng)}
                />
              );
            })}
          {mar &&
            capas.zpl &&
            !modoBarco &&
            playas.map((p) => {
              const { color, identifier } = aspectoMapaPlaya(p);
              return (
              <Marker
                key={p.id}
                coordinate={{ latitude: p.lat, longitude: p.lng }}
                pinColor={color}
                identifier={identifier}
                title={p.nombre}
                onPress={() => evaluarPlaya(p.id)}
              />
              );
            })}
          {mar &&
            capas.zpc &&
            todosLosPuertos().map((p) => {
              const c = centroZona(p.anillo);
              const { color, identifier } = aspectoMapaZonaCostaProhibida(p);
              return (
                <Marker
                  key={p.id}
                  coordinate={{ latitude: c.lat, longitude: c.lng }}
                  pinColor={color}
                  identifier={identifier}
                  title={p.nombre}
                  onPress={() => evaluarPunto(c.lat, c.lng)}
                />
              );
            })}
          {mar &&
            capas.vedado &&
            todosLosVedadosCosta().map((p) => {
              const c = centroZona(p.anillo);
              const { color, identifier } = aspectoMapaZonaCostaProhibida(p);
              return (
                <Marker
                  key={p.id}
                  coordinate={{ latitude: c.lat, longitude: c.lng }}
                  pinColor={color}
                  identifier={identifier}
                  title={p.nombre}
                  onPress={() => evaluarPunto(c.lat, c.lng)}
                />
              );
            })}
          {modo === "continental" &&
            tramosVisibles.filter(tramoUsaRadioAnexo).map((z) => {
            const { color } = aspectoMapaTramo(z);
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
          {modo === "continental" &&
          tramosVisibles.map((z) => {
            const { color, identifier } = aspectoMapaTramo(z);
            return (
            <Marker
              key={z.id}
              coordinate={{ latitude: z.lat, longitude: z.lng }}
              pinColor={color}
              identifier={identifier}
              title={`${z.aprovechamiento} · ${z.nombre}`}
              onPress={() => evaluarTramo(z)}
            />
            );
          })}
          {sitiosPersonales
            .filter((s) => (s.tipo === "captura" ? capas.capturas : capas.misPuntos))
            .map((s) => {
              const colorHex =
                s.tipo === "captura"
                  ? s.color
                    ? hexColorPunto(s.color)
                    : PIN.captura
                  : hexColorPunto(s.color);
              const glyph = glyphIconoPunto(s.icono);
              return (
                <Marker
                  key={s.id}
                  coordinate={{ latitude: s.lat, longitude: s.lng }}
                  pinColor={colorHex}
                  identifier={
                    s.tipo === "captura" ? "captura" : `personal:${glyph}`
                  }
                  title={s.titulo}
                  onPress={() => {
                    if (s.tipo === "punto") {
                      abrirEditarSitio(s);
                      return;
                    }
                    evaluarPunto(s.lat, s.lng);
                    void fijarPunto({ lat: s.lat, lng: s.lng, fuente: "mapa", etiqueta: s.titulo });
                  }}
                >
                  {Platform.OS !== "web" ? (
                    <PinPuntoPersonal
                      color={s.color}
                      icono={s.icono}
                      captura={s.tipo === "captura"}
                    />
                  ) : null}
                </Marker>
              );
            })}
          {capas.tracks &&
            tracks.map((t) => (
              <Polyline
                key={t.id}
                coordinates={t.puntos.map((pt) => ({ latitude: pt.lat, longitude: pt.lng }))}
                strokeColor={t.id === grabandoId ? COLORS.danger : COLORS.water}
                strokeWidth={t.id === grabandoId ? 5 : 3}
              />
            ))}
          {medidaPts.length >= 2 ? (
            <Polyline
              coordinates={medidaPts}
              strokeColor={COLORS.primaryDark}
              strokeWidth={3}
            />
          ) : null}
          {medidaPts.map((p, i) => (
            <Marker
              key={`medida-${i}`}
              coordinate={p}
              pinColor={COLORS.primary}
              identifier="seleccion"
              title={
                i === 0
                  ? "Origen"
                  : i === medidaPts.length - 1
                    ? "Fin"
                    : `Punto ${i + 1}`
              }
            />
          ))}
          {ancla ? (
            <Circle
              center={{ latitude: ancla.latitude, longitude: ancla.longitude }}
              radius={ancla.radioM}
              strokeColor={COLORS.water}
              fillColor={COLORS.water + "22"}
            />
          ) : null}
          {yo && (
            <Marker coordinate={yo} pinColor={PIN.yo} identifier="user" title="Tú" />
          )}
          {marcador && (!yo || marcador.latitude !== yo.latitude) && (
            <Marker coordinate={marcador} pinColor={PIN.seleccion} identifier="seleccion" title="Punto consultado" />
          )}
        </MapView>
        <MapaFabHerramientas
          onAccion={onAccionFab}
          midiendo={midiendo}
          grabando={!!grabandoId}
          mostrarAncla={modoBarco}
          mostrarRuta
        />
        {capas.radar && radarFrames.length > 1 ? (
          <View style={styles.radarScrub} pointerEvents="box-none">
            <TouchableOpacity
              style={styles.radarScrubBtn}
              onPress={() => setRadarIdx((i) => Math.max(0, i - 1))}
              disabled={radarIdx <= 0}
              accessibilityRole="button"
              accessibilityLabel="Frame de radar anterior"
            >
              <Text style={styles.radarScrubBtnTxt}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.radarScrubMeta} numberOfLines={1}>
              {radarIdx + 1}/{radarFrames.length}
              {radarHoraCorta ? ` · ${radarHoraCorta}` : ""}
            </Text>
            <TouchableOpacity
              style={styles.radarScrubBtn}
              onPress={() => setRadarIdx((i) => Math.min(radarFrames.length - 1, i + 1))}
              disabled={radarIdx >= radarFrames.length - 1}
              accessibilityRole="button"
              accessibilityLabel="Frame de radar siguiente"
            >
              <Text style={styles.radarScrubBtnTxt}>›</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        {capas.radar ? (
          <View style={styles.radarPlacaWrap} pointerEvents="none">
            <View
              style={styles.radarPlaca}
              accessibilityLiveRegion="polite"
              accessibilityLabel={
                radarCuando
                  ? `Radar lluvia. ${radarCuando}`
                  : "Radar lluvia activo, cargando hora"
              }
            >
              {radarHoraCorta ? (
                <Text style={styles.radarPlacaTxt} numberOfLines={1}>
                  <Text style={styles.radarPlacaHora}>{radarHoraCorta}</Text>
                  {"  "}
                  {radarTipo}
                  {radarFechaPlaca ? ` · ${radarFechaPlaca}` : ""}
                </Text>
              ) : (
                <Text style={styles.radarPlacaTxt}>Radar · cargando hora…</Text>
              )}
            </View>
          </View>
        ) : null}
        <BotonMiPosicion onPress={irAMiPosicion} cargando={localizando} />
      </View>

      <View style={[styles.pieMapa, mar && styles.pieMapaMar]}>
        <LeyendaMapa modo={mar ? "costa" : "continental"} />
        {capas.radar ? (
          <View style={styles.radarBanner} accessibilityLiveRegion="polite">
            <Text style={styles.radarBannerTitle} numberOfLines={1}>
              {radarHoraCorta
                ? `${radarTipo ?? "Radar"} · ${radarHoraCorta}${radarFechaPlaca ? ` · ${radarFechaPlaca}` : ""}`
                : "Radar lluvia (cargando…)"}
              {" · RainViewer"}
            </Text>
          </View>
        ) : null}
        <Text style={styles.hint}>
          {modoAnadir
            ? pickConfirmar
              ? "Pulsa el mapa · confirma con «Usar esta ubicación»."
              : "Pulsa el mapa · en la ficha elige «Guardar este punto»."
            : mar
              ? "Toca = consultar · mantén = guardar. Verde = hoy sí en orilla. Rojo = hoy no (veda o puerto)."
              : "Toca = consultar · mantén = guardar. Verde = hoy sí. Ámbar = coto. Rojo = hoy no."}
        </Text>
        {pickConfirmar && marcador ? (
          <TouchableOpacity
            style={styles.saveSpotButton}
            onPress={confirmarPickSiProcede}
            accessibilityRole="button"
            accessibilityLabel="Usar esta ubicación"
          >
            <Text style={styles.saveSpotButtonText}>Usar esta ubicación</Text>
          </TouchableOpacity>
        ) : null}
        {consulta && !fichaAbierta && !(pickConfirmar && marcador) ? (
          <TouchableOpacity style={[styles.reabrir, mar && styles.reabrirMar]} onPress={() => setFichaAbierta(true)}>
            <Text style={[styles.reabrirTxt, mar && { color: COLORS.waterDark }]}>Ver última consulta</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {!modoAnadir ? (
        <PanelExplorarSitios navigation={navigation} forzarAbrir={abrirExplorar} />
      ) : null}
      </ScrollView>

      <VentanaConsulta
        visible={fichaAbierta && !!consulta}
        titulo={consulta?.titulo ?? "Consulta de pesca"}
        onCerrar={() => setFichaAbierta(false)}
        acento={consulta?.ambito === "maritimo" ? "mar" : "bosque"}
      >
        {consulta ? (
          <>
            {pickConfirmar && marcador ? (
              <TouchableOpacity
                style={[styles.saveSpotButton, { marginTop: 0, marginBottom: 12 }]}
                onPress={confirmarPickSiProcede}
                accessibilityRole="button"
                accessibilityLabel="Usar esta ubicación"
              >
                <Text style={styles.saveSpotButtonText}>Usar esta ubicación</Text>
              </TouchableOpacity>
            ) : null}
            <ConsultaPescaCard
              consulta={consulta}
              onFicha={
                consulta.tramo?.fichaId
                  ? () => {
                      setFichaAbierta(false);
                      navigation.navigate("ZoneDetail", { zoneId: consulta.tramo!.fichaId });
                    }
                  : undefined
              }
              onEspecies={() => {
                setFichaAbierta(false);
                irAEspeciesDelPunto(navigation);
              }}
              onAparejos={(id) => {
                setFichaAbierta(false);
                navigation.navigate("Aparejos", { especieId: id });
              }}
              onMontaje={(id) => {
                setFichaAbierta(false);
                const consejoId = consejoIdMontajeEspecie(id, { provinciaId: getProvinciaActiva()?.id, soloContinental: !!getProvinciaActiva()?.continentalOnly });
                if (!consejoId) return;
                navigation.navigate("Consejos", { consejoId, categoria: "montajes" });
              }}
            />
            {marcador ? (
              <CercaMejorPintaBlock
                lat={marcador.latitude}
                lng={marcador.longitude}
                modo={modoGlobal}
                onAbrir={(fila) => evaluarPunto(fila.lat, fila.lng)}
              />
            ) : null}
            {infoNavegacion ? (
              <View style={styles.navInfoBox}>
                <Text style={styles.navInfoTitulo}>{modoBarco ? "Navegación ligera" : "Info"}</Text>
                <Text style={styles.navInfoTxt}>{infoNavegacion}</Text>
              </View>
            ) : null}
            {(consulta.tramo || consulta.ambito === "maritimo" || marcador) && (
              <>
                {pickConfirmar ? (
                  <TouchableOpacity style={styles.saveSpotButton} onPress={confirmarPickSiProcede}>
                    <Text style={styles.saveSpotButtonText}>Usar esta ubicación</Text>
                  </TouchableOpacity>
                ) : null}
                {!pickSalgo ? (
                  <TouchableOpacity style={styles.saveSpotButton} onPress={guardarMarcadorComoPunto}>
                    <Text style={styles.saveSpotButtonText}>
                      {motivoPick === "punto" ? "Guardar este punto y volver" : "Guardar este punto"}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </>
            )}
          </>
        ) : null}
      </VentanaConsulta>

      <GuardarPuntoSheet
        visible={sheetGuardar}
        borrador={borradorGuardar}
        onCerrar={() => {
          setSheetGuardar(false);
          setBorradorGuardar(null);
        }}
        onGuardar={confirmarGuardarDesdeSheet}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  containerMar: { backgroundColor: COLORS.waterLight },
  scrollMapa: { flex: 1 },
  scrollMapaContent: { flexGrow: 1, paddingBottom: 8 },
  searchBox: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: "transparent",
    marginHorizontal: 8,
    marginTop: 4,
  },
  modoBarInSearch: {
    marginTop: 6,
    paddingTop: 4,
  },
  mapaModoRowInSearch: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  searchBoxMar: { backgroundColor: "transparent" },
  searchInput: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  /** Costa/barco: superficie clara con texto oscuro (el fondo del mapa es waterLight). */
  searchInputMar: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.water,
    color: COLORS.waterDark,
  },
  sitiosChip: {
    alignSelf: "flex-start",
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.mist,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sitiosChipOn: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  sitiosChipTxt: { fontSize: 12.5, fontWeight: "700", color: COLORS.textSecondary },
  sitiosChipTxtOn: { color: COLORS.primaryDark },
  suggestionsBox: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    marginTop: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW,
  },
  suggestionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  suggestionText: { fontSize: 13, color: COLORS.textPrimary, fontWeight: "600" },
  suggestionSub: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  suggestionMeta: { fontSize: 10, color: COLORS.textMuted, fontWeight: "700", textTransform: "uppercase" },
  cuencaRow: { paddingTop: 8, paddingBottom: 2, gap: 6 },
  cuencaChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 6,
  },
  cuencaChipOn: { backgroundColor: COLORS.primaryDark, borderColor: COLORS.primaryDark },
  cuencaTxt: { fontSize: 11.5, fontWeight: "700", color: COLORS.textPrimary },
  cuencaTxtOn: { color: "#fff" },
  modoBar: {
    paddingHorizontal: 12,
    paddingBottom: 6,
    paddingTop: 4,
    backgroundColor: "transparent",
    marginHorizontal: 8,
    marginTop: 4,
  },
  modoBarMar: { backgroundColor: "transparent" },
  modoBarKayak: {
    backgroundColor: "rgba(180, 230, 200, 0.22)",
    borderColor: "rgba(46, 125, 90, 0.35)",
  },
  mapaModoRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 8,
    paddingTop: 4,
    backgroundColor: "transparent",
    marginHorizontal: 8,
    marginTop: 4,
  },
  mapaModoBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },
  mapaModoBtnOn: { backgroundColor: COLORS.primaryDark, borderColor: COLORS.primaryDark },
  mapaModoTxt: { ...TYPE.mapChip, fontSize: 13, color: COLORS.textPrimary, fontWeight: "700" },
  mapaModoTxtOn: { color: "#fff" },
  hintSimple: {
    ...TYPE.caption,
    color: COLORS.textSecondary,
    textAlign: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: COLORS.surface,
  },
  modoBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },
  modoBtnOnBosque: { backgroundColor: COLORS.primaryDark, borderColor: COLORS.primaryDark },
  modoBtnOnMar: { backgroundColor: COLORS.waterDark, borderColor: COLORS.waterDark },
  modoTxt: { ...TYPE.mapChip, fontSize: 14, color: COLORS.textPrimary },
  modoTxtOn: { color: "#fff" },
  mapWrap: { position: "relative", minHeight: 380, backgroundColor: COLORS.mist },
  radarScrub: {
    position: "absolute",
    top: 44,
    left: 12,
    right: 12,
    zIndex: 21,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  radarScrubBtn: {
    width: 36,
    height: 32,
    borderRadius: RADIUS.pill,
    backgroundColor: "rgba(15, 40, 48, 0.82)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },
  radarScrubBtnTxt: { color: "#fff", fontSize: 22, fontWeight: "800", marginTop: -2 },
  radarScrubMeta: {
    minWidth: 110,
    textAlign: "center",
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
    backgroundColor: "rgba(15, 40, 48, 0.72)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    overflow: "hidden",
  },
  radarPlacaWrap: {
    position: "absolute",
    top: 10,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 20,
  },
  radarPlaca: {
    maxWidth: 340,
    backgroundColor: "rgba(15, 40, 48, 0.82)",
    borderRadius: RADIUS.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    ...SHADOW,
  },
  radarPlacaTxt: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 12,
    fontWeight: "700",
  },
  radarPlacaHora: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  radarBanner: {
    marginTop: 6,
    marginBottom: 2,
    backgroundColor: COLORS.waterDark,
    borderRadius: RADIUS.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: "center",
  },
  radarBannerTitle: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
  layerBar: {
    maxHeight: 52,
    backgroundColor: "transparent",
    marginHorizontal: 8,
    marginTop: 4,
  },
  layerChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.background,
    marginRight: 8,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  layerChipActive: { backgroundColor: COLORS.mist, borderColor: COLORS.primary },
  layerChipMar: { backgroundColor: COLORS.waterLight, borderColor: COLORS.water },
  layerChipText: { ...TYPE.mapChip, color: COLORS.textSecondary },
  layerChipTextActive: { color: COLORS.primaryDark, fontWeight: "800" },
  rutaBtns: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 4 },
  capasExtraPanel: {
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 8,
    backgroundColor: "transparent",
    marginHorizontal: 8,
    marginTop: 4,
  },
  capasExtraCabecera: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  capasExtraTitulo: { ...TYPE.overline, color: COLORS.textPrimary },
  cerrarCapasBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cerrarCapasTxt: { fontSize: 12, fontWeight: "800", color: COLORS.primaryDark },
  map: { flex: 1 },
  pieMapa: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 88,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  pieMapaMar: { backgroundColor: COLORS.waterLight, borderTopColor: "#b7d4de" },
  hint: { ...TYPE.caption, color: COLORS.textSecondary, textAlign: "center" },
  reabrir: {
    marginTop: 8,
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.md,
  },
  reabrirMar: { backgroundColor: COLORS.waterLight },
  reabrirTxt: { color: COLORS.primaryDark, fontWeight: "700", fontSize: 14 },
  navInfoBox: {
    marginTop: 10,
    padding: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.waterLight,
    borderWidth: 1,
    borderColor: COLORS.water,
  },
  navInfoTitulo: { fontFamily: FONTS.semibold, fontSize: 13, color: COLORS.waterDark, marginBottom: 4 },
  navInfoTxt: { fontFamily: FONTS.regular, fontSize: 12.5, color: COLORS.textPrimary, lineHeight: 18 },
  saveSpotButton: {
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.md,
    marginTop: 10,
  },
  saveSpotButtonText: { color: COLORS.primaryDark, fontWeight: "700", fontSize: 13 },
  bannerAnadir: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bannerAnadirTitulo: { color: "#fff", fontWeight: "700", fontSize: 13 },
  bannerAnadirTxt: { color: "#d7e8df", fontSize: 11.5, marginTop: 2, lineHeight: 15 },
  bannerAnadirCancel: { color: "#fff", fontWeight: "700", fontSize: 12 },
  hintMedirRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  hintMedir: {
    ...TYPE.caption,
    flexShrink: 1,
    textAlign: "center",
    color: COLORS.primaryDark,
    fontFamily: FONTS.bold,
    fontWeight: "700",
  },
  hintMedirReset: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primaryDark,
  },
  hintMedirResetTxt: { color: "#fff", fontSize: 11, fontWeight: "800" },
  ftueLongpress: {
    backgroundColor: COLORS.primaryDark,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  ftueLongpressTxt: {
    color: "#fff",
    textAlign: "center",
    fontFamily: FONTS.bold,
    fontWeight: "700",
    fontSize: 12.5,
  },
  normativaDetalle: { marginTop: 8, marginBottom: 4 },
});
