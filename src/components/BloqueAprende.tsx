import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { COLORS, RADIUS } from "../theme";

type Props = {
  onKit: () => void;
  onNudo: () => void;
  onSitios: () => void;
  onPrimeraSalida?: () => void;
};

/** Atajo fijo «Aprende» para kit, nudo y sitios fáciles. */
export default function BloqueAprende({ onKit, onNudo, onSitios, onPrimeraSalida }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Aprende</Text>
      <Text style={styles.sub}>Si empiezas de cero: kit, un nudo y sitios fáciles.</Text>
      <View style={styles.row}>
        <TouchableOpacity style={styles.chip} onPress={onKit} accessibilityRole="button">
          <Text style={styles.chipTxt}>Kit mínimo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.chip} onPress={onNudo} accessibilityRole="button">
          <Text style={styles.chipTxt}>Nudo Palomar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.chip} onPress={onSitios} accessibilityRole="button">
          <Text style={styles.chipTxt}>Sitios fáciles</Text>
        </TouchableOpacity>
      </View>
      {onPrimeraSalida ? (
        <TouchableOpacity
          style={styles.link}
          onPress={onPrimeraSalida}
          accessibilityRole="button"
          accessibilityLabel="Abrir guía Mi primera salida"
        >
          <Text style={styles.linkTxt}>Mi primera salida ›</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
    padding: 14,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: { fontSize: 15, fontWeight: "800", color: COLORS.textPrimary },
  sub: { marginTop: 2, fontSize: 12.5, lineHeight: 17, color: COLORS.textSecondary, fontWeight: "600" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  chip: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipTxt: { color: COLORS.primaryDark ?? COLORS.primary, fontWeight: "800", fontSize: 12.5 },
  link: { marginTop: 10 },
  linkTxt: { color: COLORS.primary, fontWeight: "800", fontSize: 13 },
});
