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
  ImageSourcePropType,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { marcarPresentacionVirtudesVista } from "../services/offlineService";
import { useProvincia } from "../context/ProvinciaContext";
import { getProvinciaActiva } from "../provincias/runtime";
import { COLORS, FONTS, RADIUS, SEMAFORO, SPACING, TYPE } from "../theme";
import OndaAgua from "../components/OndaAgua";
import PulsePress from "../components/PulsePress";
import MapaIgnPresentacion from "../components/MapaIgnPresentacion";
import LogoMarca from "../components/LogoMarca";
import FondoCinePresentacion from "../components/FondoCinePresentacion";
import SelectorModoPesca from "../components/SelectorModoPesca";
import { useModoPesca } from "../context/ModoPescaContext";

const win = Dimensions.get("window");
/** En web forzamos ancho tipo teléfono para no ver 2 slides a la vez. */
const STAGE_W = Platform.OS === "web" ? Math.min(win.width, 420) : win.width;
const W = STAGE_W;
const H = win.height;
/** Marco tipo captura App Store: domina el alto de la pantalla. */
const PHONE_W = Math.min(W * 0.88, 372);
const PHONE_H = Math.min(H * 0.56, 580);
const nativo = Platform.OS !== "web";

/** Atmósferas de orilla / paisaje (no macros de pez). */
const FOTO_ORILLA = require("../../assets/consejos/aparejos/surfcasting-orilla.jpg") as ImageSourcePropType;
const FOTO_ROCA = require("../../assets/consejos/aparejos/rockfishing-roca.jpg") as ImageSourcePropType;

type SlideId = "legal" | "pinta" | "sitios" | "campo";

type Slide = {
  id: SlideId;
  eyebrow: string;
  titulo: string;
  texto: string;
  accent: readonly [string, string, string];
  tonoOnda: "claro" | "agua";
  foto: ImageSourcePropType;
};

/**
 * Presentación estilo App Store: 4 virtudes a pantalla completa
 * con capturas de producto (no brochure genérico).
 * Se puede cerrar con la X (arriba derecha).
 */
export default function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const { provincia: provinciaCtx } = useProvincia();
  const { modo, modoElegido, disponibles, setModo } = useModoPesca();
  const provincia = provinciaCtx ?? getProvinciaActiva();
  const nombreProv = provincia.nombre;
  const esCosta = !provincia.continentalOnly;
  const [page, setPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const enter = useRef(new Animated.Value(1)).current;
  const floatY = useRef(new Animated.Value(0)).current;

  const slides: Slide[] = useMemo(
    () => [
      {
        id: "legal",
        eyebrow: "Antes de lanzar a la orilla",
        titulo: "¿Puedo aquí?",
        texto: provincia.continentalOnly
          ? `En el agua, el semáforo habla claro. Si sale «SIN TRAMO», no es veda: mira el cartel en tu primera salida en ${nombreProv}.`
          : "Verde hoy sí · rojo veda · ámbar coto junto al agua. «SIN TRAMO» no es veda — confirma el cartel.",
        accent: ["#0f5c6e", "#0a3d48", "#062830"],
        tonoOnda: "agua",
        foto: FOTO_ORILLA,
      },
      {
        id: "pinta",
        eyebrow: "El río autoriza · el tiempo susurra",
        titulo: "Hoy pinta",
        texto: "Aire, agua, Solunar y franjas de luz en un índice 0–100. Orientativo: nunca sustituye al semáforo.",
        accent: ["#156a82", "#0e4a5c", "#083240"],
        tonoOnda: "agua",
        foto: FOTO_ROCA,
      },
      {
        id: "sitios",
        eyebrow: "Personal e íntima · PIN + biometría",
        titulo: "Mis sitios",
        texto: "Long-press en la orilla: color e icono. Solo en este móvil — exporta GPX cuando tú quieras.",
        accent: ["#16523a", "#0f3528", "#081c16"],
        tonoOnda: "claro",
        foto: FOTO_ORILLA,
      },
      {
        id: "campo",
        eyebrow: esCosta ? "Río · Embalse · Kayak · Mar" : "Río · Embalse · Kayak",
        titulo: "Salgo a pescar",
        texto: "Ritual corto junto al agua: sitio → ¿Puedo? → ¿Pinta? → montaje. Tu primera salida, paso a paso.",
        accent: ["#1c3830", "#122620", "#0a1612"],
        tonoOnda: "claro",
        foto: FOTO_ROCA,
      },
    ],
    [provincia.continentalOnly, nombreProv, esCosta]
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
  const phoneLift = floatY.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
  const phoneScale = enter.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] });
  const phoneOpacity = enter.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] });
  const textOpacity = enter.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const textY = enter.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });
  const esUltima = page === slides.length - 1;

  return (
    <View style={styles.rootOuter}>
      <View style={[styles.root, Platform.OS === "web" && { width: STAGE_W, alignSelf: "center" }]}>
      <FondoCinePresentacion foto={slide.foto} accent={slide.accent} velo={0.14} />
      <OndaAgua intensidad={0.35} tono={slide.tonoOnda} />

      <TouchableOpacity
        style={[styles.closeBtn, { top: topPad + 4 }]}
        onPress={terminar}
        accessibilityLabel="Cerrar presentación"
        accessibilityRole="button"
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={styles.closeTxt}>✕</Text>
      </TouchableOpacity>

      <Animated.View style={[styles.brandBlock, { marginTop: topPad + 14, opacity: textOpacity }]}>
        <LogoMarca size={84} hiRes accessibilityLabel="Logo Vámonos de pesca" />
        <Text style={styles.provinciasLine}>Castellón · Sevilla · Córdoba · Cuenca</Text>
      </Animated.View>

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
                paddingHorizontal: 14,
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
                  <MockUI
                    id={s.id}
                    nombreProv={nombreProv}
                    esCosta={esCosta}
                    activo={idx === page}
                  />
                </View>
                <View style={styles.phoneHome} />
              </View>
              <View style={styles.phoneGlow} />
            </Animated.View>
          </View>
        ))}
      </ScrollView>

      {esUltima ? (
        <View style={styles.modoBlock}>
          <Text style={styles.modoLabel}>¿Cómo vas a pescar?</Text>
          <SelectorModoPesca
            modo={modoElegido ? modo : null}
            disponibles={disponibles}
            onChange={(m) => void setModo(m)}
            sobreOscuro
          />
        </View>
      ) : null}

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {!esUltima ? (
          <Text style={styles.hintSwipe}>Desliza para ver las virtudes →</Text>
        ) : (
          <Text style={styles.tipCierre}>
            {modoElegido ? "Siguiente: el mapa con tu modalidad" : "Elige modalidad o entra y decide luego"}
          </Text>
        )}

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${((page + 1) / slides.length) * 100}%` as `${number}%` },
            ]}
          />
        </View>

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
          <LinearGradient colors={["#ffffff", "#e8f4ef"]} style={styles.ctaGrad}>
            <Text style={styles.ctaTxt}>
              {page < slides.length - 1 ? "Continuar" : "Empezar a pescar"}
            </Text>
            <Text style={styles.ctaArrow}>{page < slides.length - 1 ? "→" : "·"}</Text>
          </LinearGradient>
        </PulsePress>
      </View>
      </View>
    </View>
  );
}

/* ——— Mock UIs (aspecto de producto real) ——— */

function MockUI({
  id,
  nombreProv,
  esCosta,
  activo,
}: {
  id: SlideId;
  nombreProv: string;
  esCosta: boolean;
  activo: boolean;
}) {
  if (id === "legal") return <MockLegal nombreProv={nombreProv} activo={activo} />;
  if (id === "pinta") return <MockPinta nombreProv={nombreProv} activo={activo} />;
  if (id === "sitios") return <MockSitios nombreProv={nombreProv} activo={activo} />;
  return <MockCampo activo={activo} esCosta={esCosta} />;
}

function useReveal(activo: boolean) {
  const v = useRef(new Animated.Value(activo ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(v, {
      toValue: activo ? 1 : 0,
      duration: activo ? 520 : 140,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: nativo,
    }).start();
  }, [activo, v]);
  return v;
}

function MockLegal({ nombreProv, activo }: { nombreProv: string; activo: boolean }) {
  const v = useReveal(activo);
  const y = v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });
  return (
    <View style={[m.fill, { backgroundColor: "#eef2ee" }]}>
      <MapaIgnPresentacion
        titulo={`Consulta · ${nombreProv}`}
        subtitulo="Toca el mapa · semáforo"
        animar={activo}
        compacto
        marcadores={[
          { x: 42, y: 48, color: SEMAFORO.si, etiqueta: "Libre", tipo: "libre" },
          { x: 68, y: 34, color: SEMAFORO.coto, etiqueta: "Coto", tipo: "coto" },
          { x: 30, y: 62, color: SEMAFORO.neutro, etiqueta: "Sin tramo", tipo: "neutro" },
        ]}
      />
      <Animated.View style={{ opacity: v, transform: [{ translateY: y }], padding: 12, gap: 8 }}>
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

function MockPinta({ activo, nombreProv }: { activo: boolean; nombreProv: string }) {
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
  const ring = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] });

  const barras = [42, 58, 71, 88, 76, 64, 55, 68, 82, 74, 60, 48];

  return (
    <LinearGradient colors={["#0e4456", "#1a6f8a"]} style={[m.fill, { paddingHorizontal: 12 }]}>
      <Text style={m.navDisplay}>Hoy en el agua</Text>
      <Text style={m.navSub}>{nombreProv} · ¿Pinta? · no autoriza</Text>
      <Animated.View style={{ opacity: v, transform: [{ scale: ring }], marginTop: 8, alignItems: "center" }}>
        <View style={m.gaugeOuter}>
          <View style={m.gauge}>
            <Text style={m.gaugeNum}>78</Text>
            <Text style={m.gaugeLabel}>Buena</Text>
          </View>
        </View>
      </Animated.View>
      <View style={m.chartRow}>
        {barras.map((h, i) => (
          <View key={i} style={m.chartCol}>
            <View style={[m.chartBar, { height: 8 + h * 0.55, opacity: i === 3 ? 1 : 0.55 }]} />
          </View>
        ))}
      </View>
      <Text style={m.chartHint}>Arrastra la franja · mayor 07:00–10:00</Text>
      <View style={m.meteoRow}>
        {[
          { k: "Aire", v: "18 °C" },
          { k: "Agua", v: "16 °C" },
          { k: "Solunar", v: "Mayor" },
        ].map((x) => (
          <View key={x.k} style={m.meteoCard}>
            <Text style={m.meteoK}>{x.k}</Text>
            <Text style={m.meteoV}>{x.v}</Text>
          </View>
        ))}
      </View>
    </LinearGradient>
  );
}

function MockSitios({ nombreProv, activo }: { nombreProv: string; activo: boolean }) {
  const v = useReveal(activo);
  const y = v.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });
  const sitios =
    nombreProv === "Castellón"
      ? [
          { t: "Embalse de María Cristina", s: "★ Oro · favorito", c: COLORS.gold },
          { t: "Orilla que solo yo conozco", s: "≈ Agua · privado", c: COLORS.water },
        ]
      : [
          { t: `Embalse favorito · ${nombreProv}`, s: "★ Oro · en este móvil", c: COLORS.gold },
          { t: "Punto privado · GPS", s: "● Bosque · PIN", c: COLORS.primary },
        ];
  return (
    <View style={[m.fill, { backgroundColor: "#f3f6f2" }]}>
      <View style={m.privBar}>
        <Text style={m.privBarTxt}>Solo en este móvil · PIN + biometría</Text>
      </View>
      <MapaIgnPresentacion
        titulo={`Mis sitios · ${nombreProv}`}
        subtitulo="Long-press · color · icono"
        animar={activo}
        compacto
        marcadores={[
          { x: 28, y: 38, color: sitios[0].c, etiqueta: "Favorito", tipo: "privado" },
          { x: 58, y: 52, color: sitios[1].c, etiqueta: "Privado", tipo: "privado" },
          { x: 72, y: 28, color: COLORS.success, etiqueta: "Libre", tipo: "libre" },
        ]}
      />
      <Animated.View style={{ opacity: v, transform: [{ translateY: y }], padding: 10, gap: 7 }}>
        {sitios.map((row) => (
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
        <View style={m.gpxMini}>
          <Text style={m.gpxMiniTxt}>Exportar GPX · cuando tú quieras</Text>
        </View>
      </Animated.View>
    </View>
  );
}

function MockCampo({ activo, esCosta }: { activo: boolean; esCosta: boolean }) {
  const v = useReveal(activo);
  const y = v.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });
  const steps = [
    { n: "1", t: "Dónde voy", done: true },
    { n: "2", t: "¿Puedo? + ¿Pinta?", done: true },
    { n: "3", t: "Montaje de la especie", done: false },
    { n: "4", t: "Equipo a llevar", done: false },
  ];
  const modos = esCosta
    ? ["Río", "Embalse", "Kayak", "Mar"]
    : ["Río", "Embalse", "Kayak"];
  return (
    <LinearGradient colors={["#f7faf7", "#e6efe8"]} style={m.fill}>
      <Text style={[m.navDisplay, { color: COLORS.primaryDark }]}>Salgo a pescar</Text>
      <Text style={[m.navSub, { color: COLORS.textSecondary }]}>
        Tu primera salida · paso a paso
      </Text>
      <Animated.View style={{ opacity: v, transform: [{ translateY: y }], marginTop: 10, gap: 8 }}>
        <View style={m.modoRow}>
          {modos.map((x, i) => (
            <View key={x} style={[m.modoChip, i === 2 && m.modoChipOn]}>
              <Text style={[m.modoChipTxt, i === 2 && m.modoChipTxtOn]}>{x}</Text>
            </View>
          ))}
        </View>
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  rootOuter: { flex: 1, backgroundColor: COLORS.primaryDark },
  root: { flex: 1, overflow: "hidden", backgroundColor: COLORS.primaryDark },
  modoBlock: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    zIndex: 2,
  },
  modoLabel: {
    ...TYPE.storyCaption,
    color: "rgba(255,248,235,0.92)",
    marginBottom: 6,
    textAlign: "center",
  },
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
  brandBlock: {
    alignItems: "center",
    zIndex: 1,
    paddingHorizontal: 16,
  },
  provinciasLine: {
    ...TYPE.storyCaption,
    marginTop: 6,
    color: "rgba(255,248,235,0.82)",
  },
  pager: { flex: 1, zIndex: 1 },
  slide: {
    paddingHorizontal: SPACING.sm,
    alignItems: "center",
    paddingTop: 2,
  },
  eyebrow: {
    ...TYPE.storyEyebrow,
    color: "rgba(255,236,200,0.95)",
    marginBottom: 4,
    textAlign: "center",
  },
  titulo: {
    ...TYPE.storyTitle,
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  texto: {
    ...TYPE.storyLead,
    color: "rgba(245,250,247,0.96)",
    textAlign: "center",
    maxWidth: 348,
    marginBottom: 10,
    minHeight: 48,
    paddingHorizontal: 6,
  },
  phoneWrap: { alignItems: "center", justifyContent: "center" },
  phone: {
    width: PHONE_W,
    height: PHONE_H,
    borderRadius: 40,
    backgroundColor: "#050d0a",
    padding: 8,
    borderWidth: 2.5,
    borderColor: "rgba(255,255,255,0.38)",
    shadowColor: "#000",
    shadowOpacity: 0.55,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 20 },
    elevation: 18,
    zIndex: 2,
  },
  phoneGlow: {
    position: "absolute",
    bottom: -18,
    width: PHONE_W * 0.72,
    height: 28,
    borderRadius: 40,
    backgroundColor: "rgba(0,0,0,0.32)",
    zIndex: 1,
  },
  phoneNotch: {
    alignSelf: "center",
    width: 88,
    height: 9,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.14)",
    marginBottom: 6,
  },
  phoneScreen: {
    flex: 1,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: COLORS.mist,
  },
  phoneHome: {
    alignSelf: "center",
    width: 70,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.22)",
    marginTop: 6,
  },
  footer: { paddingHorizontal: 24, zIndex: 1 },
  hintSwipe: {
    ...TYPE.storyCaption,
    textAlign: "center",
    color: "rgba(255,248,235,0.86)",
    marginBottom: 8,
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.22)",
    marginBottom: 10,
    overflow: "hidden",
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
    backgroundColor: "#fff",
  },
  dots: { flexDirection: "row", justifyContent: "center", gap: 7, marginBottom: 12 },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.32)",
  },
  dotOn: { backgroundColor: "#fff", width: 24 },
  cta: {
    borderRadius: RADIUS.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
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
    fontFamily: FONTS.brand,
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: -0.2,
  },
  ctaArrow: { fontSize: 16, color: COLORS.primaryDark, fontFamily: FONTS.brand },
  tipCierre: {
    ...TYPE.storyCaption,
    textAlign: "center",
    color: "rgba(255,248,235,0.9)",
    marginBottom: 8,
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
  gpxMini: {
    backgroundColor: COLORS.waterLight,
    borderRadius: RADIUS.sm,
    paddingVertical: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#c5dde6",
  },
  gpxMiniTxt: {
    color: COLORS.waterDark,
    fontFamily: FONTS.bold,
    fontWeight: "700",
    fontSize: 12,
  },
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
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 8,
    borderColor: "rgba(255,255,255,0.38)",
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  gaugeNum: {
    color: "#fff",
    fontSize: 40,
    fontFamily: FONTS.display,
    letterSpacing: -1,
  },
  gaugeLabel: {
    color: "rgba(255,255,255,0.88)",
    fontFamily: FONTS.bold,
    fontWeight: "700",
    fontSize: 13,
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 72,
    marginTop: 14,
    gap: 3,
    paddingHorizontal: 4,
  },
  chartCol: { flex: 1, alignItems: "center", justifyContent: "flex-end" },
  chartBar: {
    width: "100%",
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.85)",
  },
  chartHint: {
    marginTop: 8,
    textAlign: "center",
    color: "rgba(255,255,255,0.78)",
    fontFamily: FONTS.semibold,
    fontSize: 11,
  },
  meteoRow: { flexDirection: "row", gap: 6, marginTop: 12 },
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
  modoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginHorizontal: 10,
    marginBottom: 4,
  },
  modoChip: {
    flexGrow: 1,
    minWidth: "22%",
    backgroundColor: "#fff",
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  modoChipOn: {
    backgroundColor: "#0a3f38",
    borderColor: "#c45f12",
    borderWidth: 2,
  },
  modoChipTxt: {
    fontFamily: FONTS.extrabold,
    fontWeight: "800",
    fontSize: 12,
    color: COLORS.textPrimary,
  },
  modoChipTxtOn: { color: "#fff" },
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
});
