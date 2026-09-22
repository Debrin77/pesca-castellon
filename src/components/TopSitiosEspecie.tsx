import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import {
  etiquetaModo,
  type ModoPescaGlobal,
} from "../data/modoPesca";
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
  /** Modo por defecto (p. ej. río en catálogo continental). */
  modo: ModoPescaGlobal;
  /**
   * Si hay varias (p. ej. orilla + barco en costa), preguntamos antes de puntuar.
   * Si se omite o hay una sola, se usa `modo` directamente.
   */
  modosPregunta?: ModoPescaGlobal[];
  ancla: { lat: number; lng: number };
  onAbrir: (sitio: SitioEspecieHoy) => void;
  /** Cuando el usuario elige modalidad en la pregunta. */
  onModoElegido?: (modo: ModoPescaGlobal) => void;
};

const ORDINALES = ["1ª", "2ª", "3ª"];

/**
 * En ficha de especie: carga bajo demanda el top 3 de sitios hoy
 * (presencia + pulso). Evita martillar la API de clima en catálogos largos.
 * En costa con orilla+barco, pregunta la modalidad antes de rankear.
 */
export default function TopSitiosEspecie({
  especieId,
  nombreEspecie,
  modo,
  modosPregunta,
  ancla,
  onAbrir,
  onModoElegido,
}: Props) {
  const opciones =
    modosPregunta && modosPregunta.length > 1 ? modosPregunta : null;
  const [abierto, setAbierto] = useState(false);
  const [modoElegidoLocal, setModoElegidoLocal] = useState<ModoPescaGlobal | null>(
    opciones ? null : modo
  );
  const [cargando, setCargando] = useState(false);
  const [pack, setPack] = useState<PackSitiosEspecie | null>(null);

  const modoActivo = modoElegidoLocal ?? modo;

  useEffect(() => {
    if (!abierto) return;
    if (opciones && !modoElegidoLocal) return;
    let vivo = true;
    setCargando(true);
    setPack(null);
    elegirTopSitiosPorEspecie({ especieId, modo: modoActivo, ancla })
      .then((p) => {
        if (vivo) setPack(p);
      })
      .finally(() => {
        if (vivo) setCargando(false);
      });
    return () => {
      vivo = false;
    };
  }, [
    abierto,
    especieId,
    modoActivo,
    modoElegidoLocal,
    !!opciones,
    ancla.lat,
    ancla.lng,
  ]);

  if (!abierto) {
    return (
      <TouchableOpacity
        style={styles.cta}
        onPress={() => {
          setAbierto(true);
          if (!opciones) setModoElegidoLocal(modo);
        }}
        accessibilityRole="button"
        accessibilityLabel={`Ver 3 sitios hoy para ${nombreEspecie}`}
      >
        <Text style={styles.ctaTxt}>3 sitios hoy · {nombreEspecie} ›</Text>
        <Text style={styles.ctaSub}>
          {opciones
            ? "Elige orilla o barco · catálogo y pulso del día"
            : "Según catálogo y pulso del día"}
        </Text>
      </TouchableOpacity>
    );
  }

  if (opciones && !modoElegidoLocal) {
    return (
      <View style={styles.box}>
        <Text style={styles.kicker}>Sitios hoy · {nombreEspecie}</Text>
        <Text style={styles.sub}>¿Desde orilla o en barco?</Text>
        <View style={styles.modosRow}>
          {opciones.map((m) => (
            <TouchableOpacity
              key={m}
              style={[
                styles.modoChip,
                m === "barco" || m === "orilla" ? styles.modoChipMar : styles.modoChipRio,
              ]}
              onPress={() => {
                setModoElegidoLocal(m);
                onModoElegido?.(m);
              }}
              accessibilityRole="button"
              accessibilityLabel={etiquetaModo(m)}
            >
              <Text style={styles.modoChipTxt}>{etiquetaModo(m)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
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
        <Text style={styles.sub}>
          {etiquetaModo(modoActivo)} · presencia en catálogo + pulso (clima/luna)
        </Text>
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
            {fila.habitatResumen ? (
              <Text style={styles.habitat} numberOfLines={2}>
                {fila.habitatResumen}
              </Text>
            ) : null}
          </View>
          <Text style={[styles.chevron, { color: fila.color }]}>›</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  cta: {
    marginTop: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.mist,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  ctaTxt: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.waterDark,
  },
  ctaSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  modosRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  modoChip: {
    flex: 1,
    minHeight: 40,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  modoChipRio: { backgroundColor: COLORS.primaryDark },
  modoChipMar: { backgroundColor: COLORS.waterDark },
  modoChipTxt: { color: "#fff", fontWeight: "800", fontSize: 14 },
  box: {
    marginTop: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.mist,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  kicker: {
    ...TYPE.overline,
    color: COLORS.textSecondary,
  },
  sub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  aviso: {
    fontSize: 12,
    color: COLORS.warning,
    fontWeight: "600",
    marginBottom: 4,
    lineHeight: 16,
  },
  vacio: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  cargandoTxt: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: "center",
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  ord: {
    minWidth: 36,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  ordTxt: { color: "#fff", fontWeight: "800", fontSize: 12 },
  filaTxt: { flex: 1, minWidth: 0 },
  nombre: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  meta: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  motivo: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  habitat: {
    fontSize: 11,
    color: COLORS.waterDark,
    marginTop: 3,
    lineHeight: 15,
    fontWeight: "600",
  },
  chevron: { fontSize: 22, fontWeight: "300" },
});
