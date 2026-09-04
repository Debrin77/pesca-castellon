import React, { useMemo, useRef, useState } from "react";
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
import { useProvincia } from "../context/ProvinciaContext";
import { getProvinciaActiva } from "../provincias/runtime";
import { COLORS, GRADIENTS, RADIUS, SPACING } from "../theme";

const { width } = Dimensions.get("window");

export default function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const { provincia: provinciaCtx } = useProvincia();
  const provincia = provinciaCtx ?? getProvinciaActiva();
  const nombreProv = provincia.nombre;
  const [page, setPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const slides = useMemo(
    () => [
      {
        emoji: "🎣",
        titulo: provincia.continentalOnly
          ? provincia.requisitosLicencia.seguroObligatorio
            ? "Licencia + seguro RC"
            : "Licencia continental"
          : "Dos aguas, dos licencias",
        texto: provincia.continentalOnly
          ? provincia.requisitosLicencia.seguroObligatorio
            ? `En ríos y embalses de ${nombreProv} necesitas licencia continental de la Junta, NIR y el seguro obligatorio de responsabilidad civil del pescador.`
            : `En ríos y embalses de ${nombreProv} necesitas la licencia de pesca continental. Comprueba siempre la normativa vigente de tu provincia.`
          : "En ríos y embalses necesitas la licencia continental. En la orilla del mar, la de pesca marítima recreativa desde tierra. No se sustituyen. En Castellón no se exige seguro de RC de pescador.",
      },
      {
        emoji: "🚦",
        titulo: "Lee el semáforo",
        texto: provincia.continentalOnly
          ? `Verde: aguas libres. Rojo: refugio de pesca (Anexo IV, prohibido). En ${nombreProv} usamos polígonos oficiales DERA de la Junta.`
          : provincia.tieneIcv
            ? `Verde: hoy sí. Rojo: veda o prohibido. Ámbar: coto (hace falta permiso). La app usa polígonos y anexos oficiales de ${nombreProv}.`
            : `Verde: hoy sí. Rojo: veda o prohibido. Ámbar: coto (hace falta permiso). Los datos de ${nombreProv} son orientativos: confirma siempre en la fuente oficial.`,
      },
      {
        emoji: "🗺️",
        titulo: "El mapa es tu herramienta",
        texto:
          "En Inicio ves el pulso del día y «Salgo a pescar» (elige GPS, mapa, coordenadas o zona). El mapa da el veredicto al pulsar un tramo. En Consejos: montajes visuales por especie, nudos y aparejos.",
      },
    ],
    [
      provincia.continentalOnly,
      provincia.tieneIcv,
      provincia.requisitosLicencia.seguroObligatorio,
      nombreProv,
    ]
  );

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
      <Text style={styles.brand}>{provincia.nombreApp ?? "Pesca"}</Text>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {slides.map((s) => (
          <View key={s.titulo} style={[styles.slide, { width }]}>
            <Text style={styles.emoji}>{s.emoji}</Text>
            <Text style={styles.titulo}>{s.titulo}</Text>
            <Text style={styles.texto}>{s.texto}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View key={i} style={[styles.dot, i === page && styles.dotOn]} />
        ))}
      </View>

      <TouchableOpacity
        style={styles.cta}
        onPress={() => {
          if (page < slides.length - 1) {
            scrollRef.current?.scrollTo({ x: (page + 1) * width, animated: true });
            setPage(page + 1);
          } else {
            terminar();
          }
        }}
      >
        <Text style={styles.ctaTxt}>{page < slides.length - 1 ? "Siguiente" : "Empezar a pescar"}</Text>
      </TouchableOpacity>

      {page < slides.length - 1 ? (
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
