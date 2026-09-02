import React, { useMemo, useState, useCallback } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, FlatList } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import MapView, { Marker, Circle } from "../components/map";

type LatLng = { latitude: number; longitude: number };
import zones from "../data/zones.json";
import { buscarZonaMasCercana, ResultadoUbicacion } from "../services/geoService";
import { estaEnVeda } from "../services/vedaService";
import { obtenerPuntosGuardados, guardarPunto, PuntoGuardado } from "../services/storageService";
import LicenseBanner from "../components/LicenseBanner";
import { COLORS, RADIUS, SHADOW } from "../theme";

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
  const [busqueda, setBusqueda] = useState("");
  const [resultado, setResultado] = useState<ResultadoUbicacion | null>(null);
  const [marcador, setMarcador] = useState<LatLng | null>(null);
  const [puntosPersonales, setPuntosPersonales] = useState<PuntoGuardado[]>([]);
  const [capas, setCapas] = useState({ cotos: true, libres: true, misPuntos: true });

  useFocusEffect(
    useCallback(() => {
      obtenerPuntosGuardados().then(setPuntosPersonales);
    }, [])
  );

  function toggleCapa(capa: keyof typeof capas) {
    setCapas((prev) => ({ ...prev, [capa]: !prev[capa] }));
  }

  const zonasVisibles = useMemo(() => {
    return (zones as any[]).filter((z) => {
      if (z.estadoZona === "libre_sin_muerte") return capas.libres;
      return capas.cotos;
    });
  }, [capas]);

  const sugerencias = useMemo(() => {
    if (!busqueda.trim()) return [];
    const q = busqueda.toLowerCase();
    return (zones as any[]).filter((z) => z.nombre.toLowerCase().includes(q) || z.rio.toLowerCase().includes(q)).slice(0, 6);
  }, [busqueda]);

  function evaluarPunto(lat: number, lng: number) {
    const r = buscarZonaMasCercana(lat, lng);
    setResultado(r);
    setMarcador({ latitude: lat, longitude: lng });
  }

  function seleccionarSugerencia(zona: any) {
    setBusqueda(zona.nombre);
    evaluarPunto(zona.lat, zona.lng);
  }

  const estado: "adecuada" | "libre_desconocida" | "vedada_ahora" | null = resultado
    ? resultado.dentroDelRadio
      ? (resultado.zona.especies as string[]).every((e: string) => estaEnVeda(e))
        ? "vedada_ahora"
        : "adecuada"
      : "libre_desconocida"
    : null;

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="Busca una zona (ej. Arenós, Palancia, Teresa...)"
          placeholderTextColor={COLORS.textMuted}
          value={busqueda}
          onChangeText={setBusqueda}
        />
        {sugerencias.length > 0 && (
          <View style={styles.suggestionsBox}>
            {sugerencias.map((z) => (
              <TouchableOpacity key={z.id} style={styles.suggestionRow} onPress={() => seleccionarSugerencia(z)}>
                <Text style={styles.suggestionText}>{z.nombre}</Text>
                <Text style={styles.suggestionMeta}>{z.estadoZona === "libre_sin_muerte" ? "🟢 Libre" : "🔵 Coto"}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.layerBar} contentContainerStyle={{ paddingHorizontal: 12 }}>
        <TouchableOpacity style={[styles.layerChip, capas.cotos && styles.layerChipActive]} onPress={() => toggleCapa("cotos")}>
          <Text style={[styles.layerChipText, capas.cotos && styles.layerChipTextActive]}>🔵 Cotos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.layerChip, capas.libres && styles.layerChipActive]} onPress={() => toggleCapa("libres")}>
          <Text style={[styles.layerChipText, capas.libres && styles.layerChipTextActive]}>🟢 Libres</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.layerChip, capas.misPuntos && styles.layerChipActive]} onPress={() => toggleCapa("misPuntos")}>
          <Text style={[styles.layerChipText, capas.misPuntos && styles.layerChipTextActive]}>⭐ Mis puntos</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.mapWrap}>
        <MapView
          style={styles.map}
          initialRegion={CASTELLON_REGION}
          fitCoordinates={(zones as any[]).map((z: any) => ({ latitude: z.lat, longitude: z.lng }))}
          onLongPress={(e) => evaluarPunto(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude)}
        >
          {zonasVisibles.map((z) => (
            <Circle
              key={`r-${z.id}`}
              center={{ latitude: z.lat, longitude: z.lng }}
              radius={(z.radioAproxKm || 1.2) * 1000}
              strokeColor={z.estadoZona === "libre_sin_muerte" ? COLORS.success : COLORS.primary}
              fillColor={z.estadoZona === "libre_sin_muerte" ? "rgba(47,125,74,0.16)" : "rgba(22,74,54,0.12)"}
            />
          ))}
          {zonasVisibles.map((z) => (
            <Marker
              key={z.id}
              coordinate={{ latitude: z.lat, longitude: z.lng }}
              pinColor={z.estadoZona === "libre_sin_muerte" ? COLORS.success : COLORS.primary}
              identifier={z.estadoZona === "libre_sin_muerte" ? "libre" : "coto"}
              title={z.nombre}
              onPress={() => evaluarPunto(z.lat, z.lng)}
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
          {marcador && (
            <Marker
              coordinate={marcador}
              pinColor={COLORS.water}
              identifier="user"
              title="Tu punto marcado"
            />
          )}
        </MapView>
        <Text style={styles.mapHint}>Mantén pulsado el mapa para chequear cualquier punto</Text>
      </View>

      <ScrollView style={styles.resultWrap} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <LicenseBanner onPress={() => navigation.navigate("License")} />

        {estado && resultado?.zona && (
          <View
            style={[
              styles.statusCard,
              estado === "adecuada" && { backgroundColor: COLORS.primaryLight, borderColor: COLORS.success },
              estado === "vedada_ahora" && { backgroundColor: COLORS.dangerLight, borderColor: COLORS.danger },
              estado === "libre_desconocida" && { backgroundColor: COLORS.waterLight, borderColor: COLORS.water },
            ]}
          >
            <Text style={styles.statusIcon}>
              {estado === "adecuada" ? "✅" : estado === "vedada_ahora" ? "⛔" : "🌊"}
            </Text>
            <Text style={styles.statusTitle}>
              {estado === "adecuada" && `Zona adecuada: ${resultado.zona.nombre}`}
              {estado === "vedada_ahora" && `Vedada ahora: ${resultado.zona.nombre}`}
              {estado === "libre_desconocida" &&
                `Fuera de coto conocido (el más cercano es ${resultado.zona.nombre}, a ${resultado.distanciaKm?.toFixed(1)} km)`}
            </Text>
            {estado === "libre_desconocida" && (
              <Text style={styles.statusSubtitle}>
                Puede ser agua libre, pero revisa la normativa general y la señalización del lugar.
              </Text>
            )}
          </View>
        )}

        {resultado?.zona && (
          <>
            <TouchableOpacity
              style={styles.detailButton}
              onPress={() => navigation.navigate("ZoneDetail", { zoneId: resultado.zona.id })}
            >
              <Text style={styles.detailButtonText}>Ver ficha completa de {resultado.zona.nombre} →</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveSpotButton}
              onPress={async () => {
                await guardarPunto({
                  nombre: resultado.zona.nombre,
                  lat: resultado.zona.lat,
                  lng: resultado.zona.lng,
                  zonaRelacionadaId: resultado.zona.id,
                });
                const actualizados = await obtenerPuntosGuardados();
                setPuntosPersonales(actualizados);
              }}
            >
              <Text style={styles.saveSpotButtonText}>⭐ Guardar como punto favorito</Text>
            </TouchableOpacity>
          </>
        )}

        <Text style={styles.sectionTitle}>🌊 Todas las zonas libres registradas</Text>
        {(zones as any[])
          .filter((z) => z.estadoZona === "libre_sin_muerte")
          .map((z) => (
            <TouchableOpacity key={z.id} style={styles.zoneRow} onPress={() => evaluarPunto(z.lat, z.lng)}>
              <Text style={styles.zoneRowName}>{z.nombre}</Text>
              <Text style={styles.zoneRowMeta}>{z.rio}</Text>
            </TouchableOpacity>
          ))}
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
  suggestionText: { fontSize: 13, color: COLORS.textPrimary },
  suggestionMeta: { fontSize: 11, color: COLORS.textMuted },
  mapWrap: { height: 300 },
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
  layerChipActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  layerChipText: { fontSize: 12, color: COLORS.textMuted },
  layerChipTextActive: { color: COLORS.primaryDark, fontWeight: "700" },
  map: { flex: 1 },
  mapHint: { fontSize: 10.5, color: COLORS.textMuted, textAlign: "center", paddingVertical: 4, backgroundColor: COLORS.surface },
  resultWrap: { flex: 1 },
  statusCard: {
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1.5,
    alignItems: "center",
    marginBottom: 10,
    ...SHADOW,
  },
  statusIcon: { fontSize: 26, marginBottom: 4 },
  statusTitle: { fontSize: 13.5, fontWeight: "700", textAlign: "center", color: COLORS.textPrimary },
  statusSubtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 6, textAlign: "center" },
  detailButton: { alignItems: "center", paddingVertical: 10, marginBottom: 6 },
  detailButtonText: { color: COLORS.water, fontWeight: "600", fontSize: 13 },
  saveSpotButton: {
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.md,
    marginBottom: 10,
  },
  saveSpotButtonText: { color: COLORS.primaryDark, fontWeight: "700", fontSize: 13 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary, marginTop: 14, marginBottom: 8 },
  zoneRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  zoneRowName: { fontSize: 13.5, fontWeight: "600", color: COLORS.textPrimary },
  zoneRowMeta: { fontSize: 12, color: COLORS.textSecondary },
});
