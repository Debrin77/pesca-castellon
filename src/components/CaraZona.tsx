import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { CaraVisual } from "../data/carasVisuales";
import { RADIUS } from "../theme";

/** Hero visual de zona (cara) para fichas premium. */
export default function CaraZona({
  cara,
  titulo,
  subtitulo,
  right,
  compact,
}: {
  cara: CaraVisual;
  titulo: string;
  subtitulo?: string;
  right?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <LinearGradient colors={[...cara.gradiente]} style={[styles.wrap, compact && styles.wrapCompact]}>
      <View style={styles.row}>
        <Text style={[styles.emoji, compact && { fontSize: 36 }]}>{cara.emoji}</Text>
        <View style={{ flex: 1, paddingHorizontal: 10 }}>
          <Text style={styles.kicker}>{cara.etiqueta}</Text>
          <Text style={[styles.titulo, compact && { fontSize: 18 }]} numberOfLines={2}>
            {titulo}
          </Text>
          {subtitulo ? (
            <Text style={styles.sub} numberOfLines={2}>
              {subtitulo}
            </Text>
          ) : null}
        </View>
        {right}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: RADIUS.lg,
    padding: 18,
    marginBottom: 14,
    overflow: "hidden",
  },
  wrapCompact: { padding: 14, marginBottom: 10 },
  row: { flexDirection: "row", alignItems: "center" },
  emoji: { fontSize: 48 },
  kicker: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  titulo: { color: "#fff", fontSize: 22, fontWeight: "800", letterSpacing: -0.3 },
  sub: { color: "rgba(255,255,255,0.95)", fontSize: 13, marginTop: 3, fontWeight: "600" },
});
