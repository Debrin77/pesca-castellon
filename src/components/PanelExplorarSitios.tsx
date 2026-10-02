/**
 * Ideas y sitios: SAIH embalses/aforos, Quiero pescar (top 3), recomendaciones, campo.
 * Montado en Inicio (y también en Mapa). Plegable por apartados; no se omite contenido.
 */
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useProvincia } from "../context/ProvinciaContext";
import { usePuntoConsulta } from "../context/PuntoConsultaContext";
import { useModoPesca } from "../context/ModoPescaContext";
import { getProvinciaActiva } from "../provincias/runtime";
import {
  FavoritoZona,
  obtenerFavoritos,
  obtenerPuntosGuardados,
  PuntoGuardado,
} from "../services/storageService";
import {
  getResumenEmbalses,
  getResumenAforos,
  etiquetaFuenteSaih,
  esFuenteSaihReal,
  type NivelAforo,
} from "../services/saihService";
import { leerCacheOffline, guardarCacheOffline } from "../services/offlineService";
import { obtenerUbicacionActual } from "../services/locationService";
import QuieroPescarBlock from "./QuieroPescarBlock";
import RecomendacionHoyCard from "./RecomendacionHoyCard";
import PanelCampoHoy from "./PanelCampoHoy";
import TerminoAyuda from "./TerminoAyuda";
import ApartadoPlegable from "./ApartadoPlegable";
import type { SitioEspecieHoy } from "../utils/recomendacionPorEspecie";
import { COLORS, RADIUS, SHADOW_SOFT, SPACING, TYPE } from "../theme";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type SaihChip = {
  etiqueta: string;
  zoneId: string;
  pct: number | null;
  fuente: string;
  fechaDato?: string | null;
};
type AforoChip = {
  etiqueta: string;
  nombre: string;
  rio: string | null;
  caudalM3s: number | null;
  nivel: NivelAforo;
  fuente: string;
  fechaDato?: string | null;
};

function metaFuentePanel(
  items: { fuente: string; fechaDato?: string | null }[],
  vivoLabel: string
): string {
  if (items.some((s) => s.fuente === "saih_chj" || s.fuente === "saih_chg")) return vivoLabel;
  const cache = items.find((s) => s.fuente === "cache");
  if (cache) return etiquetaFuenteSaih("cache", cache.fechaDato);
  return "ejemplo / reintentar";
}

function colorNivelAforo(nivel: NivelAforo): string {
  if (nivel === "rojo") return "#b33a3a";
  if (nivel === "naranja") return "#c46a1a";
  if (nivel === "amarillo") return "#c4a01a";
  if (nivel === "fallo" || nivel === "sin_dato") return COLORS.textMuted;
  return COLORS.waterDark;
}

type Props = {
  navigation: any;
  /** Fuerza abrir (p. ej. deep-link / mapa). */
  forzarAbrir?: boolean;
  /** Abierto al montar (Inicio suele ir cerrado; Mapa puede abrir). */
  inicialAbierto?: boolean;
};

/** Centra el mapa desde Inicio o desde el propio stack Mapa. */
function irAMapaCentrar(
  navigation: { navigate: (...args: any[]) => void; getParent?: () => any },
  centrarEn: { lat: number; lng: number; nombre?: string }
) {
  const parent = navigation.getParent?.();
  if (parent?.navigate) {
    parent.navigate("Mapa", { screen: "ZonasLibresMain", params: { centrarEn } });
    return;
  }
  navigation.navigate("ZonasLibresMain", { centrarEn });
}

export default function PanelExplorarSitios({
  navigation,
  forzarAbrir,
  inicialAbierto = false,
}: Props) {
  const { provincia: provinciaCtx } = useProvincia();
  const provincia = provinciaCtx ?? getProvinciaActiva();
  const { fijarPunto } = usePuntoConsulta();
  const { modo, modoElegido, disponibles, setModo } = useModoPesca();
  const [abierto, setAbierto] = useState(inicialAbierto);

  useEffect(() => {
    if (forzarAbrir) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setAbierto(true);
    }
  }, [forzarAbrir]);
  const [favoritos, setFavoritos] = useState<FavoritoZona[]>([]);
  const [puntos, setPuntos] = useState<PuntoGuardado[]>([]);
  const [saihPanel, setSaihPanel] = useState<SaihChip[]>([]);
  const [aforoPanel, setAforoPanel] = useState<AforoChip[]>([]);
  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null);

  const coordsFavorito = useCallback(
    (zonaId: string) => {
      const z = (provincia.zones as { id: string; lat?: number; lng?: number }[]).find(
        (x) => x.id === zonaId
      );
      if (z?.lat == null || z?.lng == null) return null;
      return { lat: z.lat, lng: z.lng };
    },
    [provincia.zones]
  );

  useFocusEffect(
    useCallback(() => {
      let vivo = true;
      obtenerFavoritos().then((f) => {
        if (vivo) setFavoritos(f);
      });
      obtenerPuntosGuardados().then((p) => {
        if (vivo) setPuntos(p);
      });
      return () => {
        vivo = false;
      };
    }, [])
  );

  useEffect(() => {
    let vivo = true;
    (async () => {
      const cache = await leerCacheOffline();
      if (!vivo) return;
      if (Array.isArray(cache?.saih)) setSaihPanel(cache!.saih as SaihChip[]);
      if (Array.isArray(cache?.saihAforos)) setAforoPanel(cache!.saihAforos as AforoChip[]);
      if (cache?.ubicacion) setUbicacion(cache.ubicacion);

      const embalsesPanel = provincia.embalsesPanel;
      const aforosMeta = provincia.aforosPanel ?? [];
      if (provincia.tieneSaih && embalsesPanel.length > 0) {
        try {
          const rows = await getResumenEmbalses(embalsesPanel);
          if (!vivo) return;
          const panel: SaihChip[] = rows
            .map((r) => {
              const meta =
                embalsesPanel.find((e) => e.nombre === r.nombre) ??
                embalsesPanel.find((e) => e.etiqueta === r.etiqueta);
              if (!meta) return null;
              return {
                etiqueta: r.etiqueta,
                zoneId: meta.zoneId,
                pct: r.estacion.porcentajeLleno,
                fuente: r.estacion.fuente,
                fechaDato: r.estacion.fechaDato,
              };
            })
            .filter((x): x is SaihChip => x != null);
          const hayReal = panel.some((s) => esFuenteSaihReal(s.fuente));
          // No pisar un panel previo bueno con solo ejemplos inventados.
          if (hayReal || !(Array.isArray(cache?.saih) && cache!.saih.length > 0)) {
            setSaihPanel(panel);
            if (hayReal) await guardarCacheOffline({ saih: panel });
          }
        } catch {
          /* cache ya aplicada */
        }
      } else if (vivo) {
        setSaihPanel([]);
      }

      if (aforosMeta.length) {
        try {
          const rows = await getResumenAforos(aforosMeta);
          if (!vivo) return;
          const panel: AforoChip[] = rows.map((r) => ({
            etiqueta: r.etiqueta,
            nombre: r.nombre,
            rio: r.estacion.rio,
            caudalM3s: r.estacion.caudalM3s,
            nivel: r.estacion.nivel,
            fuente: r.estacion.fuente,
            fechaDato: r.estacion.fechaDato,
          }));
          const hayReal = panel.some((s) => esFuenteSaihReal(s.fuente));
          if (hayReal || !(Array.isArray(cache?.saihAforos) && cache!.saihAforos.length > 0)) {
            setAforoPanel(panel);
            if (hayReal) await guardarCacheOffline({ saihAforos: panel });
          }
        } catch {
          /* cache ya aplicada */
        }
      } else if (vivo) {
        setAforoPanel([]);
      }

      try {
        const loc = await obtenerUbicacionActual();
        if (vivo && loc) setUbicacion({ lat: loc.lat, lng: loc.lng });
      } catch {
        /* centro provincia basta */
      }
    })();
    return () => {
      vivo = false;
    };
  }, [provincia.id, provincia.tieneSaih, provincia.embalsesPanel, provincia.aforosPanel]);

  const nSitios =
    saihPanel.length + aforoPanel.length + favoritos.length + Math.min(puntos.length, 6);
  const etiquetaClima = ubicacion
    ? `${ubicacion.lat.toFixed(2)}, ${ubicacion.lng.toFixed(2)}`
    : provincia.nombre;
  const tieneSaih = saihPanel.length > 0 || aforoPanel.length > 0;
  const tieneSitios = favoritos.length > 0 || puntos.length > 0;

  return (
    <ApartadoPlegable
      titulo="Ideas y sitios"
      subCerrado={
        nSitios > 0
          ? `${nSitios} pistas · SAIH, recomendaciones y favoritos`
          : "Quiero pescar, recomendaciones, embalses y favoritos"
      }
      subAbierto="Elige un bloque · nada se omite"
      abierto={abierto}
      onAbiertoChange={setAbierto}
      accessibilityLabelAbrir="Mostrar ideas y sitios: recomendaciones, embalses y favoritos"
      accessibilityLabelCerrar="Ocultar ideas y sitios"
      style={styles.wrapSinMargen}
    >
      {tieneSaih ? (
        <ApartadoPlegable
          interno
          titulo="Niveles SAIH"
          subCerrado={`${saihPanel.length} embalses · ${aforoPanel.length} aforos`}
          subAbierto="Embalses y caudal en vivo o caché"
          inicialAbierto={false}
        >
          {saihPanel.length > 0 && (
            <View style={{ marginBottom: aforoPanel.length > 0 ? 12 : 0 }}>
              <View style={styles.sectionRow}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={styles.sectionTitle}>Embalses</Text>
                  <TerminoAyuda id="saih" />
                </View>
                <Text style={styles.sectionMeta}>{metaFuentePanel(saihPanel, "en vivo")}</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {saihPanel.map((s) => (
                  <TouchableOpacity
                    key={`top-${s.zoneId}`}
                    style={styles.saihChip}
                    onPress={() => navigation.navigate("ZoneDetail", { zoneId: s.zoneId })}
                    accessibilityLabel={`${s.etiqueta}, ${
                      s.pct != null ? `${s.pct.toFixed(0)} por ciento` : "sin dato"
                    }${s.fuente === "cache" && s.fechaDato ? `, último ${s.fechaDato}` : ""}`}
                  >
                    <Text style={styles.saihName}>{s.etiqueta}</Text>
                    <Text style={styles.saihPct}>
                      {s.pct != null ? `${s.pct.toFixed(0)}%` : "—"}
                    </Text>
                    {s.fuente === "cache" && s.fechaDato ? (
                      <Text style={styles.saihFecha} numberOfLines={1}>
                        {s.fechaDato}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          {aforoPanel.length > 0 && (
            <View>
              <View style={styles.sectionRow}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={styles.sectionTitle}>Aforos · caudal</Text>
                  <TerminoAyuda id="aforo" />
                </View>
                <Text style={styles.sectionMeta}>
                  {metaFuentePanel(aforoPanel, "SAIH Júcar")}
                </Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {aforoPanel.map((s) => (
                  <View
                    key={`top-aforo-${s.nombre}`}
                    style={[styles.aforoChip, { borderColor: colorNivelAforo(s.nivel) }]}
                    accessibilityLabel={`${s.etiqueta}${s.rio ? `, ${s.rio}` : ""}, ${
                      s.caudalM3s != null
                        ? `${s.caudalM3s.toFixed(2)} metros cúbicos por segundo`
                        : "sin dato"
                    }${s.fuente === "cache" && s.fechaDato ? `, último ${s.fechaDato}` : ""}`}
                  >
                    <Text style={styles.saihName}>{s.etiqueta}</Text>
                    <Text style={[styles.aforoCaudal, { color: colorNivelAforo(s.nivel) }]}>
                      {s.caudalM3s != null ? `${s.caudalM3s.toFixed(2)}` : "—"}
                      <Text style={styles.aforoUnidad}> m³/s</Text>
                    </Text>
                    {s.rio ? (
                      <Text style={styles.aforoRio} numberOfLines={1}>
                        {s.rio}
                      </Text>
                    ) : null}
                    {s.fechaDato && (s.fuente === "cache" || s.fuente === "saih_chj") ? (
                      <Text style={styles.saihFecha} numberOfLines={1}>
                        {s.fechaDato}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </ApartadoPlegable>
      ) : null}

      <ApartadoPlegable
        interno
        titulo="Quiero pescar"
        subCerrado="Especie → top 3 sitios de hoy"
        subAbierto="Elige modalidad y especie"
        inicialAbierto={false}
      >
        <QuieroPescarBlock
          disponibles={disponibles}
          especiesRio={
            (provincia.species as {
              id: string;
              nombre: string;
              icono?: string;
              nombreCientifico?: string;
              invasora?: boolean;
            }[]) ?? []
          }
          ancla={{
            lat: ubicacion?.lat ?? provincia.regionMapa.latitude,
            lng: ubicacion?.lng ?? provincia.regionMapa.longitude,
          }}
          anclaCosta={
            provincia.regionCosta
              ? { lat: provincia.regionCosta.latitude, lng: provincia.regionCosta.longitude }
              : null
          }
          modoActual={modoElegido ? modo : null}
          onElegirModo={(m) => void setModo(m)}
          onAbrirSitio={(sitio: SitioEspecieHoy, modoSitio) => {
            void setModo(modoSitio);
            const zonas = provincia.zones as { id: string }[];
            const zonaConocida = !!sitio.zoneId && zonas.some((z) => z.id === sitio.zoneId);
            void fijarPunto({
              lat: sitio.lat,
              lng: sitio.lng,
              fuente: zonaConocida || sitio.origen === "zona" ? "zona" : "mapa",
              etiqueta: sitio.nombre,
            });
            if (zonaConocida) {
              navigation.navigate("ZoneDetail", { zoneId: sitio.zoneId! });
              return;
            }
            irAMapaCentrar(navigation, {
              lat: sitio.lat,
              lng: sitio.lng,
              nombre: sitio.nombre,
            });
          }}
        />
      </ApartadoPlegable>

      <ApartadoPlegable
        interno
        titulo="Hoy te conviene"
        subCerrado="Mejor sitio por modalidad"
        subAbierto="Según favoritos, puntos y catálogo"
        inicialAbierto={false}
      >
        <RecomendacionHoyCard
          favoritos={favoritos}
          puntos={puntos}
          actual={
            ubicacion
              ? { lat: ubicacion.lat, lng: ubicacion.lng, nombre: etiquetaClima }
              : null
          }
          coordsFavorito={coordsFavorito}
          modos={disponibles}
          ancla={{
            lat: ubicacion?.lat ?? provincia.regionMapa.latitude,
            lng: ubicacion?.lng ?? provincia.regionMapa.longitude,
          }}
          anclaCosta={
            provincia.regionCosta
              ? { lat: provincia.regionCosta.latitude, lng: provincia.regionCosta.longitude }
              : null
          }
          onExplorarMapa={() => {
            const parent = navigation.getParent?.();
            if (parent?.navigate) {
              parent.navigate("Mapa", { screen: "ZonasLibresMain" });
              return;
            }
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setAbierto(false);
          }}
          onAbrir={(r) => {
            const modoRec = "modo" in r ? r.modo : null;
            if (modoRec) void setModo(modoRec);
            const fuente =
              r.candidato.tipo === "favorito" || r.candidato.zoneId ? "zona" : "mapa";
            void fijarPunto({
              lat: r.candidato.lat,
              lng: r.candidato.lng,
              fuente,
              etiqueta: r.candidato.nombre,
            });
            const zid = r.candidato.zoneId;
            const zonaConocida =
              !!zid && (provincia.zones as { id: string }[]).some((z) => z.id === zid);
            if (zonaConocida) {
              navigation.navigate("ZoneDetail", { zoneId: zid });
              return;
            }
            irAMapaCentrar(navigation, {
              lat: r.candidato.lat,
              lng: r.candidato.lng,
              nombre: r.candidato.nombre,
            });
          }}
        />
      </ApartadoPlegable>

      {tieneSitios ? (
        <ApartadoPlegable
          interno
          titulo="Tus sitios"
          subCerrado={`${favoritos.length} favoritos · ${Math.min(puntos.length, 6)} puntos`}
          subAbierto="Favoritos y puntos guardados"
          inicialAbierto={false}
        >
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Favoritos y puntos</Text>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("Capturas", {
                  screen: "CapturasMain",
                  params: { abrirCapturaRapida: true },
                })
              }
            >
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
                  irAMapaCentrar(navigation, {
                    lat: p.lat,
                    lng: p.lng,
                    nombre: p.nombre,
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
        </ApartadoPlegable>
      ) : null}

      <ApartadoPlegable
        interno
        titulo="Para salir hoy"
        subCerrado="Campo: solunar, radar, ID y más"
        subAbierto="Herramientas de campo"
        inicialAbierto={false}
      >
        <PanelCampoHoy navigation={navigation} />
      </ApartadoPlegable>
    </ApartadoPlegable>
  );
}

const styles = StyleSheet.create({
  wrapSinMargen: {
    marginHorizontal: SPACING.sm,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: SPACING.sm,
  },
  sectionTitle: { ...TYPE.displayTitle, fontSize: 16, color: COLORS.textPrimary },
  sectionMeta: { fontSize: 11, color: COLORS.textMuted, fontWeight: "600" },
  linkMini: { fontSize: 12, fontWeight: "700", color: COLORS.water },
  saihChip: {
    backgroundColor: "rgba(255,255,255,0.72)",
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.85)",
    minWidth: 88,
    ...SHADOW_SOFT,
  },
  saihName: { fontSize: 11, fontWeight: "700", color: COLORS.textSecondary },
  saihPct: { fontSize: 18, fontWeight: "800", color: COLORS.waterDark, marginTop: 2 },
  saihFecha: { fontSize: 9, fontWeight: "600", color: COLORS.textMuted, marginTop: 2 },
  aforoChip: {
    backgroundColor: "rgba(255,255,255,0.72)",
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    minWidth: 104,
    ...SHADOW_SOFT,
  },
  aforoCaudal: { fontSize: 18, fontWeight: "800", marginTop: 2 },
  aforoUnidad: { fontSize: 11, fontWeight: "700" },
  aforoRio: { fontSize: 10, fontWeight: "600", color: COLORS.textMuted, marginTop: 2 },
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
});
