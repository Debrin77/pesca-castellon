import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  Platform,
  Modal,
} from "react-native";
import { useFocusEffect, useRoute, useScrollToTop } from "@react-navigation/native";
import { useProvincia } from "../context/ProvinciaContext";
import { getProvinciaActiva } from "../provincias/runtime";
import {
  PuntoGuardado,
  Captura,
  FavoritoZona,
  obtenerPuntosGuardados,
  guardarPunto,
  eliminarPunto,
  obtenerCapturas,
  guardarCaptura,
  eliminarCaptura,
  obtenerFavoritos,
  eliminarFavorito,
} from "../services/storageService";
import { obtenerUbicacionActual, solicitarPermisoUbicacion } from "../services/locationService";
import { construirGpx, exportarYCompartirGpx } from "../services/gpxService";
import { obtenerTracks } from "../services/trackService";
import { resumenCupoHoy, CupoEspecieInfo } from "../services/cupoService";
import type { ModalidadPesca } from "../data/modalidades";
import { formatearCoords, parsearLatLng } from "../services/coordsUtils";
import { asegurarCoordsEnProvincia, distanciaKm } from "../services/geoService";
import {
  cancelarPickUbicacion,
  consumirPickUbicacion,
  iniciarPickUbicacion,
} from "../services/ubicacionPendiente";
import {
  catalogoParaModalidad,
  resolverEspecie,
} from "../services/catalogoEspeciesService";
import { caraDeEspecie } from "../data/carasVisuales";
import { COLORS, RADIUS, SHADOW } from "../theme";
import ListaAnimada from "../components/ListaAnimada";
import IdentificarEspecie from "../components/IdentificarEspecie";
import SelectorModalidad from "../components/SelectorModalidad";
import { LinearGradient } from "expo-linear-gradient";
import { capturarCondicionesDelMomento } from "../services/condicionesCapturaService";
import {
  importarKmlOKmzDesdeTextoOBytes,
  placemarksAPuntos,
} from "../services/kmlService";
import {
  glyphIconoPunto,
  hexColorPunto,
  etiquetaColorPunto,
  etiquetaIconoPunto,
} from "../data/iconosPunto";
import LlevameAlPunto from "../components/LlevameAlPunto";
import { compartirUbicacion } from "../utils/abrirEnMaps";

type Tab = "favoritos" | "puntos" | "capturas";
type OrdenLista = "fecha" | "especie" | "sitio" | "color";
type GrupoLista = "ninguno" | "dia" | "sitio" | "color" | "icono";

interface Props {
  navigation: any;
}

function nombrePuntoPorDefecto(): string {
  return `Punto del ${new Date().toLocaleDateString("es-ES")}`;
}

/** ~75 m: reutilizar un punto cercano al registrar otra captura en el mismo sitio. */
const RADIO_REUTILIZAR_PUNTO_KM = 0.075;

async function asegurarPuntoParaCaptura(opts: {
  lat: number;
  lng: number;
  nombre: string;
  notas?: string;
}): Promise<PuntoGuardado> {
  const existentes = await obtenerPuntosGuardados();
  let mejor: PuntoGuardado | null = null;
  let mejorDist = Infinity;
  for (const p of existentes) {
    const d = distanciaKm(opts.lat, opts.lng, p.lat, p.lng);
    if (d <= RADIO_REUTILIZAR_PUNTO_KM && d < mejorDist) {
      mejor = p;
      mejorDist = d;
    }
  }
  if (mejor) return mejor;
  return guardarPunto({
    nombre: opts.nombre,
    lat: opts.lat,
    lng: opts.lng,
    notas: opts.notas,
  });
}

export default function MyCatchesScreen({ navigation }: Props) {
  const route = useRoute<any>();
  const { provincia: provinciaCtx } = useProvincia();
  const provincia = provinciaCtx ?? getProvinciaActiva();
  const speciesCatalog = provincia.species as any[];
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);
  const [tab, setTab] = useState<Tab>("favoritos");
  const [puntos, setPuntos] = useState<PuntoGuardado[]>([]);
  const [capturas, setCapturas] = useState<Captura[]>([]);
  const [favoritos, setFavoritos] = useState<FavoritoZona[]>([]);
  const [busquedaLista, setBusquedaLista] = useState("");
  const [ordenLista, setOrdenLista] = useState<OrdenLista>("fecha");
  const [grupoLista, setGrupoLista] = useState<GrupoLista>("ninguno");
  const [llevame, setLlevame] = useState<{ nombre: string; lat: number; lng: number } | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarId, setMostrarId] = useState(false);

  const [especieId, setEspecieId] = useState("");
  const [nombreLugar, setNombreLugar] = useState("");
  const [tallaCm, setTallaCm] = useState("");
  const [pesoKg, setPesoKg] = useState("");
  const [notas, setNotas] = useState("");
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  /** Sitio guardado elegido: la captura se enlaza a esas coordenadas (misma orilla, otra fecha). */
  const [puntoSeleccionadoId, setPuntoSeleccionadoId] = useState<string | null>(null);
  const [fechaCaptura, setFechaCaptura] = useState(() => new Date().toISOString().slice(0, 10));
  const [modalidad, setModalidad] = useState<ModalidadPesca>("orilla_continental");
  const [cupoInfo, setCupoInfo] = useState<CupoEspecieInfo | null>(null);
  const [mostrarCoordsCaptura, setMostrarCoordsCaptura] = useState(false);
  const [latCaptura, setLatCaptura] = useState("");
  const [lngCaptura, setLngCaptura] = useState("");

  const catalogoSeleccion = useMemo(
    () =>
      catalogoParaModalidad(modalidad, speciesCatalog, {
        continentalOnly: provincia.continentalOnly,
      }),
    [modalidad, speciesCatalog, provincia.continentalOnly]
  );

  const [mostrarFormPunto, setMostrarFormPunto] = useState(false);
  const [nombrePunto, setNombrePunto] = useState("");
  const [notasPunto, setNotasPunto] = useState("");
  const [latPunto, setLatPunto] = useState("");
  const [lngPunto, setLngPunto] = useState("");
  const [pegarKmlVisible, setPegarKmlVisible] = useState(false);
  const [pegarKmlTexto, setPegarKmlTexto] = useState("");
  const [pegandoKml, setPegandoKml] = useState(false);

  const cargar = useCallback(async () => {
    setPuntos(await obtenerPuntosGuardados());
    setCapturas(await obtenerCapturas());
    setFavoritos(await obtenerFavoritos());
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
      const elegidaPunto = consumirPickUbicacion("punto");
      if (elegidaPunto) {
        setTab("puntos");
        // El mapa ya persistió el punto; solo refrescamos la lista.
        Alert.alert("Punto guardado", elegidaPunto.etiqueta ?? formatearCoords(elegidaPunto.lat, elegidaPunto.lng));
      }
      const elegidaCaptura = consumirPickUbicacion("captura");
      if (elegidaCaptura) {
        const enProvincia = asegurarCoordsEnProvincia(elegidaCaptura.lat, elegidaCaptura.lng, {
          region: provincia.regionMapa,
          nombre: provincia.nombre,
        });
        setTab("capturas");
        setMostrarFormulario(true);
        if (enProvincia.ok) {
          setCoords({ lat: elegidaCaptura.lat, lng: elegidaCaptura.lng });
          setNombreLugar((prev) => prev || elegidaCaptura.etiqueta || "");
        } else {
          Alert.alert(`Fuera de ${provincia.nombre}`, enProvincia.error);
        }
      }
    }, [cargar, provincia.regionMapa, provincia.nombre])
  );

  // Campo de hoy → «Especies con foto / rasgos»
  useEffect(() => {
    if (!route.params?.abrirIdentificar) return;
    setTab("capturas");
    setMostrarFormulario(true);
    setMostrarId(true);
    navigation.setParams?.({ abrirIdentificar: undefined });
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    });
  }, [route.params, navigation]);

  useEffect(() => {
    if (!route.params?.abrirCapturaRapida) return;
    setTab("capturas");
    setMostrarFormulario(true);
    navigation.setParams?.({ abrirCapturaRapida: undefined });
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    });
    // GPS y cámara solo bajo gesto del usuario (botones del formulario),
    // no al abrir captura rápida desde Inicio.
  }, [route.params, navigation]);

  /** Abre el formulario de captura enlazado a un sitio ya guardado (misma orilla, otra fecha). */
  const usarPuntoParaCaptura = useCallback((p: PuntoGuardado) => {
    setTab("capturas");
    setMostrarFormulario(true);
    setPuntoSeleccionadoId(p.id);
    setCoords({ lat: p.lat, lng: p.lng });
    setNombreLugar(p.nombre);
    setFechaCaptura(new Date().toISOString().slice(0, 10));
    setMostrarCoordsCaptura(false);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    });
  }, []);

  useEffect(() => {
    const id = route.params?.capturaEnPuntoId as string | undefined;
    if (!id) return;
    navigation.setParams?.({ capturaEnPuntoId: undefined });
    const p = puntos.find((x) => x.id === id);
    if (p) {
      usarPuntoParaCaptura(p);
      return;
    }
    // Lista aún no cargada: recordar id y completar al llegar puntos.
    setTab("capturas");
    setMostrarFormulario(true);
    setPuntoSeleccionadoId(id);
  }, [route.params?.capturaEnPuntoId, puntos, navigation, usarPuntoParaCaptura]);

  useEffect(() => {
    if (!puntoSeleccionadoId || coords) return;
    const p = puntos.find((x) => x.id === puntoSeleccionadoId);
    if (p) usarPuntoParaCaptura(p);
  }, [puntos, puntoSeleccionadoId, coords, usarPuntoParaCaptura]);

  useEffect(() => {
    if (!especieId) {
      setCupoInfo(null);
      return;
    }
    const sp = resolverEspecie(especieId, speciesCatalog);
    void resumenCupoHoy(especieId, (sp as any)?.cupo).then(setCupoInfo);
  }, [especieId, capturas, speciesCatalog]);

  useEffect(() => {
    // Si la modalidad cambia (río ↔ mar), quitar especie que no esté en el catálogo actual.
    if (especieId && !catalogoSeleccion.some((s) => s.id === especieId)) {
      setEspecieId("");
    }
  }, [catalogoSeleccion, especieId]);

  useEffect(() => {
    // No forzar la primera del catálogo (p. ej. trucha común / siluro): el usuario elige.
    setEspecieId("");
    setModalidad("orilla_continental");
    setMostrarFormulario(false);
    setMostrarId(false);
  }, [provincia.id]);

  async function exportarGpx() {
    const tracks = await obtenerTracks();
    const gpx = construirGpx({
      nombre: `Pesca ${provincia.nombre}`,
      puntos,
      capturas,
      tracks,
    });
    await exportarYCompartirGpx(`pesca-${provincia.id}-${new Date().toISOString().slice(0, 10)}.gpx`, gpx);
  }

  async function aplicarPlacemarksImportados(places: Awaited<ReturnType<typeof importarKmlOKmzDesdeTextoOBytes>>) {
    const payloads = placemarksAPuntos(places);
    let guardados = 0;
    for (const p of payloads) {
      const enProvincia = asegurarCoordsEnProvincia(p.lat, p.lng, {
        region: provincia.regionMapa,
        nombre: provincia.nombre,
      });
      if (!enProvincia.ok) continue;
      await guardarPunto(p);
      guardados++;
    }
    await cargar();
    Alert.alert(
      "KML",
      guardados
        ? `Importados ${guardados} puntos en ${provincia.nombre}${
            guardados < payloads.length ? ` (${payloads.length - guardados} fuera de provincia)` : ""
          }.`
        : `Ningún punto cayó en ${provincia.nombre} (${payloads.length} en el archivo).`
    );
  }

  async function importarKml() {
    try {
      if (Platform.OS === "web" && typeof document !== "undefined") {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".kml,.kmz,application/vnd.google-earth.kml+xml";
        input.onchange = async () => {
          const file = input.files?.[0];
          if (!file) return;
          try {
            const buf = await file.arrayBuffer();
            const places = await importarKmlOKmzDesdeTextoOBytes({
              bytes: buf,
              nombreArchivo: file.name,
            });
            await aplicarPlacemarksImportados(places);
          } catch (err: any) {
            Alert.alert("KML", err?.message || "No se pudo importar.");
          }
        };
        input.click();
        return;
      }
      setPegarKmlTexto("");
      setPegarKmlVisible(true);
    } catch (err: any) {
      Alert.alert("KML", err?.message || "No se pudo importar.");
    }
  }

  async function confirmarPegarKml() {
    const texto = pegarKmlTexto.trim();
    if (!texto) {
      Alert.alert("KML", "Pega el contenido del archivo .kml (texto XML).");
      return;
    }
    setPegandoKml(true);
    try {
      const places = await importarKmlOKmzDesdeTextoOBytes({ texto });
      await aplicarPlacemarksImportados(places);
      setPegarKmlVisible(false);
      setPegarKmlTexto("");
    } catch (err: any) {
      Alert.alert("KML", err?.message || "No se pudo importar.");
    } finally {
      setPegandoKml(false);
    }
  }

  const capturasFiltradas = useMemo(() => {
    const q = busquedaLista.trim().toLowerCase();
    let list = [...capturas];
    if (q) {
      list = list.filter((c) => {
        const sp = resolverEspecie(c.especieId, speciesCatalog);
        const blob = [sp?.nombre, c.especieId, c.nombreLugar, c.notas, c.fecha]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return blob.includes(q);
      });
    }
    list.sort((a, b) => {
      if (ordenLista === "especie") {
        const na = resolverEspecie(a.especieId, speciesCatalog)?.nombre ?? a.especieId;
        const nb = resolverEspecie(b.especieId, speciesCatalog)?.nombre ?? b.especieId;
        return na.localeCompare(nb, "es");
      }
      if (ordenLista === "sitio") {
        return (a.nombreLugar || "").localeCompare(b.nombreLugar || "", "es");
      }
      return (b.fecha || "").localeCompare(a.fecha || "");
    });
    return list;
  }, [capturas, busquedaLista, ordenLista, speciesCatalog]);

  const puntosFiltrados = useMemo(() => {
    const q = busquedaLista.trim().toLowerCase();
    let list = [...puntos];
    if (q) {
      list = list.filter((p) =>
        [p.nombre, p.notas].filter(Boolean).join(" ").toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      if (ordenLista === "color") {
        const ca = etiquetaColorPunto(a.color).localeCompare(etiquetaColorPunto(b.color), "es");
        if (ca !== 0) return ca;
        return a.nombre.localeCompare(b.nombre, "es");
      }
      if (ordenLista === "sitio" || ordenLista === "especie") {
        return a.nombre.localeCompare(b.nombre, "es");
      }
      return (b.creadoEn || "").localeCompare(a.creadoEn || "");
    });
    if (grupoLista === "color") {
      list.sort((a, b) => etiquetaColorPunto(a.color).localeCompare(etiquetaColorPunto(b.color), "es"));
    } else if (grupoLista === "icono") {
      list.sort((a, b) => etiquetaIconoPunto(a.icono).localeCompare(etiquetaIconoPunto(b.icono), "es"));
    } else if (grupoLista === "dia") {
      list.sort((a, b) => (b.creadoEn || "").localeCompare(a.creadoEn || ""));
    }
    return list;
  }, [puntos, busquedaLista, ordenLista, grupoLista]);

  async function handleGuardarCaptura() {
    if (!especieId) {
      Alert.alert("Especie", "Elige primero la especie de la captura.");
      return;
    }
    const fechaOk = /^\d{4}-\d{2}-\d{2}$/.test(fechaCaptura.trim());
    if (!fechaOk) {
      Alert.alert("Fecha", "Usa el formato AAAA-MM-DD (ej. 2026-09-28).");
      return;
    }
    let puntoId: string | null = puntoSeleccionadoId;
    let lat = coords?.lat ?? null;
    let lng = coords?.lng ?? null;
    if (puntoId) {
      const p = puntos.find((x) => x.id === puntoId);
      if (!p) {
        Alert.alert("Sitio", "Ese punto ya no está en la lista. Elige otro o usa GPS/coords.");
        return;
      }
      lat = p.lat;
      lng = p.lng;
    } else if (coords) {
      const sp = resolverEspecie(especieId, speciesCatalog);
      const nombre =
        nombreLugar.trim() ||
        (sp?.nombre ? `Captura · ${sp.nombre}` : nombrePuntoPorDefecto());
      const punto = await asegurarPuntoParaCaptura({
        lat: coords.lat,
        lng: coords.lng,
        nombre,
        notas: notas.trim() || undefined,
      });
      puntoId = punto.id;
      lat = coords.lat;
      lng = coords.lng;
    }
    let condiciones = null;
    if (lat != null && lng != null) {
      condiciones = await capturarCondicionesDelMomento(lat, lng);
    }
    const pSel = puntoId ? puntos.find((x) => x.id === puntoId) : null;
    await guardarCaptura({
      especieId,
      fecha: fechaCaptura.trim(),
      puntoId,
      nombreLugar: nombreLugar.trim() || pSel?.nombre || undefined,
      tallaCm: tallaCm ? parseFloat(tallaCm) : null,
      pesoKg: pesoKg ? parseFloat(pesoKg) : null,
      notas: notas || undefined,
      fotoUri: fotoUri || null,
      lat,
      lng,
      modalidad,
      condiciones,
    });
    setNombreLugar("");
    setTallaCm("");
    setPesoKg("");
    setNotas("");
    setFotoUri(null);
    setCoords(null);
    setPuntoSeleccionadoId(null);
    setFechaCaptura(new Date().toISOString().slice(0, 10));
    setLatCaptura("");
    setLngCaptura("");
    setMostrarCoordsCaptura(false);
    setEspecieId("");
    setMostrarFormulario(false);
    setMostrarId(false);
    cargar();
  }

  async function elegirFoto() {
    try {
      const ImagePicker = await import("expo-image-picker");
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permiso", "Necesitas permitir acceso a la galería para añadir foto.");
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: true,
        aspect: [4, 3],
      });
      if (!res.canceled && res.assets?.[0]?.uri) {
        setFotoUri(res.assets[0].uri);
      }
    } catch {
      Alert.alert("Foto", "No se pudo abrir la galería en este entorno.");
    }
  }

  async function tomarFotoCamara() {
    try {
      const ImagePicker = await import("expo-image-picker");
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Cámara", "Necesitas permitir la cámara para la captura rápida.");
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        quality: 0.7,
        allowsEditing: true,
        aspect: [4, 3],
      });
      if (!res.canceled && res.assets?.[0]?.uri) {
        setFotoUri(res.assets[0].uri);
      }
    } catch {
      Alert.alert("Cámara", "No se pudo abrir la cámara en este entorno.");
    }
  }


  async function anadirUbicacionCapturaGps() {
    const ok = await solicitarPermisoUbicacion();
    if (!ok) {
      Alert.alert("Ubicación", "Activa el permiso para guardar el punto en el mapa.");
      return;
    }
    const loc = await obtenerUbicacionActual();
    if (!loc) {
      Alert.alert("Ubicación", "No se pudo obtener tu posición.");
      return;
    }
    const enProvincia = asegurarCoordsEnProvincia(loc.lat, loc.lng, {
      region: provincia.regionMapa,
      nombre: provincia.nombre,
    });
    if (!enProvincia.ok) {
      Alert.alert(`Fuera de ${provincia.nombre}`, enProvincia.error);
      return;
    }
    setPuntoSeleccionadoId(null);
    setCoords(loc);
    setMostrarCoordsCaptura(false);
  }

  function aplicarCoordsCapturaManual() {
    const r = parsearLatLng(latCaptura, lngCaptura);
    if (!r.ok) {
      Alert.alert("Coordenadas", r.error);
      return;
    }
    const enProvincia = asegurarCoordsEnProvincia(r.coords.lat, r.coords.lng, {
      region: provincia.regionMapa,
      nombre: provincia.nombre,
    });
    if (!enProvincia.ok) {
      Alert.alert(`Fuera de ${provincia.nombre}`, enProvincia.error);
      return;
    }
    setPuntoSeleccionadoId(null);
    setCoords(r.coords);
    setMostrarCoordsCaptura(false);
  }

  function irAMapaParaCaptura() {
    setPuntoSeleccionadoId(null);
    iniciarPickUbicacion("captura");
    navigation.navigate("Mapa", {
      screen: "ZonasLibresMain",
      params: { modoAnadirPunto: true, motivoPick: "captura" },
    });
  }

  async function handleGuardarPuntoGps() {
    const ok = await solicitarPermisoUbicacion();
    if (!ok) {
      Alert.alert("Ubicación necesaria", "Activa el permiso de ubicación para guardar tu punto actual.");
      return;
    }
    const loc = await obtenerUbicacionActual();
    if (!loc) {
      Alert.alert("No se pudo obtener tu ubicación", "Inténtalo de nuevo en un momento.");
      return;
    }
    const enProvincia = asegurarCoordsEnProvincia(loc.lat, loc.lng, {
      region: provincia.regionMapa,
      nombre: provincia.nombre,
    });
    if (!enProvincia.ok) {
      Alert.alert(`Fuera de ${provincia.nombre}`, enProvincia.error);
      return;
    }
    const nuevo = await guardarPunto({
      nombre: nombrePunto.trim() || nombrePuntoPorDefecto(),
      lat: loc.lat,
      lng: loc.lng,
      notas: notasPunto.trim() || undefined,
    });
    setNombrePunto("");
    setNotasPunto("");
    setMostrarFormPunto(false);
    await cargar();
    Alert.alert("Punto guardado", `GPS: ${formatearCoords(loc.lat, loc.lng)}`, [
      { text: "Listo", style: "cancel" },
      { text: "Añadir captura", onPress: () => usarPuntoParaCaptura(nuevo) },
    ]);
  }

  async function handleGuardarPuntoCoords() {
    const r = parsearLatLng(latPunto, lngPunto);
    if (!r.ok) {
      Alert.alert("Coordenadas", r.error);
      return;
    }
    const enProvincia = asegurarCoordsEnProvincia(r.coords.lat, r.coords.lng, {
      region: provincia.regionMapa,
      nombre: provincia.nombre,
    });
    if (!enProvincia.ok) {
      Alert.alert(`Fuera de ${provincia.nombre}`, enProvincia.error);
      return;
    }
    const nuevo = await guardarPunto({
      nombre: nombrePunto.trim() || nombrePuntoPorDefecto(),
      lat: r.coords.lat,
      lng: r.coords.lng,
      notas: notasPunto.trim() || undefined,
    });
    setNombrePunto("");
    setNotasPunto("");
    setLatPunto("");
    setLngPunto("");
    setMostrarFormPunto(false);
    await cargar();
    Alert.alert("Punto guardado", formatearCoords(r.coords.lat, r.coords.lng), [
      { text: "Listo", style: "cancel" },
      { text: "Añadir captura", onPress: () => usarPuntoParaCaptura(nuevo) },
    ]);
  }

  function irAMapaParaPunto() {
    iniciarPickUbicacion("punto");
    navigation.navigate("Mapa", {
      screen: "ZonasLibresMain",
      params: { modoAnadirPunto: true, motivoPick: "punto" },
    });
  }

  function verPuntoEnMapa(p: PuntoGuardado) {
    cancelarPickUbicacion();
    navigation.navigate("Mapa", {
      screen: "ZonasLibresMain",
      params: { centrarEn: { lat: p.lat, lng: p.lng, nombre: p.nombre } },
    });
  }

  function verCapturaEnMapa(c: Captura) {
    if (c.lat == null || c.lng == null) return;
    cancelarPickUbicacion();
    const sp = especieInfo(c.especieId);
    navigation.navigate("Mapa", {
      screen: "ZonasLibresMain",
      params: {
        centrarEn: {
          lat: c.lat,
          lng: c.lng,
          nombre: c.nombreLugar?.trim() || sp?.nombre || "Captura",
        },
      },
    });
  }

  function especieInfo(id: string) {
    return resolverEspecie(id, speciesCatalog);
  }

  function cambiarModalidad(m: ModalidadPesca) {
    setModalidad(m);
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tabBtn, tab === "favoritos" && styles.tabBtnActive]} onPress={() => setTab("favoritos")}>
          <Text style={[styles.tabBtnText, tab === "favoritos" && styles.tabBtnTextActive]}>★ Favoritos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, tab === "puntos" && styles.tabBtnActive]} onPress={() => setTab("puntos")}>
          <Text style={[styles.tabBtnText, tab === "puntos" && styles.tabBtnTextActive]}>Puntos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, tab === "capturas" && styles.tabBtnActive]} onPress={() => setTab("capturas")}>
          <Text style={[styles.tabBtnText, tab === "capturas" && styles.tabBtnTextActive]}>Capturas</Text>
        </TouchableOpacity>
      </View>

      <ScrollView ref={scrollRef} style={styles.content} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <View style={styles.toolsBox}>
          <Text style={styles.toolsTitle}>Herramientas · {provincia.nombre}</Text>
          <TouchableOpacity
            style={styles.gpxBtn}
            onPress={() => void exportarGpx()}
            accessibilityRole="button"
            accessibilityLabel={`Exportar GPX de ${provincia.nombre}`}
          >
            <Text style={styles.gpxBtnText}>Exportar GPX · {provincia.nombre}</Text>
            <Text style={styles.gpxSub}>Puntos + capturas con GPS + rutas (solo esta provincia)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.gpxBtn, { marginTop: 8 }]}
            onPress={() => void importarKml()}
            accessibilityRole="button"
            accessibilityLabel="Importar KML o KMZ"
          >
            <Text style={styles.gpxBtnText}>Importar KML / KMZ</Text>
            <Text style={styles.gpxSub}>Placemarks → Mis sitios (privados, en esta provincia)</Text>
          </TouchableOpacity>
          {(tab === "capturas" || tab === "puntos") && (
            <View style={styles.listaTools}>
              <TextInput
                style={styles.input}
                value={busquedaLista}
                onChangeText={setBusquedaLista}
                placeholder={
                  tab === "capturas"
                    ? "Buscar especie, sitio, notas…"
                    : "Buscar por nombre o notas…"
                }
                placeholderTextColor={COLORS.textMuted}
                accessibilityLabel="Buscar en la lista"
              />
              <View style={styles.ordenRow}>
                {(tab === "capturas"
                  ? (["fecha", "especie", "sitio"] as OrdenLista[])
                  : (["fecha", "sitio", "color"] as OrdenLista[])
                ).map((o) => (
                  <TouchableOpacity
                    key={o}
                    style={[styles.ordenChip, ordenLista === o && styles.ordenChipOn]}
                    onPress={() => setOrdenLista(o)}
                  >
                    <Text style={[styles.ordenChipTxt, ordenLista === o && styles.ordenChipTxtOn]}>
                      {o === "fecha" ? "Fecha" : o === "especie" ? "Especie" : o === "color" ? "Color" : "Nombre"}
                    </Text>
                  </TouchableOpacity>
                ))}
                {(tab === "capturas"
                  ? (["ninguno", "dia", "sitio"] as GrupoLista[])
                  : (["ninguno", "color", "icono", "dia"] as GrupoLista[])
                ).map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.ordenChip, grupoLista === g && styles.ordenChipOn]}
                    onPress={() => setGrupoLista(g)}
                  >
                    <Text style={[styles.ordenChipTxt, grupoLista === g && styles.ordenChipTxtOn]}>
                      {g === "ninguno"
                        ? "Sin grupo"
                        : g === "dia"
                          ? "Por día"
                          : g === "sitio"
                            ? "Por sitio"
                            : g === "color"
                              ? "Por color"
                              : "Por icono"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          {cupoInfo ? (
            <View style={styles.cupoBox}>
              <Text style={styles.cupoTitle}>
                Cupo del día · {resolverEspecie(especieId, speciesCatalog)?.nombre ?? especieId}
              </Text>
              <Text style={styles.cupoMeta}>
                Hoy: {cupoInfo.retenidasHoy}
                {cupoInfo.maxUnidades != null ? ` / ${cupoInfo.maxUnidades} ud` : " capturas"}
                {cupoInfo.maxKg != null ? ` · ${cupoInfo.kgHoy.toFixed(1)}/${cupoInfo.maxKg} kg` : ""}
              </Text>
              <Text style={styles.cupoMeta}>{cupoInfo.cupoTexto}</Text>
              {cupoInfo.aviso ? <Text style={styles.cupoWarn}>{cupoInfo.aviso}</Text> : null}
            </View>
          ) : null}
        </View>

        {tab === "favoritos" && (
          <>
            <Text style={styles.lead}>
              Marca fichas con ★ desde el detalle de zona. Aparecen también en Inicio.
            </Text>
            <Text style={styles.sectionTitle}>Zonas favoritas ({favoritos.length})</Text>
            {favoritos.length === 0 && (
              <Text style={styles.emptyText}>
                Aún no tienes favoritos. Abre una ficha de zona en el mapa y toca la estrella.
              </Text>
            )}
            {favoritos.map((f, i) => (
              <ListaAnimada key={f.zonaId} index={i}>
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => navigation.navigate("ZoneDetail", { zoneId: f.zonaId })}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={styles.cardTitle}>★ {f.nombre}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        eliminarFavorito(f.zonaId).then(cargar);
                      }}
                    >
                      <Text style={styles.deleteText}>Quitar</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.cardMeta}>Guardado {new Date(f.creadoEn).toLocaleDateString("es-ES")}</Text>
                </TouchableOpacity>
              </ListaAnimada>
            ))}
          </>
        )}

        {tab === "capturas" && (
          <>
            {!mostrarFormulario ? (
              <TouchableOpacity style={styles.addButton} onPress={() => setMostrarFormulario(true)}>
                <Text style={styles.addButtonText}>+ Registrar nueva captura</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.formCard}>
                <SelectorModalidad
                  value={modalidad}
                  onChange={cambiarModalidad}
                  filtroAmbito={provincia.continentalOnly ? "continental" : "ambos"}
                />
                <Text style={styles.formLabel}>Especie</Text>
                {!especieId ? (
                  <Text style={styles.cupoMeta}>
                    {modalidad === "orilla_mar" || modalidad === "submarina"
                      ? "Elige una de las 15 especies de costa más usuales (o invasora)."
                      : "Elige la especie (no hay preselección)."}
                  </Text>
                ) : null}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                  {catalogoSeleccion.map((s: any) => (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.chip, especieId === s.id && styles.chipActive]}
                      onPress={() => setEspecieId(s.id)}
                    >
                      <Text style={[styles.chipText, especieId === s.id && styles.chipTextActive]}>
                        {s.icono ?? caraDeEspecie(s).emoji} {s.nombre}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                {cupoInfo?.aviso ? <Text style={styles.cupoWarn}>{cupoInfo.aviso}</Text> : null}
                {cupoInfo && (cupoInfo.maxUnidades != null || cupoInfo.maxKg != null) ? (
                  <Text style={styles.cupoMeta}>
                    Hoy: {cupoInfo.retenidasHoy}
                    {cupoInfo.maxUnidades != null ? ` / ${cupoInfo.maxUnidades} ud` : " capturas"}
                    {cupoInfo.maxKg != null ? ` · ${cupoInfo.kgHoy.toFixed(1)}/${cupoInfo.maxKg} kg` : ""}
                    {" · "}
                    {cupoInfo.cupoTexto}
                  </Text>
                ) : cupoInfo ? (
                  <Text style={styles.cupoMeta}>Cupo legal: {cupoInfo.cupoTexto}</Text>
                ) : null}

                {mostrarId ? (
                  <IdentificarEspecie
                    catalogo={catalogoSeleccion}
                    fotoUri={fotoUri}
                    onElegir={(id) => {
                      setEspecieId(id);
                      setMostrarId(false);
                    }}
                    onCerrar={() => setMostrarId(false)}
                  />
                ) : (
                  <TouchableOpacity style={styles.photoBtn} onPress={() => setMostrarId(true)}>
                    <Text style={styles.photoBtnTxt}>Identificar por rasgos / foto</Text>
                  </TouchableOpacity>
                )}

                <Text style={styles.formLabel}>Sitio guardado</Text>
                {puntos.length === 0 ? (
                  <Text style={styles.hintMini}>
                    Aún no hay sitios. Guárdalos en la pestaña Puntos (GPS, mapa o coords) y vuelve a
                    enlazar capturas aquí.
                  </Text>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                    <TouchableOpacity
                      style={[styles.chip, !puntoSeleccionadoId && styles.chipActive]}
                      onPress={() => {
                        setPuntoSeleccionadoId(null);
                        setCoords(null);
                        setNombreLugar("");
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Sin sitio guardado"
                    >
                      <Text style={[styles.chipText, !puntoSeleccionadoId && styles.chipTextActive]}>
                        Sin sitio
                      </Text>
                    </TouchableOpacity>
                    {puntos.map((p) => (
                      <TouchableOpacity
                        key={p.id}
                        style={[styles.chip, puntoSeleccionadoId === p.id && styles.chipActive]}
                        onPress={() => usarPuntoParaCaptura(p)}
                        accessibilityRole="button"
                        accessibilityLabel={`Usar sitio ${p.nombre}`}
                        accessibilityState={{ selected: puntoSeleccionadoId === p.id }}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            puntoSeleccionadoId === p.id && styles.chipTextActive,
                          ]}
                        >
                          {glyphIconoPunto(p.icono)} {p.nombre}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}

                <Text style={styles.formLabel}>Lugar (opcional)</Text>
                <TextInput
                  style={styles.input}
                  value={nombreLugar}
                  onChangeText={setNombreLugar}
                  placeholder="Ej. Embalse o tramo"
                />

                <Text style={styles.formLabel}>Fecha de la captura</Text>
                <TextInput
                  style={styles.input}
                  value={fechaCaptura}
                  onChangeText={setFechaCaptura}
                  placeholder="AAAA-MM-DD"
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel="Fecha de la captura AAAA-MM-DD"
                />
                <Text style={styles.hintMini}>
                  Misma orilla, otra salida: elige el sitio guardado y cambia solo la fecha.
                </Text>

                <View style={{ flexDirection: "row", gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.formLabel}>Talla (cm)</Text>
                    <TextInput style={styles.input} value={tallaCm} onChangeText={setTallaCm} keyboardType="numeric" placeholder="—" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.formLabel}>Peso (kg)</Text>
                    <TextInput style={styles.input} value={pesoKg} onChangeText={setPesoKg} keyboardType="numeric" placeholder="—" />
                  </View>
                </View>

                <Text style={styles.formLabel}>Notas (opcional)</Text>
                <TextInput style={[styles.input, { height: 60 }]} value={notas} onChangeText={setNotas} multiline placeholder="Señuelo usado, condiciones..." />

                <Text style={styles.formLabel}>Ubicación (opcional)</Text>
                <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
                  <TouchableOpacity style={styles.methodBtn} onPress={anadirUbicacionCapturaGps}>
                    <Text style={styles.methodBtnTxt}>GPS</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.methodBtn} onPress={irAMapaParaCaptura}>
                    <Text style={styles.methodBtnTxt}>Mapa</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.methodBtn}
                    onPress={() => setMostrarCoordsCaptura((v) => !v)}
                  >
                    <Text style={styles.methodBtnTxt}>Coords</Text>
                  </TouchableOpacity>
                </View>
                {puntoSeleccionadoId && coords ? (
                  <Text style={styles.coordsOk}>
                    📍 {nombreLugar || "Sitio"} · {formatearCoords(coords.lat, coords.lng)} · captura en este
                    sitio guardado
                  </Text>
                ) : coords ? (
                  <Text style={styles.coordsOk}>
                    📍 {formatearCoords(coords.lat, coords.lng)} · se enlazará a un punto cercano o se creará uno
                  </Text>
                ) : (
                  <Text style={styles.hintMini}>
                    Elige un sitio guardado arriba, o usa GPS / mapa / coords
                  </Text>
                )}
                {mostrarCoordsCaptura && (
                  <View style={styles.coordsBox}>
                    <View style={{ flexDirection: "row", gap: 10 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.formLabel}>Latitud</Text>
                        <TextInput
                          style={styles.input}
                          value={latCaptura}
                          onChangeText={setLatCaptura}
                          keyboardType="default"
                          placeholder={String(provincia.regionMapa.latitude.toFixed(3))}
                          autoCapitalize="characters"
                          autoCorrect={false}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.formLabel}>Longitud</Text>
                        <TextInput
                          style={styles.input}
                          value={lngCaptura}
                          onChangeText={setLngCaptura}
                          keyboardType="default"
                          placeholder={String(Math.abs(provincia.regionMapa.longitude).toFixed(3))}
                          autoCapitalize="characters"
                          autoCorrect={false}
                        />
                      </View>
                    </View>
                    <Text style={styles.hintMini}>
                      {"Decimal (−5.46) o sexagesimal (5°27'40\" O). La O es oeste."}
                    </Text>
                    <TouchableOpacity style={styles.secondaryBtn} onPress={aplicarCoordsCapturaManual}>
                      <Text style={styles.secondaryBtnTxt}>Usar estas coordenadas</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
                  <TouchableOpacity style={styles.photoBtn} onPress={tomarFotoCamara}>
                    <Text style={styles.photoBtnTxt}>{fotoUri ? "Nueva foto (cámara)" : "Foto con cámara"}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.photoBtn} onPress={elegirFoto}>
                    <Text style={styles.photoBtnTxt}>{fotoUri ? "Cambiar foto" : "Añadir foto"}</Text>
                  </TouchableOpacity>
                </View>
                {fotoUri ? (
                  <Image source={{ uri: fotoUri }} style={styles.fotoPreview} />
                ) : null}

                <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setMostrarFormulario(false);
                      setPuntoSeleccionadoId(null);
                      setCoords(null);
                      setFechaCaptura(new Date().toISOString().slice(0, 10));
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveButton} onPress={handleGuardarCaptura}>
                    <Text style={styles.saveButtonText}>Guardar captura</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <Text style={styles.sectionTitle}>
              Historial ({capturasFiltradas.length}
              {busquedaLista.trim() ? ` · de ${capturas.length}` : ""})
            </Text>
            {capturasFiltradas.length === 0 && (
              <Text style={styles.emptyText}>
                {capturas.length ? "Ninguna captura coincide con la búsqueda." : "Aún no has registrado ninguna captura."}
              </Text>
            )}
            {capturasFiltradas.map((c, i) => {
              const sp = especieInfo(c.especieId);
              const cara = caraDeEspecie(sp);
              const prev = capturasFiltradas[i - 1];
              const showGrupo =
                grupoLista === "dia"
                  ? !prev || prev.fecha !== c.fecha
                  : grupoLista === "sitio"
                    ? !prev || (prev.nombreLugar || "") !== (c.nombreLugar || "")
                    : false;
              const grupoLabel =
                grupoLista === "dia" ? c.fecha : c.nombreLugar?.trim() || "Sin sitio";
              return (
                <ListaAnimada key={c.id} index={i}>
                  <>
                    {showGrupo ? <Text style={styles.grupoTitulo}>{grupoLabel}</Text> : null}
                    <View style={styles.card}>
                      {c.fotoUri ? (
                        <Image source={{ uri: c.fotoUri }} style={styles.fotoCard} />
                      ) : (
                        <LinearGradient colors={[...cara.gradiente]} style={styles.fotoCardPlaceholder}>
                          <Text style={{ fontSize: 36 }}>{cara.emoji}</Text>
                        </LinearGradient>
                      )}
                      <View style={{ padding: 12 }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                          <Text style={styles.cardTitle}>
                            {sp?.icono} {sp?.nombre ?? c.especieId}
                          </Text>
                          <TouchableOpacity
                            onPress={() => {
                              eliminarCaptura(c.id).then(cargar);
                            }}
                          >
                            <Text style={styles.deleteText}>Eliminar</Text>
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.cardMeta}>
                          {c.fecha} {c.nombreLugar ? `· ${c.nombreLugar}` : ""}
                          {c.lat != null && c.lng != null ? ` · ${c.lat.toFixed(3)}, ${c.lng.toFixed(3)}` : ""}
                        </Text>
                        {(c.tallaCm || c.pesoKg) && (
                          <Text style={styles.cardMeta}>
                            {c.tallaCm ? `${c.tallaCm} cm` : ""} {c.pesoKg ? `· ${c.pesoKg} kg` : ""}
                          </Text>
                        )}
                        {c.condiciones ? (
                          <Text style={styles.cardMeta}>
                            Condiciones
                            {c.condiciones.indice != null ? ` · índice ${c.condiciones.indice}` : ""}
                            {c.condiciones.tempAireC != null
                              ? ` · aire ${Math.round(c.condiciones.tempAireC)}°`
                              : ""}
                            {c.condiciones.faseLunar ? ` · ${c.condiciones.faseLunar}` : ""}
                          </Text>
                        ) : null}
                        {c.notas && <Text style={styles.cardNotas}>{c.notas}</Text>}
                        {c.lat != null && c.lng != null ? (
                          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 4 }}>
                            <TouchableOpacity onPress={() => verCapturaEnMapa(c)}>
                              <Text style={styles.verMapaHint}>Ver en el mapa →</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() =>
                                setLlevame({
                                  nombre: c.nombreLugar || sp?.nombre || "Captura",
                                  lat: c.lat!,
                                  lng: c.lng!,
                                })
                              }
                            >
                              <Text style={styles.verMapaHint}>Llévame →</Text>
                            </TouchableOpacity>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </>
                </ListaAnimada>
              );
            })}
          </>
        )}

        {tab === "puntos" && (
          <>
            <Text style={styles.lead}>
              Guarda sitios de {provincia.nombre} (GPS, mapa o coordenadas dentro de la provincia).
              Aparecen en Mapa → Mis sitios y en la capa «Mis puntos».
            </Text>

            <View style={styles.methodRow}>
              <TouchableOpacity style={styles.methodBtnPrimary} onPress={handleGuardarPuntoGps}>
                <Text style={styles.methodBtnPrimaryTxt}>GPS</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.methodBtnPrimary} onPress={irAMapaParaPunto}>
                <Text style={styles.methodBtnPrimaryTxt}>Mapa</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.methodBtnPrimary}
                onPress={() => setMostrarFormPunto((v) => !v)}
              >
                <Text style={styles.methodBtnPrimaryTxt}>Coords</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.hintMini}>
              GPS guarda al instante · Mapa te lleva a tocar el mapa · Coords abre el formulario
            </Text>

            {mostrarFormPunto && (
              <View style={styles.formCard}>
                <Text style={styles.formLabel}>Nombre</Text>
                <TextInput
                  style={styles.input}
                  value={nombrePunto}
                  onChangeText={setNombrePunto}
                  placeholder={nombrePuntoPorDefecto()}
                />
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.formLabel}>Latitud</Text>
                    <TextInput
                      style={styles.input}
                      value={latPunto}
                      onChangeText={setLatPunto}
                      keyboardType="default"
                      placeholder={String(provincia.regionMapa.latitude.toFixed(3))}
                      autoCapitalize="characters"
                      autoCorrect={false}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.formLabel}>Longitud</Text>
                    <TextInput
                      style={styles.input}
                      value={lngPunto}
                      onChangeText={setLngPunto}
                      keyboardType="default"
                      placeholder={String(Math.abs(provincia.regionMapa.longitude).toFixed(3))}
                      autoCapitalize="characters"
                      autoCorrect={false}
                    />
                  </View>
                </View>
                <Text style={styles.hintMini}>
                  {"Decimal (−5.46) o sexagesimal (5°27'40\" O). La O es oeste."}
                </Text>
                <Text style={styles.formLabel}>Notas (opcional)</Text>
                <TextInput
                  style={[styles.input, { height: 56 }]}
                  value={notasPunto}
                  onChangeText={setNotasPunto}
                  multiline
                  placeholder="Acceso, aparcamiento, señuelo…"
                />
                <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setMostrarFormPunto(false);
                      setLatPunto("");
                      setLngPunto("");
                      setNombrePunto("");
                      setNotasPunto("");
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveButton} onPress={handleGuardarPuntoCoords}>
                    <Text style={styles.saveButtonText}>Guardar punto</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <Text style={styles.sectionTitle}>
              Puntos guardados ({puntosFiltrados.length}
              {busquedaLista.trim() ? ` · de ${puntos.length}` : ""})
            </Text>
            {puntosFiltrados.length === 0 && (
              <Text style={styles.emptyText}>
                {puntos.length
                  ? "Ningún punto coincide con la búsqueda."
                  : `Aún no has guardado ningún punto en ${provincia.nombre}. Usa GPS, el mapa o las coordenadas.`}
              </Text>
            )}
            {puntosFiltrados.map((p, i) => {
              const prev = puntosFiltrados[i - 1];
              const diaP = (p.creadoEn || "").slice(0, 10);
              const diaPrev = (prev?.creadoEn || "").slice(0, 10);
              const showGrupo =
                grupoLista === "color"
                  ? !prev || (prev.color || "") !== (p.color || "")
                  : grupoLista === "icono"
                    ? !prev || (prev.icono || "") !== (p.icono || "")
                    : grupoLista === "dia"
                      ? !prev || diaPrev !== diaP
                      : false;
              const grupoLabel =
                grupoLista === "color"
                  ? etiquetaColorPunto(p.color)
                  : grupoLista === "icono"
                    ? `${glyphIconoPunto(p.icono)} ${etiquetaIconoPunto(p.icono)}`
                    : diaP || "Sin fecha";
              return (
                <ListaAnimada key={p.id} index={i}>
                  <>
                    {showGrupo ? <Text style={styles.grupoTitulo}>{grupoLabel}</Text> : null}
                    <TouchableOpacity style={styles.cardPad} onPress={() => verPuntoEnMapa(p)}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                          <View
                            style={[
                              styles.puntoGlyph,
                              { backgroundColor: hexColorPunto(p.color) },
                            ]}
                          >
                            <Text style={styles.puntoGlyphTxt}>{glyphIconoPunto(p.icono)}</Text>
                          </View>
                          <Text style={styles.cardTitle}>{p.nombre}</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => {
                            eliminarPunto(p.id).then(cargar);
                          }}
                        >
                          <Text style={styles.deleteText}>Eliminar</Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.cardMeta}>
                        {p.lat.toFixed(4)}, {p.lng.toFixed(4)}
                      </Text>
                      {p.notas ? <Text style={styles.cardNotas}>{p.notas}</Text> : null}
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 4 }}>
                        <TouchableOpacity
                          onPress={(e) => {
                            e?.stopPropagation?.();
                            usarPuntoParaCaptura(p);
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={`Añadir captura en ${p.nombre}`}
                        >
                          <Text style={[styles.verMapaHint, styles.accionCapturaHint]}>
                            Añadir captura →
                          </Text>
                        </TouchableOpacity>
                        <Text style={styles.verMapaHint}>Ver en el mapa →</Text>
                        <TouchableOpacity
                          onPress={(e) => {
                            e?.stopPropagation?.();
                            setLlevame({ nombre: p.nombre, lat: p.lat, lng: p.lng });
                          }}
                        >
                          <Text style={styles.verMapaHint}>Llévame →</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={(e) => {
                            e?.stopPropagation?.();
                            void compartirUbicacion(p.lat, p.lng, p.nombre);
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={`Compartir enlace de ${p.nombre}`}
                        >
                          <Text style={styles.verMapaHint}>Compartir enlace →</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  </>
                </ListaAnimada>
              );
            })}
          </>
        )}
      </ScrollView>

      <LlevameAlPunto
        visible={!!llevame}
        destino={llevame}
        onCerrar={() => setLlevame(null)}
      />

      <Modal
        visible={pegarKmlVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPegarKmlVisible(false)}
      >
        <View style={styles.pegarKmlBackdrop}>
          <View style={styles.pegarKmlSheet}>
            <Text style={styles.pegarKmlTitulo}>Importar KML</Text>
            <Text style={styles.pegarKmlHint}>
              Abre el .kml (o el .kml dentro del KMZ) y pega aquí el XML. Los waypoints se
              filtrarán a {provincia.nombre}.
            </Text>
            <TextInput
              style={styles.pegarKmlInput}
              value={pegarKmlTexto}
              onChangeText={setPegarKmlTexto}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={'<?xml version="1.0"?>… <kml>…'}
              accessibilityLabel="Pegar contenido KML"
            />
            <View style={styles.pegarKmlAcciones}>
              <TouchableOpacity
                style={styles.pegarKmlCancelar}
                onPress={() => setPegarKmlVisible(false)}
                accessibilityRole="button"
              >
                <Text style={styles.pegarKmlCancelarTxt}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.pegarKmlOk}
                onPress={() => void confirmarPegarKml()}
                disabled={pegandoKml}
                accessibilityRole="button"
                accessibilityLabel="Importar puntos del KML"
              >
                <Text style={styles.pegarKmlOkTxt}>{pegandoKml ? "Importando…" : "Importar"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {!mostrarFormulario ? (
        <TouchableOpacity
          style={styles.fabCaptura}
          onPress={() => {
            setTab("capturas");
            setMostrarFormulario(true);
            void (async () => {
              try {
                await anadirUbicacionCapturaGps();
              } catch {}
              try {
                await tomarFotoCamara();
              } catch {}
            })();
          }}
          accessibilityRole="button"
          accessibilityLabel="Captura rápida: foto, especie y GPS"
        >
          <Text style={styles.fabCapturaTxt}>＋</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fabCaptura: {
    position: 'absolute',
    right: 18,
    bottom: 28,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.water,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    elevation: 6,
    shadowColor: '#0c2c20',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  fabCapturaTxt: { color: '#fff', fontSize: 28, fontWeight: '700', marginTop: -2 },
  pegarKmlBackdrop: {
    flex: 1,
    backgroundColor: "rgba(8,18,14,0.45)",
    justifyContent: "flex-end",
  },
  pegarKmlSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: 18,
    paddingBottom: 28,
  },
  pegarKmlTitulo: { fontSize: 20, fontWeight: "800", color: COLORS.primaryDark },
  pegarKmlHint: { marginTop: 8, fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  pegarKmlInput: {
    marginTop: 14,
    minHeight: 160,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: 12,
    textAlignVertical: "top",
    fontSize: 12,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.background,
  },
  pegarKmlAcciones: { flexDirection: "row", gap: 10, marginTop: 14 },
  pegarKmlCancelar: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pegarKmlCancelarTxt: { fontWeight: "700", color: COLORS.textSecondary },
  pegarKmlOk: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.water,
  },
  pegarKmlOkTxt: { fontWeight: "800", color: "#fff" },

  container: { flex: 1, backgroundColor: COLORS.background },
  tabBar: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    padding: 6,
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: RADIUS.sm, alignItems: "center" },
  tabBtnActive: { backgroundColor: COLORS.primaryLight },
  tabBtnText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: "600" },
  tabBtnTextActive: { color: COLORS.primary },
  content: { flex: 1 },
  lead: { fontSize: 12.5, color: COLORS.textSecondary, lineHeight: 18, marginBottom: 12 },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 13,
    alignItems: "center",
    marginBottom: 16,
  },
  addButtonText: { color: "#fff", fontWeight: "700", fontSize: 13.5 },
  methodRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  methodBtnPrimary: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    alignItems: "center",
  },
  methodBtnPrimaryTxt: { color: "#fff", fontWeight: "700", fontSize: 13 },
  methodBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: COLORS.mist,
  },
  methodBtnTxt: { fontWeight: "700", color: COLORS.textSecondary, fontSize: 12 },
  hintMini: { fontSize: 11.5, color: COLORS.textMuted, marginBottom: 12, lineHeight: 16 },
  coordsOk: { fontSize: 12.5, color: COLORS.success, fontWeight: "600", marginTop: 8 },
  coordsBox: { marginTop: 8 },
  secondaryBtn: {
    marginTop: 10,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.sm,
    paddingVertical: 10,
    alignItems: "center",
  },
  secondaryBtnTxt: { color: COLORS.primaryDark, fontWeight: "700", fontSize: 13 },
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW,
  },
  formLabel: { fontSize: 12, fontWeight: "700", color: COLORS.textSecondary, marginBottom: 6, marginTop: 8 },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13.5,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.textPrimary,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primaryLight,
    marginRight: 8,
  },
  chipActive: { backgroundColor: COLORS.primary },
  chipText: { fontSize: 12.5, color: COLORS.primaryDark },
  chipTextActive: { color: "#fff", fontWeight: "600" },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelButtonText: { color: COLORS.textSecondary, fontWeight: "600" },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    alignItems: "center",
    backgroundColor: COLORS.success,
  },
  saveButtonText: { color: "#fff", fontWeight: "700" },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 10, marginTop: 4 },
  emptyText: { fontSize: 13, color: COLORS.textMuted, fontStyle: "italic", lineHeight: 18 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 0,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    ...SHADOW,
  },
  cardPad: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW,
  },
  cardTitle: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary, flex: 1, paddingRight: 8 },
  cardMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  cardNotas: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4, fontStyle: "italic" },
  verMapaHint: { fontSize: 11.5, color: COLORS.primary, fontWeight: "600", marginTop: 6 },
  accionCapturaHint: { color: COLORS.waterDark, fontWeight: "800" },
  deleteText: { fontSize: 12, color: COLORS.danger, fontWeight: "600" },
  photoBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: COLORS.mist,
  },
  photoBtnTxt: { fontWeight: "700", color: COLORS.textSecondary, fontSize: 12 },
  gpxBtn: {
    backgroundColor: COLORS.water,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  gpxBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  gpxSub: { color: "rgba(255,255,255,0.9)", fontSize: 11, marginTop: 4, textAlign: "center" },
  toolsBox: {
    marginBottom: 14,
    gap: 8,
  },
  toolsTitle: { fontSize: 12, fontWeight: "800", color: COLORS.textMuted, letterSpacing: 0.4, marginBottom: 4 },
  cupoBox: {
    backgroundColor: COLORS.mist,
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cupoTitle: { fontWeight: "800", color: COLORS.textPrimary, fontSize: 13 },
  cupoWarn: { color: COLORS.danger, fontSize: 12, fontWeight: "700", marginTop: 6 },
  cupoMeta: { color: COLORS.textSecondary, fontSize: 11.5, marginTop: 4, lineHeight: 16 },
  fotoPreview: {
    width: "100%",
    height: 160,
    borderRadius: RADIUS.sm,
    marginTop: 10,
  },
  fotoCard: { width: "100%", height: 160 },
  fotoCardPlaceholder: {
    width: "100%",
    height: 110,
    alignItems: "center",
    justifyContent: "center",
  },
  listaTools: { marginTop: 12 },
  ordenRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  ordenChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  ordenChipOn: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  ordenChipTxt: { fontSize: 11, fontWeight: "700", color: COLORS.textSecondary },
  ordenChipTxtOn: { color: COLORS.primaryDark },
  grupoTitulo: {
    marginTop: 12,
    marginBottom: 4,
    fontWeight: "800",
    fontSize: 13,
    color: COLORS.primaryDark,
  },
  puntoGlyph: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  puntoGlyphTxt: { color: "#fff", fontWeight: "800", fontSize: 12 },
});
