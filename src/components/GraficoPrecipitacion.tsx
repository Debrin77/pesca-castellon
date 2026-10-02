import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  LayoutChangeEvent,
  TouchableOpacity,
  Platform,
} from "react-native";
import type { PrevisionHora } from "../services/weatherService";
import { COLORS, FONTS, RADIUS } from "../theme";

export type ModoPrecip = "intensidad" | "probabilidad";

type Props = {
  horas: PrevisionHora[];
  titulo?: string;
  oscuro?: boolean;
};

/**
 * Gráfica horaria de precipitación: toca para alternar mm (intensidad) ↔ % (probabilidad).
 * Equivalente local a la mejora de clima de Fishing Points.
 */
export default function GraficoPrecipitacion({
  horas,
  titulo = "Precipitación · toca para cambiar",
  oscuro = false,
}: Props) {
  const serie = horas?.length ? horas : [];
  const [modo, setModo] = useState<ModoPrecip>("intensidad");
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

  const valores = useMemo(() => {
    return serie.map((h) =>
      modo === "intensidad" ? h.precipitacionMm ?? 0 : h.probabilidadLluvia ?? 0
    );
  }, [serie, modo]);

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
        <Text style={[styles.vacio, oscuro && styles.txtClaroSuave]}>Sin serie horaria</Text>
      </View>
    );
  }

  const max = Math.max(...valores, modo === "intensidad" ? 0.5 : 10);
  const valorActivo = valores[Math.min(idx, valores.length - 1)] ?? 0;
  const etiquetaValor =
    modo === "intensidad" ? `${valorActivo.toFixed(1)} mm` : `${Math.round(valorActivo)} %`;

  return (
    <View style={[styles.wrap, oscuro && styles.wrapOscuro]} accessibilityLabel={titulo}>
      <View style={styles.cabecera}>
        <Text style={[styles.titulo, oscuro && styles.txtClaro]}>{titulo}</Text>
        <TouchableOpacity
          style={[styles.toggle, oscuro && styles.toggleOscuro]}
          onPress={() => setModo((m) => (m === "intensidad" ? "probabilidad" : "intensidad"))}
          accessibilityRole="button"
          accessibilityLabel={
            modo === "intensidad"
              ? "Mostrar probabilidad de precipitación"
              : "Mostrar intensidad en milímetros"
          }
        >
          <Text style={[styles.toggleTxt, oscuro && styles.txtClaro]}>
            {modo === "intensidad" ? "mm · intensidad" : "% · probabilidad"}
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.valor, oscuro && styles.txtClaro]}>
        {activo?.hora ?? "—"} · {etiquetaValor}
      </Text>
      {activo?.rafagaKmh != null ? (
        <Text style={[styles.rafaga, oscuro && styles.txtClaroSuave]}>
          Ráfaga {Math.round(activo.rafagaKmh)} km/h
          {activo.vientoKmh != null ? ` · viento ${Math.round(activo.vientoKmh)}` : ""}
        </Text>
      ) : null}
      <View
        style={styles.chart}
        onLayout={onLayout}
        {...pan.panHandlers}
        accessibilityRole="adjustable"
      >
        {serie.map((h, i) => {
          const v = valores[i] ?? 0;
          const alto = Math.max(4, Math.round((v / max) * 72));
          const on = i === idx;
          return (
            <View key={`${h.fecha}-${h.hora}`} style={styles.col}>
              <View
                style={[
                  styles.barra,
                  {
                    height: alto,
                    backgroundColor: on
                      ? COLORS.water
                      : oscuro
                        ? "rgba(160,210,230,0.45)"
                        : "rgba(26,111,138,0.35)",
                  },
                ]}
              />
            </View>
          );
        })}
        {Platform.OS === "web" ? (
          <View
            pointerEvents="none"
            style={[
              styles.cursor,
              { left: serie.length > 1 ? `${(idx / (serie.length - 1)) * 100}%` : "0%" },
            ]}
          />
        ) : null}
      </View>
      <Text style={[styles.hint, oscuro && styles.txtClaroSuave]}>
        Toca el gráfico o el chip para cambiar intensidad ↔ probabilidad
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 12,
    padding: 14,
    borderRadius: RADIUS.lg,
    backgroundColor: "rgba(255,255,255,0.55)",
    borderWidth: 1,
    borderColor: "rgba(20,60,50,0.12)",
  },
  wrapOscuro: {
    backgroundColor: "rgba(8,24,28,0.45)",
    borderColor: "rgba(255,255,255,0.12)",
  },
  cabecera: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 4,
  },
  titulo: {
    flex: 1,
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  toggle: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  toggleOscuro: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderColor: "rgba(255,255,255,0.28)",
  },
  toggleTxt: { fontSize: 11, fontWeight: "800", color: COLORS.primaryDark },
  valor: {
    fontFamily: FONTS.display,
    fontSize: 22,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  rafaga: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 8 },
  vacio: { fontSize: 13, color: COLORS.textSecondary, marginTop: 6 },
  chart: {
    height: 88,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
    paddingTop: 8,
  },
  col: { flex: 1, alignItems: "center", justifyContent: "flex-end", height: 80 },
  barra: { width: "78%", borderTopLeftRadius: 3, borderTopRightRadius: 3, minHeight: 4 },
  cursor: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 2,
    marginLeft: -1,
    backgroundColor: COLORS.accent,
    opacity: 0.85,
  },
  hint: { marginTop: 8, fontSize: 11, color: COLORS.textMuted },
  txtClaro: { color: "#f4faf8" },
  txtClaroSuave: { color: "rgba(244,250,248,0.72)" },
});
