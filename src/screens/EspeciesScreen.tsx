import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
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
  const { provincia: provinciaCtx, provinciaId } = useProvincia();
  const { punto, fijarPunto } = usePuntoConsulta();
  const provincia = provinciaCtx ?? getProvinciaActiva();
  const soloContinental = provincia.continentalOnly;
  const speciesCatalog = provincia.species as any[];
  // Tramos de la provincia del contexto (no del singleton por defecto Castellón).
  const tramos = provincia.tramos as TramoOficial[];
  const playas = soloContinental ? [] : todasLasPlayas();
  const orillaSeleccion = useMemo(() => (soloContinental ? [] : especiesOrillaParaSeleccion()), [soloContinental]);

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
          onLongPress={(e) => evaluarPunto(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude)}
        >
          {provincia.tieneIcv && !costa ? <CapaPoligonosIcv /> : null}
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

      <View style={[styles.pie, costa && styles.pieMar]}>
        <View style={[styles.provinciaChip, costa && styles.provinciaChipMar]}>
          <Text style={[styles.provinciaChipTxt, costa && styles.provinciaChipTxtMar]}>
            {costa
              ? `Costa · ${provincia.nombre} · ${nEspeciesChip} especies de orilla`
              : `Ríos · ${provincia.nombre} · ${nEspeciesChip} especies continentales`}
          </Text>
        </View>
        {avisoFuera ? <Text style={styles.avisoFuera}>{avisoFuera}</Text> : null}
        <LeyendaMapa modo={costa ? "costa" : "continental"} />
        <Text style={styles.hint}>
          {consulta
            ? "Punto ya elegido. Abre las especies de este sitio o el catálogo completo."
            : costa
              ? "Catálogo de orilla abierto. También puedes tocar una playa en el mapa."
              : soloContinental
                ? `Catálogo continental de ${provincia.nombre}. Toca un tramo o embalse en el mapa.`
                : `Catálogo de ríos y embalses. Cambia a Costa (orilla) para lubina, dorada, sargo…`}
        </Text>
        {consulta && !fichaAbierta ? (
          <TouchableOpacity
            style={costa ? styles.ctaOrilla : styles.ctaContinental}
            onPress={() => {
              setCatalogoAbierto(false);
              setFichaAbierta(true);
            }}
            accessibilityRole="button"
            accessibilityLabel="Ver especies de este punto"
          >
            <Text style={costa ? styles.ctaOrillaTxt : styles.ctaContinentalTxt}>
              Ver especies de este punto
            </Text>
          </TouchableOpacity>
        ) : costa ? (
          <TouchableOpacity
            style={styles.ctaOrilla}
            onPress={abrirCatalogoOrilla}
            accessibilityRole="button"
            accessibilityLabel="Ver especies de orilla"
          >
            <Text style={styles.ctaOrillaTxt}>Ver especies de orilla</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.ctaContinental}
            onPress={abrirCatalogoContinental}
            accessibilityRole="button"
            accessibilityLabel="Ver especies de ríos y embalses"
          >
            <Text style={styles.ctaContinentalTxt}>Ver especies de ríos y embalses</Text>
          </TouchableOpacity>
        )}
        <View style={styles.pieRow}>
          {consulta && !fichaAbierta ? (
            <TouchableOpacity style={styles.pieBtn} onPress={() => setFichaAbierta(true)}>
              <Text style={styles.pieBtnTxt}>Ver última consulta</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={[styles.pieBtn, costa ? styles.pieBtnGhostMar : styles.pieBtnGhost]}
            onPress={abrirCatalogo}
            accessibilityRole="button"
            accessibilityLabel={
              costa ? `Catálogo de orilla de ${provincia.nombre}` : `Catálogo continental de ${provincia.nombre}`
            }
          >
            <Text style={costa ? styles.pieBtnGhostMarTxt : styles.pieBtnGhostTxt}>
              {costa ? "Catálogo orilla" : "Catálogo ríos"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <VentanaConsulta
        visible={fichaAbierta && !!consulta}
        titulo={consulta?.titulo ?? `Especies · ${provincia.nombre}`}
        onCerrar={() => setFichaAbierta(false)}
        acento={consulta?.ambito === "maritimo" ? "mar" : "bosque"}
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
                  onMontaje={consejoIdMontajeEspecie(sp.id) ? () => irMontaje(sp.id) : undefined}
                />
              ))
            )}
            {consulta.ambito === "maritimo" ? (
              <TouchableOpacity style={[styles.pieBtn, styles.pieBtnMar, { marginTop: 12 }]} onPress={abrirCatalogoOrilla}>
                <Text style={styles.pieBtnMarTxt}>Ver las 15 especies de orilla</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.pieBtn, { marginTop: 12 }]}
                onPress={abrirCatalogoContinental}
                accessibilityRole="button"
                accessibilityLabel="Ver especies continentales"
              >
                <Text style={styles.pieBtnTxt}>
                  Ver especies de ríos y embalses ({speciesCatalog.length})
                </Text>
              </TouchableOpacity>
            )}
          </>
        ) : null}
      </VentanaConsulta>

      <VentanaConsulta
        visible={catalogoAbierto}
        titulo={
          catalogo === "mar" || catalogo === "tallas" || catalogo === "no"
            ? `Catálogo orilla · ${provincia.nombre}`
            : `Catálogo ríos · ${provincia.nombre}`
        }
        onCerrar={() => setCatalogoAbierto(false)}
        acento={catalogo === "rio" ? "bosque" : "mar"}
      >
        <Text style={styles.catalogoIntro}>
          {catalogo === "mar"
            ? `Las especies más usuales desde orilla en ${provincia.nombre}. Tallas legales del Mediterráneo.`
            : `Especies de pesca continental en ${provincia.nombre}: ríos, embalses y tramos. Cada provincia tiene su propio listado y normativa.`}
        </Text>
        <View style={styles.modoBarCatalogo}>
          <TouchableOpacity
            style={[styles.modoBtn, catalogo === "rio" && styles.modoBtnOnBosque]}
            onPress={() => {
              setCatalogo("rio");
              setModo("continental");
            }}
            accessibilityRole="button"
            accessibilityLabel="Ríos y embalses catálogo"
          >
            <Text style={[styles.modoTxt, catalogo === "rio" && styles.modoTxtOn]}>Ríos y embalses</Text>
          </TouchableOpacity>
          {!soloContinental ? (
            <>
              <TouchableOpacity
                style={[styles.modoBtn, catalogo === "mar" && styles.modoBtnOnMar]}
                onPress={() => {
                  setCatalogo("mar");
                  setModo("costa");
                }}
                accessibilityRole="button"
                accessibilityLabel="Orilla mar"
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
            <TarjetaEspecie
              key={sp.id}
              sp={sp}
              index={i}
              enVeda={estaEnVeda(sp.id)}
              onAparejos={() => irAparejos(sp.id)}
              onMontaje={consejoIdMontajeEspecie(sp.id) ? () => irMontaje(sp.id) : undefined}
            />
          ))}
        {!soloContinental && catalogo === "mar" && (
          <>
            <Text style={styles.cardText}>{orilla.fuenteTallas}</Text>
            <Text style={[styles.cardText, { marginBottom: 8 }]}>
              Las 15 especies más usuales desde orilla en Castellón (más invasoras). El resto queda en Tallas.
            </Text>
            {orillaSeleccion.map((sp: any, i: number) => (
              <TarjetaEspecie
                key={sp.id}
                sp={sp}
                index={i}
                onAparejos={() => irAparejos(sp.id)}
                onMontaje={consejoIdMontajeEspecie(sp.id) ? () => irMontaje(sp.id) : undefined}
              />
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
  modoBar: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    backgroundColor: COLORS.surface,
  },
  modoBarMar: { backgroundColor: COLORS.waterLight },
  modoBarCatalogo: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 14 },
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
  pieMar: {
    backgroundColor: COLORS.waterLight,
    borderTopColor: COLORS.water,
  },
  provinciaChip: {
    alignSelf: "center",
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.md,
    marginBottom: 4,
  },
  provinciaChipMar: { backgroundColor: COLORS.water },
  provinciaChipTxt: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.primaryDark,
    textAlign: "center",
  },
  provinciaChipTxtMar: { color: "#fff" },
  avisoFuera: {
    fontSize: 12,
    color: COLORS.warning,
    lineHeight: 17,
    textAlign: "center",
    marginBottom: 4,
  },
  hint: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 17, textAlign: "center", marginTop: 4 },
  ctaOrilla: {
    marginTop: 10,
    minHeight: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.waterDark,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  ctaOrillaTxt: { color: "#fff", fontWeight: "800", fontSize: 16, textAlign: "center" },
  ctaContinental: {
    marginTop: 10,
    minHeight: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryDark,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  ctaContinentalTxt: { color: "#fff", fontWeight: "800", fontSize: 16, textAlign: "center" },
  pieRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  pieBtn: {
    flexGrow: 1,
    flexBasis: 140,
    minHeight: 42,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  pieBtnTxt: { color: COLORS.primaryDark, fontWeight: "800", fontSize: 14 },
  pieBtnMar: { backgroundColor: COLORS.waterDark },
  pieBtnMarTxt: { color: "#fff", fontWeight: "800", fontSize: 14, textAlign: "center" },
  pieBtnGhost: { backgroundColor: COLORS.waterLight },
  pieBtnGhostTxt: { color: COLORS.waterDark, fontWeight: "800", fontSize: 14 },
  pieBtnGhostMar: { backgroundColor: "#fff", borderWidth: 1, borderColor: COLORS.waterDark },
  pieBtnGhostMarTxt: { color: COLORS.waterDark, fontWeight: "800", fontSize: 14 },
  lead: { fontSize: 16, fontWeight: "700", color: COLORS.waterDark, marginBottom: 12, lineHeight: 22 },
  emptyText: { fontSize: 14, color: COLORS.textMuted, textAlign: "center", marginTop: 16, lineHeight: 20 },
  catalogoIntro: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  cardText: { fontSize: 15, color: COLORS.textSecondary, marginTop: 6, lineHeight: 22 },
});
