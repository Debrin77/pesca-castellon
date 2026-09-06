import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { elegirRecomendacionHoy, RecomendacionHoy } from "../utils/recomendacionHoy";
import { CATEGORIA_INFO } from "../services/fishingIndexService";
import type { FavoritoZona, PuntoGuardado } from "../services/storageService";
import { COLORS, FONTS, GRADIENTS, RADIUS, SHADOW_SOFT, SPACING } from "../theme";
import PulsePress from "./PulsePress";
import OndaAgua from "./OndaAgua";

type Props = {
  favoritos: FavoritoZona[];
  puntos: PuntoGuardado[];
  actual?: { lat: number; lng: number; nombre: string } | null;
  coordsFavorito: (zonaId: string) => { lat: number; lng: number } | null;
  onAbrir: (rec: RecomendacionHoy) => void;
  onExplorarMapa: () => void;
};

/** Bloque Inicio: «Hoy te conviene X» según índice de favoritos / puntos. */
export default function RecomendacionHoyCard({
  favoritos,
  puntos,
  actual,
  coordsFavorito,
  onAbrir,
  onExplorarMapa,
}: Props) {
  const [rec, setRec] = useState<RecomendacionHoy | null>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    let vivo = true;
    const haySitios = favoritos.length > 0 || puntos.length > 0 || !!actual;
    if (!haySitios) {
      setRec(null);
      return;
    }
    setCargando(true);
    elegirRecomendacionHoy({ favoritos, puntos, actual, coordsFavorito })
      .then((r) => {
        if (vivo) setRec(r);
      })
      .finally(() => {
        if (vivo) setCargando(false);
      });
    return () => {
      vivo = false;
    };
  }, [favoritos, puntos, actual?.lat, actual?.lng, actual?.nombre, coordsFavorito]);

  if (!cargando && !rec && favoritos.length === 0 && puntos.length === 0) {
    return (
      <View style={styles.vacio}>
        <Text style={styles.vacioKicker}>Hoy te conviene</Text>
        <Text style={styles.vacioTitulo}>Aún no tienes sitios guardados</Text>
        <Text style={styles.vacioSub}>
          Marca un favorito en una ficha o guarda un punto: aquí te sugeriremos el que mejor pinta.
        </Text>
        <TouchableOpacity onPress={onExplorarMapa} accessibilityRole="button">
          <Text style={styles.vacioLink}>Explorar mapa →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (cargando && !rec) {
    return (
      <View style={styles.vacio}>
        <Text style={styles.vacioKicker}>Hoy te conviene</Text>
        <ActivityIndicator color={COLORS.water} />
      </View>
    );
  }

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

const styles = StyleSheet.create({
  wrap: {
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    marginBottom: SPACING.lg,
    ...SHADOW_SOFT,
  },
  inner: { paddingVertical: SPACING.lg, paddingHorizontal: SPACING.lg, overflow: "hidden" },
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
  sub: { fontSize: 13, color: "rgba(255,255,255,0.88)", lineHeight: 18 },
  chevron: { color: "#fff", fontSize: 32, fontWeight: "200", marginTop: -4 },
  vacio: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  vacioKicker: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: COLORS.textMuted,
    marginBottom: 6,
  },
  vacioTitulo: { fontSize: 17, fontWeight: "800", color: COLORS.textPrimary, marginBottom: 6 },
  vacioSub: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 10 },
  vacioLink: { fontSize: 14, fontWeight: "800", color: COLORS.waterDark },
});
