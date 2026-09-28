import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { COLORS, FONTS, RADIUS, SHADOW } from "../theme";

export type AccionFabMapa = "guardar" | "medir" | "ruta" | "ancla";

type Props = {
  onAccion: (accion: AccionFabMapa) => void;
  midiendo?: boolean;
  grabando?: boolean;
  mostrarAncla?: boolean;
  mostrarRuta?: boolean;
};

const ACCIONES: {
  id: AccionFabMapa;
  label: string;
  glyph: string;
  always?: boolean;
}[] = [
  { id: "guardar", label: "Guardar", glyph: "+", always: true },
  { id: "medir", label: "Medir", glyph: "⟷", always: true },
  { id: "ruta", label: "Ruta", glyph: "◎" },
  { id: "ancla", label: "Ancla", glyph: "⊕" },
];

/**
 * FAB del mapa: herramientas sin llenar la barra de chips.
 * Abierto = columna de acciones encima del botón +.
 */
export default function MapaFabHerramientas({
  onAccion,
  midiendo = false,
  grabando = false,
  mostrarAncla = false,
  mostrarRuta = true,
}: Props) {
  const [abierto, setAbierto] = useState(false);

  const visibles = ACCIONES.filter((a) => {
    if (a.id === "ancla") return mostrarAncla;
    if (a.id === "ruta") return mostrarRuta;
    return true;
  });

  return (
    <View style={styles.root} pointerEvents="box-none">
      {abierto ? (
        <View style={styles.menu} pointerEvents="box-none">
          {visibles.map((a) => {
            const activa =
              (a.id === "medir" && midiendo) || (a.id === "ruta" && grabando);
            return (
              <TouchableOpacity
                key={a.id}
                style={[styles.satelite, activa && styles.sateliteOn]}
                onPress={() => {
                  onAccion(a.id);
                  setAbierto(false);
                }}
                accessibilityRole="button"
                accessibilityLabel={a.label}
              >
                <Text style={[styles.satGlyph, activa && styles.satGlyphOn]}>{a.glyph}</Text>
                <Text style={[styles.satLabel, activa && styles.satGlyphOn]} numberOfLines={1}>
                  {a.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}

      <TouchableOpacity
        style={[styles.fab, abierto && styles.fabOn]}
        onPress={() => setAbierto((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={abierto ? "Cerrar herramientas del mapa" : "Herramientas del mapa"}
        accessibilityState={{ expanded: abierto }}
      >
        <Text style={styles.fabTxt}>{abierto ? "✕" : "+"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    right: 14,
    bottom: 18,
    alignItems: "flex-end",
    zIndex: 20,
  },
  menu: {
    marginBottom: 10,
    gap: 8,
    alignItems: "flex-end",
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primaryDark,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.35)",
    ...SHADOW,
  },
  fabOn: { backgroundColor: "#13485a" },
  fabTxt: {
    color: "#fff",
    fontSize: 26,
    fontFamily: FONTS.extrabold,
    fontWeight: "800",
    marginTop: Platform.OS === "ios" ? -2 : 0,
  },
  satelite: {
    minWidth: 88,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    ...SHADOW,
  },
  sateliteOn: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  satGlyph: {
    fontSize: 14,
    color: COLORS.primaryDark,
    fontFamily: FONTS.bold,
    fontWeight: "700",
    width: 18,
    textAlign: "center",
  },
  satLabel: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  satGlyphOn: { color: COLORS.primaryDark },
});