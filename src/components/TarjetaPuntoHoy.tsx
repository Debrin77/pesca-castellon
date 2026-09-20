import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import type { ConsultaPesca } from "../services/consultaPescaService";
import { colorSemaforo } from "../services/consultaPescaService";
import type { IndicePescaDia } from "../services/fishingIndexService";
import { CATEGORIA_INFO } from "../services/fishingIndexService";
import { etiquetaHoy } from "./SemaforoVeredicto";
import { EJE_LEGAL, EJE_METEO } from "../data/ejesLegalMeteo";
import { certezaDeConsulta } from "../data/certezaConsulta";
import { getProvinciaActiva } from "../provincias/runtime";
import { COLORS, RADIUS, SHADOW, TYPE } from "../theme";

type Props = {
  consulta: ConsultaPesca;
  indice?: IndicePescaDia | null;
  etiquetaPunto?: string | null;
  onPuedo: () => void;
  onPinta: () => void;
  onEquipo: () => void;
  onEspecies: () => void;
};

/**
 * Tras elegir punto: una sola tarjeta con el orden del pescador
 * ¿Puedo? → ¿Pinta? → Equipo → Especies.
 */
export default function TarjetaPuntoHoy({
  consulta,
  indice,
  etiquetaPunto,
  onPuedo,
  onPinta,
  onEquipo,
  onEspecies,
}: Props) {
  const hoy = etiquetaHoy(consulta);
  const colorLegal = colorSemaforo(consulta);
  const certeza = certezaDeConsulta(consulta, { provinciaId: getProvinciaActiva().id });
  const cat = indice ? CATEGORIA_INFO[indice.categoria] : null;

  return (
    <View style={styles.card} accessibilityRole="summary">
      <Text style={styles.kicker}>Tu punto de hoy</Text>
      <Text style={styles.titulo} numberOfLines={2}>
        {etiquetaPunto || consulta.titulo}
      </Text>

      <Fila
        orden="1"
        kicker={`${EJE_LEGAL.tituloCorto} · ${certeza.sello}`}
        titulo={hoy.texto}
        sub={hoy.sub}
        accent={colorLegal}
        onPress={onPuedo}
        cta="Ver norma"
      />
      <Fila
        orden="2"
        kicker={EJE_METEO.tituloCorto}
        titulo={cat ? `${indice!.puntuacion} · ${cat.texto}` : "Sin índice aún"}
        sub={
          indice?.mejorFranja
            ? `Mejor ventana ~${indice.mejorFranja}`
            : "Orientativo · no autoriza"
        }
        accent={cat?.color ?? COLORS.water}
        onPress={onPinta}
        cta="Previsión"
      />
      <Fila
        orden="3"
        kicker="Equipo"
        titulo="Aparejos y guía de compra"
        sub="Caña, línea, anzuelo según especie"
        accent={COLORS.primary}
        onPress={onEquipo}
        cta="Abrir"
      />
      <Fila
        orden="4"
        kicker="Especies"
        titulo="Qué puedes encontrar aquí"
        sub="Catálogo del punto / tramo"
        accent={COLORS.waterDark}
        onPress={onEspecies}
        cta="Ver"
        ultimo
      />
    </View>
  );
}

function Fila({
  orden,
  kicker,
  titulo,
  sub,
  accent,
  onPress,
  cta,
  ultimo,
}: {
  orden: string;
  kicker: string;
  titulo: string;
  sub: string;
  accent: string;
  onPress: () => void;
  cta: string;
  ultimo?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.fila, !ultimo && styles.filaBorde]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${kicker}. ${titulo}. ${cta}`}
    >
      <View style={[styles.orden, { backgroundColor: accent }]}>
        <Text style={styles.ordenTxt}>{orden}</Text>
      </View>
      <View style={styles.filaTxt}>
        <Text style={styles.filaKicker}>{kicker}</Text>
        <Text style={styles.filaTitulo} numberOfLines={1}>
          {titulo}
        </Text>
        <Text style={styles.filaSub} numberOfLines={1}>
          {sub}
        </Text>
      </View>
      <Text style={[styles.cta, { color: accent }]}>{cta} ›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
    ...SHADOW,
  },
  kicker: { ...TYPE.overline, color: COLORS.textSecondary, marginBottom: 4 },
  titulo: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginBottom: 12,
    lineHeight: 24,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
  },
  filaBorde: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  orden: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  ordenTxt: { color: "#fff", fontWeight: "800", fontSize: 13 },
  filaTxt: { flex: 1, minWidth: 0 },
  filaKicker: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: COLORS.textMuted,
  },
  filaTitulo: { fontSize: 15, fontWeight: "800", color: COLORS.textPrimary, marginTop: 2 },
  filaSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  cta: { fontSize: 13, fontWeight: "800" },
});
