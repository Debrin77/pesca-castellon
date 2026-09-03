import React, { useMemo, useState, useCallback, useEffect, useLayoutEffect } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import MapView, { Marker, Circle } from "../components/map";
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
import ConsultaPescaCard from "../components/ConsultaPescaCard";
import VentanaConsulta from "../components/VentanaConsulta";
import BotonMiPosicion from "../components/BotonMiPosicion";
import CapaPoligonosIcv from "../components/CapaPoligonosIcv";
import CapaPuertos from "../components/CapaPuertos";
import CapaVedadosCosta from "../components/CapaVedadosCosta";
import ListaAnimada from "../components/ListaAnimada";
import LeyendaMapa from "../components/LeyendaMapa";
import { consultarCosta, consultarToqueMapa, centroZona, todosLosPuertos, todosLosVedadosCosta, todasLasPlayas } from "../services/consultaCostaService";
import { buscarZonas, CUENCAS, SugerenciaBusqueda } from "../services/busquedaService";
import { COLORS, PIN, RADIUS, SHADOW } from "../theme";

type LatLng = { latitude: number; longitude: number };

interface Props {
  navigation: any;
}

const CASTELLON_REGION = {
  latitude: 40.05,
  longitude: -0.02,
  latitudeDelta: 1.25,
  longitudeDelta: 1.25,
};

export default function ZonasLibresScreen({ navigation }: Props) {
  const tramos = todosLosTramos();
  const playas = todasLasPlayas();
  const [busqueda, setBusqueda] = useState("");
  const [consulta, setConsulta] = useState<ConsultaPesca | null>(null);
  const [marcador, setMarcador] = useState<LatLng | null>(null);
  const [yo, setYo] = useState<LatLng | null>(null);
  const [puntosPersonales, setPuntosPersonales] = useState<PuntoGuardado[]>([]);
  const [capas, setCapas] = useState({ zpl: true, zpc: true, vedado: true, misPuntos: true });
  const [localizando, setLocalizando] = useState(false);
  const [modo, setModo] = useState<"continental" | "costa">("continental");
  const [camara, setCamara] = useState<{ latitude: number; longitude: number; zoom: number; nonce: number } | undefined>();
  const [fichaAbierta, setFichaAbierta] = useState(false);
  const [cuencaFiltro, setCuencaFiltro] = useState<string | null>(null);
  const mar = modo === "costa";

  useLayoutEffect(() => {
    navigation.setOptions({
      title: mar ? "Mapa · Costa" : "Mapa",
      headerStyle: { backgroundColor: mar ? COLORS.waterDark : COLORS.primaryDark },
    });
  }, [mar, navigation]);

  useFocusEffect(
    useCallback(() => {
      obtenerPuntosGuardados().then(setPuntosPersonales);
    }, [])
  );

  useEffect(() => {
    let cancelar: (() => void) | undefined;
    (async () => {
      const ok = await solicitarPermisoUbicacion();
      if (!ok) return;
      const loc = await obtenerUbicacionActual();
      if (loc) {
        const pos = { latitude: loc.lat, longitude: loc.lng };
        setYo(pos);
        const c = consultarToqueMapa(loc.lat, loc.lng);
        setConsulta(c);
        if (c.ambito === "maritimo") setModo("costa");
        setMarcador(pos);
      }
      cancelar = await suscribirseUbicacion((lat, lng) => {
        setYo({ latitude: lat, longitude: lng });
      });
    })();
    return () => cancelar?.();
  }, []);

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
    if (!tramoUsaRadioAnexo(z)) {
      setCamara({ latitude: z.lat, longitude: z.lng, zoom: 15, nonce: Date.now() });
    }
  }

  function evaluarPunto(lat: number, lng: number) {
    const r = consultarToqueMapa(lat, lng);
    if (r.ambito === "maritimo") {
      setModo("costa");
      setCamara({ latitude: lat, longitude: lng, zoom: 14, nonce: Date.now() });
    } else {
      setModo("continental");
    }
    mostrarFicha(r);
    setMarcador({ latitude: lat, longitude: lng });
  }

  function evaluarPlaya(id: string) {
    const p = playas.find((x) => x.id === id);
    if (!p) return;
    setModo("costa");
    mostrarFicha(consultarCosta(p.lat, p.lng));
    setMarcador({ latitude: p.lat, longitude: p.lng });
    setCamara({ latitude: p.lat, longitude: p.lng, zoom: 14, nonce: Date.now() });
  }

  function cambiarModo(siguiente: "continental" | "costa") {
    setModo(siguiente);
    if (siguiente === "costa") {
      setCamara({ latitude: 40.05, longitude: 0.12, zoom: 10, nonce: Date.now() });
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
    evaluarPunto(loc.lat, loc.lng);
    setCamara({ latitude: loc.lat, longitude: loc.lng, zoom: 14, nonce: Date.now() });
  }

  return (
    <View style={[styles.container, mar && styles.containerMar]}>
      <View style={[styles.searchBox, mar && styles.searchBoxMar]}>
        <TextInput
          style={styles.searchInput}
          placeholder={
            modo === "costa"
              ? "Busca playa o municipio (Benicàssim, Grao, Nules…)"
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
            {CUENCAS.filter((c) => c !== "Otras").map((c) => (
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

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.layerBar, mar && styles.modoBarMar]} contentContainerStyle={{ paddingHorizontal: 12 }}>
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
      </ScrollView>

      <View style={styles.mapWrap}>
        <MapView
          style={styles.map}
          initialRegion={CASTELLON_REGION}
          cameraTarget={camara}
          accent={mar ? "mar" : "bosque"}
          onPress={(e) => evaluarPunto(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude)}
          onLongPress={(e) => evaluarPunto(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude)}
        >
          <CapaPoligonosIcv zpc={modo === "continental" && capas.zpc} reservas={modo === "continental" && capas.vedado} />
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
        <Text style={styles.hint}>
          {mar
            ? "Pin de agua = playa. Rojo = vedado. Gris = puerto. La ficha se abre a pantalla completa."
            : "Verde = libre. Ámbar = coto. Rojo = vedado. La ficha se abre a pantalla completa."}
        </Text>
        {consulta && !fichaAbierta ? (
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
                navigation.navigate("Aparejos", { screen: "AparejosMain", params: { especieId: id } });
              }}
            />
            {(consulta.tramo || consulta.ambito === "maritimo") && (
              <TouchableOpacity
                style={styles.saveSpotButton}
                onPress={async () => {
                  await guardarPunto({
                    nombre: consulta.titulo,
                    lat: marcador?.latitude ?? 0,
                    lng: marcador?.longitude ?? 0,
                    zonaRelacionadaId: consulta.tramo?.fichaId ?? consulta.tramo?.id,
                  });
                  setPuntosPersonales(await obtenerPuntosGuardados());
                }}
              >
                <Text style={styles.saveSpotButtonText}>Guardar este punto</Text>
              </TouchableOpacity>
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
  searchBox: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 6,
    backgroundColor: COLORS.surface,
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchBoxMar: { backgroundColor: COLORS.surface, borderBottomColor: "#c5dbe4" },
  searchInput: {
    backgroundColor: COLORS.mist,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14.5,
    fontWeight: "500",
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  suggestionsBox: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    marginTop: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW,
  },
  suggestionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  suggestionText: { fontSize: 13.5, color: COLORS.textPrimary, fontWeight: "700" },
  suggestionSub: { fontSize: 11.5, color: COLORS.textMuted, marginTop: 2 },
  suggestionMeta: { fontSize: 10, color: COLORS.textMuted, fontWeight: "700", textTransform: "uppercase" },
  cuencaRow: { paddingTop: 8, paddingBottom: 2, gap: 6 },
  cuencaChip: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.mist,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 6,
  },
  cuencaChipOn: { backgroundColor: COLORS.primaryDark, borderColor: COLORS.primaryDark },
  cuencaTxt: { fontSize: 12, fontWeight: "700", color: COLORS.textPrimary },
  cuencaTxtOn: { color: "#fff" },
  modoBar: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: COLORS.surface,
  },
  modoBarMar: { backgroundColor: COLORS.surface },
  modoBtn: {
    flex: 1,
    minHeight: 42,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.mist,
  },
  modoBtnOnBosque: { backgroundColor: COLORS.primaryDark, borderColor: COLORS.primaryDark },
  modoBtnOnMar: { backgroundColor: COLORS.waterDark, borderColor: COLORS.waterDark },
  modoTxt: { fontSize: 13.5, fontWeight: "700", color: COLORS.textPrimary },
  modoTxtOn: { color: "#fff" },
  mapWrap: { flex: 1, position: "relative", minHeight: 220 },
  layerBar: { maxHeight: 46, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  layerChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.mist,
    marginRight: 8,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  layerChipActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  layerChipMar: { backgroundColor: COLORS.waterLight, borderColor: COLORS.water },
  layerChipText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: "700" },
  layerChipTextActive: { color: COLORS.primaryDark, fontWeight: "800" },
  map: { flex: 1 },
  pieMapa: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 86,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  pieMapaMar: { backgroundColor: COLORS.surface, borderTopColor: "#c5dbe4" },
  hint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
    textAlign: "center",
    fontWeight: "600",
    marginTop: 2,
  },
  reabrir: {
    marginTop: 10,
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.md,
  },
  reabrirMar: { backgroundColor: COLORS.waterLight },
  reabrirTxt: { color: COLORS.primaryDark, fontWeight: "700", fontSize: 14 },
  saveSpotButton: {
    alignItems: "center",
    paddingVertical: 13,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.md,
    marginTop: 12,
  },
  saveSpotButtonText: { color: COLORS.primaryDark, fontWeight: "700", fontSize: 14 },
});
