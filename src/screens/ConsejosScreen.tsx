import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRoute, useScrollToTop } from "@react-navigation/native";
import { SECCIONES_CONSEJOS, CategoriaConsejo, ConsejoItem } from "../data/consejos";
import DiagramaConsejo from "../components/DiagramaConsejo";
import { COLORS, GRADIENTS, RADIUS, SHADOW, SHADOW_SOFT, SPACING } from "../theme";
import ListaAnimada from "../components/ListaAnimada";

function coincide(item: ConsejoItem, q: string): boolean {
  if (!q) return true;
  const pasos = (item.pasos || []).join(" ");
  const blob = `${item.titulo} ${item.resumen} ${item.detalle} ${pasos} ${(item.tags || []).join(" ")}`.toLowerCase();
  return blob.includes(q);
}

type ParamsConsejos = {
  consejoId?: string;
  categoria?: CategoriaConsejo | "todas";
};

export default function ConsejosScreen() {
  const route = useRoute<any>();
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);
  const { width: winW } = useWindowDimensions();
  const diagramW = Math.min(340, Math.max(280, winW - 56));
  const params = (route.params ?? {}) as ParamsConsejos;

  const [categoria, setCategoria] = useState<CategoriaConsejo | "todas">(params.categoria ?? "montajes");
  const [busqueda, setBusqueda] = useState("");
  const [abierto, setAbierto] = useState<string | null>(
    params.consejoId ?? SECCIONES_CONSEJOS.find((s) => s.id === "montajes")?.items[0]?.id ?? SECCIONES_CONSEJOS[0]?.items[0]?.id ?? null
  );

  useEffect(() => {
    const p = (route.params ?? {}) as ParamsConsejos;
    if (p.categoria) setCategoria(p.categoria);
    if (p.consejoId) {
      setAbierto(p.consejoId);
      const sec = SECCIONES_CONSEJOS.find((s) => s.items.some((it) => it.id === p.consejoId));
      if (sec) setCategoria(sec.id);
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: 0, animated: true }));
    }
  }, [route.params]);

  const q = busqueda.trim().toLowerCase();

  const secciones = useMemo(() => {
    return SECCIONES_CONSEJOS.filter((s) => categoria === "todas" || s.id === categoria)
      .map((s) => ({ ...s, items: s.items.filter((it) => coincide(it, q)) }))
      .filter((s) => s.items.length > 0);
  }, [categoria, q]);

  return (
    <ScrollView ref={scrollRef} style={styles.container} contentContainerStyle={{ paddingBottom: 110 }}>
      <LinearGradient colors={GRADIENTS.primary} style={styles.hero}>
        <Text style={styles.heroKicker}>Escuela de bolsillo</Text>
        <Text style={styles.heroTitle}>Consejos de pesca</Text>
        <Text style={styles.heroSub}>
          Montajes por especie, nudos paso a paso y piezas del aparejo. Fotos y esquemas en la app, sin internet.
        </Text>
      </LinearGradient>

      <View style={styles.body}>
        <View style={styles.introCard}>
          <Text style={styles.introTitle}>Si empiezas de cero</Text>
          <Text style={styles.introTxt}>
            Abre «Montajes por especie»: verás el orden de la línea (boya, plomo, anzuelo…) y cómo regularlo. Luego «Nudo Palomar» y «Kit mínimo».
          </Text>
        </View>

        <TextInput
          style={styles.search}
          placeholder="Busca (lubina, boya, palomar, texas…)"
          placeholderTextColor={COLORS.textMuted}
          value={busqueda}
          onChangeText={setBusqueda}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <TouchableOpacity
            style={[styles.chip, categoria === "todas" && styles.chipOn]}
            onPress={() => setCategoria("todas")}
          >
            <Text style={[styles.chipTxt, categoria === "todas" && styles.chipTxtOn]}>Todas</Text>
          </TouchableOpacity>
          {SECCIONES_CONSEJOS.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={[styles.chip, categoria === s.id && styles.chipOn]}
              onPress={() => setCategoria(s.id)}
            >
              <Text style={[styles.chipTxt, categoria === s.id && styles.chipTxtOn]}>{s.titulo}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {secciones.length === 0 && (
          <Text style={styles.empty}>No hay resultados para esa búsqueda.</Text>
        )}

        {secciones.map((sec) => (
          <View key={sec.id} style={styles.section}>
            <Text style={styles.sectionTitle}>{sec.titulo}</Text>
            <Text style={styles.sectionSub}>{sec.subtitulo}</Text>
            {sec.items.map((item, i) => {
              const isOpen = abierto === item.id;
              return (
                <ListaAnimada key={item.id} index={i} replayKey={`${categoria}-${q}`}>
                  <TouchableOpacity
                    style={[styles.card, isOpen && styles.cardOpen]}
                    onPress={() => setAbierto(isOpen ? null : item.id)}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: isOpen }}
                  >
                    <View style={styles.cardHead}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>{item.titulo}</Text>
                        <Text style={styles.cardResumen}>{item.resumen}</Text>
                      </View>
                      <Text style={styles.chevron}>{isOpen ? "▾" : "▸"}</Text>
                    </View>
                    {isOpen && (
                      <View style={styles.cardBody}>
                        {item.diagrama ? <DiagramaConsejo id={item.diagrama} width={diagramW} /> : null}
                        {item.pasos && item.pasos.length > 0 ? (
                          <View style={styles.pasosBox}>
                            {item.pasos.map((p, idx) => (
                              <View key={idx} style={styles.pasoRow}>
                                <View style={styles.pasoNum}>
                                  <Text style={styles.pasoNumTxt}>{idx + 1}</Text>
                                </View>
                                <Text style={styles.pasoTxt}>{p}</Text>
                              </View>
                            ))}
                          </View>
                        ) : null}
                        <Text style={styles.cardDetalle}>{item.detalle}</Text>
                        {item.tags && item.tags.length > 0 && (
                          <View style={styles.tagRow}>
                            {item.tags.map((t) => (
                              <Text key={t} style={styles.tag}>
                                {t}
                              </Text>
                            ))}
                          </View>
                        )}
                      </View>
                    )}
                  </TouchableOpacity>
                </ListaAnimada>
              );
            })}
          </View>
        ))}

        <Text style={styles.footnote}>
          Orientativo. Carteles del tramo, PTOP del coto y normativa oficial prevalecen. Montajes = esquema de línea para principiantes; nudos con fotos Wikimedia (créditos bajo cada guía).
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  hero: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 22 },
  heroKicker: {
    color: "#e8f5ee",
    fontWeight: "800",
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  heroTitle: { color: "#fff", fontSize: 28, fontWeight: "800", marginTop: 4 },
  heroSub: { color: "#eef7f1", marginTop: 8, fontSize: 14, lineHeight: 20 },
  body: { padding: SPACING.md },
  introCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  introTitle: { fontSize: 14, fontWeight: "800", color: COLORS.primaryDark },
  introTxt: { marginTop: 4, fontSize: 13, lineHeight: 19, color: COLORS.textSecondary },
  search: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
    marginBottom: 10,
    ...SHADOW_SOFT,
  },
  chips: { gap: 8, paddingBottom: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipTxt: { fontSize: 13, fontWeight: "700", color: COLORS.textSecondary },
  chipTxtOn: { color: "#fff" },
  empty: { textAlign: "center", color: COLORS.textMuted, marginTop: 24, fontSize: 14 },
  section: { marginTop: 14 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: COLORS.textPrimary },
  sectionSub: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 8, marginTop: 2 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW,
  },
  cardOpen: { borderColor: COLORS.water },
  cardHead: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: "800", color: COLORS.textPrimary },
  cardResumen: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2, lineHeight: 18 },
  chevron: { fontSize: 16, color: COLORS.textMuted, fontWeight: "800" },
  cardBody: { marginTop: 10 },
  cardDetalle: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19, marginTop: 8 },
  pasosBox: { marginTop: 8, gap: 8 },
  pasoRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  pasoNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  pasoNumTxt: { color: "#fff", fontWeight: "800", fontSize: 12 },
  pasoTxt: { flex: 1, fontSize: 13, lineHeight: 18, color: COLORS.textPrimary, fontWeight: "600" },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  tag: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.waterDark,
    backgroundColor: COLORS.waterLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    overflow: "hidden",
  },
  footnote: { fontSize: 11, color: COLORS.textMuted, lineHeight: 16, marginTop: 16, marginBottom: 8 },
});
