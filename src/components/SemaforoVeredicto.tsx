import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colorSemaforo, ConsultaPesca } from "../services/consultaPescaService";
import { EJE_LEGAL } from "../data/ejesLegalMeteo";
import { RADIUS } from "../theme";

export function etiquetaHoy(c: ConsultaPesca): { texto: string; sub: string } {
  if (c.veredicto === "coto") return { texto: "COTO", sub: "Hace falta permiso del titular" };
  if (c.veredicto === "vedado" || c.veredicto === "reserva_trucha") {
    return { texto: "HOY NO", sub: "Pesca prohibida aquí" };
  }
  if (c.veredicto === "fuera_catalogo") return { texto: "SIN TRAMO", sub: "No está en el catálogo" };
  if (c.sePuedePescarHoy) {
    return {
      texto: "HOY SÍ",
      sub: c.ambito === "maritimo" ? "Orilla · licencia marítima" : "Zona libre · con licencia",
    };
  }
  return { texto: "HOY NO", sub: "Restricción de día o temporada" };
}

export default function SemaforoVeredicto({ consulta }: { consulta: ConsultaPesca }) {
  const hoy = etiquetaHoy(consulta);
  const fondo = colorSemaforo(consulta);
  return (
    <View
      style={[styles.caja, { backgroundColor: fondo }]}
      accessibilityRole="summary"
      accessibilityLabel={`${EJE_LEGAL.a11y} ${hoy.texto}. ${hoy.sub}`}
    >
      <Text style={styles.kicker}>{EJE_LEGAL.kicker}</Text>
      <Text style={styles.pregunta}>{EJE_LEGAL.pregunta}</Text>
      <Text style={styles.texto}>{hoy.texto}</Text>
      <Text style={styles.sub}>{hoy.sub}</Text>
      <Text style={styles.aviso}>{EJE_LEGAL.aviso}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  caja: {
    borderRadius: RADIUS.md,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 14,
    alignItems: "center",
  },
  kicker: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  pregunta: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
    marginBottom: 8,
  },
  texto: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: 1.2,
    lineHeight: 36,
  },
  sub: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 6,
    textAlign: "center",
  },
  aviso: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 15,
  },
});
