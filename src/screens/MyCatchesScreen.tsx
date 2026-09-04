import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from "react-native";
import { useFocusEffect, useScrollToTop } from "@react-navigation/native";
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
import {
  cancelarPickUbicacion,
  consumirPickUbicacion,
  iniciarPickUbicacion,
} from "../services/ubicacionPendiente";
import { caraDeEspecie } from "../data/carasVisuales";
import { COLORS, RADIUS, SHADOW } from "../theme";
import ListaAnimada from "../components/ListaAnimada";
import IdentificarEspecie from "../components/IdentificarEspecie";
import SelectorModalidad from "../components/SelectorModalidad";
import { LinearGradient } from "expo-linear-gradient";

type Tab = "favoritos" | "puntos" | "capturas";

interface Props {
  navigation: any;
}

function nombrePuntoPorDefecto(): string {
  return `Punto del ${new Date().toLocaleDateString("es-ES")}`;
}

export default function MyCatchesScreen({ navigation }: Props) {
  const { provincia: provinciaCtx } = useProvincia();
  const provincia = provinciaCtx ?? getProvinciaActiva();
  const speciesCatalog = provincia.species as any[];
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);
  const [tab, setTab] = useState<Tab>("favoritos");
  const [puntos, setPuntos] = useState<PuntoGuardado[]>([]);
  const [capturas, setCapturas] = useState<Captura[]>([]);
  const [favoritos, setFavoritos] = useState<FavoritoZona[]>([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarId, setMostrarId] = useState(false);

  const [especieId, setEspecieId] = useState(speciesCatalog[0]?.id ?? "");
  const [nombreLugar, setNombreLugar] = useState("");
  const [tallaCm, setTallaCm] = useState("");
  const [pesoKg, setPesoKg] = useState("");
  const [notas, setNotas] = useState("");
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [modalidad, setModalidad] = useState<ModalidadPesca>("orilla_continental");
  const [cupoInfo, setCupoInfo] = useState<CupoEspecieInfo | null>(null);
  const [mostrarCoordsCaptura, setMostrarCoordsCaptura] = useState(false);
  const [latCaptura, setLatCaptura] = useState("");
  const [lngCaptura, setLngCaptura] = useState("");

  const [mostrarFormPunto, setMostrarFormPunto] = useState(false);
  const [nombrePunto, setNombrePunto] = useState("");
  const [notasPunto, setNotasPunto] = useState("");
  const [latPunto, setLatPunto] = useState("");
  const [lngPunto, setLngPunto] = useState("");

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
        setTab("capturas");
        setMostrarFormulario(true);
        setCoords({ lat: elegidaCaptura.lat, lng: elegidaCaptura.lng });
        setNombreLugar((prev) => prev || elegidaCaptura.etiqueta || "");
      }
    }, [cargar])
  );

  useEffect(() => {
    const sp = speciesCatalog.find((s: any) => s.id === especieId);
    void resumenCupoHoy(especieId, sp?.cupo).then(setCupoInfo);
  }, [especieId, capturas, speciesCatalog]);

  useEffect(() => {
    setEspecieId(speciesCatalog[0]?.id ?? "");
    setModalidad(provincia.continentalOnly ? "orilla_continental" : "orilla_continental");
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

  async function handleGuardarCaptura() {
    await guardarCaptura({
      especieId,
      fecha: new Date().toISOString().slice(0, 10),
      nombreLugar: nombreLugar || undefined,
      tallaCm: tallaCm ? parseFloat(tallaCm) : null,
      pesoKg: pesoKg ? parseFloat(pesoKg) : null,
      notas: notas || undefined,
      fotoUri: fotoUri || null,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      modalidad,
    });
    setNombreLugar("");
    setTallaCm("");
    setPesoKg("");
    setNotas("");
    setFotoUri(null);
    setCoords(null);
    setLatCaptura("");
    setLngCaptura("");
    setMostrarCoordsCaptura(false);
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
    setCoords(loc);
    setMostrarCoordsCaptura(false);
  }

  function aplicarCoordsCapturaManual() {
    const r = parsearLatLng(latCaptura, lngCaptura);
    if (!r.ok) {
      Alert.alert("Coordenadas", r.error);
      return;
    }
    setCoords(r.coords);
    setMostrarCoordsCaptura(false);
  }

  function irAMapaParaCaptura() {
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
    await guardarPunto({
      nombre: nombrePunto.trim() || nombrePuntoPorDefecto(),
      lat: loc.lat,
      lng: loc.lng,
      notas: notasPunto.trim() || undefined,
    });
    setNombrePunto("");
    setNotasPunto("");
    setMostrarFormPunto(false);
    cargar();
    Alert.alert("Punto guardado", `GPS: ${formatearCoords(loc.lat, loc.lng)}`);
  }

  async function handleGuardarPuntoCoords() {
    const r = parsearLatLng(latPunto, lngPunto);
    if (!r.ok) {
      Alert.alert("Coordenadas", r.error);
      return;
    }
    await guardarPunto({
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
    cargar();
    Alert.alert("Punto guardado", formatearCoords(r.coords.lat, r.coords.lng));
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

  function especieInfo(id: string) {
    return speciesCatalog.find((s: any) => s.id === id);
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
          {cupoInfo ? (
            <View style={styles.cupoBox}>
              <Text style={styles.cupoTitle}>Cupo del día · {speciesCatalog.find((s: any) => s.id === especieId)?.nombre ?? especieId}</Text>
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
                Aún no tienes favoritos. Abre una ficha (Arenós, Sichar…) y toca la estrella.
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
                  onChange={setModalidad}
                  filtroAmbito={provincia.continentalOnly ? "continental" : "ambos"}
                />
                <Text style={styles.formLabel}>Especie</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                  {speciesCatalog.map((s: any) => (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.chip, especieId === s.id && styles.chipActive]}
                      onPress={() => setEspecieId(s.id)}
                    >
                      <Text style={[styles.chipText, especieId === s.id && styles.chipTextActive]}>
                        {s.icono} {s.nombre}
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
                    catalogo={speciesCatalog}
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

                <Text style={styles.formLabel}>Lugar (opcional)</Text>
                <TextInput style={styles.input} value={nombreLugar} onChangeText={setNombreLugar} placeholder="Ej. Embalse de Arenós" />

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
                {coords ? (
                  <Text style={styles.coordsOk}>📍 {formatearCoords(coords.lat, coords.lng)}</Text>
                ) : (
                  <Text style={styles.hintMini}>Sin ubicación · elige GPS, mapa o coordenadas</Text>
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
                          keyboardType="numbers-and-punctuation"
                          placeholder="39.986"
                          autoCapitalize="none"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.formLabel}>Longitud</Text>
                        <TextInput
                          style={styles.input}
                          value={lngCaptura}
                          onChangeText={setLngCaptura}
                          keyboardType="numbers-and-punctuation"
                          placeholder="-0.049"
                          autoCapitalize="none"
                        />
                      </View>
                    </View>
                    <TouchableOpacity style={styles.secondaryBtn} onPress={aplicarCoordsCapturaManual}>
                      <Text style={styles.secondaryBtnTxt}>Usar estas coordenadas</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
                  <TouchableOpacity style={styles.photoBtn} onPress={elegirFoto}>
                    <Text style={styles.photoBtnTxt}>{fotoUri ? "Cambiar foto" : "Añadir foto"}</Text>
                  </TouchableOpacity>
                </View>
                {fotoUri ? (
                  <Image source={{ uri: fotoUri }} style={styles.fotoPreview} />
                ) : null}

                <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setMostrarFormulario(false)}>
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveButton} onPress={handleGuardarCaptura}>
                    <Text style={styles.saveButtonText}>Guardar captura</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <Text style={styles.sectionTitle}>Historial ({capturas.length})</Text>
            {capturas.length === 0 && <Text style={styles.emptyText}>Aún no has registrado ninguna captura.</Text>}
            {capturas.map((c, i) => {
              const sp = especieInfo(c.especieId);
              const cara = caraDeEspecie(sp);
              return (
                <ListaAnimada key={c.id} index={i}>
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
                      {c.notas && <Text style={styles.cardNotas}>{c.notas}</Text>}
                    </View>
                  </View>
                </ListaAnimada>
              );
            })}
          </>
        )}

        {tab === "puntos" && (
          <>
            <Text style={styles.lead}>
              Guarda sitios de {provincia.nombre} para volver otro día: por GPS del teléfono, pulsando el mapa o
              escribiendo latitud y longitud. Cada provincia tiene su propia lista.
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
                      keyboardType="numbers-and-punctuation"
                      placeholder={provincia.id === "sevilla" ? "37.389" : "39.986"}
                      autoCapitalize="none"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.formLabel}>Longitud</Text>
                    <TextInput
                      style={styles.input}
                      value={lngPunto}
                      onChangeText={setLngPunto}
                      keyboardType="numbers-and-punctuation"
                      placeholder={provincia.id === "sevilla" ? "-5.985" : "-0.049"}
                      autoCapitalize="none"
                    />
                  </View>
                </View>
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

            <Text style={styles.sectionTitle}>Puntos guardados ({puntos.length})</Text>
            {puntos.length === 0 && (
              <Text style={styles.emptyText}>
                Aún no has guardado ningún punto en {provincia.nombre}. Usa GPS, el mapa o las coordenadas.
              </Text>
            )}
            {puntos.map((p, i) => (
              <ListaAnimada key={p.id} index={i}>
                <TouchableOpacity style={styles.cardPad} onPress={() => verPuntoEnMapa(p)}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={styles.cardTitle}>{p.nombre}</Text>
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
                  <Text style={styles.verMapaHint}>Ver en el mapa →</Text>
                </TouchableOpacity>
              </ListaAnimada>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
