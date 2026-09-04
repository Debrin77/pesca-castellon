import React, { useMemo, useState, useCallback, useEffect, useLayoutEffect } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import MapView, { Marker, Circle, Polyline } from "../components/map";
import {
  consultarPuntoPesca,
  consultarPorTramo,
  colorAprovechamiento,
  todosLosTramos,
  ConsultaPesca,
  TramoOficial,
  tramoUsaRadioAnexo,
} from "../services/consultaPescaService";
import { obtenerPuntosGuardados, guardarPunto, PuntoGuardado } from "../services/storageService";
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
import VentanaConsulta from "../components/VentanaConsulta";
import BotonMiPosicion from "../components/BotonMiPosicion";
import CapaPoligonosIcv from "../components/CapaPoligonosIcv";
import CapaPuertos from "../components/CapaPuertos";
import CapaVedadosCosta from "../components/CapaVedadosCosta";
import ListaAnimada from "../components/ListaAnimada";
import LeyendaMapa from "../components/LeyendaMapa";
import SelectorModalidad from "../components/SelectorModalidad";
import { consultarCosta, consultarToqueMapa, centroZona, todosLosPuertos, todosLosVedadosCosta, todasLasPlayas } from "../services/consultaCostaService";
import { buscarZonas, cuencasProvincia, SugerenciaBusqueda } from "../services/busquedaService";
import { puntoEnRegionMapa } from "../services/geoService";
import { obtenerRadar } from "../services/radarService";
import {
  anadirPuntoTrack,
  finalizarTrack,
  iniciarTrack,
  obtenerTracks,
  trackActivo,
  TrackPesca,
} from "../services/trackService";
import type { ModalidadPesca } from "../data/modalidades";
import { useProvincia } from "../context/ProvinciaContext";
import { usePuntoConsulta } from "../context/PuntoConsultaContext";
import { getProvinciaActiva } from "../provincias/runtime";
import { COLORS, PIN, RADIUS, SHADOW } from "../theme";

type LatLng = { latitude: number; longitude: number };

interface Props {
  navigation: any;
}

type ParamsMapa = {
  modoAnadirPunto?: boolean;
  motivoPick?: MotivoUbicacionPendiente;
  centrarEn?: { lat: number; lng: number; nombre?: string };
  activarRadar?: boolean;
};

export default function ZonasLibresScreen({ navigation }: Props) {
  const route = useRoute<any>();
  const { provincia: provinciaCtx, provinciaId } = useProvincia();
  const { fijarPunto } = usePuntoConsulta();
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
  const [capas, setCapas] = useState({
    zpl: true,
    zpc: true,
    vedado: true,
    misPuntos: true,
    radar: false,
    batimetria: false,
    tracks: false,
  });
  const [localizando, setLocalizando] = useState(false);
  const [modo, setModo] = useState<"continental" | "costa">("continental");
  const [camara, setCamara] = useState<{ latitude: number; longitude: number; zoom: number; nonce: number } | undefined>();
  const [fichaAbierta, setFichaAbierta] = useState(false);
  const [cuencaFiltro, setCuencaFiltro] = useState<string | null>(null);
  const [radarUrl, setRadarUrl] = useState<string | null>(null);
  const [modalidad, setModalidad] = useState<ModalidadPesca>("orilla_continental");
  const [tracks, setTracks] = useState<TrackPesca[]>([]);
  const [grabandoId, setGrabandoId] = useState<string | null>(null);
  const [modoAnadir, setModoAnadir] = useState(false);
  const [motivoPick, setMotivoPick] = useState<MotivoUbicacionPendiente | null>(null);
  const [capasExtra, setCapasExtra] = useState(false);
  const mar = !soloContinental && modo === "costa";

  useLayoutEffect(() => {
    navigation.setOptions({
      title: mar ? `Mapa · Costa · ${provincia.nombre}` : `Mapa · ${provincia.nombre}`,
      headerStyle: { backgroundColor: mar ? COLORS.waterDark : COLORS.primaryDark },
    });
  }, [mar, navigation, provincia.nombre]);

  useEffect(() => {
    setModo("continental");
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
      obtenerTracks().then((t) => {
        setTracks(t);
        setGrabandoId(trackActivo(t)?.id ?? null);
      });

      const p = (route.params ?? {}) as ParamsMapa;
      const pickActivo = hayPickUbicacion() || !!p.modoAnadirPunto;
      const motivo = p.motivoPick ?? motivoPickActivo();
      setModoAnadir(pickActivo);
      setMotivoPick(motivo);

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
        navigation.setParams?.({ modoAnadirPunto: undefined, motivoPick: undefined });
      }
    }, [route.params, navigation, fijarPunto])
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
    if (!capas.radar) return;
    let cancel = false;
    void obtenerRadar().then((r) => {
      if (!cancel) setRadarUrl(r.urlPlantilla);
    });
    return () => {
      cancel = true;
    };
  }, [capas.radar]);

  useEffect(() => {
    setModalidad(mar ? "orilla_mar" : "orilla_continental");
  }, [mar]);

  useEffect(() => {
    if (!grabandoId || !yo) return;
    void anadirPuntoTrack(grabandoId, yo.latitude, yo.longitude).then(() => {
      void obtenerTracks().then(setTracks);
    });
  }, [yo?.latitude, yo?.longitude, grabandoId]);

  useEffect(() => {
    let cancelar: (() => void) | undefined;
    (async () => {
      const ok = await solicitarPermisoUbicacion();
      if (!ok) return;
      const loc = await obtenerUbicacionActual();
      if (loc) {
        const pos = { latitude: loc.lat, longitude: loc.lng };
        setYo(pos);
        if (puntoEnRegionMapa(loc.lat, loc.lng, provincia.regionMapa)) {
          const c = consultarToqueMapa(loc.lat, loc.lng);
          setConsulta(c);
          if (!soloContinental && c.ambito === "maritimo") setModo("costa");
          setMarcador(pos);
        }
      }
      cancelar = await suscribirseUbicacion((lat, lng) => {
        setYo({ latitude: lat, longitude: lng });
      });
    })();
    return () => cancelar?.();
  }, [soloContinental, provincia.regionMapa]);

  function toggleCapa(capa: keyof typeof capas) {
    setCapas((prev) => ({ ...prev, [capa]: !prev[capa] }));
  }

  const tramosVisibles = useMemo(() => {
    return tramos.filter((t) => {
      if (t.aprovechamiento === "ZPL") return capas.zpl;
      if (t.aprovechamiento === "ZPC") return capas.zpc;
      return capas.vedado;
    });
  }, [tramos, capas]);

  const sugerencias = useMemo(() => {
    if (!busqueda.trim() && !cuencaFiltro) return [];
    return buscarZonas(busqueda, {
      modo,
      cuenca: modo === "continental" ? cuencaFiltro : null,
      limite: 10,
    });
  }, [busqueda, modo, cuencaFiltro]);

  function aplicarSugerencia(s: SugerenciaBusqueda) {
    setBusqueda(s.titulo);
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
    const r = consultarToqueMapa(lat, lng);
    if (!soloContinental && r.ambito === "maritimo") {
      setModo("costa");
      setCamara({ latitude: lat, longitude: lng, zoom: 14, nonce: Date.now() });
    } else {
      setModo("continental");
    }
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
      const costa = provincia.regionCosta ?? {
        latitude: provincia.regionMapa.latitude,
        longitude: provincia.regionMapa.longitude,
        zoom: 10,
      };
      setCamara({ latitude: costa.latitude, longitude: costa.longitude, zoom: costa.zoom, nonce: Date.now() });
      if (marcador) setConsulta(consultarCosta(marcador.latitude, marcador.longitude));
    } else if (marcador) {
      setConsulta(consultarPuntoPesca(marcador.latitude, marcador.longitude));
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

  async function guardarMarcadorComoPunto() {
    if (!marcador) {
      Alert.alert("Mapa", "Pulsa primero un sitio en el mapa.");
      return;
    }
    const lat = marcador.latitude;
    const lng = marcador.longitude;
    const nombre = consulta?.titulo?.trim() || `Punto del ${new Date().toLocaleDateString("es-ES")}`;
    await guardarPunto({
      nombre,
      lat,
      lng,
      zonaRelacionadaId: consulta?.tramo?.fichaId ?? consulta?.tramo?.id ?? null,
    });
    setPuntosPersonales(await obtenerPuntosGuardados());
    setCapas((prev) => ({ ...prev, misPuntos: true }));

    if (modoAnadir && (motivoPick === "punto" || hayPickUbicacion("punto"))) {
      resolverPickUbicacion({ lat, lng, etiqueta: nombre });
      setModoAnadir(false);
      setMotivoPick(null);
      setFichaAbierta(false);
      navigation.navigate("Capturas", { screen: "CapturasMain" });
      return;
    }

    Alert.alert("Punto guardado", `${nombre}\n${formatearCoords(lat, lng)}`);
  }

  function usarUbicacionParaCaptura() {
    if (!marcador) {
      Alert.alert("Mapa", "Pulsa primero un sitio en el mapa.");
      return;
    }
    const lat = marcador.latitude;
    const lng = marcador.longitude;
    const etiqueta = consulta?.titulo?.trim() || formatearCoords(lat, lng);
    resolverPickUbicacion({ lat, lng, etiqueta });
    setModoAnadir(false);
    setMotivoPick(null);
    setFichaAbierta(false);
    navigation.navigate("Capturas", { screen: "CapturasMain" });
  }

  function usarUbicacionParaSalgo() {
    if (!marcador) {
      Alert.alert("Mapa", "Pulsa primero un sitio o zona en el mapa.");
      return;
    }
    const lat = marcador.latitude;
    const lng = marcador.longitude;
    const etiqueta = consulta?.titulo?.trim() || formatearCoords(lat, lng);
    void fijarPunto({ lat, lng, fuente: "mapa", etiqueta });
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

      <View style={[styles.searchBox, mar && styles.searchBoxMar]}>
        <TextInput
          style={styles.searchInput}
          placeholder={
            mar
              ? "Busca playa o municipio (Benicàssim, Grao, Nules…)"
              : provincia.id === "sevilla"
                ? "Busca embalse o río (Guadalquivir, Minilla, Cala…)"
                : "Busca tramo, municipio o cuenca (Onda, Palancia, Teresa…)"
          }
          placeholderTextColor={COLORS.textMuted}
          value={busqueda}
          onChangeText={setBusqueda}
        />
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
      </View>

      {!soloContinental ? (
        <View style={[styles.modoBar, mar && styles.modoBarMar]}>
          <TouchableOpacity
            style={[styles.modoBtn, modo === "continental" && styles.modoBtnOnBosque]}
            onPress={() => cambiarModo("continental")}
            accessibilityRole="button"
            accessibilityLabel="Ríos y embalses"
          >
            <Text style={[styles.modoTxt, modo === "continental" && styles.modoTxtOn]}>Ríos y embalses</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modoBtn, modo === "costa" && styles.modoBtnOnMar]}
            onPress={() => cambiarModo("costa")}
            accessibilityRole="button"
            accessibilityLabel="Costa orilla"
          >
            <Text style={[styles.modoTxt, modo === "costa" && styles.modoTxtOn]}>Costa (orilla)</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.layerBar, mar && styles.modoBarMar]} contentContainerStyle={{ paddingHorizontal: 12, alignItems: "center" }}>
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
        <TouchableOpacity style={[styles.layerChip, capas.misPuntos && styles.layerChipActive]} onPress={() => toggleCapa("misPuntos")}>
          <Text style={[styles.layerChipText, capas.misPuntos && styles.layerChipTextActive]}>Mis puntos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.layerChip, (capasExtra || capas.radar || capas.tracks || capas.batimetria) && styles.layerChipActive]}
          onPress={() => setCapasExtra((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={capasExtra ? "Ocultar más capas" : "Más capas del mapa"}
        >
          <Text style={[styles.layerChipText, capasExtra && styles.layerChipTextActive]}>
            {capasExtra ? "Menos ▲" : "Más capas ▼"}
          </Text>
        </TouchableOpacity>
        {capasExtra || capas.radar ? (
          <TouchableOpacity style={[styles.layerChip, capas.radar && styles.layerChipActive]} onPress={() => toggleCapa("radar")}>
            <Text style={[styles.layerChipText, capas.radar && styles.layerChipTextActive]}>
              {capas.radar ? "Radar ON" : "Radar lluvia"}
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

      {capasExtra ? (
        <View style={{ paddingHorizontal: 12, paddingBottom: 6 }}>
          <SelectorModalidad
            value={modalidad}
            onChange={setModalidad}
            filtroAmbito={mar ? "maritimo" : "continental"}
          />
          <TouchableOpacity
            style={[styles.layerChip, grabandoId ? styles.layerChipActive : null, { alignSelf: "flex-start" }]}
            onPress={async () => {
              if (grabandoId) {
                await finalizarTrack(grabandoId);
                setGrabandoId(null);
                setTracks(await obtenerTracks());
                Alert.alert("Ruta", "Track guardado. Puedes exportarlo en Capturas → GPX.");
                return;
              }
              const t = await iniciarTrack(`Ruta ${new Date().toLocaleString("es-ES")}`, modalidad);
              setGrabandoId(t.id);
              setTracks(await obtenerTracks());
              Alert.alert("Grabando ruta", "Se añaden puntos con tu GPS. Pulsa de nuevo para finalizar.");
            }}
            accessibilityRole="button"
            accessibilityLabel={grabandoId ? "Finalizar ruta GPS" : "Grabar ruta GPS"}
          >
            <Text style={[styles.layerChipText, grabandoId ? styles.layerChipTextActive : null]}>
              {grabandoId ? "■ Parar ruta" : "● Grabar ruta"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : grabandoId ? (
        <View style={{ paddingHorizontal: 12, paddingBottom: 6 }}>
          <TouchableOpacity
            style={[styles.layerChip, styles.layerChipActive, { alignSelf: "flex-start" }]}
            onPress={async () => {
              await finalizarTrack(grabandoId);
              setGrabandoId(null);
              setTracks(await obtenerTracks());
              Alert.alert("Ruta", "Track guardado. Puedes exportarlo en Capturas → GPX.");
            }}
          >
            <Text style={[styles.layerChipText, styles.layerChipTextActive]}>■ Parar ruta</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.mapWrap}>
        <MapView
          key={provincia.id}
          style={styles.map}
          initialRegion={provincia.regionMapa}
          cameraTarget={camara}
          accent={mar ? "mar" : "bosque"}
          pescaWms={provincia.id === "sevilla" ? "rediam" : "icv"}
          showRadar={capas.radar}
          radarUrl={radarUrl}
          showBathymetry={mar && capas.batimetria}
          onPress={(e) => evaluarPunto(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude)}
          onLongPress={(e) => evaluarPunto(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude)}
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
          {mar &&
            capas.zpl &&
            playas.map((p) => (
              <Marker
                key={p.id}
                coordinate={{ latitude: p.lat, longitude: p.lng }}
                pinColor={PIN.playa}
                identifier="playa"
                title={p.nombre}
                onPress={() => evaluarPlaya(p.id)}
              />
            ))}
          {mar &&
            capas.zpc &&
            todosLosPuertos().map((p) => {
              const c = centroZona(p.anillo);
              return (
                <Marker
                  key={p.id}
                  coordinate={{ latitude: c.lat, longitude: c.lng }}
                  pinColor={PIN.puerto}
                  identifier="puerto"
                  title={p.nombre}
                  onPress={() => evaluarPunto(c.lat, c.lng)}
                />
              );
            })}
          {mar &&
            capas.vedado &&
            todosLosVedadosCosta().map((p) => {
              const c = centroZona(p.anillo);
              return (
                <Marker
                  key={p.id}
                  coordinate={{ latitude: c.lat, longitude: c.lng }}
                  pinColor={PIN.vedado}
                  identifier="vedado"
                  title={p.nombre}
                  onPress={() => evaluarPunto(c.lat, c.lng)}
                />
              );
            })}
          {modo === "continental" &&
            tramosVisibles.filter(tramoUsaRadioAnexo).map((z) => {
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
          {modo === "continental" &&
          tramosVisibles.map((z) => (
            <Marker
              key={z.id}
              coordinate={{ latitude: z.lat, longitude: z.lng }}
              pinColor={colorAprovechamiento(z.aprovechamiento)}
              identifier={z.aprovechamiento === "ZPC" ? "coto" : z.aprovechamiento === "ZPL" ? "libre" : "vedado"}
              title={`${z.aprovechamiento} · ${z.nombre}`}
              onPress={() => evaluarTramo(z)}
            />
          ))}
          {capas.misPuntos &&
            puntosPersonales.map((p) => (
              <Marker
                key={p.id}
                coordinate={{ latitude: p.lat, longitude: p.lng }}
                pinColor={PIN.spot}
                identifier="spot"
                title={p.nombre}
                onPress={() => evaluarPunto(p.lat, p.lng)}
              />
            ))}
          {capas.tracks &&
            tracks.map((t) => (
              <Polyline
                key={t.id}
                coordinates={t.puntos.map((pt) => ({ latitude: pt.lat, longitude: pt.lng }))}
                strokeColor={t.id === grabandoId ? COLORS.danger : COLORS.water}
                strokeWidth={t.id === grabandoId ? 5 : 3}
              />
            ))}
          {yo && (
            <Marker coordinate={yo} pinColor={PIN.yo} identifier="user" title="Tú" />
          )}
          {marcador && (!yo || marcador.latitude !== yo.latitude) && (
            <Marker coordinate={marcador} pinColor={PIN.yo} identifier="user" title="Punto consultado" />
          )}
        </MapView>
        <BotonMiPosicion onPress={irAMiPosicion} cargando={localizando} />
      </View>

      <View style={[styles.pieMapa, mar && styles.pieMapaMar]}>
        <LeyendaMapa modo={mar ? "costa" : "continental"} />
        {capas.radar ? (
          <Text style={styles.hint}>
            Radar lluvia activo{radarUrl ? "" : " (cargando…)"} · RainViewer · no es aviso AEMET.
          </Text>
        ) : null}
        <Text style={styles.hint}>
          {modoAnadir
            ? pickConfirmar
              ? "Pulsa el mapa · confirma con «Usar esta ubicación»."
              : "Pulsa el mapa · en la ficha elige «Guardar este punto»."
            : mar
              ? "Pin de agua = playa. Rojo = vedado. Gris = puerto. La ficha se abre a pantalla completa."
              : "Verde = libre. Ámbar = coto. Rojo = vedado. Pulsa el mapa para consultar o guardar un punto."}
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
              onAparejos={(id) => {
                setFichaAbierta(false);
                navigation.navigate("Aparejos", { especieId: id });
              }}
            />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  containerMar: { backgroundColor: COLORS.waterLight },
  searchBox: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8, backgroundColor: COLORS.surface, zIndex: 10 },
  searchBoxMar: { backgroundColor: COLORS.waterLight },
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
  modoBar: { flexDirection: "row", gap: 8, paddingHorizontal: 12, paddingBottom: 6, backgroundColor: COLORS.surface },
  modoBarMar: { backgroundColor: COLORS.waterLight },
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
  modoTxt: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary },
  modoTxtOn: { color: "#fff" },
  mapWrap: { flex: 1, position: "relative", minHeight: 220 },
  layerBar: { maxHeight: 44, backgroundColor: COLORS.surface },
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
  layerChipText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: "700" },
  layerChipTextActive: { color: COLORS.primaryDark, fontWeight: "800" },
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
  hint: { fontSize: 13, color: COLORS.textPrimary, lineHeight: 19, textAlign: "center", fontWeight: "600" },
  reabrir: {
    marginTop: 8,
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.md,
  },
  reabrirMar: { backgroundColor: COLORS.waterLight },
  reabrirTxt: { color: COLORS.primaryDark, fontWeight: "700", fontSize: 14 },
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
});
