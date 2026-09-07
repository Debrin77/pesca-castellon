import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { leerChecklistTicks } from "../services/primeraSalidaService";
import { leerSalidaHoy, guardarSalidaHoy, type SalidaHoy } from "../services/salidaHoyService";
import { itemsDesdeTextos } from "./ChecklistInteractivo";
import OndaAgua from "./OndaAgua";
import PulsePress from "./PulsePress";
import { COLORS, GRADIENTS, RADIUS, SHADOW_SOFT } from "../theme";

export type SiguientePasoAccion =
  | { tipo: "salgo"; irAChecklist?: boolean }
  | { tipo: "mapa" }
  | { tipo: "captura" }
  | { tipo: "primera_salida" }
  | { tipo: "ninguna" };

type Props = {
  provinciaId: string;
  checklistTextos: string[];
  tienePunto: boolean;
  tieneSitios: boolean;
  /** Si aún no hizo la guía: el siguiente paso invita a «Mi primera salida». */
  invitarPrimeraSalida?: boolean;
  etiquetaPunto?: string | null;
  veredictoTexto?: string | null;
  veredictoSub?: string | null;
  tituloTramo?: string | null;
  lat?: number | null;
  lng?: number | null;
  onAccion: (accion: SiguientePasoAccion) => void;
};

type Modo =
  | { id: "guia" }
  | { id: "sin_sitios" }
  | { id: "sin_punto" }
  | { id: "checklist"; hechos: number; total: number }
  | { id: "registrar" }
  | { id: "hecha"; salida: SalidaHoy };

/**
 * Un único «siguiente paso» en Inicio: reduce puertas competidoras
 * y cierra el loop personal (sitio → qué llevar → salida de hoy).
 */
export default function SiguientePasoCard({
  provinciaId,
  checklistTextos,
  tienePunto,
  tieneSitios,
  invitarPrimeraSalida = false,
  etiquetaPunto,
  veredictoTexto,
  veredictoSub,
  tituloTramo,
  lat,
  lng,
  onAccion,
}: Props) {
  const [cargando, setCargando] = useState(true);
  const [modo, setModo] = useState<Modo>({ id: "sin_punto" });
  const [nota, setNota] = useState("");
  const [guardando, setGuardando] = useState(false);

  const items = useMemo(() => itemsDesdeTextos(checklistTextos), [checklistTextos]);

  const refrescar = useCallback(async () => {
    setCargando(true);
    try {
      const [ticks, salida] = await Promise.all([
        leerChecklistTicks(provinciaId),
        leerSalidaHoy(provinciaId),
      ]);
      if (salida) {
        setModo({ id: "hecha", salida });
        return;
      }
      if (invitarPrimeraSalida && !tieneSitios && !tienePunto) {
        setModo({ id: "guia" });
        return;
      }
      if (!tieneSitios && !tienePunto) {
        setModo({ id: "sin_sitios" });
        return;
      }
      if (!tienePunto) {
        setModo({ id: "sin_punto" });
        return;
      }
      const hechos = items.filter((it) => ticks[it.id]).length;
      const total = items.length;
      if (total > 0 && hechos >= total) {
        setModo({ id: "registrar" });
      } else if (total === 0 && tienePunto) {
        setModo({ id: "registrar" });
      } else {
        setModo({ id: "checklist", hechos, total: Math.max(total, 1) });
      }
    } finally {
      setCargando(false);
    }
  }, [provinciaId, tienePunto, tieneSitios, invitarPrimeraSalida, items]);

  useFocusEffect(
    useCallback(() => {
      void refrescar();
    }, [refrescar])
  );

  async function registrar() {
    if (!veredictoTexto) return;
    setGuardando(true);
    try {
      const salida = await guardarSalidaHoy({
        provinciaId,
        etiqueta: etiquetaPunto || tituloTramo || "Punto del día",
        lat: lat ?? undefined,
        lng: lng ?? undefined,
        veredictoTexto,
        veredictoSub: veredictoSub ?? undefined,
        tituloTramo: tituloTramo ?? undefined,
        nota,
        checklistCompleta: true,
      });
      setModo({ id: "hecha", salida });
      setNota("");
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <View style={styles.cargando}>
        <ActivityIndicator color={COLORS.water} />
        <Text style={styles.cargandoTxt}>Preparando tu siguiente paso…</Text>
      </View>
    );
  }

  if (modo.id === "hecha") {
    return (
      <View style={styles.hecha} accessibilityLabel="Salida de hoy registrada">
        <Text style={styles.kicker}>Salida de hoy</Text>
        <Text style={styles.titulo}>Registrada ✓</Text>
        <Text style={styles.sub} numberOfLines={2}>
          {modo.salida.veredictoTexto}
          {modo.salida.etiqueta ? ` · ${modo.salida.etiqueta}` : ""}
        </Text>
        {modo.salida.nota ? (
          <Text style={styles.nota} numberOfLines={3}>
            “{modo.salida.nota}”
          </Text>
        ) : null}
        <TouchableOpacity
          style={styles.btnSec}
          onPress={() => onAccion({ tipo: "captura" })}
          accessibilityRole="button"
          accessibilityLabel="Registrar captura"
        >
          <Text style={styles.btnSecTxt}>Añadir captura →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (modo.id === "registrar") {
    return (
      <View style={styles.card}>
        <Text style={styles.kicker}>Siguiente paso</Text>
        <Text style={styles.titulo}>Registrar salida de hoy</Text>
        <Text style={styles.sub}>
          Preparación lista
          {veredictoTexto ? ` · ${veredictoTexto}` : ""}
          {etiquetaPunto ? ` · ${etiquetaPunto}` : ""}
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Nota rápida (opcional)"
          placeholderTextColor={COLORS.textMuted}
          value={nota}
          onChangeText={setNota}
          maxLength={140}
        />
        <TouchableOpacity
          style={styles.btn}
          onPress={() => void registrar()}
          disabled={guardando || !veredictoTexto}
          accessibilityRole="button"
          accessibilityLabel="Guardar salida de hoy"
        >
          <Text style={styles.btnTxt}>{guardando ? "Guardando…" : "Guardar salida de hoy"}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const copy =
    modo.id === "guia"
      ? {
          kicker: "Siguiente paso",
          titulo: "Tu primera salida",
          sub: "Guía corta: sitio fácil, licencia y qué llevar. O salta y mira el mapa.",
          cta: "Empezar guía",
          accion: { tipo: "primera_salida" } as SiguientePasoAccion,
        }
      : modo.id === "sin_sitios"
        ? {
            kicker: "Siguiente paso",
            titulo: "Guarda tu primer sitio",
            sub: "Un favorito o punto: mañana te diremos cuál pinta mejor.",
            cta: "Abrir mapa",
            accion: { tipo: "mapa" } as SiguientePasoAccion,
          }
      : modo.id === "sin_punto"
        ? {
            kicker: "Siguiente paso",
            titulo: "Elige el punto del día",
            sub: "GPS, mapa o un sitio guardado en «Salgo a pescar».",
            cta: "Salgo a pescar",
            accion: { tipo: "salgo" } as SiguientePasoAccion,
          }
        : modo.id === "checklist"
          ? {
              kicker: "Siguiente paso",
              titulo: "Revisa qué llevar",
              sub: `${modo.hechos}/${modo.total} listos · ${etiquetaPunto ?? "punto elegido"}`,
              cta: "Continuar preparación",
              accion: { tipo: "salgo", irAChecklist: true } as SiguientePasoAccion,
            }
          : {
              kicker: "Siguiente paso",
              titulo: "Revisa qué llevar",
              sub: etiquetaPunto ?? "punto elegido",
              cta: "Continuar",
              accion: { tipo: "salgo" } as SiguientePasoAccion,
            };

  return (
    <PulsePress onPress={() => onAccion(copy.accion)} style={styles.ctaWrap}>
      <LinearGradient colors={[...GRADIENTS.water]} style={styles.ctaInner}>
        <OndaAgua intensidad={0.85} />
        <View style={styles.ctaRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.ctaKicker}>{copy.kicker}</Text>
            <Text style={styles.ctaTitulo}>{copy.titulo}</Text>
            <Text style={styles.ctaSub} numberOfLines={2}>
              {copy.sub}
            </Text>
            <Text style={styles.ctaLink}>{copy.cta} →</Text>
          </View>
        </View>
      </LinearGradient>
    </PulsePress>
  );
}

const styles = StyleSheet.create({
  cargando: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 16,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
    ...SHADOW_SOFT,
  },
  cargandoTxt: { fontSize: 12, color: COLORS.textSecondary, fontWeight: "600" },
  ctaWrap: { marginBottom: 8, borderRadius: RADIUS.lg, overflow: "hidden", ...SHADOW_SOFT },
  ctaInner: { padding: 16, borderRadius: RADIUS.lg, overflow: "hidden" },
  ctaRow: { flexDirection: "row", alignItems: "center" },
  ctaKicker: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  ctaTitulo: { color: "#fff", fontSize: 22, fontWeight: "800", marginTop: 4 },
  ctaSub: { color: "rgba(255,255,255,0.92)", fontSize: 13, marginTop: 4, lineHeight: 18 },
  ctaLink: { color: "#fff", fontWeight: "800", marginTop: 10, fontSize: 14 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.water,
    marginBottom: 8,
    ...SHADOW_SOFT,
  },
  hecha: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: "#c5d9cc",
    marginBottom: 8,
    ...SHADOW_SOFT,
  },
  kicker: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: COLORS.textMuted,
  },
  titulo: { fontSize: 18, fontWeight: "800", color: COLORS.textPrimary, marginTop: 4 },
  sub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, lineHeight: 18 },
  nota: {
    marginTop: 8,
    fontSize: 13,
    fontStyle: "italic",
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  input: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.mist,
  },
  btn: {
    marginTop: 12,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnTxt: { color: "#fff", fontWeight: "800" },
  btnSec: { marginTop: 10, alignSelf: "flex-start" },
  btnSecTxt: { color: COLORS.primary, fontWeight: "800", fontSize: 14 },
});
