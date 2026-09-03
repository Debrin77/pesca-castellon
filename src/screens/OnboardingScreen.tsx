import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { marcarOnboardingVisto } from "../services/offlineService";
import { COLORS, GRADIENTS, RADIUS, SPACING } from "../theme";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    emoji: "🎣",
    titulo: "Dos aguas, dos licencias",
    texto:
      "En ríos y embalses necesitas la licencia continental GVA. En la orilla del mar, la de pesca marítima recreativa desde tierra. No se sustituyen.",
  },
  {
    emoji: "🚦",
    titulo: "Lee el semáforo",
    texto:
      "Verde: hoy sí. Rojo: veda o prohibido. Ámbar: coto (hace falta permiso). La app usa polígonos ICV y anexos oficiales de Castellón.",
  },
  {
    emoji: "🗺️",
    titulo: "El mapa es tu herramienta",
    texto:
      "Pulsa un tramo o tu posición para el veredicto. En Inicio tienes clima, SAIH y avisos; el mapa completo está en su pestaña.",
  },
];

export default function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const [page, setPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  async function terminar() {
    await marcarOnboardingVisto();
    onDone();
  }

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== page) setPage(i);
  }

  return (
    <LinearGradient colors={[...GRADIENTS.primary]} style={styles.root}>
      <Text style={styles.brand}>Pesca Castellón</Text>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {SLIDES.map((s) => (
          <View key={s.titulo} style={[styles.slide, { width }]}>
            <Text style={styles.emoji}>{s.emoji}</Text>
            <Text style={styles.titulo}>{s.titulo}</Text>
            <Text style={styles.texto}>{s.texto}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === page && styles.dotOn]} />
        ))}
      </View>

      <TouchableOpacity
        style={styles.cta}
        onPress={() => {
          if (page < SLIDES.length - 1) {
            scrollRef.current?.scrollTo({ x: (page + 1) * width, animated: true });
            setPage(page + 1);
          } else {
            terminar();
          }
        }}
      >
        <Text style={styles.ctaTxt}>{page < SLIDES.length - 1 ? "Siguiente" : "Empezar a pescar"}</Text>
      </TouchableOpacity>

      {page < SLIDES.length - 1 ? (
        <TouchableOpacity onPress={terminar} style={styles.skip}>
          <Text style={styles.skipTxt}>Saltar</Text>
        </TouchableOpacity>
      ) : (
        <View style={{ height: 36 }} />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: 64, paddingBottom: 28 },
  brand: {
    textAlign: "center",
    color: "#e8f5ee",
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    fontSize: 12,
    marginBottom: 12,
  },
  slide: {
    paddingHorizontal: SPACING.xl,
    justifyContent: "center",
    alignItems: "center",
  },
  emoji: { fontSize: 64, marginBottom: 18 },
  titulo: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.4,
    marginBottom: 12,
  },
  texto: {
    color: "#eef7f1",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    fontWeight: "600",
    maxWidth: 340,
  },
  dots: { flexDirection: "row", justifyContent: "center", gap: 8, marginVertical: 18 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.45)",
  },
  dotOn: { backgroundColor: "#fff", width: 22 },
  cta: {
    marginHorizontal: 24,
    backgroundColor: "#fff",
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  ctaTxt: { color: COLORS.primaryDark, fontWeight: "800", fontSize: 16 },
  skip: { alignItems: "center", marginTop: 12, height: 36, justifyContent: "center" },
  skipTxt: { color: "#e8f5ee", fontWeight: "700" },
});
