import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colorSemaforo, ConsultaPesca } from "../services/consultaPescaService";
import { EJE_LEGAL } from "../data/ejesLegalMeteo";
import { certezaDeConsulta } from "../data/certezaConsulta";
import { getProvinciaActiva } from "../provincias/runtime";
import { COLORS, RADIUS } from "../theme";

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

/**
 * Semáforo legal + sello de certeza geométrica.
 * Oficial = bloque sólido. Orientativo/aprox. = marco discontinuo ámbar
 * (se nota sin leer el texto del pill).
 */
export default function SemaforoVeredicto({ consulta }: { consulta: ConsultaPesca }) {
  const hoy = etiquetaHoy(consulta);
  const fondo = colorSemaforo(consulta);
  const certeza = certezaDeConsulta(consulta, { provinciaId: getProvinciaActiva().id });
  const noOficial = certeza.nivel !== "oficial";

  return (
    <View
      style={[styles.envoltorio, noOficial && styles.envoltorioAprox]}
      accessibilityRole="summary"
      accessibilityLabel={`${EJE_LEGAL.a11y} ${hoy.texto}. ${hoy.sub}. ${certeza.a11y}`}
    >
      <View style={[styles.selloBar, noOficial ? styles.selloAprox : styles.selloOficial]}>
        <Text style={styles.selloTxt}>{certeza.sello}</Text>
        <Text style={styles.selloEtiqueta} numberOfLines={1}>
          {certeza.etiqueta}
        </Text>
      </View>
      <View style={[styles.caja, { backgroundColor: fondo }, noOficial && styles.cajaAprox]}>
        <Text style={styles.kicker}>{EJE_LEGAL.kicker}</Text>
        <Text style={styles.pregunta}>{EJE_LEGAL.pregunta}</Text>
        <Text style={styles.texto}>{hoy.texto}</Text>
        <Text style={styles.sub}>{hoy.sub}</Text>
        <Text style={styles.aviso}>{EJE_LEGAL.aviso}</Text>
        {noOficial ? <Text style={styles.avisoCerteza}>{certeza.aviso}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  envoltorio: {
    marginBottom: 14,
    borderRadius: RADIUS.md,
    overflow: "hidden",
  },
  envoltorioAprox: {
    borderWidth: 2,
    borderColor: COLORS.warning,
    borderStyle: "dashed",
  },
  selloBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  selloOficial: {
    backgroundColor: COLORS.primaryDark,
  },
  selloAprox: {
    backgroundColor: COLORS.warning,
  },
  selloTxt: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  selloEtiqueta: {
    flex: 1,
    color: "rgba(255,255,255,0.92)",
    fontSize: 12,
    fontWeight: "700",
  },
  caja: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  cajaAprox: {
    // Un poco más «abierto»: el marco discontinuo ya marca la duda.
    opacity: 0.96,
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
  avisoCerteza: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 16,
    backgroundColor: "rgba(0,0,0,0.22)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    overflow: "hidden",
  },
});
