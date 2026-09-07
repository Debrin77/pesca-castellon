import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Animated,
  Easing,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { marcarPresentacionVirtudesVista } from "../services/offlineService";
import { useProvincia } from "../context/ProvinciaContext";
import { getProvinciaActiva } from "../provincias/runtime";
import { COLORS, FONTS, GRADIENTS, RADIUS, SEMAFORO, SPACING } from "../theme";
import OndaAgua from "../components/OndaAgua";
import PulsePress from "../components/PulsePress";

const { width: W, height: H } = Dimensions.get("window");
/** Marco tipo captura App Store: domina el alto de la pantalla. */
const PHONE_W = Math.min(W * 0.86, 360);
const PHONE_H = Math.min(H * 0.56, 560);
const nativo = Platform.OS !== "web";

type SlideId = "intima" | "pin" | "legal" | "pinta" | "diario" | "campo";

type Slide = {
  id: SlideId;
  eyebrow: string;
  titulo: string;
  texto: string;
  accent: readonly [string, string, string?];
  tonoOnda: "claro" | "agua";
};

/**
 * Presentación estilo App Store: pantallas a pantalla completa con
 * “capturas” de virtudes. Se puede cerrar con la X (arriba derecha).
 */
export default function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const { provincia: provinciaCtx } = useProvincia();
  const provincia = provinciaCtx ?? getProvinciaActiva();
  const nombreProv = provincia.nombre;
  const [page, setPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const enter = useRef(new Animated.Value(1)).current;
  const floatY = useRef(new Animated.Value(0)).current;

  const slides: Slide[] = useMemo(
    () => [
      {
        id: "intima",
        eyebrow: "Tu cuaderno de pesca",
        titulo: "Personal e íntima",
        texto: "Sitios, capturas y notas viven en tu móvil. Compartir es opcional — no el motivo.",
        accent: ["#1f6a4a", "#134033", "#0c2c20"],
        tonoOnda: "claro",
      },
      {
        id: "pin",
        eyebrow: "Solo tú entras",
        titulo: "PIN + biometría",
        texto: "PIN de 4–8 dígitos y Face ID / huella. Al abrir o al volver, la app está cerrada para los demás.",
        accent: ["#163a2c", "#0f2a20", "#0a1c15"],
        tonoOnda: "claro",
      },
      {
        id: "legal",
        eyebrow: "¿Puedo pescar aquí?",
        titulo: "Semáforo claro",
        texto: provincia.continentalOnly
          ? `Verde, rojo o «SIN TRAMO». SIN TRAMO no es veda: en ${nombreProv} puede ser agua libre. Mira el cartel en tu primera salida.`
          : provincia.tieneIcv
            ? "Verde: hoy sí. Rojo: veda. Ámbar: coto. Gris «SIN TRAMO»: no es veda — el tramo no está dibujado; confirma cartel."
            : `Verde, rojo o ámbar. Los datos de ${nombreProv} son orientativos: confirma siempre en la fuente oficial.`,
        accent: ["#1a7a8f", "#125a6c", "#0e4456"],
        tonoOnda: "agua",
      },
      {
        id: "pinta",
        eyebrow: "¿Pinta el día?",
        titulo: "Índice y previsión",
        texto: "Clima, presión, luna e índice 0–100. «¿Puedo?» es la norma; «¿Pinta?» es el tiempo — no autoriza.",
        accent: ["#2a7a94", "#185a6e", "#0e4456"],
        tonoOnda: "agua",
      },
      {
        id: "diario",
        eyebrow: "Tu memoria de campo",
        titulo: "Capturas y rutas",
        texto: "Foto, especie, GPS y cupo. Exporta GPX cuando quieras — a Maps, a un amigo o a nadie.",
        accent: ["#1a5640", "#123a2c", "#0c2c20"],
        tonoOnda: "claro",
      },
      {
        id: "campo",
        eyebrow: "Listo para la orilla",
        titulo: "Salgo a pescar",
        texto: "Ritual de salida, montajes con fotos y checklist. Menos dudar en casa, más caña en la mano.",
        accent: ["#2c4034", "#1a2c24", "#0f1c16"],
        tonoOnda: "claro",
      },
    ],
    [provincia.continentalOnly, provincia.tieneIcv, nombreProv]
  );

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, {
          toValue: 1,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: nativo,
        }),
        Animated.timing(floatY, {
          toValue: 0,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: nativo,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [floatY]);

  useEffect(() => {
    enter.setValue(0);
    Animated.spring(enter, {
      toValue: 1,
      friction: 7,
      tension: 64,
      useNativeDriver: nativo,
    }).start();
  }, [page, enter]);

  async function terminar() {
    await marcarPresentacionVirtudesVista();
    onDone();
  }

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const i = Math.round(e.nativeEvent.contentOffset.x / W);
    if (i !== page) setPage(i);
  }

  const topPad = Math.max(insets.top, Platform.OS === "web" ? 16 : 12);
  const slide = slides[page];
  const phoneLift = floatY.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
  const phoneScale = enter.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] });
  const phoneOpacity = enter.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] });
  const textOpacity = enter.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const textY = enter.interpolate({ inputRange: [0, 1], outputRange: [18, 0] });

  const gradColors = (slide.accent.filter(Boolean) as string[]) as [string, string, ...string[]];

  return (
    <View style={styles.root}>
      <LinearGradient colors={gradColors} style={StyleSheet.absoluteFill} />
      <OndaAgua intensidad={0.7} tono={slide.tonoOnda} />
      <View pointerEvents="none" style={styles.vignette} />

      <TouchableOpacity
        style={[styles.closeBtn, { top: topPad + 4 }]}
        onPress={terminar}
        accessibilityLabel="Cerrar presentación"
        accessibilityRole="button"
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={styles.closeTxt}>✕</Text>
      </TouchableOpacity>

      <Animated.Text style={[styles.brand, { marginTop: topPad + 44, opacity: textOpacity }]}>
        {provincia.nombreApp ?? "Pesca"}
      </Animated.Text>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={styles.pager}
        decelerationRate="fast"
      >
        {slides.map((s, idx) => (
          <View key={s.id} style={[styles.slide, { width: W }]}>
            <Animated.View
              style={{
                opacity: idx === page ? textOpacity : 1,
                transform: [{ translateY: idx === page ? textY : 0 }],
                alignItems: "center",
                width: "100%",
              }}
            >
              <View style={styles.eyebrowPill}>
                <Text style={styles.eyebrow}>{s.eyebrow}</Text>
              </View>
              <Text style={styles.titulo}>{s.titulo}</Text>
              <Text style={styles.texto}>{s.texto}</Text>
            </Animated.View>

            <Animated.View
              style={[
                styles.phoneWrap,
                {
                  opacity: idx === page ? phoneOpacity : 1,
                  transform: [
                    { translateY: idx === page ? phoneLift : 0 },
                    { scale: idx === page ? phoneScale : 1 },
                  ],
                },
              ]}
            >
              <View style={styles.phone}>
                <View style={styles.phoneNotch} />
                <View style={styles.phoneScreen}>
                  <MockUI id={s.id} nombreProv={nombreProv} activo={idx === page} />
                </View>
                <View style={styles.phoneHome} />
              </View>
              <View style={styles.phoneGlow} />
            </Animated.View>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 18) }]}>
        <View style={styles.dots}>
          {slides.map((s, i) => (
            <View key={s.id} style={[styles.dot, i === page && styles.dotOn]} />
          ))}
        </View>

        <PulsePress
          style={styles.cta}
          onPress={() => {
            if (page < slides.length - 1) {
              scrollRef.current?.scrollTo({ x: (page + 1) * W, animated: true });
              setPage(page + 1);
            } else {
              terminar();
            }
          }}
          accessibilityLabel={page < slides.length - 1 ? "Continuar" : "Empezar a pescar"}
        >
          <LinearGradient colors={["#ffffff", "#eef7f1"]} style={styles.ctaGrad}>
            <Text style={styles.ctaTxt}>
              {page < slides.length - 1 ? "Continuar" : "Empezar a pescar"}
            </Text>
            <Text style={styles.ctaArrow}>{page < slides.length - 1 ? "→" : "🎣"}</Text>
          </LinearGradient>
        </PulsePress>
      </View>
    </View>
  );
}

/* ——— Mock UIs que imitan pantallas reales de la app ——— */

function MockUI({
  id,
  nombreProv,
  activo,
}: {
  id: SlideId;
  nombreProv: string;
  activo: boolean;
}) {
  if (id === "intima") return <MockIntima activo={activo} />;
  if (id === "pin") return <MockPin activo={activo} />;
  if (id === "legal") return <MockLegal nombreProv={nombreProv} activo={activo} />;
  if (id === "pinta") return <MockPinta activo={activo} />;
  if (id === "diario") return <MockDiario activo={activo} />;
  return <MockCampo activo={activo} />;
}

function useReveal(activo: boolean) {
  const v = useRef(new Animated.Value(activo ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(v, {
      toValue: activo ? 1 : 0,
      duration: activo ? 520 : 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: nativo,
    }).start();
  }, [activo, v]);
  return v;
}

function MockIntima({ activo }: { activo: boolean }) {
  const v = useReveal(activo);
  const y = v.interpolate({ inputRange: [0, 1], outputRange: [24, 0] });
  return (
    <LinearGradient colors={["#0f3a2a", "#1a5640"]} style={m.fill}>
      <Text style={m.navBrand}>Mis sitios</Text>
      <Text style={m.navSub}>Solo en este dispositivo</Text>
      <Animated.View style={{ opacity: v, transform: [{ translateY: y }], gap: 8, marginTop: 10 }}>
        {[
          { t: "Embalse de María Cristina", s: "Favorito · 12 km", c: "#c4921a" },
          { t: "Orilla que solo yo conozco", s: "Punto privado · GPS", c: "#5ec8e8" },
          { t: "Spinning al atardecer", s: "Nota de campo", c: "#8fd4a8" },
        ].map((row) => (
          <View key={row.t} style={m.cardDark}>
            <View style={[m.dotPin, { backgroundColor: row.c }]} />
            <View style={{ flex: 1 }}>
              <Text style={m.cardTitleLight}>{row.t}</Text>
              <Text style={m.cardSubLight}>{row.s}</Text>
            </View>
            <Text style={m.lock}>🔒</Text>
          </View>
        ))}
      </Animated.View>
      <View style={m.badgeRow}>
        <View style={m.badge}>
          <Text style={m.badgeTxt}>Sin feed público</Text>
        </View>
        <View style={[m.badge, m.badgeGhost]}>
          <Text style={m.badgeTxt}>Compartir = opción</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

function MockPin({ activo }: { activo: boolean }) {
  const v = useReveal(activo);
  const scale = v.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] });
  return (
    <LinearGradient colors={["#0c2c20", "#164a36"]} style={[m.fill, { alignItems: "center" }]}>
      <Text style={m.navBrand}>App bloqueada</Text>
      <Text style={m.navSub}>Introduce tu PIN</Text>
      <Animated.View style={{ opacity: v, transform: [{ scale }], alignItems: "center", marginTop: 18 }}>
        <View style={m.pinDots}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[m.pinDot, i < 3 && m.pinDotOn]} />
          ))}
        </View>
        <View style={m.pad}>
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((k, i) => (
            <View key={`${k}-${i}`} style={[m.key, !k && m.keyEmpty]}>
              <Text style={m.keyTxt}>{k}</Text>
            </View>
          ))}
        </View>
        <View style={m.bioPill}>
          <Text style={m.bioPillTxt}>Usar Face ID</Text>
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

function MockLegal({ nombreProv, activo }: { nombreProv: string; activo: boolean }) {
  const v = useReveal(activo);
  const y = v.interpolate({ inputRange: [0, 1], outputRange: [20, 0] });
  return (
    <View style={[m.fill, { backgroundColor: "#eef2ee" }]}>
      <View style={m.mapFake}>
        <View style={[m.mapBlob, { top: 28, left: 24, backgroundColor: "rgba(36,107,61,0.35)" }]} />
        <View style={[m.mapBlob, { top: 70, right: 30, backgroundColor: "rgba(26,111,138,0.3)" }]} />
        <View style={[m.mapBlob, { bottom: 40, left: 50, backgroundColor: "rgba(154,74,10,0.28)" }]} />
        <View style={m.mapPin}>
          <Text style={m.mapPinTxt}>📍</Text>
        </View>
        <Text style={m.mapLabel}>{nombreProv}</Text>
      </View>
      <Animated.View style={{ opacity: v, transform: [{ translateY: y }], padding: 10, gap: 8 }}>
        <View style={[m.semaforo, { backgroundColor: SEMAFORO.si }]}>
          <Text style={m.semaforoKicker}>¿Puedo?</Text>
          <Text style={m.semaforoBig}>HOY SÍ</Text>
          <Text style={m.semaforoSub}>Zona libre · con licencia</Text>
        </View>
        <View style={m.chipRow}>
          <View style={[m.chip, { backgroundColor: COLORS.warningLight }]}>
            <Text style={[m.chipTxt, { color: COLORS.warning }]}>SIN TRAMO ≠ veda</Text>
          </View>
          <View style={[m.chip, { backgroundColor: COLORS.primaryLight }]}>
            <Text style={[m.chipTxt, { color: COLORS.primary }]}>Oficial / orientativo</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

function MockPinta({ activo }: { activo: boolean }) {
  const v = useReveal(activo);
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!activo) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1400, useNativeDriver: nativo }),
        Animated.timing(pulse, { toValue: 0, duration: 1400, useNativeDriver: nativo }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [activo, pulse]);
  const ring = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  return (
    <LinearGradient colors={["#0e4456", "#1a6f8a"]} style={[m.fill, { alignItems: "center" }]}>
      <Text style={m.navBrand}>Hoy en el agua</Text>
      <Text style={m.navSub}>¿Pinta? · no autoriza</Text>
      <Animated.View style={{ opacity: v, transform: [{ scale: ring }], marginTop: 16, alignItems: "center" }}>
        <View style={m.gauge}>
          <Text style={m.gaugeNum}>78</Text>
          <Text style={m.gaugeLabel}>Buena</Text>
        </View>
      </Animated.View>
      <View style={m.meteoRow}>
        {[
          { k: "Presión", v: "↓ bajando" },
          { k: "Viento", v: "12 km/h" },
          { k: "Luna", v: "Creciente" },
        ].map((x) => (
          <View key={x.k} style={m.meteoCard}>
            <Text style={m.meteoK}>{x.k}</Text>
            <Text style={m.meteoV}>{x.v}</Text>
          </View>
        ))}
      </View>
      <View style={m.windowBar}>
        <Text style={m.windowTxt}>Mejor ventana 07:00–10:00</Text>
      </View>
    </LinearGradient>
  );
}

function MockDiario({ activo }: { activo: boolean }) {
  const v = useReveal(activo);
  const y = v.interpolate({ inputRange: [0, 1], outputRange: [22, 0] });
  return (
    <View style={[m.fill, { backgroundColor: "#f4f7f5" }]}>
      <View style={m.diarioHeader}>
        <Text style={[m.navBrand, { color: COLORS.primaryDark }]}>Capturas</Text>
        <Text style={[m.navSub, { color: COLORS.textSecondary }]}>Diario local · GPX opcional</Text>
      </View>
      <Animated.View style={{ opacity: v, transform: [{ translateY: y }], padding: 10, gap: 10 }}>
        <View style={m.catchCard}>
          <LinearGradient colors={["#1a6f8a", "#13485a"]} style={m.catchPhoto}>
            <Text style={m.catchPhotoIcon}>🐟</Text>
          </LinearGradient>
          <View style={{ flex: 1, padding: 10, justifyContent: "center" }}>
            <Text style={m.catchTitle}>Black bass</Text>
            <Text style={m.catchMeta}>42 cm · hoy · GPS</Text>
            <View style={m.cupoBar}>
              <View style={[m.cupoFill, { width: "40%" }]} />
            </View>
            <Text style={m.cupoTxt}>Cupo 2 / 5</Text>
          </View>
        </View>
        <View style={m.gpxBtn}>
          <Text style={m.gpxTxt}>Exportar GPX · esta provincia</Text>
        </View>
        <Text style={m.hintMuted}>Sin feed. Tú eliges con quién compartes.</Text>
      </Animated.View>
    </View>
  );
}

function MockCampo({ activo }: { activo: boolean }) {
  const v = useReveal(activo);
  const y = v.interpolate({ inputRange: [0, 1], outputRange: [22, 0] });
  const steps = [
    { n: "1", t: "Dónde voy", done: true },
    { n: "2", t: "¿Puedo? + ¿Pinta?", done: true },
    { n: "3", t: "Montaje de la especie", done: false },
    { n: "4", t: "Checklist de equipo", done: false },
  ];
  return (
    <LinearGradient colors={["#f7faf7", "#e4efe8"]} style={m.fill}>
      <Text style={[m.navBrand, { color: COLORS.primaryDark }]}>Salgo a pescar</Text>
      <Text style={[m.navSub, { color: COLORS.textSecondary }]}>Ritual de salida</Text>
      <Animated.View style={{ opacity: v, transform: [{ translateY: y }], marginTop: 12, gap: 8 }}>
        {steps.map((s, i) => (
          <View key={s.n} style={[m.stepRow, s.done && m.stepDone]}>
            <View style={[m.stepNum, s.done && m.stepNumDone]}>
              <Text style={[m.stepNumTxt, s.done && { color: "#fff" }]}>{s.done ? "✓" : s.n}</Text>
            </View>
            <Text style={[m.stepTxt, s.done && m.stepTxtDone]}>{s.t}</Text>
            {i === 2 ? <Text style={m.stepNow}>ahora</Text> : null}
          </View>
        ))}
      </Animated.View>
      <View style={m.montajePreview}>
        <Text style={m.montajeTitle}>Montaje · black bass</Text>
        <View style={m.montajeDots}>
          {["Caña", "Línea", "Señuelo"].map((x) => (
            <View key={x} style={m.montajeChip}>
              <Text style={m.montajeChipTxt}>{x}</Text>
            </View>
          ))}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: "hidden", backgroundColor: COLORS.primaryDark },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    borderWidth: 0,
    // soft top/bottom darken via layered views would be heavier; keep light
  },
  closeBtn: {
    position: "absolute",
    right: 16,
    zIndex: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },
  closeTxt: { color: "#fff", fontSize: 18, fontWeight: "700", marginTop: -1 },
  brand: {
    textAlign: "center",
    color: "rgba(255,255,255,0.9)",
    fontWeight: "800",
    fontFamily: FONTS.extrabold,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontSize: 12,
    zIndex: 1,
  },
  pager: { flex: 1, zIndex: 1 },
  slide: {
    paddingHorizontal: SPACING.md,
    alignItems: "center",
    paddingTop: 6,
  },
  eyebrowPill: {
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: RADIUS.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },
  eyebrow: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    fontFamily: FONTS.semibold,
    letterSpacing: 0.3,
  },
  titulo: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
    fontFamily: FONTS.extrabold,
    textAlign: "center",
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  texto: {
    color: "rgba(238,247,241,0.95)",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    fontWeight: "600",
    fontFamily: FONTS.semibold,
    maxWidth: 340,
    marginBottom: 12,
    minHeight: 40,
  },
  phoneWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  phone: {
    width: PHONE_W,
    height: PHONE_H,
    borderRadius: 40,
    backgroundColor: "#07140f",
    padding: 9,
    borderWidth: 2.5,
    borderColor: "rgba(255,255,255,0.28)",
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
    elevation: 14,
    zIndex: 2,
  },
  phoneGlow: {
    position: "absolute",
    bottom: -18,
    width: PHONE_W * 0.72,
    height: 28,
    borderRadius: 40,
    backgroundColor: "rgba(0,0,0,0.28)",
    zIndex: 1,
  },
  phoneNotch: {
    alignSelf: "center",
    width: 88,
    height: 10,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.14)",
    marginBottom: 7,
  },
  phoneScreen: {
    flex: 1,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: COLORS.mist,
  },
  phoneHome: {
    alignSelf: "center",
    width: 72,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.22)",
    marginTop: 7,
  },
  footer: {
    paddingHorizontal: 24,
    zIndex: 1,
  },
  dots: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 12 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  dotOn: { backgroundColor: "#fff", width: 24 },
  cta: {
    borderRadius: RADIUS.md,
    overflow: "hidden",
  },
  ctaGrad: {
    paddingVertical: 15,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ctaTxt: {
    color: COLORS.primaryDark,
    fontWeight: "800",
    fontFamily: FONTS.extrabold,
    fontSize: 16,
  },
  ctaArrow: { fontSize: 16 },
});

const m = StyleSheet.create({
  fill: { flex: 1, padding: 12 },
  navBrand: {
    fontFamily: FONTS.extrabold,
    fontWeight: "800",
    fontSize: 17,
    color: "#fff",
  },
  navSub: {
    fontFamily: FONTS.semibold,
    fontSize: 12,
    color: "rgba(255,255,255,0.72)",
    marginTop: 2,
  },
  cardDark: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: RADIUS.md,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    gap: 10,
  },
  dotPin: { width: 10, height: 10, borderRadius: 5 },
  cardTitleLight: { color: "#fff", fontFamily: FONTS.bold, fontWeight: "700", fontSize: 13 },
  cardSubLight: { color: "rgba(255,255,255,0.7)", fontFamily: FONTS.semibold, fontSize: 11, marginTop: 2 },
  lock: { fontSize: 12 },
  badgeRow: { flexDirection: "row", gap: 6, marginTop: 12, flexWrap: "wrap" },
  badge: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: RADIUS.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeGhost: { backgroundColor: "rgba(0,0,0,0.2)" },
  badgeTxt: { color: "#fff", fontSize: 11, fontFamily: FONTS.bold, fontWeight: "700" },
  pinDots: { flexDirection: "row", gap: 14, marginBottom: 16 },
  pinDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.55)",
  },
  pinDotOn: { backgroundColor: "#fff", borderColor: "#fff" },
  pad: {
    width: 220,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  key: {
    width: 60,
    height: 42,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  keyEmpty: { backgroundColor: "transparent", borderColor: "transparent" },
  keyTxt: { color: "#fff", fontSize: 18, fontFamily: FONTS.bold, fontWeight: "700" },
  bioPill: {
    marginTop: 14,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: RADIUS.pill,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  bioPillTxt: { color: "#fff", fontFamily: FONTS.extrabold, fontWeight: "800", fontSize: 13 },
  mapFake: {
    height: 132,
    backgroundColor: "#d5e4dc",
    overflow: "hidden",
    position: "relative",
  },
  mapBlob: {
    position: "absolute",
    width: 90,
    height: 56,
    borderRadius: 40,
  },
  mapPin: {
    position: "absolute",
    top: "42%",
    left: "46%",
  },
  mapPinTxt: { fontSize: 22 },
  mapLabel: {
    position: "absolute",
    bottom: 8,
    left: 10,
    fontFamily: FONTS.bold,
    fontWeight: "700",
    color: COLORS.primaryDark,
    fontSize: 11,
  },
  semaforo: {
    borderRadius: RADIUS.md,
    padding: 12,
  },
  semaforoKicker: { color: "rgba(255,255,255,0.85)", fontSize: 11, fontFamily: FONTS.semibold },
  semaforoBig: { color: "#fff", fontSize: 28, fontFamily: FONTS.extrabold, fontWeight: "800", marginTop: 2 },
  semaforoSub: { color: "rgba(255,255,255,0.9)", fontSize: 12, fontFamily: FONTS.semibold, marginTop: 2 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { borderRadius: RADIUS.pill, paddingHorizontal: 10, paddingVertical: 5 },
  chipTxt: { fontSize: 11, fontFamily: FONTS.bold, fontWeight: "700" },
  gauge: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 8,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  gaugeNum: { color: "#fff", fontSize: 42, fontFamily: FONTS.extrabold, fontWeight: "800" },
  gaugeLabel: { color: "rgba(255,255,255,0.85)", fontFamily: FONTS.bold, fontWeight: "700", fontSize: 14 },
  meteoRow: { flexDirection: "row", gap: 6, marginTop: 16, paddingHorizontal: 4 },
  meteoCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: RADIUS.sm,
    padding: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  meteoK: { color: "rgba(255,255,255,0.7)", fontSize: 10, fontFamily: FONTS.semibold },
  meteoV: { color: "#fff", fontSize: 12, fontFamily: FONTS.bold, fontWeight: "700", marginTop: 2 },
  windowBar: {
    marginTop: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: RADIUS.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  windowTxt: { color: "#fff", fontFamily: FONTS.bold, fontWeight: "700", fontSize: 12 },
  diarioHeader: { paddingHorizontal: 12, paddingTop: 10 },
  catchCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: RADIUS.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  catchPhoto: { width: 86, alignItems: "center", justifyContent: "center" },
  catchPhotoIcon: { fontSize: 34 },
  catchTitle: { fontFamily: FONTS.extrabold, fontWeight: "800", fontSize: 15, color: COLORS.primaryDark },
  catchMeta: { fontFamily: FONTS.semibold, fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  cupoBar: {
    height: 6,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 3,
    marginTop: 8,
    overflow: "hidden",
  },
  cupoFill: { height: 6, backgroundColor: COLORS.water, borderRadius: 3 },
  cupoTxt: { fontSize: 11, color: COLORS.textMuted, fontFamily: FONTS.semibold, marginTop: 4 },
  gpxBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 11,
    alignItems: "center",
  },
  gpxTxt: { color: "#fff", fontFamily: FONTS.extrabold, fontWeight: "800", fontSize: 13 },
  hintMuted: {
    textAlign: "center",
    color: COLORS.textMuted,
    fontSize: 11,
    fontFamily: FONTS.semibold,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: RADIUS.md,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  stepDone: { backgroundColor: COLORS.primaryLight, borderColor: "#c5d9cc" },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.mist,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stepNumDone: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  stepNumTxt: { fontFamily: FONTS.bold, fontWeight: "700", color: COLORS.primaryDark, fontSize: 12 },
  stepTxt: { flex: 1, fontFamily: FONTS.semibold, fontSize: 13, color: COLORS.textPrimary },
  stepTxtDone: { color: COLORS.primaryDark },
  stepNow: {
    fontSize: 10,
    fontFamily: FONTS.extrabold,
    fontWeight: "800",
    color: COLORS.water,
    textTransform: "uppercase",
  },
  montajePreview: {
    marginTop: 12,
    backgroundColor: "#fff",
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  montajeTitle: {
    fontFamily: FONTS.bold,
    fontWeight: "700",
    color: COLORS.primaryDark,
    fontSize: 13,
    marginBottom: 8,
  },
  montajeDots: { flexDirection: "row", gap: 6 },
  montajeChip: {
    backgroundColor: COLORS.waterLight,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  montajeChipTxt: { color: COLORS.waterDark, fontFamily: FONTS.bold, fontWeight: "700", fontSize: 11 },
});
