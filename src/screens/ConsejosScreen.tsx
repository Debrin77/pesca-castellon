import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useScrollToTop } from "@react-navigation/native";
import { SECCIONES_CONSEJOS, CategoriaConsejo, ConsejoItem } from "../data/consejos";
import { COLORS, GRADIENTS, RADIUS, SHADOW, SHADOW_SOFT, SPACING } from "../theme";
import ListaAnimada from "../components/ListaAnimada";

function coincide(item: ConsejoItem, q: string): boolean {
  if (!q) return true;
  const blob = `${item.titulo} ${item.resumen} ${item.detalle} ${(item.tags || []).join(" ")}`.toLowerCase();
  return blob.includes(q);
}

export default function ConsejosScreen() {
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);
  const [categoria, setCategoria] = useState<CategoriaConsejo | "todas">("todas");
  const [busqueda, setBusqueda] = useState("");
  const [abierto, setAbierto] = useState<string | null>(SECCIONES_CONSEJOS[0]?.items[0]?.id ?? null);

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
          Nudos, anzuelos, cebos, aparejos y vocabulario para pescar mejor en Castellón — sin sustituir la normativa.
        </Text>
      </LinearGradient>

      <View style={styles.body}>
        <TextInput
          style={styles.search}
          placeholder="Busca (palomar, bass, ZPL, fluoro…)"
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
                    {isOpen && <Text style={styles.cardDetalle}>{item.detalle}</Text>}
                    {isOpen && item.tags && item.tags.length > 0 && (
                      <View style={styles.tagRow}>
                        {item.tags.map((t) => (
                          <Text key={t} style={styles.tag}>
                            {t}
                          </Text>
                        ))}
                      </View>
                    )}
                  </TouchableOpacity>
                </ListaAnimada>
              );
            })}
          </View>
        ))}

        <Text style={styles.footnote}>
          Contenido orientativo. Carteles del tramo, PTOP del coto y DOGV prevalecen siempre.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  hero: {
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
  },
  heroKicker: {
    color: "#cfe8db",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  heroTitle: { color: "#fff", fontSize: 26, fontWeight: "800" },
  heroSub: { color: "#dfeee5", fontSize: 13.5, lineHeight: 19, marginTop: 8 },
  body: { paddingHorizontal: SPACING.lg, marginTop: -SPACING.md },
  search: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW_SOFT,
  },
  chips: { paddingVertical: 12, gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  chipOn: { backgroundColor: COLORS.primaryDark, borderColor: COLORS.primaryDark },
  chipTxt: { fontSize: 12, fontWeight: "700", color: COLORS.textSecondary },
  chipTxtOn: { color: "#fff" },
  empty: { color: COLORS.textMuted, fontStyle: "italic", marginTop: 8 },
  section: { marginBottom: 18 },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: COLORS.textPrimary },
  sectionSub: { fontSize: 12.5, color: COLORS.textMuted, marginBottom: 10, marginTop: 2 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW_SOFT,
  },
  cardOpen: { borderColor: COLORS.primary, ...SHADOW },
  cardHead: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  cardTitle: { fontSize: 14.5, fontWeight: "800", color: COLORS.textPrimary },
  cardResumen: { fontSize: 12.5, color: COLORS.textSecondary, marginTop: 3, lineHeight: 17 },
  cardDetalle: {
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 19,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  chevron: { fontSize: 14, color: COLORS.textMuted, fontWeight: "800", marginTop: 2 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  tag: {
    fontSize: 10.5,
    fontWeight: "700",
    color: COLORS.primaryDark,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    overflow: "hidden",
  },
  footnote: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 16,
    marginTop: 8,
    marginBottom: 12,
  },
});
