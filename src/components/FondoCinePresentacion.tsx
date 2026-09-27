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
export default function FondoCinePresentacion({ foto, accent, velo = 0.38 }: Props) {
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

  const scale = ken.interpolate({ inputRange: [0, 1], outputRange: [1.1, 1.22] });
  const tx = ken.interpolate({ inputRange: [0, 1], outputRange: [-18, 20] });
  const ty = ken.interpolate({ inputRange: [0, 1], outputRange: [-10, 14] });

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

      {/* Velo + tinte de marca: deja leer el copy sin aplastar la foto */}
      <View style={[styles.velo, { backgroundColor: `rgba(4,14,12,${velo})` }]} />
      <LinearGradient
        colors={[`${accent[0]}99`, `${accent[1]}66`, `${accent[2]}CC`]}
        locations={[0, 0.42, 1]}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={["rgba(255,232,190,0.18)", "transparent", "rgba(0,0,0,0.5)"]}
        locations={[0, 0.35, 1]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Viñeta lateral: la foto respira más en el centro */}
      <LinearGradient
        colors={["rgba(0,0,0,0.35)", "transparent", "rgba(0,0,0,0.35)"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  foto: { ...StyleSheet.absoluteFillObject },
  velo: { ...StyleSheet.absoluteFillObject },
});
