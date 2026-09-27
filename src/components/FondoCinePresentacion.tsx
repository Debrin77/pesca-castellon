import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const nativo = Platform.OS !== "web";

type Props = {
  /** Foto atmosférica del slide activo. */
  foto: ImageSourcePropType;
  /** Degradado de marca encima de la foto. */
  accent: readonly [string, string, string];
  /** Intensidad del velo oscuro (0–1). */
  velo?: number;
};

/**
 * Fondo cinematográfico para la presentación App Store:
 * foto a sangrado + Ken Burns suave + crossfade al cambiar de slide
 * + degradado de marca. Evita fondos planos y da atmósfera de orilla.
 */
export default function FondoCinePresentacion({ foto, accent, velo = 0.55 }: Props) {
  const [capaA, setCapaA] = useState(foto);
  const [capaB, setCapaB] = useState(foto);
  const [frenteEsB, setFrenteEsB] = useState(false);
  const opacidadB = useRef(new Animated.Value(0)).current;
  const ken = useRef(new Animated.Value(0)).current;
  const primer = useRef(true);

  useEffect(() => {
    if (primer.current) {
      primer.current = false;
      setCapaA(foto);
      return;
    }
    if (frenteEsB) {
      setCapaA(foto);
      Animated.timing(opacidadB, {
        toValue: 0,
        duration: 720,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: nativo,
      }).start(({ finished }) => {
        if (finished) setFrenteEsB(false);
      });
    } else {
      setCapaB(foto);
      Animated.timing(opacidadB, {
        toValue: 1,
        duration: 720,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: nativo,
      }).start(({ finished }) => {
        if (finished) setFrenteEsB(true);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al cambiar foto
  }, [foto]);

  useEffect(() => {
    ken.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(ken, {
          toValue: 1,
          duration: 9200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: nativo,
        }),
        Animated.timing(ken, {
          toValue: 0,
          duration: 9200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: nativo,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [ken, foto]);

  const scale = ken.interpolate({ inputRange: [0, 1], outputRange: [1.08, 1.18] });
  const tx = ken.interpolate({ inputRange: [0, 1], outputRange: [-12, 14] });
  const ty = ken.interpolate({ inputRange: [0, 1], outputRange: [-6, 10] });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { transform: [{ scale }, { translateX: tx }, { translateY: ty }] },
        ]}
      >
        <Image source={capaA} style={styles.foto} resizeMode="cover" />
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: opacidadB }]}>
          <Image source={capaB} style={styles.foto} resizeMode="cover" />
        </Animated.View>
      </Animated.View>

      {/* Velo + tinte de marca para legibilidad del copy */}
      <View style={[styles.velo, { backgroundColor: `rgba(6,18,14,${velo})` }]} />
      <LinearGradient
        colors={[`${accent[0]}CC`, `${accent[1]}99`, `${accent[2]}E6`]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={["rgba(255,228,180,0.16)", "transparent", "rgba(0,0,0,0.45)"]}
        locations={[0, 0.32, 1]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  foto: { ...StyleSheet.absoluteFillObject },
  velo: { ...StyleSheet.absoluteFillObject },
});
