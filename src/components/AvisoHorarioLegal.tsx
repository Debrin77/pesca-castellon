import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import {
  AmbitoHorario,
  AvisoHorarioLegal as AvisoData,
  obtenerAvisoHorarioLegal,
} from "../services/horarioLegalService";
import { COLORS, RADIUS } from "../theme";

type Props = {
  ambito: AmbitoHorario;
  lat?: number | null;
  lng?: number | null;
  provinciaId?: string;
  /** Compacto: solo título + franja + estado. */
  compacto?: boolean;
};

export default function AvisoHorarioLegal({
  ambito,
  lat,
  lng,
  provinciaId,
  compacto = false,
}: Props) {
  const [aviso, setAviso] = useState<AvisoData | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vivo = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    function cargar() {
      setCargando(true);
      void obtenerAvisoHorarioLegal({ ambito, lat, lng, provinciaId }).then((a) => {
        if (!vivo) return;
        setAviso(a);
        setCargando(false);
      });
    }

    cargar();
    // Tras medianoche local recarga la franja del día nuevo.
    const ahora = new Date();
    const manana = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + 1, 0, 1, 0);
    timer = setTimeout(cargar, Math.max(30_000, manana.getTime() - ahora.getTime()));

    return () => {
      vivo = false;
      if (timer) clearTimeout(timer);
    };
  }, [ambito, lat, lng, provinciaId]);

  const mar = ambito === "maritimo";
  const acento = mar ? COLORS.waterDark : COLORS.primaryDark;
  const fondo = mar ? COLORS.waterLight : COLORS.primaryLight;

  if (cargando && !aviso) {
    return (
      <View
        style={[styles.box, { backgroundColor: fondo, borderColor: COLORS.border }]}
        accessibilityLabel="Cargando horario legal"
      >
        <ActivityIndicator color={acento} />
        <Text style={[styles.muted, { marginTop: 8 }]}>Calculando orto / ocaso…</Text>
      </View>
    );
  }

  if (!aviso) return null;

  const estadoColor =
    aviso.estado === "dentro" || aviso.estado === "luz_dia"
      ? COLORS.success
      : aviso.estado === "fuera" || aviso.estado === "noche"
        ? COLORS.warning
        : COLORS.textSecondary;

  return (
    <View
      style={[styles.box, { backgroundColor: fondo, borderColor: COLORS.border }]}
      accessibilityRole="summary"
      accessibilityLabel={`${aviso.titulo}. ${aviso.franjaTxt}. ${aviso.estadoTxt}. ${aviso.normaTxt}`}
    >
      <Text style={[styles.title, { color: acento }]}>{aviso.titulo}</Text>
      <Text style={styles.franja}>{aviso.franjaTxt}</Text>
      <Text style={[styles.estado, { color: estadoColor }]}>{aviso.estadoTxt}</Text>
      {!compacto ? (
        <>
          <Text style={styles.norma}>{aviso.normaTxt}</Text>
          <Text style={styles.disclaimer}>{aviso.disclaimer}</Text>
        </>
      ) : (
        <Text style={styles.norma} numberOfLines={3}>
          {aviso.normaTxt}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginTop: 10,
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
  },
  title: { fontSize: 15, fontWeight: "800" },
  franja: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginTop: 6,
    lineHeight: 22,
  },
  estado: { fontSize: 14, fontWeight: "700", marginTop: 6, lineHeight: 20 },
  norma: { fontSize: 13, color: COLORS.textSecondary, marginTop: 8, lineHeight: 19 },
  disclaimer: { fontSize: 12, color: COLORS.textMuted, marginTop: 8, lineHeight: 17 },
  muted: { fontSize: 13, color: COLORS.textMuted },
});
