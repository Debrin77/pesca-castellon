import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { ConsultaPesca } from "../services/consultaPescaService";
import { FUENTE_MARITIMA } from "../data/normativaMaritima";
import { FUENTE_ICV } from "../services/geojsonHit";
import { getProvinciaActiva } from "../provincias/runtime";
import { sitiosDeTramo } from "../services/sitiosComunidad";
import { avisoSitiosCosta } from "../services/consultaCostaService";
import SitiosOrientativos from "./SitiosOrientativos";
import ListaAnimada from "./ListaAnimada";
import SemaforoVeredicto from "./SemaforoVeredicto";
import { COLORS, RADIUS } from "../theme";

interface Props {
  consulta: ConsultaPesca;
  onFicha?: () => void;
  onAparejos?: (especieId: string) => void;
}

export default function ConsultaPescaCard({ consulta, onFicha, onAparejos }: Props) {
  const provincia = getProvinciaActiva();
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
            <Text style={styles.fuente}>{provincia.fuenteNormativa.titulo}</Text>
            {provincia.tieneIcv ? <Text style={styles.fuente}>{FUENTE_ICV}</Text> : null}
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
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pill: { alignSelf: "flex-start", borderRadius: RADIUS.pill, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 8 },
  pillText: { color: "#fff", fontSize: 10, fontWeight: "800", letterSpacing: 0.4, textTransform: "uppercase" },
  title: { fontSize: 15, fontWeight: "800", color: COLORS.textPrimary, lineHeight: 20 },
  meta: { fontSize: 11.5, color: COLORS.textSecondary, marginTop: 4, marginBottom: 8 },
  ok: { fontSize: 12.5, color: COLORS.textSecondary, lineHeight: 18, marginBottom: 4 },
  warn: { fontSize: 12.5, color: COLORS.danger, lineHeight: 18, marginBottom: 4, fontWeight: "600" },
  especies: { fontSize: 12, marginTop: 6, fontWeight: "600" },
  fuente: { fontSize: 10, color: COLORS.textSecondary, marginTop: 8, fontStyle: "italic" },
  row: { flexDirection: "row", gap: 8, marginTop: 12 },
  btn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.sm, paddingHorizontal: 12, paddingVertical: 8 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  btnGhost: { borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.sm, paddingHorizontal: 12, paddingVertical: 8 },
  btnGhostText: { color: COLORS.primary, fontWeight: "700", fontSize: 12 },
});
