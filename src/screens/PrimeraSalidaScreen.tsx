import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useProvincia } from "../context/ProvinciaContext";
import { getProvinciaActiva } from "../provincias/runtime";
import { usePuntoConsulta } from "../context/PuntoConsultaContext";
import { sitiosFacilesDe, type SitioFacil } from "../data/sitiosFaciles";
import { marcarPrimeraSalidaHecha, marcarLicenciaOk } from "../services/primeraSalidaService";
import { COLORS, FONTS, GRADIENTS, RADIUS, SPACING } from "../theme";
import OndaAgua from "../components/OndaAgua";

type Props = { navigation: any };

/** Wizard «Mi primera salida»: medio → licencia → sitio fácil → kit → listo. */
export default function PrimeraSalidaScreen({ navigation }: Props) {
  const { provincia: ctx } = useProvincia();
  const provincia = ctx ?? getProvinciaActiva();
  const { fijarPunto } = usePuntoConsulta();
  const sitios = useMemo(
    () => sitiosFacilesDe(provincia.id as "castellon" | "sevilla"),
    [provincia.id]
  );
  const [paso, setPaso] = useState(0);
  const [medio, setMedio] = useState<"continental" | "maritimo" | null>(
    provincia.continentalOnly ? "continental" : null
  );
  const [sitio, setSitio] = useState<SitioFacil | null>(null);
  const total = 5;

  const sitiosVisibles = useMemo(() => {
    if (medio === "maritimo") return sitios.filter((s) => s.ambito === "maritimo");
    return sitios.filter((s) => s.ambito === "continental").slice(0, 3);
  }, [medio, sitios]);

  async function terminar() {
    await marcarPrimeraSalidaHecha();
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate("HomeMain");
  }

  async function usarSitio(s: SitioFacil) {
    setSitio(s);
    await fijarPunto({
      lat: s.lat,
      lng: s.lng,
      fuente: "zona",
      etiqueta: s.nombre,
    });
  }

  return (
    <LinearGradient colors={[...GRADIENTS.primary]} style={styles.root}>
      <OndaAgua intensidad={0.9} />
      <Text style={styles.brand}>{provincia.nombreApp}</Text>
      <Text style={styles.kicker}>
        MI PRIMERA SALIDA · {paso + 1}/{total}
      </Text>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {paso === 0 ? (
          <View style={styles.card}>
            <Text style={styles.title}>¿Dónde quieres empezar?</Text>
            <Text style={styles.sub}>
              Elige un medio. Eso fija la licencia y el tipo de sitio recomendado.
            </Text>
            {!provincia.continentalOnly ? (
              <TouchableOpacity
                style={[styles.opt, medio === "maritimo" && styles.optOn]}
                onPress={() => setMedio("maritimo")}
              >
                <Text style={styles.optTitle}>Costa / orilla de mar</Text>
                <Text style={styles.optSub}>Licencia marítima recreativa desde tierra (GVA)</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={[styles.opt, medio === "continental" && styles.optOn]}
              onPress={() => setMedio("continental")}
            >
              <Text style={styles.optTitle}>Río o embalse</Text>
              <Text style={styles.optSub}>{provincia.etiquetaLicenciaContinental}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.cta, !medio && styles.ctaOff]}
              disabled={!medio}
              onPress={() => setPaso(1)}
            >
              <Text style={styles.ctaTxt}>Continuar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={terminar}>
              <Text style={styles.back}>Saltar guía</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {paso === 1 ? (
          <View style={styles.card}>
            <Text style={styles.title}>Licencia (imprescindible)</Text>
            <Text style={styles.sub}>
              {medio === "maritimo"
                ? "En costa necesitas la licencia marítima recreativa desde tierra. Desde 2026, PescaREC puede exigir declaraciones en mar."
                : provincia.requisitosLicencia.seguroObligatorio
                  ? "En ríos/embalses: licencia continental + NIR + seguro RC obligatorio."
                  : "En ríos/embalses: licencia continental. En Castellón no se exige seguro RC."}
            </Text>
            <TouchableOpacity style={styles.opt} onPress={() => navigation.navigate("License")}>
              <Text style={styles.optTitle}>Cómo tramitarla / guardarla</Text>
              <Text style={styles.optSub}>Abre la ficha de licencias de la app</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cta}
              onPress={async () => {
                await marcarLicenciaOk(true);
                setPaso(2);
              }}
            >
              <Text style={styles.ctaTxt}>Ya la tengo · seguir</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setPaso(0)}>
              <Text style={styles.back}>← Volver</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {paso === 2 ? (
          <View style={styles.card}>
            <Text style={styles.title}>Elige un sitio fácil</Text>
            <Text style={styles.sub}>
              Propuestas para empezar. El semáforo del punto manda: confirma siempre en el mapa.
            </Text>
            {sitiosVisibles.length === 0 ? (
              <Text style={styles.note}>
                En costa: abre el mapa, toca la orilla y mira vedados. Tras la primera consulta puedes
                guardar el punto como favorito.
              </Text>
            ) : (
              sitiosVisibles.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.opt, sitio?.id === s.id && styles.optOn]}
                  onPress={() => usarSitio(s)}
                >
                  <Text style={styles.optTitle}>{s.nombre}</Text>
                  <Text style={styles.optSub}>{s.porQue}</Text>
                </TouchableOpacity>
              ))
            )}
            {sitio ? (
              <TouchableOpacity style={styles.cta} onPress={() => setPaso(3)}>
                <Text style={styles.ctaTxt}>Usar este sitio · seguir</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.cta}
                onPress={() => setPaso(3)}
                accessibilityRole="button"
                accessibilityLabel="Seguir sin sitio concreto"
              >
                <Text style={styles.ctaTxt}>Seguir sin sitio concreto</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => setPaso(1)}>
              <Text style={styles.back}>← Volver</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {paso === 3 ? (
          <View style={styles.card}>
            <Text style={styles.title}>Kit mínimo + un nudo</Text>
            <Text style={styles.sub}>
              No hace falta la tienda entera: un montaje sencillo y el nudo Palomar bastan para la
              primera jornada.
            </Text>
            <TouchableOpacity
              style={styles.opt}
              onPress={() =>
                navigation.navigate("Consejos", {
                  consejoId: "ap-kit-principiante",
                  categoria: "aparejos",
                })
              }
            >
              <Text style={styles.optTitle}>Kit de principiante</Text>
              <Text style={styles.optSub}>Caña, carrete, línea y lo imprescindible</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.opt}
              onPress={() =>
                navigation.navigate("Consejos", { consejoId: "nudo-palomar", categoria: "nudos" })
              }
            >
              <Text style={styles.optTitle}>Nudo Palomar</Text>
              <Text style={styles.optSub}>El nudo más fiable para empezar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cta} onPress={() => setPaso(4)}>
              <Text style={styles.ctaTxt}>Ya lo tengo claro · seguir</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setPaso(2)}>
              <Text style={styles.back}>← Volver</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {paso === 4 ? (
          <View style={styles.card}>
            <Text style={styles.title}>Listo para salir</Text>
            <Text style={styles.sub}>
              En Inicio verás «¿Puedo?» (norma) separado de «¿Pinta?» (clima). Usa «Salgo a pescar»
              para el checklist del día. Si el semáforo dice SIN TRAMO, no es veda automática: mira el
              cartel.
            </Text>
            {provincia.id === "castellon" && medio === "maritimo" ? (
              <TouchableOpacity
                style={styles.opt}
                onPress={() =>
                  Linking.openURL(
                    "https://www.mapa.gob.es/es/pesca/temas/pesca-maritima-de-recreo/pesca-rec/"
                  )
                }
              >
                <Text style={styles.optTitle}>PescaREC (costa)</Text>
                <Text style={styles.optSub}>Declaraciones marítimas oficiales desde 2026</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={styles.cta}
              onPress={async () => {
                await marcarPrimeraSalidaHecha();
                if (sitio) navigation.replace("SalgoAPescar");
                else navigation.replace("HomeMain");
              }}
            >
              <Text style={styles.ctaTxt}>Empezar a pescar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setPaso(3)}>
              <Text style={styles.back}>← Volver</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: 56, overflow: "hidden" },
  brand: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
    fontFamily: FONTS.extrabold,
    textAlign: "center",
    letterSpacing: 0.3,
    zIndex: 1,
  },
  kicker: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
    fontWeight: "800",
    fontFamily: FONTS.extrabold,
    letterSpacing: 0.8,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 12,
    zIndex: 1,
  },
  body: { paddingHorizontal: SPACING.md, paddingBottom: 40, zIndex: 1 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 16,
  },
  title: { fontSize: 20, fontWeight: "800", color: COLORS.textPrimary },
  sub: {
    marginTop: 6,
    marginBottom: 12,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  opt: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 8,
  },
  optOn: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  optTitle: { fontSize: 15, fontWeight: "800", color: COLORS.textPrimary },
  optSub: {
    marginTop: 2,
    fontSize: 12.5,
    lineHeight: 17,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  note: {
    fontSize: 12.5,
    lineHeight: 17,
    color: COLORS.textMuted,
    fontWeight: "600",
    marginBottom: 8,
  },
  cta: {
    marginTop: 8,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  ctaOff: { opacity: 0.45 },
  ctaTxt: { color: "#fff", fontWeight: "800", fontSize: 15 },
  back: {
    marginTop: 14,
    textAlign: "center",
    color: COLORS.textSecondary,
    fontWeight: "700",
  },
});
