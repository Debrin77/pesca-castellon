import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  elegirRecomendacionesHoyPack,
  elegirTopZonasHoy,
  type RecomendacionHoyPack,
  type RecomendacionModoHoy,
} from "../utils/recomendacionHoy";
import type { FavoritoZona, PuntoGuardado } from "../services/storageService";
import { etiquetaModo, type ModoPescaGlobal } from "../data/modoPesca";
import { COLORS, FONTS, GRADIENTS, RADIUS, SHADOW_SOFT, SPACING } from "../theme";
import OndaAgua from "./OndaAgua";

type Props = {
  favoritos: FavoritoZona[];
  puntos: PuntoGuardado[];
  actual?: { lat: number; lng: number; nombre: string } | null;
  coordsFavorito: (zonaId: string) => { lat: number; lng: number } | null;
  /** Modalidades de la provincia (1 = top zonas mismo modo; 2+ = una por modo). */
  modos: ModoPescaGlobal[];
  /** Ancla para catálogo cercano (GPS o centro del mapa provincial). */
  ancla: { lat: number; lng: number };
  /** Centro costero: respaldo para orilla/barco si el GPS es interior. */
  anclaCosta?: { lat: number; lng: number } | null;
  onAbrir: (rec: RecomendacionModoHoy) => void;
  onExplorarMapa: () => void;
};

const ORDINALES = ["1ª", "2ª", "3ª", "4ª", "5ª"];

/** Bloque Inicio: «Hoy te conviene» — mejor por modalidad, o top zonas del mismo modo. */
export default function RecomendacionHoyCard({
  favoritos,
  puntos,
  actual,
  coordsFavorito,
  modos,
  ancla,
  anclaCosta,
  onAbrir,
  onExplorarMapa,
}: Props) {
  const multi = modos.length > 1;
  const modoUnico: ModoPescaGlobal = modos[0] ?? "rio";
  const [pack, setPack] = useState<RecomendacionHoyPack | null>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    let vivo = true;
    setCargando(true);

    const trabajo = multi
      ? elegirRecomendacionesHoyPack({
          modos,
          favoritos,
          puntos,
          actual,
          coordsFavorito,
          ancla,
          anclaCosta,
        })
      : elegirTopZonasHoy({
          modo: modoUnico,
          favoritos,
          puntos,
          actual,
          coordsFavorito,
          ancla,
          topN: 3,
        });

    trabajo
      .then((p) => {
        if (!vivo) return;
        setPack(p);
      })
      .finally(() => {
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
    modoUnico,
    modos.join(","),
    ancla.lat,
    ancla.lng,
    anclaCosta?.lat,
    anclaCosta?.lng,
  ]);

  const hayPack = !!pack && pack.porModo.length > 0;

  if (!cargando && !hayPack) {
    return (
      <TouchableOpacity
        style={styles.vacioLinea}
        onPress={onExplorarMapa}
        accessibilityRole="button"
        accessibilityLabel="Explorar mapa para guardar sitios"
      >
        <Text style={styles.vacioLineaTxt}>
          Sin zonas cerca · <Text style={styles.vacioLineaLink}>explorar mapa →</Text>
        </Text>
      </TouchableOpacity>
    );
  }

  if (cargando && !hayPack) {
    return (
      <View style={styles.vacioLinea}>
        <ActivityIndicator color={COLORS.water} />
      </View>
    );
  }

  if (!hayPack || !pack) return null;

  const destId = pack.destacada?.candidato.id;
  const subtitulo = multi ? "Mejor de cada modalidad hoy" : "Mejores zonas hoy";
  const pie = multi ? "Toca una modalidad para abrir el sitio" : "Toca una zona para abrirla";

  return (
    <View style={styles.wrap}>
      <LinearGradient colors={[...GRADIENTS.water]} style={styles.inner}>
        <OndaAgua intensidad={0.75} />
        <Text style={styles.kicker}>Hoy te conviene</Text>
        <Text style={styles.subtituloMulti}>{subtitulo}</Text>

        <View style={styles.modosLista} accessibilityRole="summary">
          {pack.porModo.map((fila, i) => {
            const esMejor = fila.candidato.id === destId;
            const etiquetaFila = multi ? etiquetaModo(fila.modo) : ORDINALES[i] ?? `${i + 1}ª`;
            return (
              <TouchableOpacity
                key={`${fila.modo}:${fila.candidato.id}`}
                style={[styles.modoFila, esMejor && styles.modoFilaOn]}
                onPress={() => onAbrir(fila)}
                accessibilityRole="button"
                accessibilityLabel={`${etiquetaFila}: ${fila.etiqueta} ${fila.puntuacion}, ${fila.candidato.nombre}`}
                accessibilityState={{ selected: esMejor }}
              >
                <View style={styles.modoFilaTxt}>
                  <View style={styles.modoFilaCabecera}>
                    <Text style={[styles.modoLabel, esMejor && styles.modoLabelOn]}>
                      {etiquetaFila}
                    </Text>
                    {esMejor ? <Text style={styles.badgeMejor}>mejor hoy</Text> : null}
                  </View>
                  <Text style={[styles.modoSitio, esMejor && styles.modoSitioOn]} numberOfLines={2}>
                    {fila.candidato.nombre}
                  </Text>
                  <View style={[styles.pillCompact, { backgroundColor: fila.fondo }]}>
                    <Text style={[styles.pillTxt, { color: fila.color }]}>
                      {fila.etiqueta} · {fila.puntuacion}
                      {fila.iconoLuna ? ` ${fila.iconoLuna}` : ""}
                    </Text>
                  </View>
                </View>
                <Text style={styles.chevronFila}>›</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.sub}>{pie}</Text>
      </LinearGradient>
    </View>
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
  kicker: {
    fontSize: 11,
    fontWeight: "800",
    fontFamily: FONTS.extrabold,
    letterSpacing: 0.9,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.82)",
    marginBottom: 6,
    zIndex: 1,
  },
  subtituloMulti: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: FONTS.semibold,
    color: "rgba(255,255,255,0.88)",
    marginBottom: 12,
    zIndex: 1,
  },
  pillCompact: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    marginTop: 6,
  },
  pillTxt: { fontSize: 13, fontWeight: "800" },
  sub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.88)",
    lineHeight: 18,
    marginTop: 10,
    zIndex: 1,
  },
  chevronFila: { color: "#fff", fontSize: 28, fontWeight: "200", marginLeft: 4 },
  modosLista: {
    zIndex: 1,
    gap: 8,
  },
  modoFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  modoFilaOn: {
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  modoFilaTxt: { flex: 1, minWidth: 0 },
  modoFilaCabecera: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  modoLabel: {
    fontSize: 15,
    fontWeight: "800",
    fontFamily: FONTS.extrabold,
    color: "rgba(255,255,255,0.9)",
  },
  modoLabelOn: { color: "#fff" },
  badgeMejor: {
    fontSize: 10,
    fontWeight: "800",
    fontFamily: FONTS.extrabold,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.92)",
    backgroundColor: "rgba(0,0,0,0.22)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    overflow: "hidden",
  },
  modoSitio: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: FONTS.bold,
    color: "rgba(255,255,255,0.92)",
    lineHeight: 22,
  },
  modoSitioOn: { color: "#fff" },
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
