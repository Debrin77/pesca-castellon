import React, { useEffect, useLayoutEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
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

type LatLng = { latitude: number; longitude: number };

interface Props {
  navigation: any;
}

function camaraProvincia(region: { latitude: number; longitude: number }) {
  return { latitude: region.latitude, longitude: region.longitude, zoom: 9, nonce: Date.now() };
}

export default function EspeciesScreen({ navigation }: Props) {
  const { provincia: provinciaCtx, provinciaId } = useProvincia();
  const { fijarPunto } = usePuntoConsulta();
  const provincia = provinciaCtx ?? getProvinciaActiva();
  const soloContinental = provincia.continentalOnly;
  const speciesCatalog = provincia.species as any[];
  // Tramos de la provincia del contexto (no del singleton por defecto Castellón).
  const tramos = provincia.tramos as TramoOficial[];
  const playas = soloContinental ? [] : todasLasPlayas();
  const [consulta, setConsulta] = useState<ConsultaPesca | null>(null);
  const [marcador, setMarcador] = useState<LatLng | null>(null);
  const [cargandoUbicacion, setCargandoUbicacion] = useState(false);
  const [fichaAbierta, setFichaAbierta] = useState(false);
  const [catalogoAbierto, setCatalogoAbierto] = useState(false);
  const [catalogo, setCatalogo] = useState<"rio" | "mar" | "no" | "tallas">("rio");
  const [camara, setCamara] = useState<{ latitude: number; longitude: number; zoom: number; nonce: number } | undefined>();
  const [avisoFuera, setAvisoFuera] = useState<string | null>(null);
  const mar = !soloContinental && (consulta?.ambito === "maritimo" || catalogo === "mar");

  useLayoutEffect(() => {
    navigation.setOptions({
      title: `Especies · ${provincia.nombre}`,
      headerStyle: { backgroundColor: mar && catalogoAbierto ? COLORS.waterDark : COLORS.primaryDark },
    });
  }, [mar, catalogoAbierto, navigation, provincia.nombre]);

  useEffect(() => {
    if (soloContinental && (catalogo === "mar" || catalogo === "no" || catalogo === "tallas")) {
      setCatalogo("rio");
    }
  }, [soloContinental, catalogo]);

  // Al entrar o al cambiar de provincia: mapa y catálogo anclados a ese territorio.
  useEffect(() => {
    setConsulta(null);
    setMarcador(null);
    setFichaAbierta(false);
    setCatalogoAbierto(false);
    setCatalogo("rio");
    setAvisoFuera(null);
    setCamara(camaraProvincia(provincia.regionMapa));
  }, [provinciaId, provincia.regionMapa]);

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
          setCamara(camaraProvincia(provincia.regionMapa));
          const msg = `Tu GPS está fuera de ${provincia.nombre}. El mapa y las especies siguen siendo solo de esta provincia.`;
          setAvisoFuera(msg);
          if (!opts?.silencioso) {
            Alert.alert(`Fuera de ${provincia.nombre}`, msg);
          }
        } else {
          const r = consultarToqueMapa(loc.lat, loc.lng);
          setConsulta(r);
          if (!soloContinental && r.ambito === "maritimo") setCatalogo("mar");
          setMarcador({ latitude: loc.lat, longitude: loc.lng });
          setCamara({ latitude: loc.lat, longitude: loc.lng, zoom: 13, nonce: Date.now() });
          void fijarPunto({ lat: loc.lat, lng: loc.lng, fuente: "gps", etiqueta: "Tu ubicación" });
        }
      }
    }
    setCargandoUbicacion(false);
  }

  function evaluarPunto(lat: number, lng: number) {
    const r = consultarToqueMapa(lat, lng);
    setConsulta(r);
    setMarcador({ latitude: lat, longitude: lng });
    if (!soloContinental && r.ambito === "maritimo") setCatalogo("mar");
    else setCatalogo("rio");
    setFichaAbierta(true);
    setCamara({ latitude: lat, longitude: lng, zoom: 13, nonce: Date.now() });
    void fijarPunto({ lat, lng, fuente: "mapa", etiqueta: r.titulo });
  }

  function evaluarTramo(z: TramoOficial) {
    setConsulta(consultarPorTramo(z));
    setMarcador({ latitude: z.lat, longitude: z.lng });
    setCatalogo("rio");
    setFichaAbierta(true);
    void fijarPunto({ lat: z.lat, lng: z.lng, fuente: "zona", etiqueta: z.nombre });
  }

  function irAparejos(especieId: string) {
    setFichaAbierta(false);
    setCatalogoAbierto(false);
    navigation.navigate("Aparejos", { especieId });
  }

  const especiesConsulta =
    consulta?.ambito === "maritimo"
      ? (consulta.especiesIds ?? []).map((id) =>
          especiesOrillaParaSeleccion().find((s) => s.id === id) ??
          [...(orilla.pescablesOrilla as any[]), ...(orilla.invasorasOrilla as any[])].find((s) => s.id === id)
        )
      : (consulta?.tramo?.especies ?? []).map((especieId: string) =>
          speciesCatalog.find((s: any) => s.id === especieId)
        );

  const costa = !soloContinental && consulta?.ambito === "maritimo";

  return (
    <View style={styles.container}>
      <View style={styles.mapWrap}>
        <MapView
          key={provincia.id}
          style={styles.map}
          initialRegion={provincia.regionMapa}
          cameraTarget={camara}
          accent={costa ? "mar" : "bosque"}
          pescaWms={provincia.id === "sevilla" ? "rediam" : "icv"}
          onPress={(e) => evaluarPunto(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude)}
          onLongPress={(e) => evaluarPunto(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude)}
        >
          {provincia.tieneIcv ? <CapaPoligonosIcv /> : null}
          {costa ? <CapaPuertos /> : null}
          {costa ? <CapaVedadosCosta /> : null}
          {costa &&
            playas.map((p) => (
              <Marker
                key={p.id}
                coordinate={{ latitude: p.lat, longitude: p.lng }}
                pinColor={PIN.playa}
                identifier="playa"
                title={p.nombre}
                onPress={() => evaluarPunto(p.lat, p.lng)}
              />
            ))}
          {costa &&
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
          {costa &&
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
          {!costa &&
            tramos.filter(tramoUsaRadioAnexo).map((z) => (
            <Circle
              key={`r-${z.id}`}
              center={{ latitude: z.lat, longitude: z.lng }}
              radius={z.radioKm * 1000}
              strokeColor={colorAprovechamiento(z.aprovechamiento)}
              fillColor={colorAprovechamiento(z.aprovechamiento) + "33"}
            />
          ))}
          {!costa &&
            tramos.map((z) => (
            <Marker
              key={z.id}
              coordinate={{ latitude: z.lat, longitude: z.lng }}
              pinColor={colorAprovechamiento(z.aprovechamiento)}
              identifier={z.aprovechamiento === "ZPL" ? "libre" : z.aprovechamiento === "ZPC" ? "coto" : "vedado"}
              title={z.nombre}
              onPress={() => evaluarTramo(z)}
            />
          ))}
          {marcador && (
            <Marker coordinate={marcador} pinColor={PIN.yo} identifier="user" title="Punto consultado" />
          )}
        </MapView>
        <BotonMiPosicion onPress={() => usarMiUbicacion()} cargando={cargandoUbicacion} />
      </View>

      <View style={styles.pie}>
        <View style={styles.provinciaChip}>
          <Text style={styles.provinciaChipTxt}>
            Provincia · {provincia.nombre} · {speciesCatalog.length} especies
          </Text>
        </View>
        {avisoFuera ? <Text style={styles.avisoFuera}>{avisoFuera}</Text> : null}
        <LeyendaMapa modo={costa ? "costa" : "continental"} />
        <Text style={styles.hint}>
          {soloContinental
            ? `Toca un tramo o embalse de ${provincia.nombre}: las especies se abren a pantalla completa.`
            : `Toca río o playa de ${provincia.nombre}: las especies se abren a pantalla completa.`}
        </Text>
        <View style={styles.pieRow}>
          {consulta && !fichaAbierta ? (
            <TouchableOpacity style={styles.pieBtn} onPress={() => setFichaAbierta(true)}>
              <Text style={styles.pieBtnTxt}>Ver última consulta</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity style={[styles.pieBtn, styles.pieBtnGhost]} onPress={() => setCatalogoAbierto(true)} accessibilityRole="button" accessibilityLabel={`Catálogo de ${provincia.nombre}`}>
            <Text style={styles.pieBtnGhostTxt}>Catálogo</Text>
          </TouchableOpacity>
        </View>
      </View>

      <VentanaConsulta
        visible={fichaAbierta && !!consulta}
        titulo={consulta?.titulo ?? `Especies · ${provincia.nombre}`}
        onCerrar={() => setFichaAbierta(false)}
        acento={costa ? "mar" : "bosque"}
      >
        {consulta ? (
          <>
            <SemaforoVeredicto consulta={consulta} />
            {consulta.restriccionesHoy.slice(0, 3).map((r, i) => (
              <Text key={i} style={styles.cardText}>
                {r}
              </Text>
            ))}
            {consulta.especiesHabituales ? <Text style={styles.lead}>{consulta.especiesHabituales}</Text> : null}
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

      <VentanaConsulta
        visible={catalogoAbierto}
        titulo={`Catálogo · ${provincia.nombre}`}
        onCerrar={() => setCatalogoAbierto(false)}
        acento={catalogo === "rio" || catalogo === "tallas" ? "bosque" : "mar"}
      >
        <Text style={styles.catalogoIntro}>
          Fichas solo de {provincia.nombre}. Cada provincia tiene su propio listado y normativa.
        </Text>
        <View style={styles.modoBar}>
          <TouchableOpacity
            style={[styles.modoBtn, catalogo === "rio" && styles.modoBtnOnBosque]}
            onPress={() => setCatalogo("rio")}
          >
            <Text style={[styles.modoTxt, catalogo === "rio" && styles.modoTxtOn]}>Ríos</Text>
          </TouchableOpacity>
          {!soloContinental ? (
            <>
              <TouchableOpacity
                style={[styles.modoBtn, catalogo === "mar" && styles.modoBtnOnMar]}
                onPress={() => setCatalogo("mar")}
              >
                <Text style={[styles.modoTxt, catalogo === "mar" && styles.modoTxtOn]}>Orilla mar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modoBtn, catalogo === "tallas" && styles.modoBtnOnMar]}
                onPress={() => setCatalogo("tallas")}
              >
                <Text style={[styles.modoTxt, catalogo === "tallas" && styles.modoTxtOn]}>Tallas</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modoBtn, catalogo === "no" && styles.modoBtnOnMar]}
                onPress={() => setCatalogo("no")}
              >
                <Text style={[styles.modoTxt, catalogo === "no" && styles.modoTxtOn]}>No tocar</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>
        {catalogo === "rio" &&
          speciesCatalog.map((sp: any, i: number) => (
            <TarjetaEspecie key={sp.id} sp={sp} index={i} enVeda={estaEnVeda(sp.id)} onAparejos={() => irAparejos(sp.id)} />
          ))}
        {!soloContinental && catalogo === "mar" && (
          <>
            <Text style={styles.cardText}>{orilla.fuenteTallas}</Text>
            <Text style={[styles.cardText, { marginBottom: 8 }]}>
              Las 15 especies más usuales desde orilla en Castellón (más invasoras). El resto queda en Tallas.
            </Text>
            {especiesOrillaParaSeleccion().map((sp: any, i: number) => (
              <TarjetaEspecie key={sp.id} sp={sp} index={i} onAparejos={() => irAparejos(sp.id)} />
            ))}
          </>
        )}
        {!soloContinental && catalogo === "tallas" && <ListaTallasMinimas onEspecie={irAparejos} />}
        {!soloContinental && catalogo === "no" && orilla.noCapturar.map((sp: any, i: number) => <TarjetaEspecie key={sp.id} sp={sp} index={i} />)}
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
    paddingTop: 8,
    paddingBottom: 96,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  provinciaChip: {
    alignSelf: "center",
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.md,
    marginBottom: 4,
  },
  provinciaChipTxt: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.primaryDark,
    textAlign: "center",
  },
  avisoFuera: {
    fontSize: 12,
    color: COLORS.warning,
    lineHeight: 17,
    textAlign: "center",
    marginBottom: 4,
  },
  hint: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 17, textAlign: "center", marginTop: 4 },
  pieRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  pieBtn: {
    flex: 1,
    minHeight: 42,
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
  catalogoIntro: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  cardText: { fontSize: 15, color: COLORS.textSecondary, marginTop: 6, lineHeight: 22 },
  modoBar: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 14 },
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
  modoBtnOnBosque: { backgroundColor: COLORS.primaryDark, borderColor: COLORS.primaryDark },
  modoBtnOnMar: { backgroundColor: COLORS.waterDark, borderColor: COLORS.waterDark },
  modoTxt: { fontSize: 13, fontWeight: "700", color: COLORS.textSecondary, textAlign: "center" },
  modoTxtOn: { color: "#fff" },
});
