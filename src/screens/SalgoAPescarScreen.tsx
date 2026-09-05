import React, { useCallback, useState } from "react";
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
  type FavoritoZona,
  type PuntoGuardado,
} from "../services/storageService";
import { formatearCoords, parsearLatLng } from "../services/coordsUtils";
import {
  consumirPickUbicacion,
  iniciarPickUbicacion,
} from "../services/ubicacionPendiente";
import type { FuentePuntoConsulta } from "../services/puntoConsultaService";
import SemaforoVeredicto from "../components/SemaforoVeredicto";
import ConsultaPescaCard from "../components/ConsultaPescaCard";
import ListaAnimada from "../components/ListaAnimada";
import { COLORS, GRADIENTS, RADIUS, SHADOW, SPACING } from "../theme";

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
  const [gpsCargando, setGpsCargando] = useState(false);

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
    [fijarPunto]
  );

  useFocusEffect(
    useCallback(() => {
      void obtenerFavoritos().then(setFavoritos);
      void obtenerPuntosGuardados().then(setPuntos);
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

  async function usarGps() {
    setGpsCargando(true);
    setError(null);
    const ok = await solicitarPermisoUbicacion();
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
      <LinearGradient colors={[...GRADIENTS.primary]} style={styles.hero}>
        <Text style={styles.kicker}>Modo salida</Text>
        <Text style={styles.title}>Salgo a pescar</Text>
        <Text style={styles.sub}>En 10 segundos: dónde estás, cómo pinta y qué llevar.</Text>
        <View style={styles.steps}>
          {["Ubicación", "Veredicto", "Checklist"].map((t, i) => (
            <View key={t} style={[styles.step, paso >= i && styles.stepOn]}>
              <Text style={[styles.stepTxt, paso >= i && styles.stepTxtOn]}>
                {i + 1}. {t}
              </Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {elegirUbicacion ? (
        <ListaAnimada index={0}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>1 · Dónde estás</Text>
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
              <TouchableOpacity
                style={styles.methodBtn}
                onPress={() => void usarGps()}
                disabled={gpsCargando}
                accessibilityRole="button"
                accessibilityLabel="Usar GPS"
              >
                {gpsCargando ? (
                  <ActivityIndicator color={COLORS.primary} />
                ) : (
                  <Text style={styles.methodBtnTxt}>GPS</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.methodBtn}
                onPress={irAMapa}
                accessibilityRole="button"
                accessibilityLabel="Elegir en el mapa"
              >
                <Text style={styles.methodBtnTxt}>Mapa</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.methodBtn}
                onPress={() => setMostrarCoords((v) => !v)}
                accessibilityRole="button"
                accessibilityLabel="Introducir coordenadas"
              >
                <Text style={styles.methodBtnTxt}>Coords</Text>
              </TouchableOpacity>
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

            {puntos.length > 0 ? (
              <>
                <Text style={styles.sectionLabel}>Tus puntos</Text>
                {puntos.slice(0, 6).map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={styles.listItem}
                    onPress={() =>
                      void aplicarUbicacion({
                        lat: p.lat,
                        lng: p.lng,
                        fuente: "mapa",
                        etiqueta: p.nombre,
                      })
                    }
                  >
                    <Text style={styles.listItemTxt}>{p.nombre}</Text>
                    <Text style={styles.listItemMeta}>{formatearCoords(p.lat, p.lng)}</Text>
                  </TouchableOpacity>
                ))}
              </>
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
              <Text style={styles.cardTitle}>1 · Dónde estás</Text>
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
                  <SemaforoVeredicto consulta={consulta} />
                  <ConsultaPescaCard
                    consulta={consulta}
                    onFicha={
                      consulta.tramo?.fichaId
                        ? () => navigation.navigate("ZoneDetail", { zoneId: consulta.tramo!.fichaId })
                        : undefined
                    }
                    onAparejos={(id) => navigation.navigate("Aparejos", { especieId: id })}
                  />
                </>
              ) : (
                <Text style={styles.muted}>No hay tramo reconocido en este punto.</Text>
              )}
              <TouchableOpacity style={styles.btnGhost} onPress={cambiarUbicacion}>
                <Text style={styles.btnGhostTxt}>Cambiar ubicación</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnGhost} onPress={() => setPaso(1)}>
                <Text style={styles.btnGhostTxt}>Continuar →</Text>
              </TouchableOpacity>
            </View>
          </ListaAnimada>

          {paso >= 1 && (
            <ListaAnimada index={1}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>2 · Cómo pinta hoy</Text>
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
                <TouchableOpacity
                  style={styles.btnGhost}
                  onPress={() => {
                    setPaso(2);
                    navigation.navigate("Previsión");
                  }}
                >
                  <Text style={styles.btnGhostTxt}>Ver previsión completa</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnGhost} onPress={() => setPaso(2)}>
                  <Text style={styles.btnGhostTxt}>Ir al checklist →</Text>
                </TouchableOpacity>
              </View>
            </ListaAnimada>
          )}

          {paso >= 2 && (
            <ListaAnimada index={2}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>3 · Checklist rápido</Text>
                {checklist.map((item, i) => (
                  <Text key={i} style={styles.check}>
                    ☐ {item}
                  </Text>
                ))}
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  hero: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: 14,
    ...SHADOW,
  },
  kicker: {
    color: "#e8f5ee",
    fontWeight: "800",
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  title: { color: "#fff", fontSize: 28, fontWeight: "800", marginTop: 4 },
  sub: { color: "#eef7f1", marginTop: 6, fontSize: 14, lineHeight: 20 },
  steps: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 14 },
  step: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  stepOn: { backgroundColor: "rgba(255,255,255,0.35)" },
  stepTxt: { color: "#e8f5ee", fontSize: 11, fontWeight: "700" },
  stepTxtOn: { color: "#fff" },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW,
  },
  cardTitle: { fontSize: 15, fontWeight: "800", color: COLORS.textPrimary, marginBottom: 10 },
  hint: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 19, marginBottom: 12 },
  muted: { color: COLORS.textSecondary, fontSize: 13 },
  error: { color: COLORS.danger, fontWeight: "700", marginTop: 10, marginBottom: 4 },
  lugar: { fontSize: 14, fontWeight: "800", color: COLORS.textPrimary, marginBottom: 2 },
  origenMeta: { fontSize: 12, color: COLORS.textMuted, fontWeight: "600", marginBottom: 10 },
  methodRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  methodBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: COLORS.mist,
  },
  methodBtnTxt: { color: COLORS.primary, fontWeight: "800", fontSize: 14 },
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
  check: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 6 },
  btn: {
    marginTop: 12,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 13,
    alignItems: "center",
  },
  btnTxt: { color: "#fff", fontWeight: "800" },
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
});
