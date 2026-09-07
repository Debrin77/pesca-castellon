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
import { COLORS, FONTS, RADIUS, SEMAFORO, SPACING } from "../theme";
import OndaAgua from "../components/OndaAgua";
import PulsePress from "../components/PulsePress";
import MapaIgnPresentacion from "../components/MapaIgnPresentacion";

const { width: W, height: H } = Dimensions.get("window");
/** Marco tipo captura App Store: domina el alto de la pantalla. */
const PHONE_W = Math.min(W * 0.88, 372);
const PHONE_H = Math.min(H * 0.58, 580);
const nativo = Platform.OS !== "web";

type SlideId = "intima" | "pin" | "legal" | "pinta" | "diario" | "campo";

type Slide = {
  id: SlideId;
  eyebrow: string;
  titulo: string;
  texto: string;
  accent: readonly [string, string, string];
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
        id: "legal",
        eyebrow: "Antes de lanzar la caña",
        titulo: "¿Puedo aquí?",
        texto: provincia.continentalOnly
          ? `Semáforo claro: verde sí, rojo no. Si sale «SIN TRAMO», no es veda: mira el cartel en tu primera salida en ${nombreProv}.`
          : provincia.tieneIcv
            ? "Verde: hoy sí. Rojo: veda. Ámbar: coto. Gris «SIN TRAMO»: no es veda — confirma el cartel."
            : `Verde, rojo o ámbar. En ${nombreProv} es orientativo: confirma siempre en la fuente oficial.`,
        accent: ["#176a7c", "#114e5c", "#0b3540"],
        tonoOnda: "agua",
      },
      {
        id: "pinta",
        eyebrow: "La norma autoriza · el tiempo orienta",
        titulo: "Hoy pinta",
        texto: "Índice 0–100 con clima, presión y luna. «¿Pinta?» no autoriza: solo ayuda a elegir hora.",
        accent: ["#1f6f88", "#155566", "#0d3c48"],
        tonoOnda: "agua",
      },
      {
        id: "intima",
        eyebrow: "Sin feed · sin nube obligatoria",
        titulo: "Personal e íntima",
        texto: "Sitios y notas en tu móvil. Compartir es opcional — nunca el motivo.",
        accent: ["#1c5c42", "#12382c", "#0a2218"],
        tonoOnda: "claro",
      },
      {
        id: "pin",
        eyebrow: "Cerrada para los demás",
        titulo: "PIN + biometría",
        texto: "PIN de 4–8 dígitos y Face ID / huella. Al abrir o al volver, solo tú entras.",
        accent: ["#142e24", "#0d1f18", "#07140f"],
        tonoOnda: "claro",
      },
      {
        id: "diario",
        eyebrow: "Memoria de campo",
        titulo: "Tu diario local",
        texto: "Foto, especie, GPS y cupo. Exporta GPX a Maps, a un amigo… o a nadie.",
        accent: ["#18523c", "#12382c", "#0c241c"],
        tonoOnda: "claro",
      },
      {
        id: "campo",
        eyebrow: "De la duda a la orilla",
        titulo: "Salgo en 5 pasos",
        texto: "Ritual corto para tu primera salida: sitio → norma → clima → montaje → qué llevar.",
        accent: ["#24382e", "#17261f", "#0e1713"],
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
          duration: 3400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: nativo,
        }),
        Animated.timing(floatY, {
          toValue: 0,
          duration: 3400,
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
      tension: 68,
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
  const phoneLift = floatY.interpolate({ inputRange: [0, 1], outputRange: [0, -12] });
  const phoneScale = enter.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] });
  const phoneOpacity = enter.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  const textOpacity = enter.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const textY = enter.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });

  return (
    <View style={styles.root}>
      <LinearGradient colors={[...slide.accent]} style={StyleSheet.absoluteFill} />
      <OndaAgua intensidad={0.65} tono={slide.tonoOnda} />
      <LinearGradient
        colors={["rgba(0,0,0,0.28)", "transparent", "rgba(0,0,0,0.35)"]}
        locations={[0, 0.35, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <TouchableOpacity
        style={[styles.closeBtn, { top: topPad + 4 }]}
        onPress={terminar}
        accessibilityLabel="Cerrar presentación"
        accessibilityRole="button"
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={styles.closeTxt}>✕</Text>
      </TouchableOpacity>

      <Animated.Text style={[styles.brand, { marginTop: topPad + 36, opacity: textOpacity }]}>
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
                paddingHorizontal: 8,
              }}
            >
              <Text style={styles.eyebrow}>{s.eyebrow}</Text>
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

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.dots}>
          {slides.map((s, i) => (
            <View key={s.id} style={[styles.dot, i === page && styles.dotOn]} />
          ))}
        </View>

        {page === slides.length - 1 ? (
          <Text style={styles.tipCierre}>Siguiente: prueba «Salgo a pescar»</Text>
        ) : null}

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
          <LinearGradient colors={["#ffffff", "#eef6f1"]} style={styles.ctaGrad}>
            <Text style={styles.ctaTxt}>
              {page < slides.length - 1 ? "Continuar" : "Empezar a pescar"}
            </Text>
            <Text style={styles.ctaArrow}>{page < slides.length - 1 ? "→" : "·"}</Text>
          </LinearGradient>
        </PulsePress>
      </View>
    </View>
  );
}

/* ——— Mock UIs ——— */

function MockUI({
  id,
  nombreProv,
  activo,
}: {
  id: SlideId;
  nombreProv: string;
  activo: boolean;
}) {
  if (id === "intima") return <MockIntima nombreProv={nombreProv} activo={activo} />;
  if (id === "pin") return <MockPin activo={activo} />;
  if (id === "legal") return <MockLegal nombreProv={nombreProv} activo={activo} />;
  if (id === "pinta") return <MockPinta nombreProv={nombreProv} activo={activo} />;
  if (id === "diario") return <MockDiario activo={activo} />;
  return <MockCampo activo={activo} />;
}

function useReveal(activo: boolean) {
  const v = useRef(new Animated.Value(activo ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(v, {
      toValue: activo ? 1 : 0,
      duration: activo ? 560 : 160,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: nativo,
    }).start();
  }, [activo, v]);
  return v;
}

function MockIntima({ nombreProv, activo }: { nombreProv: string; activo: boolean }) {
  const v = useReveal(activo);
  const y = v.interpolate({ inputRange: [0, 1], outputRange: [18, 0] });
  return (
    <View style={[m.fill, { backgroundColor: "#f3f6f2" }]}>
      <View style={m.privBar}>
        <Text style={m.privBarTxt}>Solo en este móvil · Sin feed · Sin nube</Text>
      </View>
      <MapaIgnPresentacion
        titulo={`Mis sitios · ${nombreProv}`}
        subtitulo="Privados · sin feed"
        animar={activo}
        compacto
        marcadores={[
          { x: 28, y: 38, color: COLORS.gold, etiqueta: "María Cristina", tipo: "privado" },
          { x: 58, y: 52, color: COLORS.water, etiqueta: "Orilla secreta", tipo: "privado" },
          { x: 72, y: 28, color: COLORS.success, etiqueta: "Atardecer", tipo: "libre" },
        ]}
      />
      <Animated.View style={{ opacity: v, transform: [{ translateY: y }], padding: 10, gap: 7 }}>
        {[
          { t: "Embalse de María Cristina", s: "Favorito · 12 km", c: COLORS.gold },
          { t: "Orilla que solo yo conozco", s: "Punto privado · GPS", c: COLORS.water },
        ].map((row) => (
          <View key={row.t} style={m.listRow}>
            <View style={[m.listDot, { backgroundColor: row.c }]} />
            <View style={{ flex: 1 }}>
              <Text style={m.listTitle}>{row.t}</Text>
              <Text style={m.listSub}>{row.s}</Text>
            </View>
            <View style={m.lockPill}>
              <Text style={m.lockPillTxt}>privado</Text>
            </View>
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

function MockPin({ activo }: { activo: boolean }) {
  const v = useReveal(activo);
  const scale = v.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] });
  return (
    <LinearGradient colors={["#0c2c20", "#164a36"]} style={[m.fill, { alignItems: "center" }]}>
      <Text style={m.navDisplay}>App bloqueada</Text>
      <Text style={m.navSub}>Introduce tu PIN</Text>
      <Animated.View style={{ opacity: v, transform: [{ scale }], alignItems: "center", marginTop: 16 }}>
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
          <Text style={m.bioPillTxt}>Usar Face ID / huella</Text>
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

function MockLegal({ nombreProv, activo }: { nombreProv: string; activo: boolean }) {
  const v = useReveal(activo);
  const y = v.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });
  return (
    <View style={[m.fill, { backgroundColor: "#eef2ee" }]}>
      <MapaIgnPresentacion
        titulo={`Consulta · ${nombreProv}`}
        subtitulo="Mapa tipo IGN · indicadores"
        animar={activo}
        compacto
        marcadores={[
          { x: 42, y: 48, color: SEMAFORO.si, etiqueta: "Libre", tipo: "libre" },
          { x: 68, y: 34, color: SEMAFORO.coto, etiqueta: "Coto", tipo: "coto" },
          { x: 30, y: 62, color: SEMAFORO.neutro, etiqueta: "Sin tramo", tipo: "neutro" },
        ]}
      />
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
            <Text style={[m.chipTxt, { color: COLORS.primary }]}>Mira el cartel</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

function MockPinta({ activo, nombreProv }: { activo: boolean; nombreProv?: string }) {
  const v = useReveal(activo);
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!activo) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1500, useNativeDriver: nativo }),
        Animated.timing(pulse, { toValue: 0, duration: 1500, useNativeDriver: nativo }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [activo, pulse]);
  const ring = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] });
  return (
    <LinearGradient colors={["#0e4456", "#1a6f8a"]} style={[m.fill, { alignItems: "center" }]}>
      <Text style={m.navDisplay}>Hoy en el agua</Text>
      <Text style={m.navSub}>
        {nombreProv ? `${nombreProv} · ¿Pinta? · no autoriza` : "¿Pinta? · no autoriza"}
      </Text>
      <Animated.View style={{ opacity: v, transform: [{ scale: ring }], marginTop: 14, alignItems: "center" }}>
        <View style={m.gaugeOuter}>
          <View style={m.gauge}>
            <Text style={m.gaugeNum}>78</Text>
            <Text style={m.gaugeLabel}>Buena</Text>
          </View>
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
      <Text style={m.pintaDisclaimer}>La norma manda · esto solo orienta</Text>
    </LinearGradient>
  );
}

function MockDiario({ activo }: { activo: boolean }) {
  const v = useReveal(activo);
  const y = v.interpolate({ inputRange: [0, 1], outputRange: [18, 0] });
  return (
    <View style={[m.fill, { backgroundColor: "#f4f7f5" }]}>
      <View style={m.diarioHeader}>
        <Text style={[m.navDisplay, { color: COLORS.primaryDark }]}>Capturas</Text>
        <Text style={[m.navSub, { color: COLORS.textSecondary }]}>Diario local · GPX opcional</Text>
      </View>
      <Animated.View style={{ opacity: v, transform: [{ translateY: y }], padding: 10, gap: 10 }}>
        <View style={m.catchCard}>
          <LinearGradient colors={["#1a6f8a", "#0e4456"]} style={m.catchPhoto}>
            <View style={m.catchPhotoInner}>
              <Text style={m.catchPhotoLabel}>foto</Text>
              <Text style={m.catchPhotoSpecies}>Black bass</Text>
            </View>
          </LinearGradient>
          <View style={{ flex: 1, padding: 11, justifyContent: "center" }}>
            <Text style={m.catchTitle}>Black bass</Text>
            <Text style={m.catchMeta}>42 cm · hoy · GPS fijado</Text>
            <View style={m.cupoBar}>
              <View style={[m.cupoFill, { width: "40%" }]} />
            </View>
            <Text style={m.cupoTxt}>Cupo 2 / 5 ud</Text>
          </View>
        </View>
        <View style={m.gpxBtn}>
          <Text style={m.gpxTxt}>Exportar GPX · esta provincia</Text>
        </View>
        <Text style={m.hintMuted}>Sin feed público. Tú eliges con quién compartes.</Text>
      </Animated.View>
    </View>
  );
}

function MockCampo({ activo }: { activo: boolean }) {
  const v = useReveal(activo);
  const y = v.interpolate({ inputRange: [0, 1], outputRange: [18, 0] });
  const steps = [
    { n: "1", t: "Dónde voy", done: true },
    { n: "2", t: "¿Puedo? + ¿Pinta?", done: true },
    { n: "3", t: "Montaje de la especie", done: false },
    { n: "4", t: "Equipo a llevar", done: false },
  ];
  return (
    <LinearGradient colors={["#f7faf7", "#e6efe8"]} style={m.fill}>
      <Text style={[m.navDisplay, { color: COLORS.primaryDark }]}>Salgo a pescar</Text>
      <Text style={[m.navSub, { color: COLORS.textSecondary }]}>Tu primera salida · paso a paso</Text>
      <Animated.View style={{ opacity: v, transform: [{ translateY: y }], marginTop: 12, gap: 7 }}>
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
  closeBtn: {
    position: "absolute",
    right: 16,
    zIndex: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.38)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.42)",
  },
  closeTxt: { color: "#fff", fontSize: 17, fontWeight: "700", marginTop: -1 },
  brand: {
    textAlign: "center",
    color: "#fff",
    fontFamily: FONTS.display,
    letterSpacing: -0.4,
    fontSize: 22,
    lineHeight: 26,
    zIndex: 1,
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  pager: { flex: 1, zIndex: 1 },
  slide: {
    paddingHorizontal: SPACING.sm,
    alignItems: "center",
    paddingTop: 2,
  },
  eyebrow: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontFamily: FONTS.displayItalic,
    fontStyle: "italic",
    letterSpacing: 0.15,
    marginBottom: 2,
    textAlign: "center",
  },
  titulo: {
    color: "#fff",
    fontSize: 32,
    fontFamily: FONTS.display,
    textAlign: "center",
    letterSpacing: -0.6,
    marginBottom: 6,
    lineHeight: 36,
    textShadowColor: "rgba(0,0,0,0.25)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  texto: {
    color: "rgba(245,250,247,0.96)",
    fontSize: 15.5,
    lineHeight: 22,
    textAlign: "center",
    fontFamily: FONTS.regular,
    maxWidth: 348,
    marginBottom: 10,
    minHeight: 44,
    paddingHorizontal: 4,
  },
  phoneWrap: { alignItems: "center", justifyContent: "center" },
  phone: {
    width: PHONE_W,
    height: PHONE_H,
    borderRadius: 42,
    backgroundColor: "#050d0a",
    padding: 9,
    borderWidth: 2.5,
    borderColor: "rgba(255,255,255,0.3)",
    shadowColor: "#000",
    shadowOpacity: 0.48,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 18 },
    elevation: 16,
    zIndex: 2,
  },
  phoneGlow: {
    position: "absolute",
    bottom: -20,
    width: PHONE_W * 0.7,
    height: 30,
    borderRadius: 40,
    backgroundColor: "rgba(0,0,0,0.3)",
    zIndex: 1,
  },
  phoneNotch: {
    alignSelf: "center",
    width: 92,
    height: 10,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.14)",
    marginBottom: 7,
  },
  phoneScreen: {
    flex: 1,
    borderRadius: 30,
    overflow: "hidden",
    backgroundColor: COLORS.mist,
  },
  phoneHome: {
    alignSelf: "center",
    width: 74,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.22)",
    marginTop: 7,
  },
  footer: { paddingHorizontal: 24, zIndex: 1 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 12 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.32)",
  },
  dotOn: { backgroundColor: "#fff", width: 26 },
  cta: { borderRadius: RADIUS.md, overflow: "hidden" },
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
    fontFamily: FONTS.extrabold,
    fontWeight: "800",
    fontSize: 16,
  },
  ctaArrow: { fontSize: 16, color: COLORS.primaryDark, fontFamily: FONTS.extrabold },
  tipCierre: {
    textAlign: "center",
    color: "rgba(255,255,255,0.82)",
    fontFamily: FONTS.semibold,
    fontSize: 13,
    marginBottom: 10,
    letterSpacing: 0.1,
  },
});

const m = StyleSheet.create({
  fill: { flex: 1 },
  privBar: {
    backgroundColor: COLORS.primaryDark,
    paddingVertical: 7,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  privBarTxt: {
    color: "rgba(255,255,255,0.92)",
    fontFamily: FONTS.bold,
    fontWeight: "700",
    fontSize: 11,
    letterSpacing: 0.2,
  },
  navDisplay: {
    fontFamily: FONTS.display,
    fontSize: 20,
    color: "#fff",
    letterSpacing: -0.3,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  navSub: {
    fontFamily: FONTS.semibold,
    fontSize: 12,
    color: "rgba(255,255,255,0.72)",
    marginTop: 2,
    paddingHorizontal: 12,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: RADIUS.md,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  listDot: { width: 10, height: 10, borderRadius: 5 },
  listTitle: {
    fontFamily: FONTS.bold,
    fontWeight: "700",
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  listSub: {
    fontFamily: FONTS.semibold,
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  lockPill: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  lockPillTxt: {
    fontSize: 10,
    fontFamily: FONTS.extrabold,
    fontWeight: "800",
    color: COLORS.primaryDark,
    textTransform: "uppercase",
  },
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
    width: 228,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  key: {
    width: 62,
    height: 44,
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
    paddingVertical: 9,
  },
  bioPillTxt: { color: "#fff", fontFamily: FONTS.extrabold, fontWeight: "800", fontSize: 13 },
  semaforo: { borderRadius: RADIUS.md, padding: 12 },
  semaforoKicker: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
    fontFamily: FONTS.semibold,
  },
  semaforoBig: {
    color: "#fff",
    fontSize: 30,
    fontFamily: FONTS.display,
    marginTop: 2,
    letterSpacing: -0.5,
  },
  semaforoSub: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 12,
    fontFamily: FONTS.semibold,
    marginTop: 2,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { borderRadius: RADIUS.pill, paddingHorizontal: 10, paddingVertical: 5 },
  chipTxt: { fontSize: 11, fontFamily: FONTS.bold, fontWeight: "700" },
  gaugeOuter: {
    padding: 6,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  gauge: {
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 8,
    borderColor: "rgba(255,255,255,0.38)",
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  gaugeNum: {
    color: "#fff",
    fontSize: 46,
    fontFamily: FONTS.display,
    letterSpacing: -1,
  },
  gaugeLabel: {
    color: "rgba(255,255,255,0.88)",
    fontFamily: FONTS.bold,
    fontWeight: "700",
    fontSize: 14,
  },
  meteoRow: { flexDirection: "row", gap: 6, marginTop: 16, paddingHorizontal: 10 },
  meteoCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: RADIUS.sm,
    padding: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  meteoK: { color: "rgba(255,255,255,0.7)", fontSize: 10, fontFamily: FONTS.semibold },
  meteoV: {
    color: "#fff",
    fontSize: 12,
    fontFamily: FONTS.bold,
    fontWeight: "700",
    marginTop: 2,
  },
  windowBar: {
    marginTop: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: RADIUS.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  windowTxt: { color: "#fff", fontFamily: FONTS.bold, fontWeight: "700", fontSize: 12 },
  pintaDisclaimer: {
    marginTop: 10,
    color: "rgba(255,255,255,0.7)",
    fontFamily: FONTS.semibold,
    fontSize: 11,
    textAlign: "center",
    paddingHorizontal: 16,
  },
  diarioHeader: { paddingHorizontal: 12, paddingTop: 10 },
  catchCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: RADIUS.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  catchPhoto: { width: 92, alignItems: "center", justifyContent: "center" },
  catchPhotoInner: { alignItems: "center", gap: 4 },
  catchPhotoLabel: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 10,
    fontFamily: FONTS.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  catchPhotoSpecies: {
    color: "#fff",
    fontFamily: FONTS.display,
    fontSize: 14,
  },
  catchTitle: {
    fontFamily: FONTS.display,
    fontSize: 17,
    color: COLORS.primaryDark,
    letterSpacing: -0.3,
  },
  catchMeta: {
    fontFamily: FONTS.semibold,
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
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
    paddingVertical: 12,
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
    marginHorizontal: 10,
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
  stepNumTxt: {
    fontFamily: FONTS.bold,
    fontWeight: "700",
    color: COLORS.primaryDark,
    fontSize: 12,
  },
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
    marginHorizontal: 10,
    backgroundColor: "#fff",
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  montajeTitle: {
    fontFamily: FONTS.displaySemi,
    color: COLORS.primaryDark,
    fontSize: 14,
    marginBottom: 8,
  },
  montajeDots: { flexDirection: "row", gap: 6 },
  montajeChip: {
    backgroundColor: COLORS.waterLight,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  montajeChipTxt: {
    color: COLORS.waterDark,
    fontFamily: FONTS.bold,
    fontWeight: "700",
    fontSize: 11,
  },
});
