import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { distanciaKm } from "../services/geoService";
import { rumboGrados, rumboCardinal } from "../services/navegacionEmbarcacionService";
import { obtenerUbicacionActual, solicitarPermisoUbicacion } from "../services/locationService";
import { COLORS, FONTS, RADIUS, SPACING } from "../theme";
import { formatearCoords } from "../services/coordsUtils";

type Destino = {
  nombre: string;
  lat: number;
  lng: number;
};

type Props = {
  visible: boolean;
  destino: Destino | null;
  onCerrar: () => void;
};

/**
 * Navegación ligera al pin: distancia + rumbo (no plotter / no Navionics).
 */
export default function LlevameAlPunto({ visible, destino, onCerrar }: Props) {
  const insets = useSafeAreaInsets();
  const [yo, setYo] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !destino) return;
    let cancel = false;
    (async () => {
      setError(null);
      const ok = await solicitarPermisoUbicacion();
      if (!ok) {
        if (!cancel) setError("Activa la ubicación para guiarte al punto.");
        return;
      }
      const loc = await obtenerUbicacionActual();
      if (!cancel && loc) setYo({ lat: loc.lat, lng: loc.lng });
      else if (!cancel) setError("No pude leer tu GPS.");
    })();
    const id = setInterval(async () => {
      const loc = await obtenerUbicacionActual();
      if (!cancel && loc) setYo({ lat: loc.lat, lng: loc.lng });
    }, 4000);
    return () => {
      cancel = true;
      clearInterval(id);
    };
  }, [visible, destino?.lat, destino?.lng]);

  if (!destino) return null;

  const dKm = yo ? distanciaKm(yo.lat, yo.lng, destino.lat, destino.lng) : null;
  const dM = dKm != null ? Math.round(dKm * 1000) : null;
  const rumbo = yo ? rumboGrados(yo.lat, yo.lng, destino.lat, destino.lng) : null;
  const card = rumbo != null ? rumboCardinal(rumbo) : null;
  const cerca = dM != null && dM <= 50;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCerrar}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Text style={styles.kicker}>Llévame al punto</Text>
          <Text style={styles.titulo}>{destino.nombre}</Text>
          <Text style={styles.coords}>{formatearCoords(destino.lat, destino.lng)}</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {dM != null && rumbo != null ? (
            <View style={styles.panel}>
              <View style={[styles.flechaWrap, { transform: [{ rotate: `${rumbo}deg` }] }]}>
                <Text style={styles.flecha}>↑</Text>
              </View>
              <Text style={styles.dist}>
                {dM < 1000 ? `${dM} m` : `${(dM / 1000).toFixed(2)} km`}
              </Text>
              <Text style={styles.rumbo}>
                Rumbo {Math.round(rumbo)}° · {card}
              </Text>
              <Text style={styles.hint}>
                {cerca
                  ? "Últimos metros · mira alrededor"
                  : "Flecha hacia el pin · no es plotter ni carta náutica"}
              </Text>
            </View>
          ) : (
            <Text style={styles.cargando}>Leyendo GPS…</Text>
          )}

          <TouchableOpacity style={styles.cerrar} onPress={onCerrar} accessibilityRole="button">
            <Text style={styles.cerrarTxt}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(8,18,14,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingTop: 16,
  },
  kicker: {
    fontFamily: FONTS.bold,
    fontWeight: "700",
    fontSize: 11,
    color: COLORS.water,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  titulo: {
    marginTop: 4,
    fontFamily: FONTS.display,
    fontSize: 24,
    color: COLORS.primaryDark,
    letterSpacing: -0.4,
  },
  coords: {
    marginTop: 4,
    fontFamily: FONTS.semibold,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  error: { marginTop: 12, color: COLORS.danger, fontFamily: FONTS.semibold },
  cargando: { marginTop: 24, fontFamily: FONTS.semibold, color: COLORS.textSecondary },
  panel: { alignItems: "center", marginTop: 20, marginBottom: 8 },
  flechaWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  flecha: {
    fontSize: 42,
    color: COLORS.primaryDark,
    fontWeight: "800",
    marginTop: Platform.OS === "ios" ? -4 : 0,
  },
  dist: {
    marginTop: 14,
    fontFamily: FONTS.display,
    fontSize: 36,
    color: COLORS.primaryDark,
    letterSpacing: -1,
  },
  rumbo: {
    marginTop: 4,
    fontFamily: FONTS.bold,
    fontWeight: "700",
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  hint: {
    marginTop: 10,
    textAlign: "center",
    fontFamily: FONTS.semibold,
    fontSize: 12,
    color: COLORS.textSecondary,
    paddingHorizontal: 12,
  },
  cerrar: {
    marginTop: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cerrarTxt: {
    fontFamily: FONTS.extrabold,
    fontWeight: "800",
    color: COLORS.primaryDark,
  },
});
