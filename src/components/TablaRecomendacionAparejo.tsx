import React from "react";
import { View, Text, StyleSheet } from "react-native";
import {
  RecomendacionAparejo,
  etiquetaArponcillo,
  restriccionesParaProvincia,
  type SeveridadRestriccion,
} from "../data/recomendacionesAparejo";
import { COLORS, RADIUS, SHADOW } from "../theme";

type Props = {
  rec: RecomendacionAparejo;
  provinciaId: string;
  /** Costa vs río: matiza el color del encabezado y filtra restricciones de orilla */
  mar?: boolean;
};

function severidadStyle(s: SeveridadRestriccion) {
  if (s === "obligatorio") {
    return { box: styles.restOblig, label: styles.restObligLabel, tag: "Obligatorio" };
  }
  if (s === "aviso") {
    return { box: styles.restAviso, label: styles.restAvisoLabel, tag: "Aviso" };
  }
  return { box: styles.restOrient, label: styles.restOrientLabel, tag: "Orientativo" };
}

/**
 * Tabla clara de compra: anzuelo, arponcillo, cebador, plomo según cebo y restricciones.
 */
export default function TablaRecomendacionAparejo({ rec, provinciaId, mar }: Props) {
  const restricciones = restriccionesParaProvincia(rec, provinciaId, mar ? "costa" : "rio");
  const accent = mar ? COLORS.waterDark : COLORS.primaryDark;
  const accentSoft = mar ? COLORS.waterLight : COLORS.mist;

  return (
    <View style={[styles.card, { borderColor: mar ? COLORS.water : COLORS.border }]} accessibilityRole="summary">
      <Text style={[styles.title, { color: accent }]}>Guía de compra del aparejo</Text>
      <Text style={styles.resumen}>{rec.resumenCompra}</Text>
      <Text style={styles.disclaimer}>
        Orientativo para elegir bien en la tienda. El cartel y la normativa oficial mandan.
      </Text>

      <View style={[styles.tabla, { backgroundColor: accentSoft }]}>
        <Fila label="Anzuelo (tipo)" valor={rec.anzueloTipo} />
        <Fila label="Talla de anzuelo" valor={rec.anzueloTalla} strong />
        <Fila label="Arponcillo" valor={etiquetaArponcillo(rec.arponcillo)} strong />
        <Text style={styles.filaNota}>{rec.arponcilloNota}</Text>
        <Fila
          label="Cebador"
          valor={rec.cebador.recomendado ? `Sí · ${rec.cebador.tipos}` : "No recomendado"}
          strong
        />
        <Text style={styles.filaNota}>{rec.cebador.nota}</Text>
      </View>

      <Text style={[styles.subtitulo, { color: accent }]}>Plomo según lo que va en el anzuelo</Text>
      <View style={styles.plomoTabla}>
        <View style={styles.plomoHeader}>
          <Text style={[styles.plomoHCell, { flex: 1.4 }]}>En anzuelo / señuelo</Text>
          <Text style={[styles.plomoHCell, { flex: 1 }]}>Plomo</Text>
        </View>
        {rec.plomos.map((p, i) => (
          <View key={i} style={[styles.plomoRow, i % 2 === 0 && styles.plomoRowAlt]}>
            <View style={{ flex: 1.4 }}>
              <Text style={styles.plomoCebo}>{p.enAnzuelo}</Text>
              {p.nota ? <Text style={styles.plomoNota}>{p.nota}</Text> : null}
            </View>
            <Text style={[styles.plomoG, { flex: 1 }]}>{p.plomoG}</Text>
          </View>
        ))}
      </View>

      <Text style={[styles.subtitulo, { color: accent }]}>Lista corta de tienda</Text>
      {rec.compraRapida.map((item, i) => (
        <Text key={i} style={styles.bullet}>
          • {item}
        </Text>
      ))}

      {restricciones.length > 0 ? (
        <>
          <Text style={[styles.subtitulo, { color: accent }]}>Restricciones en tu provincia</Text>
          {restricciones.map((r, i) => {
            const s = severidadStyle(r.severidad);
            return (
              <View key={i} style={[styles.restBox, s.box]}>
                <Text style={[styles.restTag, s.label]}>{s.tag}</Text>
                <Text style={styles.restText}>{r.texto}</Text>
              </View>
            );
          })}
        </>
      ) : null}
    </View>
  );
}

function Fila({ label, valor, strong }: { label: string; valor: string; strong?: boolean }) {
  return (
    <View style={styles.fila}>
      <Text style={styles.filaLabel}>{label}</Text>
      <Text style={[styles.filaValor, strong && styles.filaValorStrong]}>{valor}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 18,
    borderWidth: 1,
    marginTop: 12,
    ...SHADOW,
  },
  title: { fontSize: 16, fontWeight: "800", marginBottom: 4 },
  resumen: { fontSize: 14, color: COLORS.textPrimary, fontWeight: "700", lineHeight: 20 },
  disclaimer: { fontSize: 12, color: COLORS.textMuted, marginTop: 6, marginBottom: 12, lineHeight: 17 },
  tabla: {
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  fila: { marginBottom: 8 },
  filaLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.water,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  filaValor: { fontSize: 14, color: COLORS.textPrimary, marginTop: 2, lineHeight: 20 },
  filaValorStrong: { fontWeight: "800", fontSize: 15 },
  filaNota: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 17, marginBottom: 8, marginTop: -4 },
  subtitulo: { fontSize: 14, fontWeight: "800", marginTop: 16, marginBottom: 8 },
  plomoTabla: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    overflow: "hidden",
  },
  plomoHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.primaryDark,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  plomoHCell: { fontSize: 11, fontWeight: "800", color: "#fff", letterSpacing: 0.3 },
  plomoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  plomoRowAlt: { backgroundColor: COLORS.mist },
  plomoCebo: { fontSize: 13, fontWeight: "700", color: COLORS.textPrimary, lineHeight: 18 },
  plomoNota: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2, lineHeight: 15 },
  plomoG: { fontSize: 14, fontWeight: "800", color: COLORS.waterDark, lineHeight: 18 },
  bullet: { fontSize: 14, color: COLORS.textPrimary, marginBottom: 4, lineHeight: 20 },
  restBox: {
    borderRadius: RADIUS.sm,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
  },
  restOblig: { backgroundColor: COLORS.dangerLight, borderColor: COLORS.danger },
  restAviso: { backgroundColor: "#FEF3E6", borderColor: "#D97706" },
  restOrient: { backgroundColor: COLORS.mist, borderColor: COLORS.border },
  restTag: { fontSize: 10, fontWeight: "800", letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 4 },
  restObligLabel: { color: "#7a1414" },
  restAvisoLabel: { color: "#9A4A0A" },
  restOrientLabel: { color: COLORS.textSecondary },
  restText: { fontSize: 13, color: COLORS.textPrimary, lineHeight: 18, fontWeight: "600" },
});
