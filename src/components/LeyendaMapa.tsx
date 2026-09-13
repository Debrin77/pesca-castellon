import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, PIN, TYPE } from "../theme";

type Modo = "continental" | "costa";

const ITEMS: Record<Modo, { color: string; label: string }[]> = {
  continental: [
    { color: PIN.libre, label: "Hoy sí" },
    { color: PIN.coto, label: "Coto" },
    { color: PIN.vedado, label: "Hoy no" },
    { color: PIN.yo, label: "Tú" },
    { color: PIN.seleccion, label: "Consulta" },
    { color: PIN.spot, label: "Punto" },
    { color: PIN.captura, label: "Captura" },
  ],
  costa: [
    { color: PIN.playa, label: "Playa" },
    { color: PIN.vedado, label: "Vedado" },
    { color: PIN.puerto, label: "Puerto" },
    { color: PIN.yo, label: "Tú" },
    { color: PIN.seleccion, label: "Consulta" },
    { color: PIN.spot, label: "Punto" },
    { color: PIN.captura, label: "Captura" },
  ],
};

/** Leyenda compacta para leer el mapa al sol, con guantes o con prisa. */
export default function LeyendaMapa({ modo }: { modo: Modo }) {
  return (
    <View
      style={styles.wrap}
      accessibilityRole="summary"
      accessibilityLabel={
        modo === "continental"
          ? "Leyenda del mapa. Verde hoy sí, ámbar coto, rojo hoy no o vedado"
          : "Leyenda del mapa"
      }
    >
      <View style={styles.row}>
        {ITEMS[modo].map((it) => (
          <View key={it.label} style={styles.item}>
            <View style={[styles.dot, { backgroundColor: it.color }]} />
            <Text style={styles.txt}>{it.label}</Text>
          </View>
        ))}
      </View>
      {modo === "continental" ? (
        <Text style={styles.nota}>Color = si puedes hoy (temporada y días hábiles)</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
    paddingHorizontal: 4,
    alignItems: "center",
    gap: 4,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  item: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(18,32,24,0.12)",
  },
  txt: { ...TYPE.mapLegend, color: COLORS.textPrimary },
  nota: {
    ...TYPE.mapLegend,
    color: COLORS.textMuted,
    textAlign: "center",
  },
});
