import React from "react";
import { Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { GRADIENTS, RADIUS, SHADOW_SOFT } from "../theme";

interface Props {
  onPress: () => void;
  compact?: boolean;
}

export default function LicenseBanner({ onPress, compact }: Props) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[styles.wrap, compact && { marginBottom: 8 }]}>
      <LinearGradient colors={GRADIENTS.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.banner}>
        <Text style={styles.icon}>🎫</Text>
        <Text style={styles.text}>
          Recuerda: necesitas <Text style={styles.bold}>licencia de pesca continental</Text> vigente para pescar en Castellón
        </Text>
        <Text style={styles.chevron}>›</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14, borderRadius: RADIUS.md, ...SHADOW_SOFT },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
  },
  icon: { fontSize: 18, marginRight: 8 },
  text: { flex: 1, color: "#fff", fontSize: 12.5, lineHeight: 17 },
  bold: { fontWeight: "700" },
  chevron: { color: "#fff", fontSize: 20, marginLeft: 6 },
});
