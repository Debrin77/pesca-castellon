import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { EJE_LEGAL, EJE_METEO } from "../data/ejesLegalMeteo";
import { COLORS, RADIUS } from "../theme";

type Eje = "legal" | "meteo";

interface Props {
  eje: Eje;
  /** Variante sobre hero oscuro (Inicio) o tarjeta clara. */
  sobreOscuro?: boolean;
  compacto?: boolean;
}

/**
 * Cabecera de eje para principiante: deja claro si miras normativa o clima.
 */
export default function EjeLegalMeteo({ eje, sobreOscuro = false, compacto = false }: Props) {
  const data = eje === "legal" ? EJE_LEGAL : EJE_METEO;
  const acento = eje === "legal" ? COLORS.primary : COLORS.water;

  return (
    <View
      style={[
        styles.wrap,
        compacto && styles.wrapCompacto,
        sobreOscuro ? styles.wrapOscuro : styles.wrapClaro,
        !sobreOscuro && { borderColor: acento },
      ]}
      accessibilityRole="text"
      accessibilityLabel={`${data.kicker}. ${data.pregunta}. ${data.aviso}`}
    >
      <Text style={[styles.kicker, sobreOscuro ? styles.kickerOscuro : { color: acento }]}>
        {data.kicker}
      </Text>
      <Text style={[styles.pregunta, sobreOscuro ? styles.preguntaOscuro : styles.preguntaClaro]}>
        {data.pregunta}
      </Text>
      {!compacto ? (
        <Text style={[styles.aviso, sobreOscuro ? styles.avisoOscuro : styles.avisoClaro]}>
          {data.aviso}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderWidth: 1.5,
  },
  wrapCompacto: {
    paddingVertical: 8,
    marginBottom: 8,
  },
  wrapClaro: {
    backgroundColor: COLORS.mist,
  },
  wrapOscuro: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderColor: "rgba(255,255,255,0.28)",
  },
  kicker: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  kickerOscuro: { color: "#e8f5ee" },
  pregunta: {
    fontSize: 15,
    fontWeight: "800",
    marginTop: 2,
  },
  preguntaClaro: { color: COLORS.textPrimary },
  preguntaOscuro: { color: "#fff" },
  aviso: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 3,
    lineHeight: 16,
  },
  avisoClaro: { color: COLORS.textSecondary },
  avisoOscuro: { color: "rgba(255,255,255,0.82)" },
});
