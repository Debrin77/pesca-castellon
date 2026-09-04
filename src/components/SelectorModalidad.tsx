import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { MODALIDADES, ModalidadPesca } from "../data/modalidades";
import { COLORS, RADIUS } from "../theme";

interface Props {
  value: ModalidadPesca;
  onChange: (m: ModalidadPesca) => void;
  /** Filtrar p.ej. solo marítimas en costa. */
  filtroAmbito?: "continental" | "maritimo" | "ambos";
}

export default function SelectorModalidad({ value, onChange, filtroAmbito }: Props) {
  const lista = MODALIDADES.filter((m) => {
    if (!filtroAmbito || filtroAmbito === "ambos") return true;
    return m.ambito === filtroAmbito || m.ambito === "ambos";
  });
  const actual = MODALIDADES.find((m) => m.id === value) ?? lista[0];

  return (
    <View style={styles.wrap} accessibilityLabel="Modalidad de pesca">
      <Text style={styles.label}>Modalidad</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {lista.map((m) => (
          <TouchableOpacity
            key={m.id}
            style={[styles.chip, value === m.id && styles.chipOn]}
            onPress={() => onChange(m.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: value === m.id }}
            accessibilityLabel={m.etiqueta}
          >
            <Text style={[styles.chipText, value === m.id && styles.chipTextOn]}>{m.corta}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {actual ? <Text style={styles.nota}>{actual.notaLegal}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 8 },
  label: { fontSize: 11, fontWeight: "800", color: COLORS.textMuted, marginBottom: 4 },
  row: { gap: 6 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipOn: { backgroundColor: COLORS.water, borderColor: COLORS.water },
  chipText: { fontSize: 12.5, fontWeight: "700", color: COLORS.textPrimary },
  chipTextOn: { color: "#fff" },
  nota: { fontSize: 11, color: COLORS.textSecondary, marginTop: 6, lineHeight: 15 },
});
