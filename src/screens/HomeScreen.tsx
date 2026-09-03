import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useScrollToTop } from "@react-navigation/native";
import { obtenerUbicacionActual, solicitarPermisoUbicacion } from "../services/locationService";
import { obtenerClimaActual, descripcionTiempo, detectarAlertas, ClimaActual } from "../services/weatherService";
import { calcularIndicePesca, IndicePescaDia, CATEGORIA_INFO } from "../services/fishingIndexService";
import { solicitarPermisoNotificaciones, programarAlertasPesca } from "../services/notificationService";
import { getResumenEmbalsesCastellon } from "../services/saihService";
import { FavoritoZona, obtenerFavoritos, obtenerPuntosGuardados, PuntoGuardado } from "../services/storageService";
import LicenseBanner from "../components/LicenseBanner";
import ConsultaPescaCard from "../components/ConsultaPescaCard";
import TemporadaBanner from "../components/TemporadaBanner";
import PanelAvisosSeguridad from "../components/PanelAvisosSeguridad";
import BannerOffline from "../components/BannerOffline";
import PulsePress from "../components/PulsePress";
import ListaAnimada from "../components/ListaAnimada";
import { consultarPuntoPesca } from "../services/consultaPescaService";
import {
  AvisoSeguridad,
  obtenerAvisosSeguridadPesca,
} from "../services/avisosSeguridadService";
import {
  CacheOffline,
  hayConexion,
  leerCacheOffline,
  guardarCacheOffline,
  mensajeOfflineCorto,
} from "../services/offlineService";
import { COLORS, GRADIENTS, RADIUS, SHADOW_SOFT, SPACING } from "../theme";

const EMBALSES_PANEL = [
  { nombre: "EMBALSE DE ARENÓS", fichaId: 266, etiqueta: "Arenós", zoneId: "embalse_arenos" },
  { nombre: "EMBALSE DE SICHAR", fichaId: 247, etiqueta: "Sichar", zoneId: "embalse_sichar" },
  { nombre: "EMBALSE DE MARÍA CRISTINA", fichaId: 248, etiqueta: "M. Cristina", zoneId: "embalse_maria_cristina" },
  { nombre: "EMBALSE DE REGAJO", fichaId: 221, etiqueta: "Regajo", zoneId: "rio_palancia_regajo" },
  { nombre: "EMBALSE DE ULLDECONA", fichaId: 243, etiqueta: "Ulldecona", zoneId: "embalse_ulldecona" },
];

type SaihChip = { etiqueta: string; zoneId: string; pct: number | null; fuente: string };

interface Props {
  navigation: any;
}

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function fechaLegible(d: Date): string {
  return `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}`;
}

function aplicarCache(cache: CacheOffline, setters: {
  setClima: (v: ClimaActual | null) => void;
  setIndiceHoy: (v: IndicePescaDia | null) => void;
  setSaihPanel: (v: SaihChip[]) => void;
  setAvisosSeguridad: (v: AvisoSeguridad[]) => void;
  setUbicacion: (v: { lat: number; lng: number } | null) => void;
}) {
  if (cache.clima) setters.setClima(cache.clima as ClimaActual);
  if (cache.indiceHoy) setters.setIndiceHoy(cache.indiceHoy as IndicePescaDia);
  if (Array.isArray(cache.saih)) setters.setSaihPanel(cache.saih as SaihChip[]);
  if (Array.isArray(cache.avisos)) setters.setAvisosSeguridad(cache.avisos as AvisoSeguridad[]);
  if (cache.ubicacion) setters.setUbicacion(cache.ubicacion);
}

export default function HomeScreen({ navigation }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);
  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null);
  const [clima, setClima] = useState<ClimaActual | null>(null);
  const [indiceHoy, setIndiceHoy] = useState<IndicePescaDia | null>(null);
  const [cargando, setCargando] = useState(true);
  const [permisoDenegado, setPermisoDenegado] = useState(false);
  const [favoritos, setFavoritos] = useState<FavoritoZona[]>([]);
  const [puntos, setPuntos] = useState<PuntoGuardado[]>([]);
  const [saihPanel, setSaihPanel] = useState<SaihChip[]>([]);
  const [avisosSeguridad, setAvisosSeguridad] = useState<AvisoSeguridad[]>([]);
  const [avisosCargando, setAvisosCargando] = useState(true);
  const [avisosError, setAvisosError] = useState<string | null>(null);
  const [online, setOnline] = useState(true);
  const [cache, setCache] = useState<CacheOffline | null>(null);

  useFocusEffect(
    useCallback(() => {
      obtenerFavoritos().then(setFavoritos);
      obtenerPuntosGuardados().then(setPuntos);
    }, [])
  );

  useEffect(() => {
    let vivo = true;

    async function bootstrap() {
      const conectado = await hayConexion();
      if (!vivo) return;
      setOnline(conectado);

      const cacheLocal = await leerCacheOffline();
      if (!vivo) return;
      setCache(cacheLocal);

      if (!conectado && cacheLocal) {
        aplicarCache(cacheLocal, {
          setClima,
          setIndiceHoy,
          setSaihPanel,
          setAvisosSeguridad,
          setUbicacion,
        });
        setAvisosCargando(false);
        setAvisosError(null);
        setCargando(false);
        return;
      }

      // En línea (o sin caché): cargar avisos + SAIH + clima/índice
      setAvisosCargando(true);
      try {
        const lista = await obtenerAvisosSeguridadPesca();
        if (!vivo) return;
        setAvisosSeguridad(lista);
        setAvisosError(null);
        if (conectado) {
          await guardarCacheOffline({ avisos: lista });
        }
      } catch {
        if (!vivo) return;
        if (cacheLocal?.avisos) {
          setAvisosSeguridad(cacheLocal.avisos as AvisoSeguridad[]);
          setAvisosError(null);
        } else {
          setAvisosError("No se pudieron cargar los avisos");
        }
      } finally {
        if (vivo) setAvisosCargando(false);
      }

      try {
        const rows = await getResumenEmbalsesCastellon(EMBALSES_PANEL);
        if (!vivo) return;
        const panel: SaihChip[] = rows.map((r) => {
          const meta =
            EMBALSES_PANEL.find((e) => e.nombre === r.nombre) ??
            EMBALSES_PANEL.find((e) => e.etiqueta === r.etiqueta)!;
          return {
            etiqueta: r.etiqueta,
            zoneId: meta.zoneId,
            pct: r.estacion.porcentajeLleno,
            fuente: r.estacion.fuente,
          };
        });
        setSaihPanel(panel);
        if (conectado) {
          await guardarCacheOffline({ saih: panel });
        }
      } catch {
        if (!vivo) return;
        if (cacheLocal && Array.isArray(cacheLocal.saih)) {
          setSaihPanel(cacheLocal.saih as SaihChip[]);
        }
      }

      await cargar(conectado);
    }

    bootstrap();
    return () => {
      vivo = false;
    };
  }, []);

  async function cargar(conectadoParam?: boolean) {
    setCargando(true);
    const conectado = conectadoParam ?? (await hayConexion());
    setOnline(conectado);

    if (!conectado) {
      const cacheLocal = await leerCacheOffline();
      setCache(cacheLocal);
      if (cacheLocal) {
        aplicarCache(cacheLocal, {
          setClima,
          setIndiceHoy,
          setSaihPanel,
          setAvisosSeguridad,
          setUbicacion,
        });
      }
      setCargando(false);
      return;
    }

    const ok = await solicitarPermisoUbicacion();
    if (!ok) {
      setPermisoDenegado(true);
      setCargando(false);
      return;
    }
    setPermisoDenegado(false);
    const loc = await obtenerUbicacionActual();
    if (loc) {
      setUbicacion(loc);
      const [c, indice] = await Promise.all([
        obtenerClimaActual(loc.lat, loc.lng),
        calcularIndicePesca(loc.lat, loc.lng, 3),
      ]);
      setClima(c);
      const dia = indice.length > 0 ? indice[0] : null;
      if (dia) {
        setIndiceHoy(dia);
        const permisoNotif = await solicitarPermisoNotificaciones();
        if (permisoNotif) await programarAlertasPesca(indice);
      }
      await guardarCacheOffline({
        clima: c,
        indiceHoy: dia,
        ubicacion: loc,
      });
      const cacheActualizado = await leerCacheOffline();
      setCache(cacheActualizado);
    }
    setCargando(false);
  }

  const tiempo = clima ? descripcionTiempo(clima.codigoTiempo) : null;
  const catInfo = indiceHoy ? CATEGORIA_INFO[indiceHoy.categoria] : null;
  const consultaViva = ubicacion ? consultarPuntoPesca(ubicacion.lat, ubicacion.lng) : null;
  const mensajeOffline = mensajeOfflineCorto(online, cache);
  const alertasClima =
    clima
      ? detectarAlertas({
          codigoTiempo: clima.codigoTiempo,
          vientoMaxKmh: clima.velocidadVientoKmh,
        })
      : [];

  return (
    <ScrollView ref={scrollRef} style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <LinearGradient colors={[...GRADIENTS.primary]} style={styles.hero}>
        <Text style={styles.dateText}>{fechaLegible(new Date())}</Text>

        {cargando ? (
          <ActivityIndicator color="#fff" style={{ marginVertical: 28 }} />
        ) : permisoDenegado ? (
          <View style={{ alignItems: "center", marginVertical: 16 }}>
            <Text style={styles.weatherFallback}>
              Activa la ubicación para ver el clima y el índice de pesca
            </Text>
            <TouchableOpacity style={styles.retryChip} onPress={() => cargar()}>
              <Text style={styles.retryChipText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.heroClima}>
              {tiempo && clima ? (
                <>
                  <Text style={styles.weatherIcon}>{tiempo.icono}</Text>
                  <Text style={styles.weatherTemp}>{Math.round(clima.temperatura)}°</Text>
                  <Text style={styles.weatherDesc}>{tiempo.texto}</Text>
                </>
              ) : (
                <Text style={styles.weatherFallback}>Sin datos de clima</Text>
              )}
            </View>

            {indiceHoy && catInfo && (
              <View style={styles.indexBlock}>
                <Text style={styles.indexLabel}>Índice de pesca</Text>
                <Text style={styles.indexScore}>{indiceHoy.puntuacion}</Text>
                <View style={[styles.indexCatPill, { backgroundColor: catInfo.fondo }]}>
                  <Text style={[styles.indexCategoria, { color: catInfo.color }]}>
                    {catInfo.icono} {catInfo.texto}
                    <Text style={styles.indexMoon}> · {indiceHoy.iconoLuna}</Text>
                  </Text>
                </View>
              </View>
            )}

            {alertasClima.length > 0 && (
              <View style={styles.alertRow}>
                {alertasClima.map((alerta, idx) => (
                  <View
                    key={idx}
                    style={[styles.weatherAlert, alerta.nivel === "peligro" && styles.weatherAlertDanger]}
                  >
                    <Text style={styles.weatherAlertText}>
                      {alerta.icono} {alerta.texto}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </LinearGradient>

      <View style={styles.body}>
        <BannerOffline mensaje={mensajeOffline} />

        <ListaAnimada index={0}>
          <PulsePress
            onPress={() => navigation.navigate("SalgoAPescar")}
            style={styles.ctaSalgo}
          >
            <LinearGradient colors={[...GRADIENTS.water]} style={styles.ctaSalgoInner}>
              <Text style={styles.ctaSalgoTitle}>Salgo a pescar</Text>
              <Text style={styles.ctaSalgoSub}>Ubicación · veredicto · checklist</Text>
            </LinearGradient>
          </PulsePress>
        </ListaAnimada>

        {/* Bloque seguridad */}
        <ListaAnimada index={1}>
          <View style={styles.bloque}>
            <Text style={styles.bloqueTitulo}>Seguridad y normativa</Text>
            <TemporadaBanner />
            <PanelAvisosSeguridad
              avisos={avisosSeguridad}
              cargando={avisosCargando}
              error={avisosError}
            />
            <LicenseBanner onPress={() => navigation.navigate("License")} />
          </View>
        </ListaAnimada>

        {/* Bloque embalses / favoritos */}
        {(saihPanel.length > 0 || favoritos.length > 0 || puntos.length > 0) && (
          <ListaAnimada index={2}>
            <View style={styles.bloque}>
              <Text style={styles.bloqueTitulo}>Embalses y favoritos</Text>

              {saihPanel.length > 0 && (
                <View style={{ marginBottom: favoritos.length > 0 || puntos.length > 0 ? 12 : 0 }}>
                  <View style={styles.sectionRow}>
                    <Text style={styles.sectionTitle}>Embalses SAIH</Text>
                    <Text style={styles.sectionMeta}>
                      {saihPanel.some((s) => s.fuente === "saih_chj") ? "en vivo" : "ejemplo / reintentar"}
                    </Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8 }}
                  >
                    {saihPanel.map((s) => (
                      <TouchableOpacity
                        key={s.zoneId}
                        style={styles.saihChip}
                        onPress={() => navigation.navigate("ZoneDetail", { zoneId: s.zoneId })}
                      >
                        <Text style={styles.saihName}>{s.etiqueta}</Text>
                        <Text style={styles.saihPct}>
                          {s.pct != null ? `${s.pct.toFixed(0)}%` : "—"}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {(favoritos.length > 0 || puntos.length > 0) && (
                <View>
                  <View style={styles.sectionRow}>
                    <Text style={styles.sectionTitle}>Tus favoritos</Text>
                    <TouchableOpacity onPress={() => navigation.navigate("Capturas")}>
                      <Text style={styles.linkMini}>Ver todo</Text>
                    </TouchableOpacity>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
                  >
                    {favoritos.map((f) => (
                      <TouchableOpacity
                        key={f.zonaId}
                        style={styles.favChip}
                        onPress={() => navigation.navigate("ZoneDetail", { zoneId: f.zonaId })}
                      >
                        <Text style={styles.favChipStar}>★</Text>
                        <Text style={styles.favChipTxt} numberOfLines={2}>
                          {f.nombre}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    {puntos.slice(0, 6).map((p) => (
                      <TouchableOpacity
                        key={p.id}
                        style={styles.puntoChip}
                        onPress={() =>
                          navigation.navigate("Mapa", {
                            screen: "ZonasLibresMain",
                          })
                        }
                      >
                        <Text style={styles.favChipStar}>●</Text>
                        <Text style={styles.favChipTxt} numberOfLines={2}>
                          {p.nombre}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </ListaAnimada>
        )}

        {/* Bloque dónde estoy */}
        <ListaAnimada index={3}>
          <View style={styles.bloque}>
            <Text style={styles.bloqueTitulo}>Dónde estoy</Text>
            {consultaViva ? (
              <View style={{ marginBottom: 12 }}>
                <ConsultaPescaCard
                  consulta={consultaViva}
                  onFicha={
                    consultaViva.tramo?.fichaId
                      ? () =>
                          navigation.navigate("ZoneDetail", {
                            zoneId: consultaViva.tramo!.fichaId,
                          })
                      : undefined
                  }
                  onAparejos={(id) =>
                    navigation.navigate("Aparejos", {
                      screen: "AparejosMain",
                      params: { especieId: id },
                    })
                  }
                />
              </View>
            ) : (
              <Text style={styles.sinConsulta}>
                Activa la ubicación para ver el veredicto del tramo donde estás. El mapa completo
                está en la pestaña Mapa.
              </Text>
            )}

            <PulsePress
              onPress={() => navigation.navigate("Mapa")}
              style={styles.mapaCta}
            >
              <View style={styles.mapaCtaRow}>
                <View style={styles.mapaCtaGlyph}>
                  <Text style={styles.mapaCtaIcon}>◉</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.mapaCtaTitle}>Abrir mapa</Text>
                  <Text style={styles.mapaCtaSub}>Cotos, vedados, costa y consulta al pulsar</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </View>
            </PulsePress>
          </View>
        </ListaAnimada>

        {/* Enlaces secundarios */}
        <ListaAnimada index={4}>
          <View style={styles.linksRow}>
            <TouchableOpacity
              style={styles.linkChip}
              onPress={() => navigation.navigate("Capturas")}
              accessibilityRole="button"
              accessibilityLabel="Capturas"
            >
              <Text style={styles.linkChipTxt}>Capturas</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.linkChip}
              onPress={() => navigation.navigate("Consejos")}
              accessibilityRole="button"
              accessibilityLabel="Consejos"
            >
              <Text style={styles.linkChipTxt}>Consejos</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.linkChip}
              onPress={() => navigation.navigate("Ajustes")}
              accessibilityRole="button"
              accessibilityLabel="Ajustes"
            >
              <Text style={styles.linkChipTxt}>Ajustes</Text>
            </TouchableOpacity>
          </View>
        </ListaAnimada>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  hero: {
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxl + 8,
    paddingHorizontal: SPACING.lg,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
  },
  dateText: {
    fontSize: 15,
    color: "rgba(255,255,255,0.92)",
    textTransform: "capitalize",
    marginBottom: 4,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  heroClima: {
    alignItems: "center",
    marginTop: 8,
  },
  weatherIcon: { fontSize: 42, marginBottom: -4 },
  weatherTemp: {
    fontSize: 72,
    fontWeight: "200",
    color: "#fff",
    letterSpacing: -2,
    lineHeight: 80,
  },
  weatherDesc: {
    fontSize: 17,
    color: "rgba(255,255,255,0.95)",
    fontWeight: "500",
    marginTop: -2,
  },
  weatherFallback: { color: "#fff", fontSize: 13, textAlign: "center" },
  retryChip: {
    marginTop: 12,
    backgroundColor: "rgba(255,255,255,0.22)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
  },
  retryChipText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  indexBlock: {
    alignItems: "center",
    marginTop: 20,
  },
  indexLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  indexScore: {
    fontSize: 48,
    fontWeight: "200",
    color: "#fff",
    letterSpacing: -1,
    lineHeight: 54,
    marginTop: 2,
  },
  indexCatPill: {
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  indexCategoria: {
    fontSize: 16,
    fontWeight: "700",
  },
  indexMoon: {
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  alertRow: {
    marginTop: 14,
    gap: 8,
  },
  weatherAlert: {
    backgroundColor: "rgba(154,74,10,0.92)",
    borderRadius: RADIUS.sm,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  weatherAlertDanger: { backgroundColor: "rgba(180,35,24,0.92)" },
  weatherAlertText: { fontSize: 12.5, color: "#fff", fontWeight: "700" },
  body: {
    paddingHorizontal: SPACING.lg,
    marginTop: -SPACING.md,
  },
  ctaSalgo: {
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    marginBottom: SPACING.md,
    ...SHADOW_SOFT,
  },
  ctaSalgoInner: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: RADIUS.lg,
    alignItems: "center",
  },
  ctaSalgoTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.2,
  },
  ctaSalgoSub: {
    fontSize: 12.5,
    color: "rgba(255,255,255,0.92)",
    fontWeight: "600",
    marginTop: 3,
  },
  bloque: {
    marginBottom: SPACING.md,
  },
  bloqueTitulo: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: SPACING.sm,
  },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: COLORS.textPrimary },
  sectionMeta: { fontSize: 11, color: COLORS.textMuted, fontWeight: "600" },
  linkMini: { fontSize: 12, fontWeight: "700", color: COLORS.water },
  saihChip: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 88,
    ...SHADOW_SOFT,
  },
  saihName: { fontSize: 11, fontWeight: "700", color: COLORS.textSecondary },
  saihPct: { fontSize: 18, fontWeight: "800", color: COLORS.waterDark, marginTop: 2 },
  favChip: {
    width: 130,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e8d9a8",
    ...SHADOW_SOFT,
  },
  puntoChip: {
    width: 130,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW_SOFT,
  },
  favChipStar: { color: COLORS.goldText, fontWeight: "800", marginBottom: 4 },
  favChipTxt: { fontSize: 12, fontWeight: "700", color: COLORS.textPrimary, lineHeight: 16 },
  sinConsulta: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  mapaCta: {
    backgroundColor: COLORS.waterLight,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: "#b7d4de",
    ...SHADOW_SOFT,
  },
  mapaCtaRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  mapaCtaGlyph: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  mapaCtaIcon: { fontSize: 16, color: COLORS.water, fontWeight: "800" },
  mapaCtaTitle: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary },
  mapaCtaSub: { fontSize: 11.5, color: COLORS.textSecondary, marginTop: 2 },
  chevron: { fontSize: 22, color: COLORS.textMuted },
  linksRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  linkChip: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 10,
    alignItems: "center",
  },
  linkChipTxt: {
    fontSize: 12.5,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
});
