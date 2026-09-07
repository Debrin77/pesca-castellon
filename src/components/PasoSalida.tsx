import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, FONTS, RADIUS } from "../theme";

type Props = {
  pasos: string[];
  activo: number;
  /** Sobre fondo oscuro (hero). */
  sobreOscuro?: boolean;
};

/** Pista de progreso Sitio → Normativa → Clima → Qué llevar. */
export default function PasoSalida({ pasos, activo, sobreOscuro = false }: Props) {
  return (
    <View style={styles.row} accessibilityRole="progressbar" accessibilityValue={{ now: activo + 1, min: 1, max: pasos.length }}>
      {pasos.map((label, i) => {
        const on = i <= activo;
        const current = i === activo;
        return (
          <React.Fragment key={label}>
            {i > 0 ? (
              <View
                style={[
                  styles.line,
                  sobreOscuro ? styles.lineDark : styles.lineLight,
                  on && (sobreOscuro ? styles.lineOnDark : styles.lineOnLight),
                ]}
              />
            ) : null}
            <View style={styles.step}>
              <View
                style={[
                  styles.dot,
                  sobreOscuro ? styles.dotDark : styles.dotLight,
                  on && (sobreOscuro ? styles.dotOnDark : styles.dotOnLight),
                  current && styles.dotCurrent,
                ]}
              >
                <Text
                  style={[
                    styles.dotTxt,
                    sobreOscuro ? styles.dotTxtDark : styles.dotTxtLight,
                    on && (sobreOscuro ? styles.dotTxtOnDark : styles.dotTxtOnLight),
                  ]}
                >
                  {i + 1}
                </Text>
              </View>
              <Text
                style={[
                  styles.label,
                  sobreOscuro ? styles.labelDark : styles.labelLight,
                  on && (sobreOscuro ? styles.labelOnDark : styles.labelOnLight),
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </View>
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginTop: 14,
  },
  step: { alignItems: "center", flexShrink: 1, maxWidth: 72 },
  line: {
    flex: 1,
    height: 2,
    marginTop: 13,
    marginHorizontal: 2,
    borderRadius: 1,
  },
  lineDark: { backgroundColor: "rgba(255,255,255,0.22)" },
  lineLight: { backgroundColor: COLORS.border },
  lineOnDark: { backgroundColor: "rgba(255,255,255,0.7)" },
  lineOnLight: { backgroundColor: COLORS.water },
  dot: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.pill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  dotDark: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderColor: "rgba(255,255,255,0.28)",
  },
  dotLight: {
    backgroundColor: COLORS.mist,
    borderColor: COLORS.border,
  },
  dotOnDark: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderColor: "#fff",
  },
  dotOnLight: {
    backgroundColor: COLORS.water,
    borderColor: COLORS.waterDark,
  },
  dotCurrent: {
    transform: [{ scale: 1.08 }],
  },
  dotTxt: {
    fontSize: 12,
    fontWeight: "800",
    fontFamily: FONTS.extrabold,
  },
  dotTxtDark: { color: "rgba(255,255,255,0.85)" },
  dotTxtLight: { color: COLORS.textMuted },
  dotTxtOnDark: { color: COLORS.primaryDark },
  dotTxtOnLight: { color: "#fff" },
  label: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: "700",
    fontFamily: FONTS.bold,
    letterSpacing: 0.2,
    textAlign: "center",
  },
  labelDark: { color: "rgba(255,255,255,0.55)" },
  labelLight: { color: COLORS.textMuted },
  labelOnDark: { color: "#fff" },
  labelOnLight: { color: COLORS.waterDark },
});
