import React from "react";
import { Text, StyleSheet, TouchableOpacity, View } from "react-native";
import { COLORS, RADIUS, SHADOW_SOFT } from "../theme";

interface Props {
  onPress: () => void;
  compact?: boolean;
}

export default function LicenseBanner({ onPress, compact }: Props) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[styles.wrap, compact && { marginBottom: 8 }]}>
      <View style={styles.banner}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>GVA</Text>
        </View>
        <Text style={styles.text}>
          Licencia de pesca continental vigente para pescar en Castellón
        </Text>
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14, borderRadius: RADIUS.md, ...SHADOW_SOFT },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  badge: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginRight: 10,
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "800", letterSpacing: 0.6 },
  text: { flex: 1, color: COLORS.textPrimary, fontSize: 12.5, lineHeight: 17, fontWeight: "600" },
  chevron: { color: COLORS.textMuted, fontSize: 22, marginLeft: 6 },
});
