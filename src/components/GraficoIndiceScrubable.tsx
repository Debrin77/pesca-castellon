import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, PanResponder, LayoutChangeEvent, Platform } from "react-native";
import type { HoraIndice } from "../services/fishingIndexService";
import { COLORS, FONTS, RADIUS } from "../theme";

type Props = {
  horas: HoraIndice[];
  /** Puntuación diaria de respaldo si no hay serie. */
  puntuacionDia?: number;
  titulo?: string;
  oscuro?: boolean;
};

/**
 * Gráfica horaria del índice (equivalente local a “fish activity” de Fishing Points).
 * Arrastra para elegir hora · muestra puntuación y ventana solunar.
 */
export default function GraficoIndiceScrubable({
  horas,
  puntuacionDia,
  titulo = "Actividad por horas",
  oscuro = false,
}: Props) {
  const serie = horas?.length ? horas : [];
  const [ancho, setAncho] = useState(280);
  const horaActual = useMemo(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:00`;
  }, []);
  const idxInicial = Math.max(
    0,
    serie.findIndex((h) => h.hora >= horaActual)
  );
  const [idx, setIdx] = useState(idxInicial >= 0 ? idxInicial : 0);

  const activo = serie[Math.min(idx, Math.max(0, serie.length - 1))];

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => {
          const x = e.nativeEvent.locationX;
          if (!serie.length || ancho <= 0) return;
          const i = Math.round((x / ancho) * (serie.length - 1));
          setIdx(Math.max(0, Math.min(serie.length - 1, i)));
        },
        onPanResponderMove: (e) => {
          const x = e.nativeEvent.locationX;
          if (!serie.length || ancho <= 0) return;
          const i = Math.round((x / ancho) * (serie.length - 1));
          setIdx(Math.max(0, Math.min(serie.length - 1, i)));
        },
      }),
    [serie.length, ancho]
  );

  function onLayout(e: LayoutChangeEvent) {
    setAncho(e.nativeEvent.layout.width);
  }

  if (!serie.length) {
    return (
      <View style={[styles.wrap, oscuro && styles.wrapOscuro]}>
        <Text style={[styles.titulo, oscuro && styles.txtClaro]}>{titulo}</Text>
        <Text style={[styles.vacio, oscuro && styles.txtClaroSuave]}>
          {puntuacionDia != null ? `Índice del día · ${puntuacionDia}` : "Sin serie horaria"}
        </Text>
      </View>
    );
  }

  const max = Math.max(...serie.map((h) => h.puntuacion), 1);
  const etiquetaSol =
    activo?.solunar === "mayor" ? "Solunar mayor" : activo?.solunar === "menor" ? "Solunar menor" : "Sin pico solunar";

  return (
    <View style={[styles.wrap, oscuro && styles.wrapOscuro]} accessibilityLabel={titulo}>
      <Text style={[styles.titulo, oscuro && styles.txtClaro]}>{titulo}</Text>
      <View style={styles.heroNum}>
        <Text style={[styles.hora, oscuro && styles.txtClaro]}>{activo.hora}</Text>
        <Text style={[styles.score, oscuro && styles.txtClaro]}>{activo.puntuacion}</Text>
        <Text style={[styles.sub, oscuro && styles.txtClaroSuave]}>{etiquetaSol}</Text>
      </View>
      <View
        style={styles.chart}
        onLayout={onLayout}
        {...pan.panHandlers}
        accessibilityRole="adjustable"
        accessibilityLabel="Arrastra para ver el índice por horas"
      >
        {serie.map((h, i) => {
          const alto = 12 + (h.puntuacion / max) * 72;
          const on = i === idx;
          return (
            <View key={h.hora} style={styles.col}>
              <View
                style={[
                  styles.bar,
                  {
                    height: alto,
                    backgroundColor: on
                      ? oscuro
                        ? "#fff"
                        : COLORS.primaryDark
                      : h.solunar
                        ? oscuro
                          ? "rgba(255,220,140,0.85)"
                          : COLORS.gold
                        : oscuro
                          ? "rgba(255,255,255,0.35)"
                          : COLORS.water,
                    opacity: on ? 1 : 0.55,
                  },
                ]}
              />
            </View>
          );
        })}
      </View>
      <Text style={[styles.hint, oscuro && styles.txtClaroSuave]}>
        Arrastra la franja · orientativo (no autoriza)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginTop: 10,
  },
  wrapOscuro: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderColor: "rgba(255,255,255,0.2)",
  },
  titulo: {
    fontFamily: FONTS.bold,
    fontWeight: "700",
    fontSize: 13,
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  vacio: { marginTop: 8, fontFamily: FONTS.semibold, color: COLORS.textSecondary },
  heroNum: { flexDirection: "row", alignItems: "baseline", gap: 10, marginTop: 8 },
  hora: {
    fontFamily: FONTS.display,
    fontSize: 22,
    color: COLORS.primaryDark,
    letterSpacing: -0.4,
  },
  score: {
    fontFamily: FONTS.display,
    fontSize: 36,
    color: COLORS.primaryDark,
    letterSpacing: -1,
  },
  sub: {
    fontFamily: FONTS.semibold,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 96,
    marginTop: 12,
    gap: 2,
    ...Platform.select({ web: { cursor: "ew-resize" as any }, default: {} }),
  },
  col: { flex: 1, alignItems: "center", justifyContent: "flex-end" },
  bar: { width: "100%", borderRadius: 3, minHeight: 8 },
  hint: {
    marginTop: 8,
    fontFamily: FONTS.semibold,
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: "center",
  },
  txtClaro: { color: "#fff" },
  txtClaroSuave: { color: "rgba(255,255,255,0.78)" },
});
