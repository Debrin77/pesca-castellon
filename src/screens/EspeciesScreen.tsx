import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import MapView, { Marker, Circle } from "../components/map";

type LatLng = { latitude: number; longitude: number };
import zones from "../data/zones.json";
import speciesCatalog from "../data/species.json";
import { buscarZonaMasCercana, ResultadoUbicacion } from "../services/geoService";
import { obtenerUbicacionActual, solicitarPermisoUbicacion } from "../services/locationService";
import { estaEnVeda } from "../services/vedaService";
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

export default function EspeciesScreen({ navigation }: Props) {
  const [resultado, setResultado] = useState<ResultadoUbicacion | null>(null);
  const [marcador, setMarcador] = useState<LatLng | null>(null);
  const [cargandoUbicacion, setCargandoUbicacion] = useState(true);
  const [mostrarCatalogoCompleto, setMostrarCatalogoCompleto] = useState(false);

  async function usarMiUbicacion() {
    setCargandoUbicacion(true);
    const ok = await solicitarPermisoUbicacion();
    if (ok) {
      const loc = await obtenerUbicacionActual();
      if (loc) {
        const r = buscarZonaMasCercana(loc.lat, loc.lng);
        setResultado(r);
        setMarcador({ latitude: loc.lat, longitude: loc.lng });
      }
    }
    setCargandoUbicacion(false);
  }

  useEffect(() => {
    usarMiUbicacion();
  }, []);

  function evaluarPunto(lat: number, lng: number) {
    const r = buscarZonaMasCercana(lat, lng);
    setResultado(r);
    setMarcador({ latitude: lat, longitude: lng });
  }

  return (
    <View style={styles.container}>
      <View style={styles.mapWrap}>
        <MapView
          style={styles.map}
          initialRegion={CASTELLON_REGION}
          fitCoordinates={(zones as any[]).map((z: any) => ({ latitude: z.lat, longitude: z.lng }))}
          onLongPress={(e) => evaluarPunto(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude)}
        >
          {(zones as any[]).map((z) => (
            <Circle
              key={`r-${z.id}`}
              center={{ latitude: z.lat, longitude: z.lng }}
              radius={(z.radioAproxKm || 1.2) * 1000}
              strokeColor={z.estadoZona === "libre_sin_muerte" ? COLORS.success : COLORS.primary}
              fillColor={z.estadoZona === "libre_sin_muerte" ? "rgba(47,125,74,0.16)" : "rgba(22,74,54,0.12)"}
            />
          ))}
          {(zones as any[]).map((z) => (
            <Marker
              key={z.id}
              coordinate={{ latitude: z.lat, longitude: z.lng }}
              pinColor={z.estadoZona === "libre_sin_muerte" ? COLORS.success : COLORS.primary}
              identifier={z.estadoZona === "libre_sin_muerte" ? "libre" : "coto"}
              title={z.nombre}
              onPress={() => evaluarPunto(z.lat, z.lng)}
            />
          ))}
          {marcador && (
            <Marker
              coordinate={marcador}
              pinColor={COLORS.water}
              identifier="user"
              title="Punto consultado"
            />
          )}
        </MapView>
        <TouchableOpacity style={styles.myLocationButton} onPress={usarMiUbicacion}>
          <Text style={styles.myLocationButtonText}>📍 Usar mi ubicación</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.listWrap} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {cargandoUbicacion && !resultado && <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />}

        {resultado?.zona ? (
          <>
            <Text style={styles.zoneHeader}>
              Especies en {resultado.zona.nombre}
              {resultado.dentroDelRadio ? "" : ` (zona más cercana, a ${resultado.distanciaKm?.toFixed(1)} km)`}
            </Text>
            {resultado.zona.especies.map((especieId: string) => {
              const sp = speciesCatalog.find((s: any) => s.id === especieId);
              if (!sp) return null;
              const enVeda = estaEnVeda(especieId);
              return (
                <View key={especieId} style={[styles.card, sp.invasora && styles.cardInvasora]}>
                  <Text style={styles.cardTitle}>
                    {sp.icono} {sp.nombre} {sp.invasora && <Text style={styles.badgeInvasora}>INVASORA</Text>}
                  </Text>
                  <Text style={styles.cardNote}>{sp.nombreCientifico}</Text>
                  <Text style={styles.cardText}>{sp.notas}</Text>
                  {sp.normativaEspecial && (
                    <View style={styles.avisoLegalBox}>
                      <Text style={styles.avisoLegalText}>{sp.normativaEspecial}</Text>
                    </View>
                  )}
                  <Text style={styles.cardStatus}>
                    Estado ahora:{" "}
                    <Text style={{ fontWeight: "bold", color: enVeda ? COLORS.danger : COLORS.success }}>
                      {enVeda ? "EN VEDA" : "Periodo hábil"}
                    </Text>
                  </Text>
                  <TouchableOpacity onPress={() => navigation.navigate("Aparejos", { especieId })}>
                    <Text style={styles.gearLink}>Ver aparejos recomendados →</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </>
        ) : (
          !cargandoUbicacion && (
            <Text style={styles.emptyText}>Toca el mapa o activa tu ubicación para ver las especies de una zona.</Text>
          )
        )}

        <TouchableOpacity
          style={styles.toggleCatalog}
          onPress={() => setMostrarCatalogoCompleto(!mostrarCatalogoCompleto)}
        >
          <Text style={styles.toggleCatalogText}>
            {mostrarCatalogoCompleto ? "▲ Ocultar" : "▼ Ver"} catálogo completo de especies de Castellón
          </Text>
        </TouchableOpacity>

        {mostrarCatalogoCompleto &&
          speciesCatalog.map((sp: any) => (
            <View key={sp.id} style={[styles.card, sp.invasora && styles.cardInvasora]}>
              <Text style={styles.cardTitle}>
                {sp.icono} {sp.nombre} {sp.invasora && <Text style={styles.badgeInvasora}>INVASORA</Text>}
              </Text>
              <Text style={styles.cardNote}>{sp.nombreCientifico}</Text>
              <Text style={styles.cardText}>{sp.notas}</Text>
              {sp.normativaEspecial && (
                <View style={styles.avisoLegalBox}>
                  <Text style={styles.avisoLegalText}>{sp.normativaEspecial}</Text>
                </View>
              )}
            </View>
          ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  mapWrap: { height: 280 },
  map: { flex: 1 },
  myLocationButton: {
    position: "absolute",
    bottom: 10,
    alignSelf: "center",
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    ...SHADOW,
  },
  myLocationButtonText: { fontSize: 12.5, fontWeight: "600", color: COLORS.primary },
  listWrap: { flex: 1 },
  zoneHeader: { fontSize: 15.5, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 10 },
  emptyText: { fontSize: 13, color: COLORS.textMuted, fontStyle: "italic", textAlign: "center", marginTop: 20 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW,
  },
  cardInvasora: { borderColor: COLORS.warning, backgroundColor: "#fffaf3" },
  cardTitle: { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary },
  cardNote: { fontSize: 11, color: COLORS.textMuted, marginTop: 2, fontStyle: "italic" },
  cardText: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  avisoLegalBox: {
    marginTop: 8,
    backgroundColor: COLORS.dangerLight,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  avisoLegalText: { fontSize: 12, color: "#7a1414", lineHeight: 17, fontWeight: "600" },
  cardStatus: { fontSize: 12.5, color: COLORS.textSecondary, marginTop: 6 },
  badgeInvasora: { fontSize: 11, color: COLORS.warning, fontWeight: "bold" },
  gearLink: { fontSize: 12.5, color: COLORS.water, fontWeight: "600", marginTop: 8 },
  toggleCatalog: { alignItems: "center", paddingVertical: 12, marginTop: 8 },
  toggleCatalogText: { color: COLORS.primary, fontWeight: "600", fontSize: 13 },
});
