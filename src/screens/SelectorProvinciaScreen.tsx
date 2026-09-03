import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useProvincia } from "../context/ProvinciaContext";
import type { ProvinciaId } from "../provincias";
import { COLORS, RADIUS, SHADOW, SPACING } from "../theme";

const COPY: Record<
  ProvinciaId,
  { kicker: string; detalle: string; chips: string[] }
> = {
  castellon: {
    kicker: "Comunitat Valenciana",
    detalle: "Ríos, embalses y orilla de mar. Polígonos ICV, cotos y previsión con oleaje en el Grao.",
    chips: ["Continental", "Costa", "ICV / GVA"],
  },
  sevilla: {
    kicker: "Andalucía",
    detalle: "Solo pesca continental: embalses y ríos de la provincia. Sin costa marítima en esta guía.",
    chips: ["Continental", "Junta Andalucía"],
  },
};

interface Props {
  /** Si true, es un cambio desde Ajustes (no primer arranque). */
  desdeAjustes?: boolean;
}

export default function SelectorProvinciaScreen({ desdeAjustes }: Props) {
  const insets = useSafeAreaInsets();
  const { provincias, elegirProvincia } = useProvincia();

  return (
    <LinearGradient
      colors={["#0B3D2E", "#145A32", "#1A6B3C"]}
      style={styles.root}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: Math.max(insets.top, 24) + 12, paddingBottom: Math.max(insets.bottom, 24) + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.brand}>Pesca</Text>
        <Text style={styles.titulo}>
          {desdeAjustes ? "Cambiar provincia" : "¿Dónde vas a pescar?"}
        </Text>
        <Text style={styles.sub}>
          Elige la provincia. Cargamos el mapa, la normativa y las especies de ese territorio. Puedes
          cambiarla cuando quieras desde Ajustes.
        </Text>

        {provincias.map((p) => {
          const copy = COPY[p.id];
          return (
            <TouchableOpacity
              key={p.id}
              style={styles.card}
              activeOpacity={0.88}
              onPress={() => elegirProvincia(p.id)}
              accessibilityRole="button"
              accessibilityLabel={`Pescar en ${p.nombre}`}
            >
              <View style={styles.cardTop}>
                <Text style={styles.cardKicker}>{copy.kicker}</Text>
                <Text style={styles.cardNombre}>{p.nombre}</Text>
              </View>
              <Text style={styles.cardDetalle}>{copy.detalle}</Text>
              <View style={styles.chipRow}>
                {copy.chips.map((c) => (
                  <View key={c} style={styles.chip}>
                    <Text style={styles.chipTxt}>{c}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.cta}>Entrar →</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: SPACING.lg,
    maxWidth: 520,
    width: "100%",
    alignSelf: "center",
  },
  brand: {
    color: COLORS.gold,
    fontSize: 42,
    fontWeight: "800",
    fontFamily: "SourceSans3_800ExtraBold",
    letterSpacing: 1,
    marginBottom: 4,
  },
  titulo: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "700",
    fontFamily: "SourceSans3_700Bold",
    marginBottom: 10,
  },
  sub: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 16,
    fontFamily: "SourceSans3_400Regular",
    marginBottom: 28,
    lineHeight: 22,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: 16,
    ...SHADOW,
  },
  cardTop: { marginBottom: 8 },
  cardKicker: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "SourceSans3_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  cardNombre: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "SourceSans3_700Bold",
  },
  cardDetalle: {
    color: COLORS.textMuted,
    fontSize: 15,
    fontFamily: "SourceSans3_400Regular",
    marginBottom: 12,
    lineHeight: 21,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  chip: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
  },
  chipTxt: {
    color: COLORS.primaryDark,
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "SourceSans3_600SemiBold",
  },
  cta: {
    color: COLORS.primary,
    fontWeight: "700",
    fontFamily: "SourceSans3_700Bold",
    fontSize: 16,
  },
});
