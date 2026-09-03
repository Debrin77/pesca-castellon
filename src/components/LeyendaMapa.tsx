import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, PIN, SPACING, TYPE } from "../theme";

type Modo = "continental" | "costa";

const ITEMS: Record<Modo, { color: string; label: string }[]> = {
  continental: [
    { color: PIN.libre, label: "Libre" },
    { color: PIN.coto, label: "Coto" },
    { color: PIN.vedado, label: "Vedado" },
  ],
  costa: [
    { color: PIN.playa, label: "Playa" },
    { color: PIN.vedado, label: "Vedado" },
    { color: PIN.puerto, label: "Puerto" },
  ],
};

export default function LeyendaMapa({ modo }: { modo: Modo }) {
  return (
    <View style={styles.row}>
      {ITEMS[modo].map((it) => (
        <View key={it.label} style={styles.item}>
          <View style={[styles.dot, { backgroundColor: it.color }]} />
          <Text style={styles.txt}>{it.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md,
    justifyContent: "center",
    marginBottom: 4,
  },
  item: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  txt: { ...TYPE.caption, color: COLORS.textPrimary, fontWeight: "700" },
});
