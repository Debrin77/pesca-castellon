import React from "react";
import { View, StyleSheet } from "react-native";
import { COLORS } from "../theme";

type Forma = "pez" | "sepia" | "calamar" | "pulpo" | "cangrejo" | "prohibido";

function formaDe(id?: string, nombre?: string): Forma {
  const k = `${id ?? ""} ${nombre ?? ""}`.toLowerCase();
  if (k.includes("pulpo")) return "pulpo";
  if (k.includes("sepia") || k.includes("jibia")) return "sepia";
  if (k.includes("calamar")) return "calamar";
  if (k.includes("cangrejo")) return "cangrejo";
  if (k.includes("datil") || k.includes("nacra") || k.includes("caballito") || k.includes("tortuga") || k.includes("mero")) {
    return "prohibido";
  }
  return "pez";
}

export default function SiluetaEspecie({
  id,
  nombre,
  color,
  size = 72,
}: {
  id?: string;
  nombre?: string;
  color?: string;
  size?: number;
}) {
  const forma = formaDe(id, nombre);
  const fill = color ?? (forma === "prohibido" ? COLORS.danger : COLORS.waterDark);
  const w = size;
  const h = size * 0.72;

  if (forma === "pulpo") {
    return (
      <View style={[styles.caja, { width: w, height: h }]} accessibilityLabel="Silueta de pulpo">
        <View style={[styles.cabeza, { backgroundColor: fill, width: w * 0.55, height: w * 0.42, borderRadius: w }]} />
        <View style={styles.patas}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.pata, { backgroundColor: fill, height: h * 0.38 }]} />
          ))}
        </View>
      </View>
    );
  }

  if (forma === "sepia") {
    return (
      <View style={[styles.caja, { width: w, height: h }]} accessibilityLabel="Silueta de sepia">
        <View
          style={{
            width: w * 0.78,
            height: h * 0.62,
            backgroundColor: fill,
            borderRadius: h,
            transform: [{ scaleX: 1.05 }],
          }}
        />
      </View>
    );
  }

  if (forma === "calamar") {
    return (
      <View style={[styles.caja, { width: w, height: h }]} accessibilityLabel="Silueta de calamar">
        <View style={{ width: w * 0.28, height: h * 0.72, backgroundColor: fill, borderRadius: w }} />
      </View>
    );
  }

  if (forma === "cangrejo") {
    return (
      <View style={[styles.caja, { width: w, height: h }]} accessibilityLabel="Silueta de cangrejo">
        <View style={{ width: w * 0.5, height: h * 0.42, backgroundColor: fill, borderRadius: 8 }} />
        <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
          <View style={{ width: 10, height: 14, backgroundColor: fill, borderRadius: 3 }} />
          <View style={{ width: 10, height: 14, backgroundColor: fill, borderRadius: 3 }} />
        </View>
      </View>
    );
  }

  if (forma === "prohibido") {
    return (
      <View style={[styles.caja, { width: w, height: h }]} accessibilityLabel="Especie protegida">
        <View style={{ width: w * 0.5, height: w * 0.5, borderRadius: w, borderWidth: 5, borderColor: fill }} />
      </View>
    );
  }

  return (
    <View style={[styles.caja, { width: w, height: h }]} accessibilityLabel="Silueta de pez">
      <View
        style={{
          width: w * 0.62,
          height: h * 0.48,
          backgroundColor: fill,
          borderRadius: h,
        }}
      />
      <View
        style={{
          position: "absolute",
          right: 4,
          width: 0,
          height: 0,
          borderTopWidth: 10,
          borderBottomWidth: 10,
          borderLeftWidth: 16,
          borderTopColor: "transparent",
          borderBottomColor: "transparent",
          borderLeftColor: fill,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  caja: { alignItems: "center", justifyContent: "center" },
  cabeza: { marginBottom: 2 },
  patas: { flexDirection: "row", gap: 4 },
  pata: { width: 6, borderRadius: 4 },
});
