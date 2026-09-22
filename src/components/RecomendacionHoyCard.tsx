import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  elegirRecomendacionHoy,
  elegirRecomendacionesHoyPack,
  type RecomendacionHoy,
  type RecomendacionHoyPack,
  type RecomendacionModoHoy,
} from "../utils/recomendacionHoy";
import { CATEGORIA_INFO } from "../services/fishingIndexService";
import type { FavoritoZona, PuntoGuardado } from "../services/storageService";
import { etiquetaModo, type ModoPescaGlobal } from "../data/modoPesca";
import { COLORS, FONTS, GRADIENTS, RADIUS, SHADOW_SOFT, SPACING } from "../theme";
import PulsePress from "./PulsePress";
import OndaAgua from "./OndaAgua";

type Props = {
  favoritos: FavoritoZona[];
  puntos: PuntoGuardado[];
  actual?: { lat: number; lng: number; nombre: string } | null;
  coordsFavorito: (zonaId: string) => { lat: number; lng: number } | null;
  /** Modalidades de la provincia (1 = tarjeta clásica; 2+ = resumen por modo). */
  modos: ModoPescaGlobal[];
  /** Ancla para catálogo cercano (GPS o centro del mapa provincial). */
  ancla: { lat: number; lng: number };
  onAbrir: (rec: RecomendacionModoHoy | RecomendacionHoy) => void;
  onExplorarMapa: () => void;
};

/** Bloque Inicio: «Hoy te conviene» — mejor sitio, o resumen Río/Orilla/Barco. */
export default function RecomendacionHoyCard({
  favoritos,
  puntos,
  actual,
  coordsFavorito,
  modos,
  ancla,
  onAbrir,
  onExplorarMapa,
}: Props) {
  const multi = modos.length > 1;
  const [rec, setRec] = useState<RecomendacionHoy | null>(null);
  const [pack, setPack] = useState<RecomendacionHoyPack | null>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    let vivo = true;
    const haySitios = favoritos.length > 0 || puntos.length > 0 || !!actual || multi;
    if (!haySitios) {
      setRec(null);
      setPack(null);
      return;
    }
    setCargando(true);

    const trabajo = multi
      ? elegirRecomendacionesHoyPack({
          modos,
          favoritos,
          puntos,
          actual,
          coordsFavorito,
          ancla,
        }).then((p) => {
          if (!vivo) return;
          setPack(p);
          setRec(null);
        })
      : elegirRecomendacionHoy({ favoritos, puntos, actual, coordsFavorito }).then((r) => {
          if (!vivo) return;
          setRec(r);
          setPack(null);
        });

    trabajo.finally(() => {
      if (vivo) setCargando(false);
    });

    return () => {
      vivo = false;
    };
  }, [
    favoritos,
    puntos,
    actual?.lat,
    actual?.lng,
    actual?.nombre,
    coordsFavorito,
    multi,
    modos.join(","),
    ancla.lat,
    ancla.lng,
  ]);

  if (!cargando && !rec && !pack?.destacada && favoritos.length === 0 && puntos.length === 0 && !multi) {
    return (
      <TouchableOpacity
        style={styles.vacioLinea}
        onPress={onExplorarMapa}
        accessibilityRole="button"
        accessibilityLabel="Explorar mapa para guardar sitios"
      >
        <Text style={styles.vacioLineaTxt}>
          Sin sitios guardados · <Text style={styles.vacioLineaLink}>explorar mapa →</Text>
        </Text>
      </TouchableOpacity>
    );
  }

  if (cargando && !rec && !pack?.destacada) {
    return (
      <View style={styles.vacioLinea}>
        <ActivityIndicator color={COLORS.water} />
      </View>
    );
  }

  // —— Varias modalidades: resumen breve de las 3 ——
  if (multi && pack?.destacada) {
    const dest = pack.destacada;
    return (
      <View style={styles.wrap}>
        <LinearGradient colors={[...GRADIENTS.water]} style={styles.inner}>
          <OndaAgua intensidad={0.75} />
          <PulsePress
            onPress={() => onAbrir(dest)}
            style={styles.destacadaHit}
            accessibilityLabel={`Hoy te conviene ${etiquetaModo(dest.modo)}: ${dest.candidato.nombre}`}
          >
            <Text style={styles.kicker}>Hoy te conviene</Text>
            <Text style={styles.modoDestacado}>
              {etiquetaModo(dest.modo)}
              <Text style={styles.modoDestacadoSuave}> · mejor hoy</Text>
            </Text>
            <Text style={styles.nombre} numberOfLines={2}>
              {dest.candidato.nombre}
            </Text>
            <View style={[styles.pill, { backgroundColor: dest.fondo }]}>
              <Text style={[styles.pillTxt, { color: dest.color }]}>
                {dest.etiqueta} · {dest.puntuacion}
                {dest.iconoLuna ? ` ${dest.iconoLuna}` : ""}
              </Text>
            </View>
          </PulsePress>

          <View style={styles.modosLista} accessibilityRole="summary">
            {pack.porModo.map((fila) => {
              const esMejor = fila.modo === dest.modo;
              return (
                <TouchableOpacity
                  key={fila.modo}
                  style={[styles.modoFila, esMejor && styles.modoFilaOn]}
                  onPress={() => onAbrir(fila)}
                  accessibilityRole="button"
                  accessibilityLabel={`${etiquetaModo(fila.modo)}: ${fila.puntuacion}, ${fila.candidato.nombre}`}
                  accessibilityState={{ selected: esMejor }}
                >
                  <Text style={[styles.modoLabel, esMejor && styles.modoLabelOn]}>
                    {etiquetaModo(fila.modo)}
                  </Text>
                  <Text style={[styles.modoScore, esMejor && styles.modoScoreOn]}>{fila.puntuacion}</Text>
                  <Text style={[styles.modoSitio, esMejor && styles.modoSitioOn]} numberOfLines={1}>
                    {fila.candidato.nombre}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.sub}>
            Mejor de cada modalidad (clima) · toca para abrir
          </Text>
        </LinearGradient>
      </View>
    );
  }

  // —— Un solo modo: tarjeta clásica ——
  if (!rec) return null;
  const cat = CATEGORIA_INFO[rec.dia.categoria];

  return (
    <PulsePress onPress={() => onAbrir(rec)} style={styles.wrap}>
      <LinearGradient colors={[...GRADIENTS.water]} style={styles.inner}>
        <OndaAgua intensidad={0.75} />
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>Hoy te conviene</Text>
            <Text style={styles.nombre} numberOfLines={2}>
              {rec.candidato.nombre}
            </Text>
            <View style={[styles.pill, { backgroundColor: cat.fondo }]}>
              <Text style={[styles.pillTxt, { color: cat.color }]}>
                {cat.texto} · {rec.dia.puntuacion}
                {rec.dia.iconoLuna ? ` ${rec.dia.iconoLuna}` : ""}
              </Text>
            </View>
            <Text style={styles.sub} numberOfLines={2}>
              Condiciones (clima) frente a tus sitios · toca para abrir
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </View>
      </LinearGradient>
    </PulsePress>
  );
}

export type { RecomendacionModoHoy };

const styles = StyleSheet.create({
  wrap: {
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    marginBottom: SPACING.lg,
    ...SHADOW_SOFT,
  },
  inner: { paddingVertical: SPACING.lg, paddingHorizontal: SPACING.lg, overflow: "hidden" },
  destacadaHit: { zIndex: 1, marginBottom: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 8, zIndex: 1 },
  kicker: {
    fontSize: 11,
    fontWeight: "800",
    fontFamily: FONTS.extrabold,
    letterSpacing: 0.9,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.82)",
    marginBottom: 6,
  },
  modoDestacado: {
    fontSize: 13,
    fontWeight: "800",
    fontFamily: FONTS.extrabold,
    color: "rgba(255,255,255,0.95)",
    marginBottom: 4,
  },
  modoDestacadoSuave: {
    fontWeight: "600",
    fontFamily: FONTS.semibold,
    color: "rgba(255,255,255,0.75)",
  },
  nombre: {
    fontSize: 22,
    fontWeight: "800",
    fontFamily: FONTS.extrabold,
    color: "#fff",
    lineHeight: 28,
    marginBottom: 10,
  },
  pill: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    marginBottom: 8,
  },
  pillTxt: { fontSize: 13, fontWeight: "800" },
  sub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.88)",
    lineHeight: 18,
    marginTop: 10,
    zIndex: 1,
  },
  chevron: { color: "#fff", fontSize: 32, fontWeight: "200", marginTop: -4 },
  modosLista: {
    zIndex: 1,
    marginTop: 6,
    gap: 6,
  },
  modoFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: RADIUS.sm,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  modoFilaOn: {
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  modoLabel: {
    width: 52,
    fontSize: 13,
    fontWeight: "800",
    fontFamily: FONTS.extrabold,
    color: "rgba(255,255,255,0.78)",
  },
  modoLabelOn: { color: "#fff" },
  modoScore: {
    width: 28,
    fontSize: 15,
    fontWeight: "800",
    fontFamily: FONTS.extrabold,
    color: "rgba(255,255,255,0.85)",
    textAlign: "right",
  },
  modoScoreOn: { color: "#fff" },
  modoSitio: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    fontFamily: FONTS.semibold,
    color: "rgba(255,255,255,0.8)",
  },
  modoSitioOn: { color: "#fff", fontWeight: "700", fontFamily: FONTS.bold },
  vacioLinea: {
    marginBottom: SPACING.md,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  vacioLineaTxt: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  vacioLineaLink: {
    fontWeight: "800",
    color: COLORS.waterDark,
  },
});
