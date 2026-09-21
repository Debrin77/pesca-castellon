import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import type { ModoPescaGlobal } from "../data/modoPesca";
import { etiquetaModo, subtituloModo, textoPedirModo } from "../data/modoPesca";
import { COLORS, RADIUS, TYPE } from "../theme";

type Props = {
  /** Null / no elegido: ninguna pestaña marcada hasta que el usuario pulse. */
  modo: ModoPescaGlobal | null;
  disponibles: ModoPescaGlobal[];
  onChange: (modo: ModoPescaGlobal) => void;
  /**
   * Última modalidad de una sesión anterior. Chip «¿Seguir en…?» (un toque)
   * sin marcar el selector ni asumir el veredicto.
   */
  modoRecordado?: ModoPescaGlobal | null;
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
  modoRecordado = null,
  sobreOscuro,
  compacto,
}: Props) {
  if (disponibles.length <= 1) return null;

  const elegido = modo != null;
  const mostrarSeguir =
    !elegido && !!modoRecordado && disponibles.includes(modoRecordado);

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
          const on = elegido && m === modo;
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
      {mostrarSeguir ? (
        <TouchableOpacity
          style={[styles.seguirChip, sobreOscuro && styles.seguirChipOscuro]}
          onPress={() => onChange(modoRecordado!)}
          accessibilityRole="button"
          accessibilityLabel={`Seguir en ${etiquetaModo(modoRecordado!)}`}
        >
          <Text style={[styles.seguirTxt, sobreOscuro && styles.seguirTxtOscuro]}>
            ¿Seguir en {etiquetaModo(modoRecordado!)}?
          </Text>
          <Text style={[styles.seguirCta, sobreOscuro && styles.seguirCtaOscuro]}>Sí ›</Text>
        </TouchableOpacity>
      ) : null}
      {!compacto ? (
        <Text style={[styles.sub, sobreOscuro && styles.subOscuro]} numberOfLines={2}>
          {elegido
            ? subtituloModo(modo)
            : `${textoPedirModo(disponibles)} para el veredicto y tu punto de hoy`}
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
  seguirChip: {
    marginTop: 10,
    minHeight: 44,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.water,
    backgroundColor: "rgba(26, 117, 136, 0.1)",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  seguirChipOscuro: {
    backgroundColor: "rgba(255,255,255,0.16)",
    borderColor: "rgba(255,255,255,0.45)",
  },
  seguirTxt: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.waterDark,
  },
  seguirTxtOscuro: { color: "#fff" },
  seguirCta: { fontSize: 14, fontWeight: "800", color: COLORS.waterDark },
  seguirCtaOscuro: { color: "#fff" },
  sub: { marginTop: 8, fontSize: 12, color: COLORS.textSecondary, fontWeight: "600", lineHeight: 16 },
  subOscuro: { color: "rgba(255,255,255,0.8)" },
});
