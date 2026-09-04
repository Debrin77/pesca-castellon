import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { COLORS, RADIUS } from "../theme";
import { TEXTO_PESCA_REC, abrirPescaRecInfo, abrirPescaRecTienda } from "../services/pescaRecService";

interface Props {
  compacto?: boolean;
}

export default function PescaRecBanner({ compacto }: Props) {
  return (
    <View
      style={[styles.box, compacto && styles.boxCompact]}
      accessibilityRole="summary"
      accessibilityLabel="Aviso PescaREC"
    >
      <Text style={styles.kicker}>PESCAREC · OFICIAL</Text>
      <Text style={styles.text}>{compacto ? "Declaraciones marítimas: usa PescaREC (MAPA)." : TEXTO_PESCA_REC}</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => void abrirPescaRecInfo()}
          accessibilityRole="button"
          accessibilityLabel="Abrir información PescaREC"
        >
          <Text style={styles.btnText}>Info MAPA</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btnGhost}
          onPress={() => void abrirPescaRecTienda()}
          accessibilityRole="button"
          accessibilityLabel="Abrir tienda PescaREC"
        >
          <Text style={styles.btnGhostText}>App PescaREC</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: COLORS.waterLight,
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.water,
    marginTop: 8,
  },
  boxCompact: { padding: 10 },
  kicker: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.waterDark,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  text: { fontSize: 12.5, color: COLORS.textPrimary, lineHeight: 18 },
  row: { flexDirection: "row", gap: 8, marginTop: 10 },
  btn: {
    backgroundColor: COLORS.water,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  btnGhost: {
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.water,
  },
  btnGhostText: { color: COLORS.waterDark, fontWeight: "700", fontSize: 12 },
});
