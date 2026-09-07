import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking } from "react-native";
import { concursosParaProvincia, ConcursoPesca } from "../data/concursos";
import {
  clubesParaProvincia,
  enlacesApuntarsePara,
  ClubPesca,
  EnlaceApuntarse,
} from "../data/clubesPesca";
import type { ProvinciaId } from "../provincias/types";
import { COLORS, FONTS, RADIUS } from "../theme";

interface Props {
  provinciaId: ProvinciaId;
  limite?: number;
}

function abrir(url?: string) {
  if (url) Linking.openURL(url);
}

export default function CalendarioConcursos({ provinciaId, limite = 4 }: Props) {
  const [items, setItems] = useState<ConcursoPesca[]>([]);
  const [enlaces, setEnlaces] = useState<EnlaceApuntarse[]>([]);
  const [clubes, setClubes] = useState<ClubPesca[]>([]);

  useEffect(() => {
    setItems(concursosParaProvincia(provinciaId).slice(0, limite));
    setEnlaces(enlacesApuntarsePara(provinciaId));
    setClubes(clubesParaProvincia(provinciaId).slice(0, 6));
  }, [provinciaId, limite]);

  if (!items.length && !enlaces.length) return null;

  const portales = items.filter((c) => c.portal);
  const eventos = items.filter((c) => !c.portal);

  return (
    <View style={styles.box} accessibilityLabel="Calendario de concursos">
      <Text style={styles.title} accessibilityRole="header">
        Concursos y clubes
      </Text>
      <Text style={styles.sub}>
        Calendario oficial + enlaces vivos. La inscripción a pruebas oficiales va casi siempre por
        el club federado.
      </Text>

      {enlaces.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Apuntarse / federarse</Text>
          {enlaces.map((e) => (
            <TouchableOpacity
              key={e.id}
              style={styles.ctaRow}
              onPress={() => abrir(e.url)}
              accessibilityRole="link"
              accessibilityLabel={e.titulo}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.ctaTitle}>{e.titulo}</Text>
                <Text style={styles.ctaDesc}>{e.descripcion}</Text>
              </View>
              <Text style={styles.ctaArrow}>↗</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {portales.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Calendario en tiempo real</Text>
          {portales.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={styles.portalItem}
              onPress={() => abrir(c.url)}
              accessibilityRole="link"
              accessibilityLabel={c.titulo}
            >
              <Text style={styles.portalNombre}>{c.titulo}</Text>
              {c.notas ? <Text style={styles.notas}>{c.notas}</Text> : null}
              <Text style={styles.portalCta}>{c.cta ?? "Abrir enlace"} →</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {eventos.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Próximos / temporada</Text>
          {eventos.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={styles.item}
              onPress={() => abrir(c.url)}
              accessibilityRole="button"
              accessibilityLabel={`${c.titulo}, ${c.fecha}`}
            >
              <Text style={styles.fecha}>
                {c.fecha}
                {c.fin && c.fin !== c.fecha ? ` → ${c.fin}` : ""}
              </Text>
              <Text style={styles.nombre}>{c.titulo}</Text>
              <Text style={styles.meta}>
                {c.lugar} · {c.modalidad} · {c.organizador}
              </Text>
              {c.notas ? <Text style={styles.notas}>{c.notas}</Text> : null}
              {c.url ? (
                <Text style={styles.linkHint}>{c.cta ?? "Ver convocatoria"} →</Text>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {clubes.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Clubes cercanos / de referencia</Text>
          <Text style={styles.subInline}>
            Contacta el club para federarte e inscribirte en concursos.
          </Text>
          {clubes.map((cl) => (
            <TouchableOpacity
              key={cl.id}
              style={styles.clubItem}
              onPress={() => abrir(cl.url)}
              accessibilityRole="link"
              accessibilityLabel={cl.nombre}
            >
              <Text style={styles.clubNombre}>{cl.nombre}</Text>
              <Text style={styles.meta}>
                {[cl.localidad, cl.notas].filter(Boolean).join(" · ")}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 12,
  },
  title: {
    fontSize: 15,
    fontFamily: FONTS.extrabold,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  sub: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginBottom: 8,
    marginTop: 2,
    lineHeight: 15,
  },
  subInline: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginBottom: 6,
    lineHeight: 15,
  },
  section: { marginTop: 6 },
  sectionTitle: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    fontWeight: "700",
    color: COLORS.primaryDark,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginTop: 8,
    marginBottom: 4,
  },
  ctaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  ctaTitle: {
    fontSize: 13.5,
    fontFamily: FONTS.bold,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  ctaDesc: {
    fontSize: 11.5,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  ctaArrow: { fontSize: 16, color: COLORS.primary, fontFamily: FONTS.bold },
  portalItem: {
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.primaryLight,
    marginTop: 4,
    marginHorizontal: -6,
    paddingHorizontal: 10,
    borderRadius: RADIUS.md,
  },
  portalNombre: {
    fontSize: 13.5,
    fontFamily: FONTS.bold,
    fontWeight: "700",
    color: COLORS.primaryDark,
  },
  portalCta: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: FONTS.bold,
    fontWeight: "700",
    color: COLORS.primary,
  },
  item: {
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  fecha: {
    fontSize: 11,
    fontFamily: FONTS.extrabold,
    fontWeight: "800",
    color: COLORS.primary,
  },
  nombre: {
    fontSize: 13.5,
    fontFamily: FONTS.bold,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  meta: {
    fontSize: 11.5,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  notas: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: 3,
    lineHeight: 14,
  },
  linkHint: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: FONTS.bold,
    fontWeight: "700",
    color: COLORS.primary,
  },
  clubItem: {
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  clubNombre: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
});
