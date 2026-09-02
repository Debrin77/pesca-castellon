import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { useFocusEffect, useScrollToTop } from "@react-navigation/native";
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
import BotonMiPosicion from "../components/BotonMiPosicion";
import CapaPoligonosIcv from "../components/CapaPoligonosIcv";
import ListaAnimada from "../components/ListaAnimada";
import { COLORS, RADIUS, SHADOW } from "../theme";

type LatLng = { latitude: number; longitude: number };

interface Props {
  navigation: any;
}

const CASTELLON_REGION = {
  latitude: 40.12,
  longitude: -0.38,
  latitudeDelta: 1.15,
  longitudeDelta: 1.15,
};

export default function ZonasLibresScreen({ navigation }: Props) {
  const resultRef = useRef<ScrollView>(null);
  useScrollToTop(resultRef);
  const tramos = todosLosTramos();
  const [busqueda, setBusqueda] = useState("");
  const [consulta, setConsulta] = useState<ConsultaPesca | null>(null);
  const [marcador, setMarcador] = useState<LatLng | null>(null);
  const [yo, setYo] = useState<LatLng | null>(null);
  const [puntosPersonales, setPuntosPersonales] = useState<PuntoGuardado[]>([]);
  const [capas, setCapas] = useState({ zpl: true, zpc: true, vedado: true, misPuntos: true });
  const [localizando, setLocalizando] = useState(false);
  const [camara, setCamara] = useState<{ latitude: number; longitude: number; zoom: number; nonce: number } | undefined>();

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
        const c = consultarPuntoPesca(loc.lat, loc.lng);
        setConsulta(c);
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
    if (!busqueda.trim()) return [];
    const q = busqueda.toLowerCase();
    return tramos.filter((z) => z.nombre.toLowerCase().includes(q) || z.rio.toLowerCase().includes(q)).slice(0, 6);
  }, [busqueda, tramos]);

  function evaluarTramo(z: TramoOficial) {
    setConsulta(consultarPorTramo(z));
    setMarcador({ latitude: z.lat, longitude: z.lng });
    if (!tramoUsaRadioAnexo(z)) {
      setCamara({ latitude: z.lat, longitude: z.lng, zoom: 15, nonce: Date.now() });
    }
  }

  function evaluarPunto(lat: number, lng: number) {
    setConsulta(consultarPuntoPesca(lat, lng));
    setMarcador({ latitude: lat, longitude: lng });
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
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="Busca un tramo (Arenós, Palancia, Teresa, Sitjar...)"
          placeholderTextColor={COLORS.textMuted}
          value={busqueda}
          onChangeText={setBusqueda}
        />
        {sugerencias.length > 0 && (
          <View style={styles.suggestionsBox}>
            {sugerencias.map((z, i) => (
              <ListaAnimada key={z.id} index={i} replayKey={busqueda}>
              <TouchableOpacity
                style={styles.suggestionRow}
                onPress={() => {
                  setBusqueda(z.nombre);
                  evaluarTramo(z);
                }}
              >
                <Text style={styles.suggestionText}>{z.nombre}</Text>
                <Text style={styles.suggestionMeta}>{z.aprovechamiento}</Text>
              </TouchableOpacity>
              </ListaAnimada>
            ))}
          </View>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.layerBar} contentContainerStyle={{ paddingHorizontal: 12 }}>
        <TouchableOpacity style={[styles.layerChip, capas.zpl && styles.layerChipActive]} onPress={() => toggleCapa("zpl")}>
          <Text style={[styles.layerChipText, capas.zpl && { color: "#2f7d4a" }]}>Libre ZPL</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.layerChip, capas.zpc && styles.layerChipActive]} onPress={() => toggleCapa("zpc")}>
          <Text style={[styles.layerChipText, capas.zpc && { color: "#c45c12" }]}>Coto ZPC</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.layerChip, capas.vedado && styles.layerChipActive]} onPress={() => toggleCapa("vedado")}>
          <Text style={[styles.layerChipText, capas.vedado && { color: "#b42318" }]}>Vedado / reserva</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.layerChip, capas.misPuntos && styles.layerChipActive]} onPress={() => toggleCapa("misPuntos")}>
          <Text style={[styles.layerChipText, capas.misPuntos && styles.layerChipTextActive]}>Mis puntos</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.mapWrap}>
        <MapView
          style={styles.map}
          initialRegion={CASTELLON_REGION}
          fitCoordinates={tramos.map((z) => ({ latitude: z.lat, longitude: z.lng }))}
          cameraTarget={camara}
          onLongPress={(e) => evaluarPunto(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude)}
        >
          <CapaPoligonosIcv zpc={capas.zpc} reservas={capas.vedado} />
          {tramosVisibles.filter(tramoUsaRadioAnexo).map((z) => {
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
          {tramosVisibles.map((z) => (
            <Marker
              key={z.id}
              coordinate={{ latitude: z.lat, longitude: z.lng }}
              pinColor={colorAprovechamiento(z.aprovechamiento)}
              identifier={z.aprovechamiento === "ZPC" ? "coto" : z.aprovechamiento === "ZPL" ? "libre" : "coto"}
              title={`${z.aprovechamiento} · ${z.nombre}`}
              onPress={() => evaluarTramo(z)}
            />
          ))}
          {capas.misPuntos &&
            puntosPersonales.map((p) => (
              <Marker
                key={p.id}
                coordinate={{ latitude: p.lat, longitude: p.lng }}
                pinColor={COLORS.gold}
                identifier="spot"
                title={p.nombre}
                onPress={() => evaluarPunto(p.lat, p.lng)}
              />
            ))}
          {yo && (
            <Marker coordinate={yo} pinColor={COLORS.water} identifier="user" title="Tú" />
          )}
          {marcador && (!yo || marcador.latitude !== yo.latitude) && (
            <Marker coordinate={marcador} pinColor={COLORS.water} identifier="user" title="Punto consultado" />
          )}
        </MapView>
        <BotonMiPosicion onPress={irAMiPosicion} cargando={localizando} />
      </View>

      <ScrollView ref={resultRef} style={styles.resultWrap} contentContainerStyle={{ padding: 14, paddingBottom: 110 }}>
        {consulta ? (
          <ConsultaPescaCard
            consulta={consulta}
            onFicha={
              consulta.tramo?.fichaId
                ? () => navigation.navigate("ZoneDetail", { zoneId: consulta.tramo!.fichaId })
                : undefined
            }
            onAparejos={(id) =>
              navigation.navigate("Aparejos", { screen: "AparejosMain", params: { especieId: id } })
            }
          />
        ) : (
          <Text style={styles.hint}>Pulsa el agua. Cotos y reservas usan el polígono ICV; el resto, el radio del anexo. El recuadro grande te dice si hoy puedes pescar.</Text>
        )}

        {consulta?.tramo && (
          <TouchableOpacity
            style={styles.saveSpotButton}
            onPress={async () => {
              const t = consulta.tramo as TramoOficial;
              await guardarPunto({
                nombre: t.nombre,
                lat: marcador?.latitude ?? t.lat,
                lng: marcador?.longitude ?? t.lng,
                zonaRelacionadaId: t.fichaId ?? t.id,
              });
              setPuntosPersonales(await obtenerPuntosGuardados());
            }}
          >
            <Text style={styles.saveSpotButtonText}>Guardar este punto</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchBox: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8, backgroundColor: COLORS.surface, zIndex: 10 },
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
  suggestionText: { fontSize: 13, color: COLORS.textPrimary, flex: 1, paddingRight: 8 },
  suggestionMeta: { fontSize: 11, color: COLORS.textMuted, fontWeight: "700" },
  mapWrap: { height: 340, position: "relative" },
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
  layerChipText: { fontSize: 12, color: COLORS.textMuted, fontWeight: "700" },
  layerChipTextActive: { color: COLORS.primaryDark, fontWeight: "700" },
  map: { flex: 1 },
  resultWrap: { flex: 1 },
  hint: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19, textAlign: "center", padding: 8 },
  saveSpotButton: {
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.md,
    marginTop: 10,
  },
  saveSpotButtonText: { color: COLORS.primaryDark, fontWeight: "700", fontSize: 13 },
});
