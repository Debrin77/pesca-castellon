import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import MapView, { Marker, Circle } from "../components/map";
import speciesCatalog from "../data/species.json";
import orilla from "../data/especiesOrilla.json";
import { consultarPorTramo, ConsultaPesca, colorAprovechamiento, todosLosTramos, tramoUsaRadioAnexo, TramoOficial } from "../services/consultaPescaService";
import { consultarToqueMapa, avisoSitiosCosta } from "../services/consultaCostaService";
import { obtenerUbicacionActual, solicitarPermisoUbicacion } from "../services/locationService";
import { estaEnVeda } from "../services/vedaService";
import { COLORS, RADIUS, SHADOW } from "../theme";
import BotonMiPosicion from "../components/BotonMiPosicion";
import CapaPoligonosIcv from "../components/CapaPoligonosIcv";
import ListaAnimada from "../components/ListaAnimada";
import SitiosOrientativos from "../components/SitiosOrientativos";
import VentanaConsulta from "../components/VentanaConsulta";
import { sitiosDeTramo } from "../services/sitiosComunidad";
import MejorHoraPesca from "../components/MejorHoraPesca";

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

function TarjetaEspecie({
  sp,
  index,
  enVeda,
  onAparejos,
  extra,
}: {
  sp: any;
  index: number;
  enVeda?: boolean;
  onAparejos?: () => void;
  extra?: React.ReactNode;
}) {
  return (
    <ListaAnimada key={sp.id} index={index} replayKey={sp.id}>
      <View style={[styles.card, (sp.invasora || sp.id === "cangrejo_azul") && styles.cardInvasora]}>
        <Text style={styles.cardTitle}>
          {sp.icono ? `${sp.icono} ` : ""}
          {sp.nombre}{" "}
          {(sp.invasora || sp.id === "cangrejo_azul") && <Text style={styles.badgeInvasora}>INVASORA</Text>}
        </Text>
        <Text style={styles.cardNote}>{sp.nombreCientifico}</Text>
        {sp.tallaCm != null || sp.tallaNota ? (
          <Text style={styles.cardStatus}>
            Talla: {sp.tallaCm != null ? `${sp.tallaCm} cm` : "sin cifra en anexo II"}
            {sp.tallaNota ? ` · ${sp.tallaNota}` : ""}
          </Text>
        ) : null}
        {sp.tallaOficial ? <Text style={styles.cardStatus}>Régimen: {sp.tallaOficial}</Text> : null}
        <Text style={styles.cardText}>{sp.notas}</Text>
        {sp.noConfundirCon ? <Text style={styles.cardText}>No lo confundas con: {sp.noConfundirCon}</Text> : null}
        {sp.motivo ? <Text style={styles.avisoLegalText}>{sp.motivo}</Text> : null}
        <MejorHoraPesca especie={sp} />
        {sp.normativaEspecial && (
          <View style={styles.avisoLegalBox}>
            <Text style={styles.avisoLegalText}>{sp.normativaEspecial}</Text>
          </View>
        )}
        {enVeda != null && (
          <Text style={styles.cardStatus}>
            Estado ahora:{" "}
            <Text style={{ fontWeight: "800", color: enVeda ? COLORS.danger : COLORS.success }}>
              {enVeda ? "EN VEDA" : "Periodo hábil"}
            </Text>
          </Text>
        )}
        {extra}
        {onAparejos ? (
          <TouchableOpacity onPress={onAparejos} style={styles.gearBtn}>
            <Text style={styles.gearLink}>Ver aparejos →</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </ListaAnimada>
  );
}

export default function EspeciesScreen({ navigation }: Props) {
  const tramos = todosLosTramos();
  const [consulta, setConsulta] = useState<ConsultaPesca | null>(null);
  const [marcador, setMarcador] = useState<LatLng | null>(null);
  const [cargandoUbicacion, setCargandoUbicacion] = useState(true);
  const [fichaAbierta, setFichaAbierta] = useState(false);
  const [catalogoAbierto, setCatalogoAbierto] = useState(false);
  const [catalogo, setCatalogo] = useState<"rio" | "mar" | "no">("rio");
  const [camara, setCamara] = useState<{ latitude: number; longitude: number; zoom: number; nonce: number } | undefined>();

  async function usarMiUbicacion() {
    setCargandoUbicacion(true);
    const ok = await solicitarPermisoUbicacion();
    if (ok) {
      const loc = await obtenerUbicacionActual();
      if (loc) {
        const r = consultarToqueMapa(loc.lat, loc.lng);
        setConsulta(r);
        if (r.ambito === "maritimo") setCatalogo("mar");
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
    const r = consultarToqueMapa(lat, lng);
    setConsulta(r);
    setMarcador({ latitude: lat, longitude: lng });
    if (r.ambito === "maritimo") setCatalogo("mar");
    setFichaAbierta(true);
    setCamara({ latitude: lat, longitude: lng, zoom: 13, nonce: Date.now() });
  }

  function evaluarTramo(z: TramoOficial) {
    setConsulta(consultarPorTramo(z));
    setMarcador({ latitude: z.lat, longitude: z.lng });
    setCatalogo("rio");
    setFichaAbierta(true);
  }

  function irAparejos(especieId: string) {
    setFichaAbierta(false);
    setCatalogoAbierto(false);
    navigation.navigate("Aparejos", { screen: "AparejosMain", params: { especieId } });
  }

  const especiesConsulta =
    consulta?.ambito === "maritimo"
      ? (consulta.especiesIds ?? []).map((id) =>
          [...(orilla.pescablesOrilla as any[]), ...(orilla.invasorasOrilla as any[])].find((s) => s.id === id)
        )
      : (consulta?.tramo?.especies ?? []).map((especieId: string) =>
          speciesCatalog.find((s: any) => s.id === especieId)
        );

  return (
    <View style={styles.container}>
      <View style={styles.mapWrap}>
        <MapView
          style={styles.map}
          initialRegion={CASTELLON_REGION}
          cameraTarget={camara}
          onPress={(e) => evaluarPunto(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude)}
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

      <View style={styles.pie}>
        <Text style={styles.hint}>Toca río o playa: las especies se abren a pantalla completa.</Text>
        <View style={styles.pieRow}>
          {consulta && !fichaAbierta ? (
            <TouchableOpacity style={styles.pieBtn} onPress={() => setFichaAbierta(true)}>
              <Text style={styles.pieBtnTxt}>Ver última consulta</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity style={[styles.pieBtn, styles.pieBtnGhost]} onPress={() => setCatalogoAbierto(true)}>
            <Text style={styles.pieBtnGhostTxt}>Catálogo</Text>
          </TouchableOpacity>
        </View>
      </View>

      <VentanaConsulta
        visible={fichaAbierta && !!consulta}
        titulo={consulta?.titulo ?? "Especies"}
        onCerrar={() => setFichaAbierta(false)}
      >
        {consulta ? (
          <>
            {consulta.restriccionesHoy.slice(0, 3).map((r, i) => (
              <Text key={i} style={styles.cardText}>
                {r}
              </Text>
            ))}
            {consulta.especiesHabituales ? (
              <Text style={styles.lead}>{consulta.especiesHabituales}</Text>
            ) : null}
            {consulta.ambito === "maritimo" ? (
              <SitiosOrientativos
                sitios={consulta.sitiosCosta ?? []}
                titulo="Dónde se pesca a caña (uso habitual)"
                aviso={avisoSitiosCosta()}
              />
            ) : consulta.tramo && consulta.veredicto !== "vedado" && consulta.veredicto !== "reserva_trucha" ? (
              <SitiosOrientativos sitios={sitiosDeTramo(consulta.tramo.id)} />
            ) : null}
            {especiesConsulta.filter(Boolean).length === 0 ? (
              <Text style={styles.emptyText}>No hay ficha de especies para este punto. Abre el catálogo.</Text>
            ) : (
              especiesConsulta.filter(Boolean).map((sp: any, i: number) => (
                <TarjetaEspecie
                  key={sp.id}
                  sp={sp}
                  index={i}
                  enVeda={consulta.ambito === "maritimo" ? undefined : estaEnVeda(sp.id)}
                  onAparejos={() => irAparejos(sp.id)}
                />
              ))
            )}
          </>
        ) : null}
      </VentanaConsulta>

      <VentanaConsulta visible={catalogoAbierto} titulo="Catálogo de especies" onCerrar={() => setCatalogoAbierto(false)}>
        <View style={styles.modoBar}>
          <TouchableOpacity style={[styles.modoBtn, catalogo === "rio" && styles.modoBtnOn]} onPress={() => setCatalogo("rio")}>
            <Text style={[styles.modoTxt, catalogo === "rio" && styles.modoTxtOn]}>Ríos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modoBtn, catalogo === "mar" && styles.modoBtnOn]} onPress={() => setCatalogo("mar")}>
            <Text style={[styles.modoTxt, catalogo === "mar" && styles.modoTxtOn]}>Orilla mar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modoBtn, catalogo === "no" && styles.modoBtnOn]} onPress={() => setCatalogo("no")}>
            <Text style={[styles.modoTxt, catalogo === "no" && styles.modoTxtOn]}>No tocar</Text>
          </TouchableOpacity>
        </View>
        {catalogo === "rio" &&
          speciesCatalog.map((sp: any, i: number) => (
            <TarjetaEspecie key={sp.id} sp={sp} index={i} enVeda={estaEnVeda(sp.id)} onAparejos={() => irAparejos(sp.id)} />
          ))}
        {catalogo === "mar" && (
          <>
            <Text style={styles.cardText}>{orilla.fuenteTallas}</Text>
            {orilla.invasorasOrilla.map((sp: any, i: number) => (
              <TarjetaEspecie key={sp.id} sp={sp} index={i} onAparejos={() => irAparejos(sp.id)} />
            ))}
            {orilla.pescablesOrilla.map((sp: any, i: number) => (
              <TarjetaEspecie key={sp.id} sp={sp} index={i} onAparejos={() => irAparejos(sp.id)} />
            ))}
          </>
        )}
        {catalogo === "no" && orilla.noCapturar.map((sp: any, i: number) => <TarjetaEspecie key={sp.id} sp={sp} index={i} />)}
      </VentanaConsulta>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  mapWrap: { flex: 1, position: "relative", minHeight: 220 },
  map: { flex: 1 },
  pie: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 88,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  hint: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19, textAlign: "center" },
  pieRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  pieBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  pieBtnTxt: { color: COLORS.primaryDark, fontWeight: "800", fontSize: 14 },
  pieBtnGhost: { backgroundColor: COLORS.waterLight },
  pieBtnGhostTxt: { color: COLORS.waterDark, fontWeight: "800", fontSize: 14 },
  lead: { fontSize: 16, fontWeight: "700", color: COLORS.waterDark, marginBottom: 12, lineHeight: 22 },
  emptyText: { fontSize: 14, color: COLORS.textMuted, textAlign: "center", marginTop: 16, lineHeight: 20 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW,
  },
  cardInvasora: { borderColor: COLORS.warning, backgroundColor: "#fffaf3" },
  cardTitle: { fontSize: 18, fontWeight: "800", color: COLORS.textPrimary, letterSpacing: -0.3 },
  cardNote: { fontSize: 12, color: COLORS.textMuted, marginTop: 3, fontStyle: "italic" },
  cardText: { fontSize: 15, color: COLORS.textSecondary, marginTop: 6, lineHeight: 22 },
  avisoLegalBox: {
    marginTop: 10,
    backgroundColor: COLORS.dangerLight,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  avisoLegalText: { fontSize: 13, color: "#7a1414", lineHeight: 19, fontWeight: "600", marginTop: 6 },
  cardStatus: { fontSize: 14, color: COLORS.textSecondary, marginTop: 8, lineHeight: 20 },
  badgeInvasora: { fontSize: 11, color: COLORS.warning, fontWeight: "800" },
  gearBtn: { marginTop: 12, alignSelf: "flex-start" },
  gearLink: { fontSize: 15, color: COLORS.water, fontWeight: "800" },
  modoBar: { flexDirection: "row", gap: 6, marginBottom: 14 },
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
  modoBtnOn: { backgroundColor: COLORS.waterDark, borderColor: COLORS.waterDark },
  modoTxt: { fontSize: 13, fontWeight: "700", color: COLORS.textSecondary, textAlign: "center" },
  modoTxtOn: { color: "#fff" },
});
