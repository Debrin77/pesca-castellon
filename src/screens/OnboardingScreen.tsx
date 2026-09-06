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
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { marcarPresentacionVirtudesVista } from "../services/offlineService";
import { useProvincia } from "../context/ProvinciaContext";
import { getProvinciaActiva } from "../provincias/runtime";
import { COLORS, FONTS, GRADIENTS, RADIUS, SPACING } from "../theme";
import OndaAgua from "../components/OndaAgua";

const { width: W, height: H } = Dimensions.get("window");

type Slide = {
  id: string;
  eyebrow: string;
  titulo: string;
  texto: string;
  mockTitle: string;
  mockLines: string[];
  accent: readonly [string, string];
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

  const slides: Slide[] = useMemo(
    () => [
      {
        id: "intima",
        eyebrow: "Tu cuaderno de pesca",
        titulo: "Personal e íntima",
        texto:
          "Pensada para ti: sitios, capturas y notas viven en tu móvil. Compartir un punto es una opción, no el motivo de la app.",
        mockTitle: "Mis sitios",
        mockLines: [
          "★ Embalse de María Cristina",
          "📍 Orilla que solo yo conozco",
          "📓 Nota: spinning al atardecer",
          "🔒 Solo en este dispositivo",
        ],
        accent: GRADIENTS.primary,
      },
      {
        id: "pin",
        eyebrow: "Privacidad real",
        titulo: "PIN + biometría",
        texto:
          "Activa un PIN configurable en Ajustes y, si quieres, Face ID / huella. Al abrir la app —o al volver— solo tú entras.",
        mockTitle: "App bloqueada",
        mockLines: ["● ● ● ●", "Introduce tu PIN", "Usar Face ID / huella", "Configurable en Ajustes"],
        accent: ["#0f3326", "#1a5640"] as const,
      },
      {
        id: "legal",
        eyebrow: "¿Puedo pescar aquí?",
        titulo: "Semáforo claro",
        texto: provincia.continentalOnly
          ? `Verde, rojo o «SIN TRAMO». SIN TRAMO no es veda: el mapa no tiene ese tramo dibujado; en ${nombreProv} puede ser agua libre si no es refugio. Mira el cartel en tu primera salida.`
          : provincia.tieneIcv
            ? `Verde: hoy sí. Rojo: veda. Ámbar: coto. Gris «SIN TRAMO»: no es veda — el tramo no está dibujado; confirma cartel. Detalles ICV en «Más info».`
            : `Verde: hoy sí. Rojo: veda o prohibido. Ámbar: coto. Los datos de ${nombreProv} son orientativos: confirma siempre en la fuente oficial.`,
        mockTitle: "Consulta del punto",
        mockLines: [
          "🟢 Libre · hoy sí",
          "SIN TRAMO ≠ veda",
          "Cartel del tramo manda",
          "Licencia · tallas · cupos",
        ],
        accent: GRADIENTS.water,
      },
      {
        id: "pinta",
        eyebrow: "¿Pinta el día?",
        titulo: "Índice y previsión",
        texto:
          "Clima, presión, luna y un índice 0–100 para decidir si sales. «¿Puedo?» es la norma; «¿Pinta?» es el tiempo — no autoriza.",
        mockTitle: "Hoy en el agua",
        mockLines: ["Índice 78 · Buena", "Presión bajando", "Viento suave · 12 km/h", "Mejor ventana 07:00–10:00"],
        accent: ["#13485a", "#2a7a94"] as const,
      },
      {
        id: "diario",
        eyebrow: "Tu memoria de campo",
        titulo: "Capturas y rutas",
        texto:
          "Diario con foto, especie, GPS y cupo. Exporta GPX cuando quieras — a Maps, a un amigo o a nadie. Tú eliges.",
        mockTitle: "Diario",
        mockLines: ["Black bass · 42 cm", "Foto + GPS guardados", "Exportar GPX (opcional)", "Sin feed público"],
        accent: GRADIENTS.primary,
      },
      {
        id: "campo",
        eyebrow: "Listo para la orilla",
        titulo: "Salgo a pescar",
        texto:
          "Ritual de salida, montajes con fotos, consejos y checklist. Menos dudar en casa, más tiempo con la caña en la mano.",
        mockTitle: "Antes de salir",
        mockLines: ["1. Dónde voy", "2. ¿Puedo? + ¿Pinta?", "3. Montaje de la especie", "4. Checklist de equipo"],
        accent: GRADIENTS.dusk,
      },
    ],
    [provincia.continentalOnly, provincia.tieneIcv, nombreProv]
  );

  async function terminar() {
    await marcarPresentacionVirtudesVista();
    onDone();
  }

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const i = Math.round(e.nativeEvent.contentOffset.x / W);
    if (i !== page) setPage(i);
  }

  const topPad = Math.max(insets.top, Platform.OS === "web" ? 16 : 12);

  return (
    <View style={styles.root}>
      <LinearGradient colors={[...slides[page].accent]} style={StyleSheet.absoluteFill} />
      <OndaAgua intensidad={0.55} />

      <TouchableOpacity
        style={[styles.closeBtn, { top: topPad + 4 }]}
        onPress={terminar}
        accessibilityLabel="Cerrar presentación"
        accessibilityRole="button"
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={styles.closeTxt}>✕</Text>
      </TouchableOpacity>

      <Text style={[styles.brand, { marginTop: topPad + 44 }]}>
        {provincia.nombreApp ?? "Pesca"}
      </Text>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={styles.pager}
      >
        {slides.map((s) => (
          <View key={s.id} style={[styles.slide, { width: W }]}>
            <Text style={styles.eyebrow}>{s.eyebrow}</Text>
            <Text style={styles.titulo}>{s.titulo}</Text>
            <Text style={styles.texto}>{s.texto}</Text>

            <View style={styles.phone}>
              <View style={styles.phoneNotch} />
              <LinearGradient colors={["#f7faf7", "#eef2ee"]} style={styles.phoneScreen}>
                <Text style={styles.mockTitle}>{s.mockTitle}</Text>
                {s.mockLines.map((line) => (
                  <View key={line} style={styles.mockRow}>
                    <Text style={styles.mockLine}>{line}</Text>
                  </View>
                ))}
              </LinearGradient>
              <View style={styles.phoneHome} />
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.dots}>
          {slides.map((s, i) => (
            <View key={s.id} style={[styles.dot, i === page && styles.dotOn]} />
          ))}
        </View>

        <TouchableOpacity
          style={styles.cta}
          onPress={() => {
            if (page < slides.length - 1) {
              scrollRef.current?.scrollTo({ x: (page + 1) * W, animated: true });
              setPage(page + 1);
            } else {
              terminar();
            }
          }}
        >
          <Text style={styles.ctaTxt}>
            {page < slides.length - 1 ? "Continuar" : "Empezar a pescar"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/** Marco tipo captura App Store: domina el alto de la pantalla. */
const PHONE_W = Math.min(W * 0.82, 340);
const PHONE_H = Math.min(H * 0.52, 520);

const styles = StyleSheet.create({
  root: { flex: 1, overflow: "hidden", backgroundColor: COLORS.primaryDark },
  closeBtn: {
    position: "absolute",
    right: 16,
    zIndex: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.28)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  closeTxt: { color: "#fff", fontSize: 18, fontWeight: "700", marginTop: -1 },
  brand: {
    textAlign: "center",
    color: "rgba(255,255,255,0.85)",
    fontWeight: "800",
    fontFamily: FONTS.extrabold,
    letterSpacing: 1,
    textTransform: "uppercase",
    fontSize: 12,
    zIndex: 1,
  },
  pager: { flex: 1, zIndex: 1 },
  slide: {
    paddingHorizontal: SPACING.lg,
    alignItems: "center",
    paddingTop: 8,
  },
  eyebrow: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    fontWeight: "700",
    fontFamily: FONTS.semibold,
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  titulo: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
    fontFamily: FONTS.extrabold,
    textAlign: "center",
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  texto: {
    color: "#eef7f1",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    fontWeight: "600",
    fontFamily: FONTS.semibold,
    maxWidth: 340,
    marginBottom: 14,
    minHeight: 40,
  },
  phone: {
    width: PHONE_W,
    height: PHONE_H,
    borderRadius: 36,
    backgroundColor: "#0c1a14",
    padding: 8,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.22)",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  phoneNotch: {
    alignSelf: "center",
    width: 72,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.12)",
    marginBottom: 6,
  },
  phoneScreen: {
    flex: 1,
    borderRadius: 20,
    padding: 14,
    justifyContent: "center",
    gap: 8,
  },
  phoneHome: {
    alignSelf: "center",
    width: 64,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginTop: 6,
  },
  mockTitle: {
    fontFamily: FONTS.extrabold,
    fontWeight: "800",
    fontSize: 16,
    color: COLORS.primaryDark,
    marginBottom: 6,
  },
  mockRow: {
    backgroundColor: "#fff",
    borderRadius: RADIUS.md,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mockLine: {
    fontFamily: FONTS.semibold,
    fontWeight: "600",
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  footer: {
    paddingHorizontal: 24,
    zIndex: 1,
  },
  dots: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 14 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  dotOn: { backgroundColor: "#fff", width: 22 },
  cta: {
    backgroundColor: "#fff",
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  ctaTxt: {
    color: COLORS.primaryDark,
    fontWeight: "800",
    fontFamily: FONTS.extrabold,
    fontSize: 16,
  },
});
