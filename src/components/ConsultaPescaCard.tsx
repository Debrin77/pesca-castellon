import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { ConsultaPesca } from "../services/consultaPescaService";
import { FUENTE_NORMATIVA } from "../data/normativa2026";
import { FUENTE_MARITIMA } from "../data/normativaMaritima";
import { FUENTE_ICV } from "../services/geojsonHit";
import { sitiosDeTramo } from "../services/sitiosComunidad";
import { avisoSitiosCosta } from "../services/consultaCostaService";
import SitiosOrientativos from "./SitiosOrientativos";
import ListaAnimada from "./ListaAnimada";
import SemaforoVeredicto from "./SemaforoVeredicto";
import { CARD, COLORS, RADIUS, SPACING, TYPE } from "../theme";

interface Props {
  consulta: ConsultaPesca;
  onFicha?: () => void;
  onAparejos?: (especieId: string) => void;
}

export default function ConsultaPescaCard({ consulta, onFicha, onAparejos }: Props) {
  const especieDestacada =
    consulta.ambito === "maritimo" ? consulta.especiesIds?.[0] : consulta.tramo?.especies?.[0];
  const mar = consulta.ambito === "maritimo";
  const acento = mar ? COLORS.water : COLORS.primary;
  return (
    <ListaAnimada replayKey={`${consulta.veredicto}-${consulta.titulo}`} index={0}>
      <View style={styles.card}>
        <SemaforoVeredicto consulta={consulta} />
        <View style={[styles.pill, { backgroundColor: consulta.confianza === "oficial" ? COLORS.water : COLORS.textMuted }]}>
          <Text style={styles.pillText}>
            {mar
              ? "Polígono de consulta (orientativo)"
              : consulta.confianza === "oficial"
                ? "Polígono ICV oficial"
                : "Radio del anexo I (aprox.)"}
          </Text>
        </View>
        <Text style={styles.title}>{consulta.titulo}</Text>
        {consulta.tramo && (
          <Text style={styles.meta}>
            Tramo {consulta.tramo.codigo} · {consulta.tramo.rio} · {consulta.tramo.vocacion}
          </Text>
        )}

        {(consulta.permisos.length > 0 || consulta.restriccionesHoy.length > 0) && (
          <View style={styles.lista}>
            {consulta.permisos.map((p, i) => (
              <Text key={`p-${i}`} style={styles.ok}>
                {p}
              </Text>
            ))}
            {consulta.restriccionesHoy.map((p, i) => (
              <Text key={`r-${i}`} style={styles.warn}>
                {p}
              </Text>
            ))}
          </View>
        )}

        {consulta.especiesHabituales ? (
          <Text style={[styles.especies, { color: acento }]}>Especies habituales: {consulta.especiesHabituales}</Text>
        ) : consulta.tramo?.especies?.length ? (
          <Text style={[styles.especies, { color: acento }]}>Especies habituales: {consulta.tramo.especies.join(" · ")}</Text>
        ) : null}

        {mar ? (
          <SitiosOrientativos
            sitios={consulta.sitiosCosta ?? []}
            titulo="Dónde se pesca a caña (uso habitual)"
            aviso={avisoSitiosCosta()}
          />
        ) : consulta.tramo && consulta.veredicto !== "vedado" && consulta.veredicto !== "reserva_trucha" ? (
          <SitiosOrientativos sitios={sitiosDeTramo(consulta.tramo.id)} />
        ) : null}

        {mar ? (
          <Text style={styles.fuente}>{FUENTE_MARITIMA.titulo}</Text>
        ) : (
          <>
            <Text style={styles.fuente}>{FUENTE_NORMATIVA.titulo}</Text>
            <Text style={styles.fuente}>{FUENTE_ICV}</Text>
          </>
        )}

        <View style={styles.row}>
          {consulta.tramo?.fichaId && onFicha ? (
            <TouchableOpacity onPress={onFicha} style={[styles.btn, { backgroundColor: acento }]}>
              <Text style={styles.btnText}>Ficha del agua</Text>
            </TouchableOpacity>
          ) : null}
          {especieDestacada && onAparejos ? (
            <TouchableOpacity onPress={() => onAparejos(especieDestacada)} style={styles.btnGhost}>
              <Text style={[styles.btnGhostText, { color: acento }]}>Aparejo</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </ListaAnimada>
  );
}

const styles = StyleSheet.create({
  card: {
    ...CARD,
  },
  pill: {
    alignSelf: "flex-start",
    borderRadius: RADIUS.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: SPACING.sm,
  },
  pillText: {
    ...TYPE.overline,
    color: "#fff",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  title: {
    ...TYPE.title,
    color: COLORS.textPrimary,
  },
  meta: {
    ...TYPE.caption,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginBottom: SPACING.sm,
  },
  lista: {
    marginTop: 2,
    marginBottom: 4,
    gap: 4,
  },
  ok: {
    ...TYPE.body,
    color: COLORS.textSecondary,
  },
  warn: {
    ...TYPE.bodyStrong,
    color: COLORS.danger,
  },
  especies: {
    ...TYPE.bodyStrong,
    marginTop: SPACING.sm,
  },
  fuente: {
    ...TYPE.caption,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
    fontStyle: "italic",
    fontWeight: "500",
  },
  row: { flexDirection: "row", gap: 8, marginTop: SPACING.md },
  btn: {
    borderRadius: RADIUS.sm,
    paddingHorizontal: 14,
    paddingVertical: 11,
    minHeight: 42,
    justifyContent: "center",
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 13.5 },
  btnGhost: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 14,
    paddingVertical: 11,
    minHeight: 42,
    justifyContent: "center",
    backgroundColor: COLORS.mist,
  },
  btnGhostText: { fontWeight: "700", fontSize: 13.5 },
});
