import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useProvincia } from "../context/ProvinciaContext";
import type { ProvinciaId } from "../provincias";
import { COLORS, FONTS, RADIUS, SHADOW, SPACING } from "../theme";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/** Copy de puerta: humano primero. La jerga queda detrás de «Más detalles». */
const COPY: Record<
  ProvinciaId,
  { kicker: string; detalle: string; chips: string[]; tecnico: string }
> = {
  castellon: {
    kicker: "Comunitat Valenciana",
    detalle: "Costa, ríos y embalses. Normativa y mapa locales listos al entrar.",
    chips: ["Costa", "Ríos", "Embalses"],
    tecnico:
      "Mapa con tramos oficiales (ICV), cotos y orilla. No se exige seguro RC. Previsión con oleaje en costa.",
  },
  sevilla: {
    kicker: "Andalucía",
    detalle: "Ríos, azudes y embalses. Licencia de la Junta y mapa local al entrar.",
    chips: ["Ríos", "Embalses", "Licencia Junta"],
    tecnico:
      "Cartografía DERA y aguas libres (art. 5.2). Licencia continental + NIR + seguro RC obligatorio.",
  },
  cordoba: {
    kicker: "Andalucía",
    detalle: "Ríos y embalses del Guadalquivir medio. Licencia de la Junta y mapa local al entrar.",
    chips: ["Ríos", "Embalses", "Licencia Junta"],
    tecnico:
      "Cartografía DERA y aguas libres (art. 5.2). Licencia continental + NIR + seguro RC obligatorio. SAIH CHG EmbalCO.",
  },
};

interface Props {
  /** Si true, es un cambio desde Ajustes (no primer arranque). */
  desdeAjustes?: boolean;
}

export default function SelectorProvinciaScreen({ desdeAjustes }: Props) {
  const insets = useSafeAreaInsets();
  const { provincias, elegirProvincia } = useProvincia();
  const [tecnicosAbiertos, setTecnicosAbiertos] = useState<Partial<Record<ProvinciaId, boolean>>>(
    {}
  );

  function toggleTecnico(id: ProvinciaId) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setTecnicosAbiertos((prev) => ({ ...prev, [id]: !prev[id] }));
  }

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
          {
            paddingTop: Math.max(insets.top, 24) + 12,
            paddingBottom: Math.max(insets.bottom, 24) + 16,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.brand}>Pesca</Text>
        <Text style={styles.titulo}>
          {desdeAjustes ? "Cambiar provincia" : "¿Dónde vas a pescar?"}
        </Text>
        <Text style={styles.sub}>
          Elige tu zona. Cargamos mapa, especies y normas de ese territorio. Puedes cambiarla luego
          en Ajustes.
        </Text>

        {provincias.map((p) => {
          const copy = COPY[p.id];
          const abierto = !!tecnicosAbiertos[p.id];
          return (
            <View key={p.id} style={styles.card}>
              <TouchableOpacity
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
              <TouchableOpacity
                onPress={() => toggleTecnico(p.id)}
                accessibilityRole="button"
                accessibilityState={{ expanded: abierto }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.masInfo}
              >
                <Text style={styles.masInfoTxt}>
                  {abierto ? "Menos detalles ▲" : "Más detalles técnicos ›"}
                </Text>
              </TouchableOpacity>
              {abierto ? <Text style={styles.tecnico}>{copy.tecnico}</Text> : null}
            </View>
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
    fontFamily: FONTS.extrabold,
    letterSpacing: 1,
    marginBottom: 4,
  },
  titulo: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "700",
    fontFamily: FONTS.bold,
    marginBottom: 10,
  },
  sub: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 16,
    fontFamily: FONTS.regular,
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
    fontFamily: FONTS.bold,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  cardNombre: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: "700",
    fontFamily: FONTS.bold,
  },
  cardDetalle: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontFamily: FONTS.regular,
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
    fontFamily: FONTS.semibold,
  },
  cta: {
    color: COLORS.primary,
    fontWeight: "700",
    fontFamily: FONTS.bold,
    fontSize: 16,
  },
  masInfo: { marginTop: 12 },
  masInfoTxt: {
    color: COLORS.textMuted,
    fontSize: 12.5,
    fontWeight: "700",
    fontFamily: FONTS.bold,
  },
  tecnico: {
    marginTop: 6,
    fontSize: 12.5,
    lineHeight: 18,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
  },
});
