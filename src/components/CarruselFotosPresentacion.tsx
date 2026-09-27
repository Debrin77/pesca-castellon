import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { FONTS, RADIUS } from "../theme";

const nativo = Platform.OS !== "web";

export type FotoSlide = {
  source: ImageSourcePropType;
  caption: string;
};

type Props = {
  fotos: FotoSlide[];
  activo: boolean;
  /** Altura del marco. */
  height?: number;
  /** Intervalo entre fotos (ms). */
  intervaloMs?: number;
};

/**
 * Carrusel con crossfade para mocks de la presentación.
 * Transición suave entre fotos reales (especies, montajes, placas).
 */
export default function CarruselFotosPresentacion({
  fotos,
  activo,
  height = 118,
  intervaloMs = 2600,
}: Props) {
  const [idx, setIdx] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!activo || fotos.length < 2) return;
    const t = setInterval(() => {
      Animated.timing(fade, {
        toValue: 0,
        duration: 280,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: nativo,
      }).start(({ finished }) => {
        if (!finished) return;
        setIdx((i) => (i + 1) % fotos.length);
        Animated.timing(fade, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: nativo,
        }).start();
      });
    }, intervaloMs);
    return () => clearInterval(t);
  }, [activo, fotos.length, fade, intervaloMs]);

  useEffect(() => {
    if (!activo) {
      fade.setValue(1);
      setIdx(0);
    }
  }, [activo, fade]);

  const actual = fotos[idx] ?? fotos[0];
  if (!actual) return null;

  return (
    <View style={[styles.wrap, { height }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade }]}>
        <Image source={actual.source} style={styles.img} resizeMode="cover" />
      </Animated.View>
      <View style={styles.scrim} />
      <View style={styles.captionBar}>
        <Text style={styles.caption} numberOfLines={1}>
          {actual.caption}
        </Text>
        <View style={styles.dots}>
          {fotos.map((_, i) => (
            <View key={i} style={[styles.dot, i === idx && styles.dotOn]} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: RADIUS.md,
    overflow: "hidden",
    backgroundColor: "#0c2c20",
    marginHorizontal: 10,
  },
  img: { width: "100%", height: "100%" },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  captionBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "rgba(6,18,14,0.72)",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  caption: {
    flex: 1,
    color: "#fff",
    fontFamily: FONTS.bold,
    fontWeight: "700",
    fontSize: 12,
  },
  dots: { flexDirection: "row", gap: 4 },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  dotOn: { backgroundColor: "#fff", width: 12 },
});
