import React, { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { obtenerUbicacionActual, solicitarPermisoUbicacion } from "../services/locationService";
import { calcularIndicePesca, CATEGORIA_INFO, IndicePescaDia } from "../services/fishingIndexService";
import { consultarToqueMapa } from "../services/consultaCostaService";
import type { ConsultaPesca } from "../services/consultaPescaService";
import { useProvincia } from "../context/ProvinciaContext";
import { usePuntoConsulta } from "../context/PuntoConsultaContext";
import { getProvinciaActiva } from "../provincias/runtime";
import {
  obtenerFavoritos,
  obtenerPuntosGuardados,
  obtenerCapturas,
  type FavoritoZona,
  type PuntoGuardado,
  type Captura,
} from "../services/storageService";
import { formatearCoords, parsearLatLng } from "../services/coordsUtils";
import { asegurarCoordsEnProvincia } from "../services/geoService";
import { listarSitiosPersonales } from "../services/sitiosPersonalesService";
import { resolverEspecie } from "../services/catalogoEspeciesService";
import {
  consumirPickUbicacion,
  iniciarPickUbicacion,
} from "../services/ubicacionPendiente";
import type { FuentePuntoConsulta } from "../services/puntoConsultaService";
import SemaforoVeredicto from "../components/SemaforoVeredicto";
import ConsultaPescaCard from "../components/ConsultaPescaCard";
import ListaAnimada from "../components/ListaAnimada";
import { irAEspeciesDelPunto } from "../navigation/irATab";
import {
  consejoIdMontajeEspecie,
  montajesParaEspecie,
} from "../data/montajesEspecie";
import { COLORS, FONTS, GRADIENTS, RADIUS, SHADOW, SPACING } from "../theme";
import { EJE_LEGAL, EJE_METEO } from "../data/ejesLegalMeteo";
import EjeLegalMeteo from "../components/EjeLegalMeteo";
import ChecklistInteractivo, { itemsDesdeTextos } from "../components/ChecklistInteractivo";
import SheetPermisoGps from "../components/SheetPermisoGps";
import { sitiosFacilesDe } from "../data/sitiosFaciles";
import OndaAgua from "../components/OndaAgua";
import PasoSalida from "../components/PasoSalida";
import PulsePress from "../components/PulsePress";

interface Props {
  navigation: any;
}

type OrigenUbicacion = FuentePuntoConsulta;

/**
 * Flujo corto “Salgo a pescar”: eliges dónde → veredicto → índice → checklist.
 * Misma lógica de punto que Inicio / Previsión / Mapa (GPS, mapa, coords, zona).
 */
export default function SalgoAPescarScreen({ navigation }: Props) {
  const { provincia: provinciaCtx } = useProvincia();
  const provincia = provinciaCtx ?? getProvinciaActiva();
  const { punto, fijarPunto } = usePuntoConsulta();
  const checklist = provincia.checklistAntesDePescar;
  const [paso, setPaso] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consulta, setConsulta] = useState<ConsultaPesca | null>(null);
  const [indice, setIndice] = useState<IndicePescaDia | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [etiqueta, setEtiqueta] = useState<string | null>(null);
  const [origen, setOrigen] = useState<OrigenUbicacion | null>(null);
  const [elegirUbicacion, setElegirUbicacion] = useState(true);
  const [mostrarCoords, setMostrarCoords] = useState(false);
  const [latTxt, setLatTxt] = useState("");
  const [lngTxt, setLngTxt] = useState("");
  const [favoritos, setFavoritos] = useState<FavoritoZona[]>([]);
  const [puntos, setPuntos] = useState<PuntoGuardado[]>([]);
  const [capturas, setCapturas] = useState<Captura[]>([]);
  const [gpsCargando, setGpsCargando] = useState(false);
  const [sheetGps, setSheetGps] = useState(false);
  const gpsResolver = useRef<((ok: boolean) => void) | null>(null);

  const sitiosPersonales = listarSitiosPersonales(puntos, capturas, {
    region: provincia.regionMapa,
    nombreEspecie: (id) =>
      resolverEspecie(id, provincia.species as { id: string; nombre: string }[])?.nombre ?? id,
    limite: 10,
  });

  const sitiosFaciles = sitiosFacilesDe(provincia.id as "castellon" | "sevilla");

  const zonasRapidas = [...(provincia.zones as { id: string; nombre: string; lat: number; lng: number; tipo?: string }[])]
    .sort((a, b) => {
      const rank = (z: { tipo?: string; id: string }) =>
        z.tipo === "embalse" || z.id.startsWith("embalse") ? 0 : 1;
      return rank(a) - rank(b);
    })
    .slice(0, 12);

  const aplicarUbicacion = useCallback(
    async (args: {
      lat: number;
      lng: number;
      fuente: FuentePuntoConsulta;
      etiqueta?: string;
    }) => {
      const enProvincia = asegurarCoordsEnProvincia(args.lat, args.lng, {
        region: provincia.regionMapa,
        nombre: provincia.nombre,
      });
      if (!enProvincia.ok) {
        Alert.alert(`Fuera de ${provincia.nombre}`, enProvincia.error);
        setElegirUbicacion(true);
        return;
      }
      setCargando(true);
      setError(null);
      setElegirUbicacion(false);
      setMostrarCoords(false);
      try {
        await fijarPunto({
          lat: args.lat,
          lng: args.lng,
          fuente: args.fuente,
          etiqueta: args.etiqueta,
        });
        const c = consultarToqueMapa(args.lat, args.lng);
        const dias = await calcularIndicePesca(args.lat, args.lng, 2);
        setCoords({ lat: args.lat, lng: args.lng });
        setEtiqueta(args.etiqueta ?? c.titulo ?? null);
        setOrigen(args.fuente);
        setConsulta(c);
        setIndice(dias[0] ?? null);
        setPaso(0);
      } catch {
        setError("No se pudo consultar este punto. Prueba otra ubicación.");
        setElegirUbicacion(true);
      } finally {
        setCargando(false);
      }
    },
    [fijarPunto, provincia.regionMapa, provincia.nombre]
  );

  useFocusEffect(
    useCallback(() => {
      void obtenerFavoritos().then(setFavoritos);
      void obtenerPuntosGuardados().then(setPuntos);
      void obtenerCapturas().then(setCapturas);
      const elegida = consumirPickUbicacion("salgo");
      if (elegida) {
        void aplicarUbicacion({
          lat: elegida.lat,
          lng: elegida.lng,
          fuente: "mapa",
          etiqueta: elegida.etiqueta,
        });
      }
    }, [aplicarUbicacion])
  );

  async function pedirGpsConSheet(): Promise<boolean> {
    const { gpsSheetVisto, marcarGpsSheetVisto } = await import("../services/primeraSalidaService");
    if (await gpsSheetVisto()) return solicitarPermisoUbicacion();
    return new Promise((resolve) => {
      gpsResolver.current = async (continuar) => {
        setSheetGps(false);
        if (!continuar) {
          resolve(false);
          return;
        }
        await marcarGpsSheetVisto();
        resolve(await solicitarPermisoUbicacion());
      };
      setSheetGps(true);
    });
  }

  async function usarGps() {
    setGpsCargando(true);
    setError(null);
    const ok = await pedirGpsConSheet();
    if (!ok) {
      setGpsCargando(false);
      Alert.alert(
        "Ubicación",
        "Activa el permiso de ubicación o elige zona en el mapa / coordenadas."
      );
      return;
    }
    const loc = await obtenerUbicacionActual();
    setGpsCargando(false);
    if (!loc) {
      Alert.alert(
        "Sin señal GPS",
        "No se pudo obtener tu posición. Usa el mapa, una zona o coordenadas."
      );
      return;
    }
    await aplicarUbicacion({
      lat: loc.lat,
      lng: loc.lng,
      fuente: "gps",
      etiqueta: "Tu ubicación",
    });
  }

  function irAMapa() {
    iniciarPickUbicacion("salgo");
    // Nested tab → stack: params en ZonasLibresMain + singleton por si el foco no re-aplica params.
    const parent = navigation.getParent?.();
    const dest = {
      screen: "ZonasLibresMain",
      params: { modoAnadirPunto: true, motivoPick: "salgo" as const },
    };
    if (parent?.navigate) {
      parent.navigate("Mapa", dest);
    } else {
      navigation.navigate("Mapa", dest);
    }
  }

  function aplicarCoordsManual() {
    const r = parsearLatLng(latTxt, lngTxt);
    if (!r.ok) {
      Alert.alert("Coordenadas", r.error);
      return;
    }
    void aplicarUbicacion({
      lat: r.coords.lat,
      lng: r.coords.lng,
      fuente: "mapa",
      etiqueta: formatearCoords(r.coords.lat, r.coords.lng),
    });
  }

  function cambiarUbicacion() {
    setElegirUbicacion(true);
    setError(null);
    setPaso(0);
  }

  const cat = indice ? CATEGORIA_INFO[indice.categoria] : null;
  const hayResultado = !!coords && !elegirUbicacion;
  const especieDestacada = consulta
    ? consulta.ambito === "maritimo"
      ? consulta.especiesIds?.[0]
      : consulta.tramo?.especies?.[0]
    : undefined;
  const consejoMontaje = especieDestacada ? consejoIdMontajeEspecie(especieDestacada) : undefined;
  const montajeTipico = especieDestacada ? montajesParaEspecie(especieDestacada)[0] : undefined;
  const pasoVisual = elegirUbicacion || !hayResultado ? 0 : Math.min(paso + 1, 3);
  const labelsPaso = ["Sitio", "Normativa", "Clima", "Checklist"];

  function irMontaje(especieId: string) {
    const consejoId = consejoIdMontajeEspecie(especieId);
    if (!consejoId) return;
    navigation.navigate("Consejos", { consejoId, categoria: "montajes" });
  }

  return (
    <>
    <SheetPermisoGps
      visible={sheetGps}
      onCancelar={() => gpsResolver.current?.(false)}
      onContinuar={() => gpsResolver.current?.(true)}
    />
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
      <LinearGradient colors={[...GRADIENTS.primary]} style={styles.hero}>
        <OndaAgua intensidad={1} />
        <Text style={styles.kicker}>Modo salida</Text>
        <Text style={styles.title}>Salgo a pescar</Text>
        <Text style={styles.sub}>
          Prepara la jornada: dónde, si puedes, si pinta y qué llevar.
        </Text>
        <PasoSalida pasos={labelsPaso} activo={pasoVisual} sobreOscuro />
      </LinearGradient>

      {elegirUbicacion ? (
        <ListaAnimada index={0}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>1 · Dónde estás · normativa</Text>
            <Text style={styles.hint}>
              Elige GPS, un punto en el mapa, coordenadas o una zona de {provincia.nombre}.
            </Text>

            {punto &&
            (punto.fuente === "mapa" || punto.fuente === "zona" || punto.fuente === "gps") &&
            !coords ? (
              <TouchableOpacity
                style={styles.puntoActual}
                onPress={() =>
                  void aplicarUbicacion({
                    lat: punto.lat,
                    lng: punto.lng,
                    fuente: punto.fuente,
                    etiqueta: punto.etiqueta,
                  })
                }
              >
                <Text style={styles.puntoActualTitle}>Usar punto actual</Text>
                <Text style={styles.puntoActualMeta}>
                  {punto.etiqueta ?? formatearCoords(punto.lat, punto.lng)}
                </Text>
              </TouchableOpacity>
            ) : null}

            <View style={styles.methodRow}>
              <PulsePress
                onPress={() => void usarGps()}
                disabled={gpsCargando}
                style={styles.methodBtn}
                accessibilityLabel="Usar GPS"
              >
                {gpsCargando ? (
                  <ActivityIndicator color={COLORS.primary} />
                ) : (
                  <>
                    <Text style={styles.methodGlyph}>◉</Text>
                    <Text style={styles.methodBtnTxt}>GPS</Text>
                    <Text style={styles.methodHint}>Aquí</Text>
                  </>
                )}
              </PulsePress>
              <PulsePress onPress={irAMapa} style={styles.methodBtn} accessibilityLabel="Elegir en el mapa">
                <Text style={styles.methodGlyph}>▦</Text>
                <Text style={styles.methodBtnTxt}>Mapa</Text>
                <Text style={styles.methodHint}>Tocar</Text>
              </PulsePress>
              <PulsePress
                onPress={() => setMostrarCoords((v) => !v)}
                style={[styles.methodBtn, mostrarCoords && styles.methodBtnOn]}
                accessibilityLabel="Introducir coordenadas"
              >
                <Text style={styles.methodGlyph}>⌗</Text>
                <Text style={styles.methodBtnTxt}>Coords</Text>
                <Text style={styles.methodHint}>Manual</Text>
              </PulsePress>
            </View>

            {mostrarCoords ? (
              <View style={styles.coordsBox}>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.formLabel}>Latitud</Text>
                    <TextInput
                      style={styles.input}
                      value={latTxt}
                      onChangeText={setLatTxt}
                      keyboardType="default"
                      placeholder={
                        provincia.id === "sevilla" ? '37°45\'55" N' : String(provincia.regionMapa.latitude.toFixed(3))
                      }
                      autoCapitalize="characters"
                      autoCorrect={false}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.formLabel}>Longitud</Text>
                    <TextInput
                      style={styles.input}
                      value={lngTxt}
                      onChangeText={setLngTxt}
                      keyboardType="default"
                      placeholder={
                        provincia.id === "sevilla" ? '5°27\'40" O' : String(provincia.regionMapa.longitude.toFixed(3))
                      }
                      autoCapitalize="characters"
                      autoCorrect={false}
                    />
                  </View>
                </View>
                <Text style={styles.hint}>
                  {"Decimal (−5.46) o sexagesimal (5°27'40\" O). La O es oeste."}
                </Text>
                <TouchableOpacity style={styles.btnSecondary} onPress={aplicarCoordsManual}>
                  <Text style={styles.btnSecondaryTxt}>Usar estas coordenadas</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {favoritos.length > 0 ? (
              <>
                <Text style={styles.sectionLabel}>Favoritos</Text>
                {favoritos.slice(0, 6).map((f) => {
                  const zona = provincia.zones.find((z: any) => z.id === f.zonaId) as
                    | { id: string; nombre: string; lat: number; lng: number }
                    | undefined;
                  if (!zona) return null;
                  return (
                    <TouchableOpacity
                      key={f.zonaId}
                      style={styles.listItem}
                      onPress={() =>
                        void aplicarUbicacion({
                          lat: zona.lat,
                          lng: zona.lng,
                          fuente: "zona",
                          etiqueta: zona.nombre,
                        })
                      }
                    >
                      <Text style={styles.listItemTxt}>★ {zona.nombre}</Text>
                    </TouchableOpacity>
                  );
                })}
              </>
            ) : null}

            {sitiosPersonales.length > 0 ? (
              <>
                <Text style={styles.sectionLabel}>Tus puntos y capturas</Text>
                {sitiosPersonales.slice(0, 8).map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={styles.listItem}
                    onPress={() =>
                      void aplicarUbicacion({
                        lat: s.lat,
                        lng: s.lng,
                        fuente: "mapa",
                        etiqueta: s.titulo,
                      })
                    }
                  >
                    <Text style={styles.listItemTxt}>
                      {s.tipo === "captura" ? "🎣 " : ""}
                      {s.titulo}
                    </Text>
                    <Text style={styles.listItemMeta}>{s.meta}</Text>
                  </TouchableOpacity>
                ))}
              </>
            ) : null}

            {sitiosFaciles.length > 0 ? (
              <View style={{ marginBottom: 10 }}>
                <Text style={styles.formLabel}>Sitios fáciles para empezar</Text>
                {sitiosFaciles.slice(0, 5).map((z) => (
                  <TouchableOpacity
                    key={z.id}
                    style={styles.zonaChip}
                    onPress={() =>
                      void aplicarUbicacion({
                        lat: z.lat,
                        lng: z.lng,
                        fuente: "zona",
                        etiqueta: z.nombre,
                      })
                    }
                  >
                    <Text style={styles.zonaChipTitle}>{z.nombre}</Text>
                    <Text style={styles.zonaChipMeta}>{z.porQue}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}

            {zonasRapidas.length > 0 ? (

              <>
                <Text style={styles.sectionLabel}>Zonas de {provincia.nombre}</Text>
                {zonasRapidas.map((z) => (
                  <TouchableOpacity
                    key={z.id}
                    style={styles.listItem}
                    onPress={() =>
                      void aplicarUbicacion({
                        lat: z.lat,
                        lng: z.lng,
                        fuente: "zona",
                        etiqueta: z.nombre,
                      })
                    }
                  >
                    <Text style={styles.listItemTxt}>{z.nombre}</Text>
                  </TouchableOpacity>
                ))}
              </>
            ) : null}

            {coords && elegirUbicacion ? (
              <TouchableOpacity style={styles.btnGhost} onPress={() => setElegirUbicacion(false)}>
                <Text style={styles.btnGhostTxt}>Cancelar cambio</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </ListaAnimada>
      ) : null}

      {cargando && !elegirUbicacion ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : null}

      {hayResultado && !cargando ? (
        <>
          <ListaAnimada index={0}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>1 · Dónde estás · normativa</Text>
              {etiqueta || coords ? (
                <Text style={styles.lugar}>
                  {etiqueta ?? "Punto elegido"}
                  {coords ? ` · ${formatearCoords(coords.lat, coords.lng)}` : ""}
                </Text>
              ) : null}
              {origen ? (
                <Text style={styles.origenMeta}>
                  {origen === "gps"
                    ? "Desde tu GPS"
                    : origen === "zona"
                      ? "Zona elegida"
                      : "Punto del mapa / coordenadas"}
                </Text>
              ) : null}
              {consulta ? (
                <>
                  <EjeLegalMeteo eje="legal" />
                  <SemaforoVeredicto consulta={consulta} />
                  <ConsultaPescaCard
                    consulta={consulta}
                    onFicha={
                      consulta.tramo?.fichaId
                        ? () => navigation.navigate("ZoneDetail", { zoneId: consulta.tramo!.fichaId })
                        : undefined
                    }
                    onEspecies={() => irAEspeciesDelPunto(navigation)}
                    onAparejos={(id) => navigation.navigate("Aparejos", { especieId: id })}
                    onMontaje={irMontaje}
                  />
                  {consejoMontaje && montajeTipico ? (
                    <TouchableOpacity
                      style={styles.montajeCta}
                      onPress={() => irMontaje(especieDestacada!)}
                      accessibilityRole="button"
                      accessibilityLabel={`Ver montaje típico: ${montajeTipico.titulo}`}
                    >
                      <Text style={styles.montajeCtaTitle}>Ver montaje típico</Text>
                      <Text style={styles.montajeCtaSub}>
                        Esquema visual · {montajeTipico.titulo}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </>
              ) : (
                <Text style={styles.muted}>No hay tramo reconocido en este punto.</Text>
              )}
              <TouchableOpacity style={styles.btnGhost} onPress={cambiarUbicacion}>
                <Text style={styles.btnGhostTxt}>Cambiar ubicación</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btn} onPress={() => setPaso(1)}>
                <Text style={styles.btnTxt}>Continuar → clima</Text>
              </TouchableOpacity>
            </View>
          </ListaAnimada>

          {paso >= 1 && (
            <ListaAnimada index={1}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>2 · Condiciones · clima</Text>
                <EjeLegalMeteo eje="meteo" />
                <Text style={styles.meteoAviso}>{EJE_METEO.aviso}</Text>
                {indice && cat ? (
                  <View style={[styles.indexBox, { backgroundColor: cat.fondo }]}>
                    <Text style={[styles.indexBig, { color: cat.color }]}>
                      {cat.icono} {cat.texto}
                    </Text>
                    <Text style={styles.indexMeta}>
                      {indice.puntuacion}/100 · {indice.faseLunar} {indice.iconoLuna}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.muted}>Sin índice (revisa conexión o ubicación).</Text>
                )}
                {consejoMontaje && montajeTipico ? (
                  <TouchableOpacity
                    style={styles.montajeCta}
                    onPress={() => irMontaje(especieDestacada!)}
                    accessibilityRole="button"
                    accessibilityLabel={`Ver montaje típico: ${montajeTipico.titulo}`}
                  >
                    <Text style={styles.montajeCtaTitle}>Ver montaje típico</Text>
                    <Text style={styles.montajeCtaSub}>
                      Antes de salir · {montajeTipico.titulo}
                    </Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity
                  style={styles.btnGhost}
                  onPress={() => {
                    setPaso(2);
                    navigation.navigate("Previsión");
                  }}
                >
                  <Text style={styles.btnGhostTxt}>Ver previsión completa</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btn} onPress={() => setPaso(2)}>
                  <Text style={styles.btnTxt}>Ir al checklist →</Text>
                </TouchableOpacity>
              </View>
            </ListaAnimada>
          )}

          {paso >= 2 && (
            <ListaAnimada index={2}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>3 · Checklist</Text>
                <Text style={styles.hint}>Marca lo que ya llevas. Los enlaces abren la ficha útil.</Text>
                <ChecklistInteractivo
                  provinciaId={provincia.id}
                  items={itemsDesdeTextos(
                    checklist,
                    provincia.id === "castellon"
                      ? [
                          {
                            id: "pesca-rec",
                            texto: "Si pescas en costa: declara en PescaREC (obligatorio desde 2026).",
                            accion: { tipo: "pesca_rec" },
                          },
                        ]
                      : []
                  )}
                  onLicencia={() => navigation.navigate("License")}
                  onConsejos={(o) =>
                    navigation.navigate("Consejos", {
                      consejoId: o.consejoId,
                      categoria: o.categoria,
                    })
                  }
                  onMapa={() => navigation.navigate("Mapa")}
                />
                <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate("Mapa")}>
                  <Text style={styles.btnTxt}>Abrir mapa</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.btnSecondary}
                  onPress={() => navigation.navigate("License")}
                >
                  <Text style={styles.btnSecondaryTxt}>Revisar licencias</Text>
                </TouchableOpacity>
              </View>
            </ListaAnimada>
          )}
        </>
      ) : null}
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  hero: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: 14,
    overflow: "hidden",
    ...SHADOW,
  },
  kicker: {
    color: "#e8f5ee",
    fontWeight: "800",
    fontFamily: FONTS.extrabold,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    zIndex: 1,
  },
  title: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "800",
    fontFamily: FONTS.extrabold,
    marginTop: 4,
    letterSpacing: -0.3,
    zIndex: 1,
  },
  sub: {
    color: "#eef7f1",
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: FONTS.semibold,
    fontWeight: "600",
    zIndex: 1,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW,
  },
  meteoAviso: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 10,
    lineHeight: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    fontFamily: FONTS.extrabold,
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  hint: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 19, marginBottom: 12 },
  muted: { color: COLORS.textSecondary, fontSize: 13 },
  error: { color: COLORS.danger, fontWeight: "700", marginTop: 10, marginBottom: 4 },
  lugar: { fontSize: 14, fontWeight: "800", color: COLORS.textPrimary, marginBottom: 2 },
  origenMeta: { fontSize: 12, color: COLORS.textMuted, fontWeight: "600", marginBottom: 10 },
  methodRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  methodBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: COLORS.water,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: "center",
    backgroundColor: COLORS.waterLight,
    minHeight: 88,
    justifyContent: "center",
  },
  methodBtnOn: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  methodGlyph: {
    fontSize: 18,
    color: COLORS.waterDark,
    fontWeight: "800",
    marginBottom: 4,
  },
  methodBtnTxt: {
    color: COLORS.primaryDark,
    fontWeight: "800",
    fontFamily: FONTS.extrabold,
    fontSize: 14,
  },
  methodHint: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  puntoActual: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  puntoActualTitle: { fontSize: 13, fontWeight: "800", color: COLORS.primary },
  puntoActualMeta: { marginTop: 2, fontSize: 12, color: COLORS.textSecondary, fontWeight: "600" },
  coordsBox: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  formLabel: { fontSize: 12, fontWeight: "700", color: COLORS.textSecondary, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.mist,
    marginBottom: 8,
  },
  sectionLabel: {
    marginTop: 14,
    marginBottom: 6,
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  listItem: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  listItemTxt: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary },
  listItemMeta: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  indexBox: { borderRadius: RADIUS.md, padding: 14 },
  indexBig: { fontSize: 22, fontWeight: "800" },
  indexMeta: { marginTop: 4, color: COLORS.textSecondary, fontWeight: "700" },
  btn: {
    marginTop: 12,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 13,
    alignItems: "center",
  },
  btnTxt: { color: "#fff", fontWeight: "800", fontFamily: FONTS.extrabold },
  btnSecondary: {
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnSecondaryTxt: { color: COLORS.primary, fontWeight: "800" },
  btnGhost: { marginTop: 10, alignItems: "flex-end" },
  btnGhostTxt: { color: COLORS.water, fontWeight: "800" },
  montajeCta: {
    marginTop: 12,
    backgroundColor: COLORS.waterLight,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.water,
  },
  montajeCtaTitle: { fontSize: 15, fontWeight: "800", color: COLORS.waterDark },
  montajeCtaSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4, lineHeight: 17 },
  zonaChip: {
    backgroundColor: COLORS.mist,
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  zonaChipTitle: { fontSize: 14, fontWeight: "800", color: COLORS.textPrimary },
  zonaChipMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2, lineHeight: 16 },
});
