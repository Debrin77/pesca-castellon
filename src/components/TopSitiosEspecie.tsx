import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import type { ModoPescaGlobal } from "../data/modoPesca";
import {
  elegirTopSitiosPorEspecie,
  type PackSitiosEspecie,
  type SitioEspecieHoy,
} from "../utils/recomendacionPorEspecie";
import { formatearDistanciaKm } from "../utils/cercaMejorPinta";
import { COLORS, RADIUS, TYPE } from "../theme";

type Props = {
  especieId: string;
  nombreEspecie: string;
  modo: ModoPescaGlobal;
  ancla: { lat: number; lng: number };
  onAbrir: (sitio: SitioEspecieHoy) => void;
};

const ORDINALES = ["1ª", "2ª", "3ª"];

/**
 * En ficha de especie: carga bajo demanda el top 3 de sitios hoy
 * (presencia + pulso). Evita martillar la API de clima en catálogos largos.
 */
export default function TopSitiosEspecie({
  especieId,
  nombreEspecie,
  modo,
  ancla,
  onAbrir,
}: Props) {
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [pack, setPack] = useState<PackSitiosEspecie | null>(null);

  useEffect(() => {
    if (!abierto) return;
    let vivo = true;
    setCargando(true);
    elegirTopSitiosPorEspecie({ especieId, modo, ancla })
      .then((p) => {
        if (vivo) setPack(p);
      })
      .finally(() => {
        if (vivo) setCargando(false);
      });
    return () => {
      vivo = false;
    };
  }, [abierto, especieId, modo, ancla.lat, ancla.lng]);

  if (!abierto) {
    return (
      <TouchableOpacity
        style={styles.cta}
        onPress={() => setAbierto(true)}
        accessibilityRole="button"
        accessibilityLabel={`Ver 3 sitios hoy para ${nombreEspecie}`}
      >
        <Text style={styles.ctaTxt}>3 sitios hoy · {nombreEspecie} ›</Text>
        <Text style={styles.ctaSub}>Según catálogo y pulso del día</Text>
      </TouchableOpacity>
    );
  }

  if (cargando && !pack) {
    return (
      <View style={styles.box}>
        <ActivityIndicator color={COLORS.water} />
        <Text style={styles.cargandoTxt}>Buscando sitios…</Text>
      </View>
    );
  }

  if (!pack || pack.filas.length === 0) {
    return (
      <View style={styles.box}>
        <Text style={styles.kicker}>Sitios hoy · {nombreEspecie}</Text>
        <Text style={styles.vacio}>
          {pack?.aviso ?? "Sin sitios recomendables ahora."}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.box} accessibilityRole="summary">
      <Text style={styles.kicker}>Sitios hoy · {nombreEspecie}</Text>
      {pack.orientativoSinCatalogo && pack.aviso ? (
        <Text style={styles.aviso}>{pack.aviso}</Text>
      ) : (
        <Text style={styles.sub}>Presencia en catálogo + pulso (clima/luna)</Text>
      )}
      {pack.filas.map((fila, i) => (
        <TouchableOpacity
          key={fila.id}
          style={styles.fila}
          onPress={() => onAbrir(fila)}
          accessibilityRole="button"
          accessibilityLabel={`${ORDINALES[i]}: ${fila.nombre}, ${fila.etiqueta} ${fila.puntuacion}`}
        >
          <View style={[styles.ord, { backgroundColor: fila.color }]}>
            <Text style={styles.ordTxt}>{ORDINALES[i] ?? `${i + 1}`}</Text>
          </View>
          <View style={styles.filaTxt}>
            <Text style={styles.nombre} numberOfLines={2}>
              {fila.nombre}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {fila.etiqueta} · {fila.puntuacion}
              {fila.iconoLuna ? ` ${fila.iconoLuna}` : ""}
              {` · ${formatearDistanciaKm(fila.distanciaKm)}`}
            </Text>
            <Text style={styles.motivo} numberOfLines={1}>
              {fila.motivo}
            </Text>
          </View>
          <Text style={[styles.chevron, { color: fila.color }]}>›</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
