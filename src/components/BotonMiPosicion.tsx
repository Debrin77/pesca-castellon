import React from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from "react-native";
import { COLORS, RADIUS, SHADOW } from "../theme";

interface Props {
  onPress: () => void;
  cargando?: boolean;
}

export default function BotonMiPosicion({ onPress, cargando }: Props) {
  return (
    <TouchableOpacity style={styles.fab} onPress={onPress} activeOpacity={0.85} disabled={cargando}>
      {cargando ? (
        <ActivityIndicator color={COLORS.water} size="small" />
      ) : (
        <Text style={styles.fabText}>Ir a mí</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    left: 12,
    bottom: 12,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW,
    minWidth: 88,
    alignItems: "center",
  },
  fabText: { fontSize: 13, fontWeight: "800", color: COLORS.water },
});
