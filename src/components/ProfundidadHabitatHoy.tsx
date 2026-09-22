import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import type { HabitatSitio } from "../data/habitat";
import type { EstacionHidrologica } from "../services/saihService";
import {
  etiquetaSello,
  lecturaProfundidadHoy,
  type BloqueSello,
  type SelloDato,
} from "../utils/profundidadEmbalseHoy";
import { COLORS, RADIUS } from "../theme";

type Props = {
  hidro?: EstacionHidrologica | null;
  habitat?: HabitatSitio | null;
  cargandoHidro?: boolean;
  /** Título de la confederación (CHG / CHJ) para el pie oficial. */
  pieOficial?: string | null;
};

function colorSello(sello: SelloDato): { bg: string; fg: string; border: string } {
  if (sello === "oficial") {
    return { bg: "#e8f5ee", fg: COLORS.success, border: COLORS.success };
  }
  if (sello === "ejemplo") {
    return { bg: "#fff6e8", fg: COLORS.warning, border: COLORS.warning };
  }
  return { bg: COLORS.mist, fg: COLORS.waterDark, border: COLORS.border };
}

function Bloque({ bloque }: { bloque: BloqueSello }) {
  const c = colorSello(bloque.sello);
  return (
    <View style={[styles.bloque, { borderColor: c.border, backgroundColor: c.bg }]}>
      <View style={styles.bloqueCab}>
        <Text style={styles.bloqueTitulo}>{bloque.titulo}</Text>
        <Text style={[styles.sello, { color: c.fg, borderColor: c.border }]}>
          {etiquetaSello(bloque.sello)}
        </Text>
      </View>
      {bloque.chips && bloque.chips.length > 0 ? (
        <View style={styles.chips}>
          {bloque.chips.map((ch) => (
            <Text key={ch} style={styles.chip}>
              {ch}
            </Text>
          ))}
        </View>
      ) : null}
      {bloque.lineas.map((l, i) => (
        <Text key={i} style={styles.linea}>
          {l}
        </Text>
      ))}
    </View>
  );
}

/**
 * Ficha de embalse: nivel SAIH (oficial) + estructura (orientativo) + lectura de pesca.
 */
export default function ProfundidadHabitatHoy({
  hidro,
  habitat,
  cargandoHidro,
  pieOficial,
}: Props) {
  if (!hidro && !habitat && !cargandoHidro) return null;

  const lectura = lecturaProfundidadHoy({ hidro: hidro ?? null, habitat: habitat ?? null });

  return (
    <View style={styles.wrap} accessibilityRole="summary">
      <Text style={styles.kicker}>Profundidad y hábitat hoy</Text>
      {cargandoHidro ? (
        <View style={styles.cargando}>
          <ActivityIndicator color={COLORS.water} />
          <Text style={styles.cargandoTxt}>Consultando SAIH…</Text>
        </View>
      ) : null}
      <Text style={styles.lectura}>{lectura.lecturaPesca}</Text>
      {lectura.oficial ? <Bloque bloque={lectura.oficial} /> : null}
      {lectura.orientativo ? <Bloque bloque={lectura.orientativo} /> : null}
      {pieOficial && lectura.oficial && lectura.oficial.sello === "oficial" ? (
        <Text style={styles.pie}>{pieOficial}</Text>
      ) : null}
      <Text style={styles.avisoLegal}>
        Sin batimetría oficial del vaso abierta: el %/cota SAIH son oficiales; la estructura
        (limo, troncos, colas…) es orientativa.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  kicker: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  lectura: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textPrimary,
    lineHeight: 22,
    marginBottom: 10,
  },
  cargando: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  cargandoTxt: { fontSize: 13, color: COLORS.textSecondary },
  bloque: {
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    padding: 10,
    marginBottom: 8,
  },
  bloqueCab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 6,
  },
  bloqueTitulo: {
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  sello: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    borderWidth: 1,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
    overflow: "hidden",
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 6 },
  chip: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primaryDark,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    overflow: "hidden",
  },
  linea: {
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 19,
    marginTop: 2,
  },
  pie: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 6,
  },
  avisoLegal: {
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 15,
    fontStyle: "italic",
    marginTop: 2,
  },
});
