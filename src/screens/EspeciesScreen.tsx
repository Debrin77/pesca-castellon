import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useScrollToTop } from "@react-navigation/native";
import MapView, { Marker, Circle } from "../components/map";
import speciesCatalog from "../data/species.json";
import orilla from "../data/especiesOrilla.json";
import { consultarPuntoPesca, consultarPorTramo, ConsultaPesca, colorAprovechamiento, todosLosTramos, tramoUsaRadioAnexo, TramoOficial } from "../services/consultaPescaService";
import { obtenerUbicacionActual, solicitarPermisoUbicacion } from "../services/locationService";
import { estaEnVeda } from "../services/vedaService";
import { COLORS, RADIUS, SHADOW } from "../theme";
import BotonMiPosicion from "../components/BotonMiPosicion";
import CapaPoligonosIcv from "../components/CapaPoligonosIcv";
import ListaAnimada from "../components/ListaAnimada";
import SitiosOrientativos from "../components/SitiosOrientativos";
import { sitiosDeTramo } from "../services/sitiosComunidad";
import MejorHoraPesca from "../components/MejorHoraPesca";

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

export default function EspeciesScreen({ navigation }: Props) {
  const listRef = useRef<ScrollView>(null);
  useScrollToTop(listRef);
  const tramos = todosLosTramos();
  const [consulta, setConsulta] = useState<ConsultaPesca | null>(null);
  const [marcador, setMarcador] = useState<LatLng | null>(null);
  const [cargandoUbicacion, setCargandoUbicacion] = useState(true);
  const [mostrarCatalogoCompleto, setMostrarCatalogoCompleto] = useState(false);
  const [catalogo, setCatalogo] = useState<"rio" | "mar" | "no">("rio");
  const [camara, setCamara] = useState<{ latitude: number; longitude: number; zoom: number; nonce: number } | undefined>();

  async function usarMiUbicacion() {
    setCargandoUbicacion(true);
    const ok = await solicitarPermisoUbicacion();
    if (ok) {
      const loc = await obtenerUbicacionActual();
      if (loc) {
        const r = consultarPuntoPesca(loc.lat, loc.lng);
        setConsulta(r);
        setMarcador({ latitude: loc.lat, longitude: loc.lng });
        setCamara({ latitude: loc.lat, longitude: loc.lng, zoom: 13, nonce: Date.now() });
      }
    }
    setCargandoUbicacion(false);
  }

  useEffect(() => {
    usarMiUbicacion();
  }, []);

  function evaluarPunto(lat: number, lng: number) {
    const r = consultarPuntoPesca(lat, lng);
    setConsulta(r);
    setMarcador({ latitude: lat, longitude: lng });
  }

  function evaluarTramo(z: TramoOficial) {
    setConsulta(consultarPorTramo(z));
    setMarcador({ latitude: z.lat, longitude: z.lng });
  }

  return (
    <View style={styles.container}>
      <View style={styles.mapWrap}>
        <MapView
          style={styles.map}
          initialRegion={CASTELLON_REGION}
          fitCoordinates={tramos.map((z) => ({ latitude: z.lat, longitude: z.lng }))}
          cameraTarget={camara}
          onLongPress={(e) => evaluarPunto(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude)}
        >
          <CapaPoligonosIcv />
          {tramos.filter(tramoUsaRadioAnexo).map((z) => (
            <Circle
              key={`r-${z.id}`}
              center={{ latitude: z.lat, longitude: z.lng }}
              radius={z.radioKm * 1000}
              strokeColor={colorAprovechamiento(z.aprovechamiento)}
              fillColor={colorAprovechamiento(z.aprovechamiento) + "33"}
            />
          ))}
          {tramos.map((z) => (
            <Marker
              key={z.id}
              coordinate={{ latitude: z.lat, longitude: z.lng }}
              pinColor={colorAprovechamiento(z.aprovechamiento)}
              identifier={z.aprovechamiento === "ZPL" ? "libre" : "coto"}
              title={z.nombre}
              onPress={() => evaluarTramo(z)}
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
        <BotonMiPosicion onPress={usarMiUbicacion} cargando={cargandoUbicacion} />
      </View>

      <ScrollView ref={listRef} style={styles.listWrap} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {cargandoUbicacion && !consulta && <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />}

        {consulta ? (
          <>
            <Text style={styles.zoneHeader}>{consulta.titulo}</Text>
            {consulta.restriccionesHoy.slice(0, 2).map((r, i) => (
              <Text key={i} style={styles.cardText}>{r}</Text>
            ))}
            {consulta.tramo && consulta.veredicto !== "vedado" && consulta.veredicto !== "reserva_trucha" ? (
              <SitiosOrientativos sitios={sitiosDeTramo(consulta.tramo.id)} />
            ) : null}
            {(consulta.tramo?.especies ?? []).map((especieId: string, i: number) => {
              const sp = speciesCatalog.find((s: any) => s.id === especieId);
              if (!sp) return null;
              const enVeda = estaEnVeda(especieId);
              return (
                <ListaAnimada key={especieId} index={i}>
                <View style={[styles.card, sp.invasora && styles.cardInvasora]}>
                  <Text style={styles.cardTitle}>
                    {sp.nombre} {sp.invasora && <Text style={styles.badgeInvasora}>INVASORA</Text>}
                  </Text>
                  <Text style={styles.cardNote}>{sp.nombreCientifico}</Text>
                  <Text style={styles.cardText}>{sp.notas}</Text>
                  <MejorHoraPesca especie={sp} />
                  {sp.tallaOficial ? <Text style={styles.cardStatus}>Régimen: {sp.tallaOficial}</Text> : null}
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
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate("Aparejos", { screen: "AparejosMain", params: { especieId } })
                    }
                  >
                    <Text style={styles.gearLink}>Ver aparejos recomendados →</Text>
                  </TouchableOpacity>
                </View>
                </ListaAnimada>
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
            {mostrarCatalogoCompleto ? "▲ Ocultar" : "▼ Ver"} catálogo de especies
          </Text>
        </TouchableOpacity>

        {mostrarCatalogoCompleto && (
          <View style={styles.modoBar}>
            <TouchableOpacity style={[styles.modoBtn, catalogo === "rio" && styles.modoBtnOn]} onPress={() => setCatalogo("rio")}>
              <Text style={[styles.modoTxt, catalogo === "rio" && styles.modoTxtOn]}>Ríos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modoBtn, catalogo === "mar" && styles.modoBtnOn]} onPress={() => setCatalogo("mar")}>
              <Text style={[styles.modoTxt, catalogo === "mar" && styles.modoTxtOn]}>Orilla mar (20)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modoBtn, catalogo === "no" && styles.modoBtnOn]} onPress={() => setCatalogo("no")}>
              <Text style={[styles.modoTxt, catalogo === "no" && styles.modoTxtOn]}>No tocar</Text>
            </TouchableOpacity>
          </View>
        )}

        {mostrarCatalogoCompleto && catalogo === "rio" &&
          speciesCatalog.map((sp: any, i: number) => (
            <ListaAnimada key={sp.id} index={i} replayKey={`cat-${sp.id}`}>
            <View style={[styles.card, sp.invasora && styles.cardInvasora]}>
              <Text style={styles.cardTitle}>
                {sp.icono} {sp.nombre} {sp.invasora && <Text style={styles.badgeInvasora}>INVASORA</Text>}
              </Text>
              <Text style={styles.cardNote}>{sp.nombreCientifico}</Text>
              <Text style={styles.cardText}>{sp.notas}</Text>
              <MejorHoraPesca especie={sp} />
              {sp.normativaEspecial && (
                <View style={styles.avisoLegalBox}>
                  <Text style={styles.avisoLegalText}>{sp.normativaEspecial}</Text>
                </View>
              )}
            </View>
            </ListaAnimada>
          ))}

        {mostrarCatalogoCompleto && catalogo === "mar" && (
          <>
            <Text style={styles.cardText}>{orilla.fuenteTallas}</Text>
            {orilla.invasorasOrilla.map((sp: any, i: number) => (
              <ListaAnimada key={sp.id} index={i} replayKey={sp.id}>
                <View style={[styles.card, styles.cardInvasora]}>
                  <Text style={styles.cardTitle}>{sp.nombre} <Text style={styles.badgeInvasora}>INVASORA</Text></Text>
                  <Text style={styles.cardNote}>{sp.nombreCientifico}</Text>
                  <Text style={styles.cardText}>{sp.notas}</Text>
                  <Text style={styles.cardStatus}>Régimen: {sp.tallaOficial}</Text>
                  <MejorHoraPesca especie={sp} />
                </View>
              </ListaAnimada>
            ))}
            {orilla.pescablesOrilla.map((sp: any, i: number) => (
              <ListaAnimada key={sp.id} index={i} replayKey={sp.id}>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>{i + 1}. {sp.nombre}</Text>
                  <Text style={styles.cardNote}>{sp.nombreCientifico}</Text>
                  <Text style={styles.cardStatus}>
                    Talla mínima: {sp.tallaCm != null ? `${sp.tallaCm} cm` : "sin cifra en el anexo II"} · {sp.tallaNota}
                  </Text>
                  <Text style={styles.cardText}>{sp.notas}</Text>
                  <Text style={styles.cardText}>No lo confundas con: {sp.noConfundirCon}</Text>
                  <MejorHoraPesca especie={sp} />
                </View>
              </ListaAnimada>
            ))}
          </>
        )}

        {mostrarCatalogoCompleto && catalogo === "no" &&
          orilla.noCapturar.map((sp: any, i: number) => (
            <ListaAnimada key={sp.id} index={i} replayKey={sp.id}>
              <View style={[styles.card, styles.avisoLegalBox]}>
                <Text style={styles.cardTitle}>{sp.nombre}</Text>
                <Text style={styles.cardNote}>{sp.nombreCientifico}</Text>
                <Text style={styles.avisoLegalText}>{sp.motivo}</Text>
              </View>
            </ListaAnimada>
          ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  mapWrap: { height: 280, position: "relative" },
  map: { flex: 1 },
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
  modoBar: { flexDirection: "row", gap: 6, marginBottom: 10 },
  modoBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  modoBtnOn: { backgroundColor: COLORS.primaryDark, borderColor: COLORS.primaryDark },
  modoTxt: { fontSize: 13, fontWeight: "700", color: COLORS.textSecondary, textAlign: "center" },
  modoTxtOn: { color: "#fff" },
});
