import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  type ImageSourcePropType,
  type LayoutChangeEvent,
} from "react-native";
import type { CriterioMedicion } from "../data/criterioMedicion";
import {
  anclaMedicionFoto,
  proyectarCover,
  type AnclaMedicionFoto,
} from "../data/anclasMedicionFoto";
import { COLORS } from "../theme";

type Props = {
  source: ImageSourcePropType;
  especieId: string;
  criterio: CriterioMedicion;
  valorMinimo?: string | null;
  accessibilityLabel?: string;
  /** Altura del marco (ancho = 100%). */
  height?: number;
};

const CHIP = 22;

function OverlayLinea({
  ancla,
  boxW,
  boxH,
  badge,
}: {
  ancla: AnclaMedicionFoto;
  boxW: number;
  boxH: number;
  badge: string;
}) {
  const A = proyectarCover(ancla.a, ancla.w, ancla.h, boxW, boxH);
  const B = proyectarCover(ancla.b, ancla.w, ancla.h, boxW, boxH);
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const len = Math.max(1, Math.sqrt(dx * dx + dy * dy));
  const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  const midX = (A.x + B.x) / 2;
  const midY = (A.y + B.y) / 2;

  // Puntas de flecha: triángulos CSS rotados en los extremos
  const flechaAngA = ang + 180; // apunta hacia A (desde la línea)
  const flechaAngB = ang;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Cota */}
      <View
        style={{
          position: "absolute",
          left: midX - len / 2,
          top: midY - 1.5,
          width: len,
          height: 3,
          backgroundColor: COLORS.primaryDark,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.92)",
          borderRadius: 2,
          transform: [{ rotate: `${ang}deg` }],
        }}
      />

      {/* Flecha en A (apunta al hocico) */}
      <View
        style={[
          styles.flecha,
          {
            left: A.x - 5,
            top: A.y - 7,
            transform: [{ rotate: `${flechaAngA}deg` }],
          },
        ]}
      />
      {/* Flecha en B (apunta a la cola) */}
      <View
        style={[
          styles.flecha,
          {
            left: B.x - 5,
            top: B.y - 7,
            transform: [{ rotate: `${flechaAngB}deg` }],
          },
        ]}
      />

      {/* Chips A / B encima de los puntos */}
      <View style={[styles.chip, styles.chipA, { left: A.x - CHIP / 2, top: A.y - CHIP - 6 }]}>
        <Text style={styles.chipTxt}>A</Text>
      </View>
      <View style={[styles.chip, styles.chipB, { left: B.x - CHIP / 2, top: B.y - CHIP - 6 }]}>
        <Text style={styles.chipTxt}>B</Text>
      </View>

      <View style={[styles.guia, { left: A.x - 0.5, top: A.y - 8, height: 8 }]} />
      <View style={[styles.guia, { left: B.x - 0.5, top: B.y - 8, height: 8 }]} />

      <View style={[styles.badge, { left: Math.min(boxW - 110, Math.max(8, midX - 48)), top: Math.min(boxH - 32, midY + 12) }]}>
        <Text style={styles.badgeTxt}>{badge}</Text>
      </View>
    </View>
  );
}

function OverlayPeso({
  ancla,
  boxW,
  boxH,
  badge,
}: {
  ancla: AnclaMedicionFoto;
  boxW: number;
  boxH: number;
  badge: string;
}) {
  const A = proyectarCover(ancla.a, ancla.w, ancla.h, boxW, boxH);
  const B = proyectarCover(ancla.b, ancla.w, ancla.h, boxW, boxH);
  const cx = (A.x + B.x) / 2;
  const cy = (A.y + B.y) / 2;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[styles.chip, styles.chipA, { left: A.x - CHIP / 2, top: A.y - CHIP / 2 }]}>
        <Text style={styles.chipTxt}>A</Text>
      </View>
      <View style={[styles.chip, styles.chipB, { left: B.x - CHIP / 2, top: B.y - CHIP / 2 }]}>
        <Text style={styles.chipTxt}>B</Text>
      </View>
      <View
        style={[
          styles.badge,
          styles.badgePeso,
          { left: Math.min(boxW - 120, Math.max(8, cx - 56)), top: Math.max(8, cy - 40) },
        ]}
      >
        <Text style={styles.badgeTxt}>{badge}</Text>
      </View>
    </View>
  );
}

/**
 * Foto de especie con flechas A→B ancladas sobre el ejemplar.
 */
export default function FotoConMedicion({
  source,
  especieId,
  criterio,
  valorMinimo,
  accessibilityLabel,
  height = 200,
}: Props) {
  const ancla = anclaMedicionFoto(especieId, criterio.patron);
  const [box, setBox] = useState({ w: 0, h: height });

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height: h } = e.nativeEvent.layout;
    if (width > 0 && h > 0) setBox({ w: width, h });
  };

  const badge =
    valorMinimo != null && valorMinimo !== ""
      ? `mín. ${valorMinimo} ${criterio.unidad}`
      : criterio.unidad === "kg"
        ? "peso mínimo"
        : "medir aquí";

  const modo = ancla?.modo ?? "linea";

  return (
    <View style={styles.wrap}>
      <View style={[styles.marco, { height }]} onLayout={onLayout}>
        <Image
          source={source}
          style={styles.foto}
          resizeMode="cover"
          accessibilityLabel={accessibilityLabel}
        />
        <View style={styles.vignette} pointerEvents="none" />
        {ancla && box.w > 0 ? (
          modo === "peso" ? (
            <OverlayPeso ancla={ancla} boxW={box.w} boxH={box.h} badge={badge} />
          ) : (
            <OverlayLinea ancla={ancla} boxW={box.w} boxH={box.h} badge={badge} />
          )
        ) : null}
      </View>
      <View style={styles.pie}>
        <Text style={styles.pieTxt} numberOfLines={2}>
          <Text style={styles.pieStrong}>A</Text> {criterio.desde}
          {"  →  "}
          <Text style={styles.pieStrong}>B</Text> {criterio.hasta}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: COLORS.mist,
  },
  marco: {
    width: "100%",
    overflow: "hidden",
    backgroundColor: COLORS.mist,
  },
  foto: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  chip: {
    position: "absolute",
    width: CHIP,
    height: CHIP,
    borderRadius: CHIP / 2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
    zIndex: 3,
  },
  chipA: { backgroundColor: COLORS.primary },
  chipB: { backgroundColor: COLORS.waterDark },
  chipTxt: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },
  guia: {
    position: "absolute",
    width: 1.5,
    backgroundColor: "rgba(255,255,255,0.95)",
    zIndex: 2,
  },
  badge: {
    position: "absolute",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.85)",
    zIndex: 4,
    minWidth: 96,
    alignItems: "center",
  },
  badgePeso: {
    minWidth: 112,
  },
  badgeTxt: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  flecha: {
    position: "absolute",
    width: 0,
    height: 0,
    borderTopWidth: 7,
    borderBottomWidth: 7,
    borderLeftWidth: 11,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: "#fff",
    zIndex: 2,
  },
  pie: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  pieTxt: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "600",
    lineHeight: 16,
  },
  pieStrong: {
    color: COLORS.waterDark,
    fontWeight: "800",
  },
});
