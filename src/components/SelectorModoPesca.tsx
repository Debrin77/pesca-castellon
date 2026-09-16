import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import type { ModoPescaGlobal } from "../data/modoPesca";
import { etiquetaModo, subtituloModo } from "../data/modoPesca";
import { COLORS, RADIUS, TYPE } from "../theme";

type Props = {
  modo: ModoPescaGlobal;
  disponibles: ModoPescaGlobal[];
  onChange: (modo: ModoPescaGlobal) => void;
  /** Variante sobre hero oscuro */
  sobreOscuro?: boolean;
  compacto?: boolean;
};

/**
 * Selector Río / Orilla / Barco — fija el ámbito de toda la app.
 */
export default function SelectorModoPesca({
  modo,
  disponibles,
  onChange,
  sobreOscuro,
  compacto,
}: Props) {
  if (disponibles.length <= 1) return null;

  return (
    <View
      style={[styles.wrap, sobreOscuro && styles.wrapOscuro, compacto && styles.wrapCompacto]}
      accessibilityRole="tablist"
    >
      {!compacto ? (
        <Text style={[styles.kicker, sobreOscuro && styles.kickerOscuro]}>¿Cómo vas a pescar?</Text>
      ) : null}
      <View style={styles.row}>
        {disponibles.map((m) => {
          const on = m === modo;
          const mar = m === "orilla" || m === "barco";
          return (
            <TouchableOpacity
              key={m}
              style={[
                styles.btn,
                sobreOscuro && styles.btnOscuro,
                on && (mar ? styles.btnOnMar : styles.btnOnRio),
              ]}
              onPress={() => onChange(m)}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={etiquetaModo(m)}
            >
              <Text
                style={[
                  styles.btnTxt,
                  sobreOscuro && styles.btnTxtOscuro,
                  on && styles.btnTxtOn,
                ]}
              >
                {etiquetaModo(m)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {!compacto ? (
        <Text style={[styles.sub, sobreOscuro && styles.subOscuro]} numberOfLines={2}>
          {subtituloModo(modo)}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  wrapOscuro: {},
  wrapCompacto: { marginBottom: 8 },
  kicker: {
    ...TYPE.overline,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  kickerOscuro: { color: "rgba(255,255,255,0.85)" },
  row: { flexDirection: "row", gap: 8 },
  btn: {
    flex: 1,
    minHeight: 44,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  btnOscuro: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderColor: "rgba(255,255,255,0.28)",
  },
  btnOnRio: {
    backgroundColor: COLORS.primaryDark,
    borderColor: COLORS.primaryDark,
  },
  btnOnMar: {
    backgroundColor: COLORS.waterDark,
    borderColor: COLORS.waterDark,
  },
  btnTxt: { fontSize: 14, fontWeight: "800", color: COLORS.textSecondary },
  btnTxtOscuro: { color: "rgba(255,255,255,0.9)" },
  btnTxtOn: { color: "#fff" },
  sub: { marginTop: 8, fontSize: 12, color: COLORS.textSecondary, fontWeight: "600", lineHeight: 16 },
  subOscuro: { color: "rgba(255,255,255,0.8)" },
});
