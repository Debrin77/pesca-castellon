import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import type { ModoPescaGlobal } from "../data/modoPesca";
import {
  formatearDistanciaKm,
  rankearCercaMejorPinta,
  type FilaCercaMejorPinta,
} from "../utils/cercaMejorPinta";
import { COLORS, RADIUS } from "../theme";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = {
  lat: number;
  lng: number;
  modo: ModoPescaGlobal;
  onAbrir: (fila: FilaCercaMejorPinta) => void;
};

/**
 * Bloque plegable bajo la consulta del mapa: 3 sitios cercanos con mejor pinta.
 * Carga en segundo plano; si no hay candidatos, no pinta nada.
 */
export default function CercaMejorPintaBlock({ lat, lng, modo, onAbrir }: Props) {
  const [filas, setFilas] = useState<FilaCercaMejorPinta[] | null>(null);
  const [cargando, setCargando] = useState(true);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    let vivo = true;
    setCargando(true);
    setFilas(null);
    setAbierto(false);
    rankearCercaMejorPinta({ lat, lng, modo })
      .then((r) => {
        if (vivo) setFilas(r);
      })
      .catch(() => {
        if (vivo) setFilas(null);
      })
      .finally(() => {
        if (vivo) setCargando(false);
      });
    return () => {
      vivo = false;
    };
  }, [lat, lng, modo]);

  // Carga en silencio: no ocupar el sheet hasta tener filas reales.
  if (cargando || !filas || filas.length === 0) return null;

  const n = filas.length;
  const titulo = n === 1 ? "1 cerca con mejor pinta" : `${n} cerca con mejor pinta`;

  return (
    <View style={styles.box}>
      <TouchableOpacity
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setAbierto((v) => !v);
        }}
        accessibilityRole="button"
        accessibilityState={{ expanded: abierto }}
        accessibilityLabel={titulo}
        style={styles.cabecera}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.titulo}>{titulo}</Text>
          <Text style={styles.sub}>
            {abierto ? "Toca un sitio para consultarlo" : "Según fecha y condiciones · tocar"}
          </Text>
        </View>
        <Text style={styles.chevron}>{abierto ? "▲" : "▼"}</Text>
      </TouchableOpacity>

      {abierto
        ? filas.map((f) => (
            <TouchableOpacity
              key={f.id}
              style={styles.fila}
              onPress={() => onAbrir(f)}
              accessibilityRole="button"
              accessibilityLabel={`${f.nombre}, ${formatearDistanciaKm(f.distanciaKm)}, ${f.etiqueta} ${f.puntuacion}${
                f.alerta ? ", con alerta" : ""
              }`}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.nombre} numberOfLines={1}>
                  {f.nombre}
                </Text>
                <Text style={styles.meta}>
                  {formatearDistanciaKm(f.distanciaKm)}
                  {f.alerta ? " · alerta" : ""}
                </Text>
              </View>
              <View style={[styles.pill, { backgroundColor: f.fondo }]}>
                <Text style={[styles.pillTxt, { color: f.color }]}>
                  {f.puntuacion} {f.etiqueta}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginTop: 12,
    backgroundColor: COLORS.mist,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cabecera: {
    flexDirection: "row",
    alignItems: "center",
  },
  titulo: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  sub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  chevron: {
    fontSize: 12,
    color: COLORS.textMuted,
    paddingLeft: 8,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  nombre: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.waterDark,
  },
  meta: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  pill: {
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  pillTxt: {
    fontSize: 12,
    fontWeight: "700",
  },
});
