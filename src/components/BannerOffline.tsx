import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, RADIUS } from "../theme";

export default function BannerOffline({ mensaje }: { mensaje: string | null }) {
  if (!mensaje) return null;
  return (
    <View style={styles.wrap} accessibilityRole="text">
      <Text style={styles.txt}>📡 {mensaje}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: COLORS.warningLight,
    borderColor: "#e8c48a",
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  txt: { color: COLORS.warning, fontSize: 12, fontWeight: "700", lineHeight: 16 },
});
