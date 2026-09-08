import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { Marker, Circle } from "../components/map";
import orilla from "../data/especiesOrilla.json";
import { consultarPorTramo, ConsultaPesca, colorAprovechamiento, tramoUsaRadioAnexo, TramoOficial } from "../services/consultaPescaService";
import { consultarToqueMapa, avisoSitiosCosta, todasLasPlayas, todosLosPuertos, todosLosVedadosCosta, centroZona } from "../services/consultaCostaService";
import { obtenerUbicacionActual, solicitarPermisoUbicacion } from "../services/locationService";
import { estaEnVeda } from "../services/vedaService";
import { puntoEnRegionMapa } from "../services/geoService";
import { especiesOrillaParaSeleccion } from "../services/catalogoEspeciesService";
import { useProvincia } from "../context/ProvinciaContext";
import { usePuntoConsulta } from "../context/PuntoConsultaContext";
import { getProvinciaActiva } from "../provincias/runtime";
import { COLORS, PIN, RADIUS } from "../theme";
import BotonMiPosicion from "../components/BotonMiPosicion";
import CapaPoligonosIcv from "../components/CapaPoligonosIcv";
import CapaPuertos from "../components/CapaPuertos";
import CapaVedadosCosta from "../components/CapaVedadosCosta";
import SitiosOrientativos from "../components/SitiosOrientativos";
import VentanaConsulta from "../components/VentanaConsulta";
import TarjetaEspecie from "../components/TarjetaEspecie";
import SemaforoVeredicto from "../components/SemaforoVeredicto";
import LeyendaMapa from "../components/LeyendaMapa";
import ListaTallasMinimas from "../components/ListaTallasMinimas";
import { sitiosDeTramo } from "../services/sitiosComunidad";
import { consejoIdMontajeEspecie } from "../data/montajesEspecie";
import { consumirAbrirConsultaEspecies } from "../services/especiesPendiente";

type LatLng = { latitude: number; longitude: number };
type ModoEspecies = "continental" | "costa";

interface Props {
  navigation: any;
  route?: { params?: { abrirConsulta?: boolean } };
}

function camaraProvincia(region: { latitude: number; longitude: number }) {
  return { latitude: region.latitude, longitude: region.longitude, zoom: 9, nonce: Date.now() };
}

function camaraCosta(provincia: {
  regionCosta?: { latitude: number; longitude: number; zoom: number };
  regionMapa: { latitude: number; longitude: number };
}) {
  const c = provincia.regionCosta ?? {
    latitude: provincia.regionMapa.latitude,
    longitude: provincia.regionMapa.longitude,
    zoom: 10,
  };
  return { latitude: c.latitude, longitude: c.longitude, zoom: c.zoom, nonce: Date.now() };
}

export default function EspeciesScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { provincia: provinciaCtx, provinciaId } = useProvincia();
  const { punto, fijarPunto } = usePuntoConsulta();
  const provincia = provinciaCtx ?? getProvinciaActiva();
  const soloContinental = provincia.continentalOnly;
  const speciesCatalog = provincia.species as any[];
  // Tramos de la provincia del contexto (no del singleton por defecto Castellón).
  const tramos = provincia.tramos as TramoOficial[];
  const playas = soloContinental ? [] : todasLasPlayas();
  const orillaSeleccion = useMemo(() => (soloContinental ? [] : especiesOrillaParaSeleccion()), [soloContinental]);
  // Barra de tabs flotante (~80) + margen; los CTAs del pie deben quedar por encima.
  const piePadBottom = 88 + Math.max(insets.bottom, 8);

  const puntoSeed =
    punto &&
    (punto.fuente === "mapa" || punto.fuente === "zona" || punto.fuente === "gps") &&
    puntoEnRegionMapa(punto.lat, punto.lng, provincia.regionMapa)
      ? punto
      : null;
  const consultaSeed = useMemo(
    () => (puntoSeed ? consultarToqueMapa(puntoSeed.lat, puntoSeed.lng) : null),
    // Solo semilla inicial: el resto lo hidrata el efecto / foco.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [modo, setModo] = useState<ModoEspecies>(() =>
    !soloContinental && consultaSeed?.ambito === "maritimo" ? "costa" : "continental"
  );
  const [consulta, setConsulta] = useState<ConsultaPesca | null>(() => consultaSeed);
  const [marcador, setMarcador] = useState<LatLng | null>(() =>
    puntoSeed ? { latitude: puntoSeed.lat, longitude: puntoSeed.lng } : null
  );
  const [cargandoUbicacion, setCargandoUbicacion] = useState(false);
  const [fichaAbierta, setFichaAbierta] = useState(() => !!consultaSeed);
  const [catalogoAbierto, setCatalogoAbierto] = useState(false);
  const [catalogo, setCatalogo] = useState<"rio" | "mar" | "no" | "tallas">(() =>
    !soloContinental && consultaSeed?.ambito === "maritimo" ? "mar" : "rio"
  );
  const [camara, setCamara] = useState<
    { latitude: number; longitude: number; zoom: number; nonce: number } | undefined
  >(() =>
    puntoSeed
      ? { latitude: puntoSeed.lat, longitude: puntoSeed.lng, zoom: 13, nonce: Date.now() }
      : undefined
  );
  const [avisoFuera, setAvisoFuera] = useState<string | null>(null);
  /** Evita reaplicar el mismo punto compartido en cada foco. */
  const puntoAplicadoRef = useRef<string | null>(
    puntoSeed ? `${puntoSeed.lat.toFixed(5)},${puntoSeed.lng.toFixed(5)}` : null
  );

  const costa = !soloContinental && modo === "costa";
  const mar = costa || (!soloContinental && catalogoAbierto && catalogo === "mar");
  const provinciaAnteriorRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: costa
        ? `Especies · Costa · ${provincia.nombre}`
        : `Especies · Ríos · ${provincia.nombre}`,
      headerStyle: { backgroundColor: mar ? COLORS.waterDark : COLORS.primaryDark },
    });
  }, [costa, mar, navigation, provincia.nombre]);

  useEffect(() => {
    if (soloContinental && (catalogo === "mar" || catalogo === "no" || catalogo === "tallas")) {
      setCatalogo("rio");
    }
  }, [soloContinental, catalogo]);

  // Solo al CAMBIAR de provincia (no en el montaje: conserva semilla del punto ya elegido).
  useEffect(() => {
    const prev = provinciaAnteriorRef.current;
    provinciaAnteriorRef.current = provinciaId ?? null;
    if (prev == null || prev === provinciaId) {
      return;
    }
    setConsulta(null);
    setMarcador(null);
    setFichaAbierta(false);
    setCatalogoAbierto(false);
    setCatalogo("rio");
    setModo("continental");
    setAvisoFuera(null);
    setCamara(camaraProvincia(provincia.regionMapa));
    puntoAplicadoRef.current = null;
  }, [provinciaId, provincia.regionMapa]);

  // Cámara inicial si no hay punto sembrado.
  useEffect(() => {
    if (!camara) setCamara(camaraProvincia(provincia.regionMapa));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Aplica un punto ya elegido (Salgo a pescar / Mapa / Inicio) sin volver a pedirlo. */
  const aplicarPuntoCompartido = useCallback(
    (lat: number, lng: number, opts?: { abrirFicha?: boolean }) => {
      const r = consultarToqueMapa(lat, lng);
      setConsulta(r);
      setMarcador({ latitude: lat, longitude: lng });
      if (!soloContinental && r.ambito === "maritimo") {
        setModo("costa");
        setCatalogo("mar");
      } else {
        setModo("continental");
        setCatalogo("rio");
      }
      setCamara({ latitude: lat, longitude: lng, zoom: 13, nonce: Date.now() });
      setCatalogoAbierto(false);
      if (opts?.abrirFicha !== false) {
        setFichaAbierta(true);
      }
      puntoAplicadoRef.current = `${lat.toFixed(5)},${lng.toFixed(5)}`;
    },
    [soloContinental]
  );

  // Hidratar siempre que haya punto compartido (no depender solo del foco / params entre tabs).
  useEffect(() => {
    if (!punto || (punto.fuente !== "mapa" && punto.fuente !== "zona" && punto.fuente !== "gps")) {
      return;
    }
    if (!puntoEnRegionMapa(punto.lat, punto.lng, provincia.regionMapa)) {
      return;
    }
    const clave = `${punto.lat.toFixed(5)},${punto.lng.toFixed(5)}`;
    if (puntoAplicadoRef.current === clave) return;
    aplicarPuntoCompartido(punto.lat, punto.lng, { abrirFicha: true });
  }, [punto, provincia.regionMapa, aplicarPuntoCompartido]);

  // Al entrar en Especies con punto ya elegido → lista de especies (tab o botón).
  useFocusEffect(
    useCallback(() => {
      const pedidoExplicito =
        consumirAbrirConsultaEspecies() || route?.params?.abrirConsulta === true;
      if (route?.params?.abrirConsulta) {
        navigation.setParams?.({ abrirConsulta: undefined });
      }

      if (
        punto &&
        (punto.fuente === "mapa" || punto.fuente === "zona" || punto.fuente === "gps") &&
        puntoEnRegionMapa(punto.lat, punto.lng, provincia.regionMapa)
      ) {
        const clave = `${punto.lat.toFixed(5)},${punto.lng.toFixed(5)}`;
        if (puntoAplicadoRef.current !== clave) {
          aplicarPuntoCompartido(punto.lat, punto.lng, { abrirFicha: true });
        } else {
          setCatalogoAbierto(false);
          setFichaAbierta(true);
        }
        return;
      }
      if (pedidoExplicito) {
        setCatalogoAbierto(false);
        setFichaAbierta(true);
      }
    }, [punto, provincia.regionMapa, route?.params?.abrirConsulta, navigation, aplicarPuntoCompartido])
  );

  function cambiarModo(siguiente: ModoEspecies, opts?: { abrirCatalogo?: boolean }) {
    if (soloContinental && siguiente === "costa") return;
    setModo(siguiente);
    setFichaAbierta(false);
    if (siguiente === "costa") {
      setCatalogo("mar");
      setCamara(camaraCosta(provincia));
      // Acceso directo: al pulsar Costa se ven las especies de orilla sin pasos extra.
      if (opts?.abrirCatalogo !== false) {
        setCatalogoAbierto(true);
      }
    } else {
      setCatalogo("rio");
      setCamara(camaraProvincia(provincia.regionMapa));
      // Equivalente continental: al pulsar Ríos se ven las especies de ríos/embalses.
      if (opts?.abrirCatalogo) {
        setCatalogoAbierto(true);
      } else {
        setCatalogoAbierto(false);
      }
    }
  }

  function abrirCatalogoOrilla() {
    if (soloContinental) return;
    setModo("costa");
    setCatalogo("mar");
    setCatalogoAbierto(true);
    setFichaAbierta(false);
    setCamara(camaraCosta(provincia));
  }

  function abrirCatalogoContinental() {
    setModo("continental");
    setCatalogo("rio");
    setCatalogoAbierto(true);
    setFichaAbierta(false);
    setCamara(camaraProvincia(provincia.regionMapa));
  }

  function abrirCatalogo() {
    if (costa) {
      setCatalogo("mar");
    } else if (catalogo === "mar" || catalogo === "no" || catalogo === "tallas") {
      // Mantener pestaña marítima si el usuario ya estaba ahí.
    } else {
      setCatalogo("rio");
    }
    setCatalogoAbierto(true);
  }

  async function usarMiUbicacion(opts?: { silencioso?: boolean }) {
    setCargandoUbicacion(true);
    setAvisoFuera(null);
    const ok = await solicitarPermisoUbicacion();
    if (ok) {
      const loc = await obtenerUbicacionActual();
      if (loc) {
        const dentro = puntoEnRegionMapa(loc.lat, loc.lng, provincia.regionMapa);
        if (!dentro) {
          // No volamos a otra provincia (p. ej. Castellón) ni mezclamos su costa.
          setCamara(costa ? camaraCosta(provincia) : camaraProvincia(provincia.regionMapa));
          const msg = `Tu GPS está fuera de ${provincia.nombre}. El mapa y las especies siguen siendo solo de esta provincia.`;
          setAvisoFuera(msg);
          if (!opts?.silencioso) {
            Alert.alert(`Fuera de ${provincia.nombre}`, msg);
          }
        } else {
          const r = consultarToqueMapa(loc.lat, loc.lng);
          setConsulta(r);
          if (!soloContinental && r.ambito === "maritimo") {
            setModo("costa");
            setCatalogo("mar");
          } else {
            setModo("continental");
            setCatalogo("rio");
          }
          setMarcador({ latitude: loc.lat, longitude: loc.lng });
          setCamara({ latitude: loc.lat, longitude: loc.lng, zoom: 13, nonce: Date.now() });
          void fijarPunto({ lat: loc.lat, lng: loc.lng, fuente: "gps", etiqueta: "Tu ubicación" });
          puntoAplicadoRef.current = `${loc.lat.toFixed(5)},${loc.lng.toFixed(5)}`;
        }
      }
    }
    setCargandoUbicacion(false);
  }

  function evaluarPunto(lat: number, lng: number) {
    const r = consultarToqueMapa(lat, lng);
    setConsulta(r);
    setMarcador({ latitude: lat, longitude: lng });
    if (!soloContinental && r.ambito === "maritimo") {
      setModo("costa");
      setCatalogo("mar");
    } else {
      setModo("continental");
      setCatalogo("rio");
    }
    setFichaAbierta(true);
    setCamara({ latitude: lat, longitude: lng, zoom: 13, nonce: Date.now() });
    puntoAplicadoRef.current = `${lat.toFixed(5)},${lng.toFixed(5)}`;
    void fijarPunto({ lat, lng, fuente: "mapa", etiqueta: r.titulo });
  }

  function evaluarTramo(z: TramoOficial) {
    setConsulta(consultarPorTramo(z));
    setMarcador({ latitude: z.lat, longitude: z.lng });
    setModo("continental");
    setCatalogo("rio");
    setFichaAbierta(true);
    puntoAplicadoRef.current = `${z.lat.toFixed(5)},${z.lng.toFixed(5)}`;
    void fijarPunto({ lat: z.lat, lng: z.lng, fuente: "zona", etiqueta: z.nombre });
  }

  function irAparejos(especieId: string) {
    setFichaAbierta(false);
    setCatalogoAbierto(false);
    navigation.navigate("Aparejos", { especieId });
  }

  function irMontaje(especieId: string) {
    const consejoId = consejoIdMontajeEspecie(especieId);
    if (!consejoId) {
      irAparejos(especieId);
      return;
    }
    setFichaAbierta(false);
    setCatalogoAbierto(false);
    navigation.navigate("Consejos", { consejoId, categoria: "montajes" });
  }

  const especiesConsulta =
    consulta?.ambito === "maritimo"
      ? (consulta.especiesIds ?? []).map((id) =>
          orillaSeleccion.find((s) => s.id === id) ??
          [...(orilla.pescablesOrilla as any[]), ...(orilla.invasorasOrilla as any[])].find((s) => s.id === id)
        )
      : (consulta?.tramo?.especies ?? []).map((especieId: string) =>
          speciesCatalog.find((s: any) => s.id === especieId)
        );

  const nEspeciesChip = costa ? orillaSeleccion.length : speciesCatalog.length;

  return (
    <View style={styles.container}>
      {!soloContinental ? (
        <View style={[styles.modoBar, costa && styles.modoBarMar]}>
          <TouchableOpacity
            style={[styles.modoBtn, !costa && styles.modoBtnOnBosque]}
            onPress={() => cambiarModo("continental", { abrirCatalogo: true })}
            accessibilityRole="button"
            accessibilityLabel="Ríos y embalses"
          >
            <Text style={[styles.modoTxt, !costa && styles.modoTxtOn]}>Ríos y embalses</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modoBtn, costa && styles.modoBtnOnMar]}
            onPress={() => cambiarModo("costa", { abrirCatalogo: true })}
            accessibilityRole="button"
            accessibilityLabel="Costa orilla"
          >
            <Text style={[styles.modoTxt, costa && styles.modoTxtOn]}>Costa (orilla)</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.modoBar}>
          <TouchableOpacity
            style={[styles.modoBtn, styles.modoBtnOnBosque]}
            onPress={abrirCatalogoContinental}
            accessibilityRole="button"
            accessibilityLabel="Ver especies de ríos y embalses de Sevilla"
          >
            <Text style={[styles.modoTxt, styles.modoTxtOn]}>Ríos y embalses · ver especies</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.mapWrap}>
        <MapView
          key={`${provincia.id}-${modo}`}
          style={styles.map}
          initialRegion={provincia.regionMapa}
          cameraTarget={camara}
          accent={costa ? "mar" : "bosque"}
          pescaWms={provincia.id === "sevilla" ? "rediam" : "icv"}
          onPress={(e) => evaluarPunto(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude)}
          onLongPress={(e) => evaluarPunto(e.nativeEvent.coordinate.latitude,