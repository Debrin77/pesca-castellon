import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { GuiaMedia } from "../data/consejosMedia";
import { COLORS, RADIUS, SHADOW_SOFT } from "../theme";

type Props = {
  guia: GuiaMedia;
  width: number;
};

/**
 * Visor tipo apps de nudos (Knots 3D / Animated Knots):
 * foto grande + paso actual + anterior/siguiente + pies explicativos.
 */
export default function GuiaFotoConsejo({ guia, width }: Props) {
  const [paso, setPaso] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const total = guia.pasos.length;
  const actual = guia.pasos[Math.min(paso, total - 1)];
  const esSecuencia = total > 1;

  useEffect(() => {
    setPaso(0);
    scrollRef.current?.scrollTo({ x: 0, animated: false });
  }, [guia]);

  function irA(i: number) {
    const next = Math.max(0, Math.min(total - 1, i));
    setPaso(next);
    scrollRef.current?.scrollTo({ x: next * width, animated: true });
  }

  function onScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const x = e.nativeEvent.contentOffset.x;
    const i = Math.round(x / width);
    if (i !== paso && i >= 0 && i < total) setPaso(i);
  }

  const imgH = Math.round(width * 0.72);

  return (
    <View style={[styles.wrap, { width }]} accessibilityLabel="Guía visual paso a paso">
      <View style={styles.badgeRow}>
        <Text style={styles.badge}>
          {guia.modo === "secuencia" ? "Fotos paso a paso" : "Identificar por foto"}
        </Text>
        {esSecuencia ? (
          <Text style={styles.contador}>
            Paso {paso + 1} / {total}
          </Text>
        ) : null}
      </View>

      <View style={[styles.frame, { width, height: imgH }]}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScrollEnd}
          scrollEventThrottle={16}
          decelerationRate="fast"
        >
          {guia.pasos.map((p, i) => (
            <View key={i} style={{ width, height: imgH, justifyContent: "center" }}>
              <Image
                source={p.source}
                style={{ width: width - 2, height: imgH - 2, alignSelf: "center" }}
                resizeMode="contain"
                accessibilityLabel={p.caption}
              />
            </View>
          ))}
        </ScrollView>
      </View>

      {esSecuencia ? (
        <View style={styles.nav}>
          <TouchableOpacity
            style={[styles.navBtn, paso === 0 && styles.navBtnOff]}
            onPress={() => irA(paso - 1)}
            disabled={paso === 0}
            accessibilityRole="button"
            accessibilityLabel="Paso anterior"
          >
            <Text style={[styles.navTxt, paso === 0 && styles.navTxtOff]}>← Anterior</Text>
          </TouchableOpacity>
          <View style={styles.dots}>
            {guia.pasos.map((_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => irA(i)}
                style={[styles.dot, i === paso && styles.dotOn]}
                accessibilityLabel={`Ir al paso ${i + 1}`}
              />
            ))}
          </View>
          <TouchableOpacity
            style={[styles.navBtn, paso === total - 1 && styles.navBtnOff]}
            onPress={() => irA(paso + 1)}
            disabled={paso === total - 1}
            accessibilityRole="button"
            accessibilityLabel="Paso siguiente"
          >
            <Text style={[styles.navTxt, paso === total - 1 && styles.navTxtOff]}>Siguiente →</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.captionBox}>
        {esSecuencia ? (
          <View style={styles.pasoChip}>
            <Text style={styles.pasoChipTxt}>{paso + 1}</Text>
          </View>
        ) : null}
        <Text style={styles.caption}>{actual?.caption}</Text>
      </View>

      <Text style={styles.credito}>{guia.credito}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 12, alignSelf: "center" },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  badge: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.waterDark,
    backgroundColor: COLORS.waterLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    overflow: "hidden",
  },
  contador: { fontSize: 12, fontWeight: "700", color: COLORS.textSecondary },
  frame: {
    backgroundColor: "#fff",
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    ...SHADOW_SOFT,
  },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  navBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    minWidth: 88,
  },
  navBtnOff: { opacity: 0.35 },
  navTxt: { fontSize: 12.5, fontWeight: "800", color: COLORS.primaryDark },
  navTxtOff: { color: COLORS.textMuted },
  dots: { flexDirection: "row", gap: 6, alignItems: "center" },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  dotOn: { backgroundColor: COLORS.primaryDark, width: 16 },
  captionBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 10,
    backgroundColor: COLORS.mist,
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pasoChip: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primaryDark,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  pasoChipTxt: { color: "#fff", fontSize: 12, fontWeight: "800" },
  caption: { flex: 1, fontSize: 13.5, lineHeight: 20, color: COLORS.textPrimary, fontWeight: "600" },
  credito: {
    marginTop: 8,
    fontSize: 10,
    color: COLORS.textMuted,
    lineHeight: 14,
    fontStyle: "italic",
  },
});
