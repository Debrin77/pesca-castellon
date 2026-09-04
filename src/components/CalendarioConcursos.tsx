import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking } from "react-native";
import { concursosParaProvincia, ConcursoPesca } from "../data/concursos";
import type { ProvinciaId } from "../provincias/types";
import { COLORS, RADIUS } from "../theme";

interface Props {
  provinciaId: ProvinciaId;
  limite?: number;
}

export default function CalendarioConcursos({ provinciaId, limite = 4 }: Props) {
  const [items, setItems] = useState<ConcursoPesca[]>([]);

  useEffect(() => {
    setItems(concursosParaProvincia(provinciaId).slice(0, limite));
  }, [provinciaId, limite]);

  if (!items.length) return null;

  return (
    <View style={styles.box} accessibilityLabel="Calendario de concursos">
      <Text style={styles.title} accessibilityRole="header">
        Concursos / federación
      </Text>
      <Text style={styles.sub}>Orientativo: confirma siempre en la web del organizador.</Text>
      {items.map((c) => (
        <TouchableOpacity
          key={c.id}
          style={styles.item}
          onPress={() => (c.url ? Linking.openURL(c.url) : undefined)}
          accessibilityRole="button"
          accessibilityLabel={`${c.titulo}, ${c.fecha}`}
        >
          <Text style={styles.fecha}>
            {c.fecha}
            {c.fin && c.fin !== c.fecha ? ` → ${c.fin}` : ""}
          </Text>
          <Text style={styles.nombre}>{c.titulo}</Text>
          <Text style={styles.meta}>
            {c.lugar} · {c.modalidad} · {c.organizador}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 12,
  },
  title: { fontSize: 15, fontWeight: "800", color: COLORS.textPrimary },
  sub: { fontSize: 11, color: COLORS.textMuted, marginBottom: 8, marginTop: 2 },
  item: {
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  fecha: { fontSize: 11, fontWeight: "800", color: COLORS.primary },
  nombre: { fontSize: 13.5, fontWeight: "700", color: COLORS.textPrimary, marginTop: 2 },
  meta: { fontSize: 11.5, color: COLORS.textSecondary, marginTop: 2 },
});
