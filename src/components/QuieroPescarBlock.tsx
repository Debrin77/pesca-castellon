/**
 * Flujo Inicio: «Quiero pescar…»
 * 1) Si la provincia tiene costa → Río / Orilla / Barco
 * 2) Elegir especie del catálogo de esa modalidad
 * 3) Top 3 zonas / playas / rampas por puntuación del día
 */
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import {
  etiquetaModo,
  etiquetaModoLarga,
  type ModoPescaGlobal,
} from "../data/modoPesca";
import {
  especiesEmbarcacionUsuales,
  especiesOrillaParaSeleccion,
  type EspecieCatalogo,
} from "../services/catalogoEspeciesService";
import {
  elegirTopSitiosPorEspecie,
  type PackSitiosEspecie,
  type SitioEspecieHoy,
} from "../utils/recomendacionPorEspecie";
import { formatearDistanciaKm } from "../utils/cercaMejorPinta";
import { COLORS, RADIUS, TYPE } from "../theme";

type Paso = "cerrado" | "modo" | "especie" | "sitios";

type Props = {
  disponibles: ModoPescaGlobal[];
  /** Catálogo continental de la provincia activa. */
  especiesRio: EspecieCatalogo[];
  ancla: { lat: number; lng: number };
  /** Respaldo costero si el GPS es interior (orilla/barco). */
  anclaCosta?: { lat: number; lng: number } | null;
  modoActual: ModoPescaGlobal | null;
  onElegirModo: (modo: ModoPescaGlobal) => void;
  onAbrirSitio: (sitio: SitioEspecieHoy, modo: ModoPescaGlobal) => void;
};

const ORDINALES = ["1ª", "2ª", "3ª"];

function catalogoDeModo(
  modo: ModoPescaGlobal,
  especiesRio: EspecieCatalogo[]
): EspecieCatalogo[] {
  if (modo === "orilla") return especiesOrillaParaSeleccion();
  if (modo === "barco") return especiesEmbarcacionUsuales();
  return especiesRio;
}

function anclaParaModo(
  modo: ModoPescaGlobal,
  ancla: { lat: number; lng: number },
  anclaCosta?: { lat: number; lng: number } | null
): { lat: number; lng: number } {
  if ((modo === "orilla" || modo === "barco") && anclaCosta) return anclaCosta;
  return ancla;
}

export default function QuieroPescarBlock({
  disponibles,
  especiesRio,
  ancla,
  anclaCosta,
  modoActual,
  onElegirModo,
  onAbrirSitio,
}: Props) {
  const multi = disponibles.length > 1;
  const [paso, setPaso] = useState<Paso>("cerrado");
  const [modo, setModo] = useState<ModoPescaGlobal | null>(null);
  const [especie, setEspecie] = useState<EspecieCatalogo | null>(null);
  const [pack, setPack] = useState<PackSitiosEspecie | null>(null);
  const [cargando, setCargando] = useState(false);

  const listaEspecies = useMemo(
    () => (modo ? catalogoDeModo(modo, especiesRio) : []),
    [modo, especiesRio]
  );

  useEffect(() => {
    if (paso !== "sitios" || !modo || !especie) return;
    let vivo = true;
    setCargando(true);
    setPack(null);
    const anclaModo = anclaParaModo(modo, ancla, anclaCosta);
    elegirTopSitiosPorEspecie({
      especieId: especie.id,
      modo,
      ancla: anclaModo,
    })
      .then((p) => {
        if (vivo) setPack(p);
      })
      .finally(() => {
        if (vivo) setCargando(false);
      });
    return () => {
      vivo = false;
    };
  }, [paso, modo, especie?.id, ancla.lat, ancla.lng, anclaCosta?.lat, anclaCosta?.lng]);

  function abrir() {
    setEspecie(null);
    setPack(null);
    if (multi) {
      // Si ya eligió modalidad en Inicio, saltamos al catálogo de esa modalidad.
      if (modoActual && disponibles.includes(modoActual)) {
        setModo(modoActual);
        setPaso("especie");
        return;
      }
      setModo(null);
      setPaso("modo");
      return;
    }
    const unico = disponibles[0] ?? "rio";
    setModo(unico);
    setPaso("especie");
  }

  function elegirModo(m: ModoPescaGlobal) {
    setModo(m);
    onElegirModo(m);
    setEspecie(null);
    setPack(null);
    setPaso("especie");
  }

  function elegirEspecie(sp: EspecieCatalogo) {
    setEspecie(sp);
    setPack(null);
    setPaso("sitios");
  }

  function volver() {
    if (paso === "sitios") {
      setEspecie(null);
      setPack(null);
      setPaso("especie");
      return;
    }
    if (paso === "especie" && multi) {
      setModo(null);
      setPaso("modo");
      return;
    }
    setPaso("cerrado");
    setModo(null);
    setEspecie(null);
    setPack(null);
  }

  if (paso === "cerrado") {
    return (
      <TouchableOpacity
        style={styles.cta}
        onPress={abrir}
        accessibilityRole="button"
        accessibilityLabel="Quiero pescar: elegir especie y ver 3 zonas hoy"
      >
        <Text style={styles.ctaTitulo}>Quiero pescar…</Text>
        <Text style={styles.ctaSub}>
          {multi
            ? "Elige río, orilla o barco · especie · 3 zonas con mejor puntuación"
            : "Elige especie · 3 zonas con mejor puntuación hoy"}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.box} accessibilityRole="summary">
      <View style={styles.cabecera}>
        <TouchableOpacity
          onPress={volver}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.volver}>‹ Volver</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setPaso("cerrado");
            setModo(null);
            setEspecie(null);
            setPack(null);
          }}
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.cerrar}>Cerrar</Text>
        </TouchableOpacity>
      </View>

      {paso === "modo" ? (
        <>
          <Text style={styles.kicker}>¿Cómo vas a pescar?</Text>
          <Text style={styles.lead}>
            Hay costa en esta provincia: elige modalidad y te mostramos especies y zonas.
          </Text>
          <View style={styles.modosRow}>
            {disponibles.map((m) => {
              const mar = m === "orilla" || m === "barco";
              return (
                <TouchableOpacity
                  key={m}
                  style={[styles.modoBtn, mar ? styles.modoBtnMar : styles.modoBtnRio]}
                  onPress={() => elegirModo(m)}
                  accessibilityRole="button"
                  accessibilityLabel={etiquetaModoLarga(m)}
                >
                  <Text style={styles.modoBtnTitulo}>{etiquetaModo(m)}</Text>
                  <Text style={styles.modoBtnSub} numberOfLines={2}>
                    {m === "rio" ? "Ríos y embalses" : m === "orilla" ? "Desde tierra" : "Kayak / barco"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      ) : null}

      {paso === "especie" && modo ? (
        <>
          <Text style={styles.kicker}>¿Qué quieres pescar?</Text>
          <Text style={styles.lead}>
            {etiquetaModoLarga(modo)} · toca una especie para el top 3 de hoy
          </Text>
          <ScrollView
            style={styles.listaScroll}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            {listaEspecies.map((sp) => (
              <TouchableOpacity
                key={sp.id}
                style={styles.especieFila}
                onPress={() => elegirEspecie(sp)}
                accessibilityRole="button"
                accessibilityLabel={sp.nombre}
              >
                <Text style={styles.especieIcon}>{sp.icono ?? "·"}</Text>
                <View style={styles.especieTxt}>
                  <Text style={styles.especieNombre} numberOfLines={1}>
                    {sp.nombre}
                  </Text>
                  {sp.invasora ? (
                    <Text style={styles.especieMeta}>Invasora · mira la norma</Text>
                  ) : sp.nombreCientifico ? (
                    <Text style={styles.especieMeta} numberOfLines={1}>
                      {sp.nombreCientifico}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      ) : null}

      {paso === "sitios" && modo && especie ? (
        <>
          <Text style={styles.kicker}>Sitios hoy · {especie.nombre}</Text>
          <Text style={styles.lead}>
            {etiquetaModo(modo)} · presencia en catálogo + pulso del día
          </Text>
          {cargando && !pack ? (
            <View style={styles.cargando}>
              <ActivityIndicator color={COLORS.water} />
              <Text style={styles.cargandoTxt}>Buscando las 3 mejores…</Text>
            </View>
          ) : null}
          {pack && pack.filas.length === 0 ? (
            <Text style={styles.vacio}>{pack.aviso ?? "Sin sitios recomendables ahora."}</Text>
          ) : null}
          {pack?.orientativoSinCatalogo && pack.aviso ? (
            <Text style={styles.aviso}>{pack.aviso}</Text>
          ) : null}
          {pack?.filas.map((fila, i) => (
            <TouchableOpacity
              key={fila.id}
              style={styles.sitioFila}
              onPress={() => onAbrirSitio(fila, modo)}
              accessibilityRole="button"
              accessibilityLabel={`${ORDINALES[i]}: ${fila.nombre}, ${fila.etiqueta} ${fila.puntuacion}`}
            >
              <View style={[styles.ord, { backgroundColor: fila.color }]}>
                <Text style={styles.ordTxt}>{ORDINALES[i] ?? `${i + 1}`}</Text>
              </View>
              <View style={styles.sitioTxt}>
                <Text style={styles.sitioNombre} numberOfLines={2}>
                  {fila.nombre}
                </Text>
                <Text style={styles.sitioMeta} numberOfLines={1}>
                  {fila.etiqueta} · {fila.puntuacion}
                  {fila.iconoLuna ? ` ${fila.iconoLuna}` : ""}
                  {` · ${formatearDistanciaKm(fila.distanciaKm)}`}
                </Text>
                <Text style={styles.sitioMotivo} numberOfLines={1}>
                  {fila.motivo}
                </Text>
              </View>
              <Text style={[styles.chevron, { color: fila.color }]}>›</Text>
            </TouchableOpacity>
          ))}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cta: {
    marginBottom: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.mist,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  ctaTitulo: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.primaryDark,
  },
  ctaSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  box: {
    marginBottom: 16,
    padding: 14,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.mist,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  cabecera: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  volver: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.waterDark,
  },
  cerrar: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  kicker: {
    ...TYPE.overline,
    color: COLORS.textSecondary,
  },
  lead: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 4,
  },
  modosRow: { flexDirection: "row", gap: 8 },
  modoBtn: {
    flex: 1,
    minHeight: 64,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: RADIUS.md,
    justifyContent: "center",
  },
  modoBtnRio: { backgroundColor: COLORS.primaryDark },
  modoBtnMar: { backgroundColor: COLORS.waterDark },
  modoBtnTitulo: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
  },
  modoBtnSub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.85)",
    marginTop: 3,
    textAlign: "center",
    lineHeight: 14,
  },
  listaScroll: { maxHeight: 280 },
  especieFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  especieIcon: { fontSize: 20, width: 28, textAlign: "center" },
  especieTxt: { flex: 1, minWidth: 0 },
  especieNombre: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  especieMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  chevron: { fontSize: 22, fontWeight: "300", color: COLORS.textSecondary },
  cargando: { paddingVertical: 16, alignItems: "center", gap: 8 },
  cargandoTxt: { fontSize: 13, color: COLORS.textSecondary },
  vacio: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    paddingVertical: 8,
  },
  aviso: {
    fontSize: 12,
    color: COLORS.warning,
    fontWeight: "600",
    lineHeight: 16,
    marginBottom: 4,
  },
  sitioFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  ord: {
    minWidth: 36,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  ordTxt: { color: "#fff", fontWeight: "800", fontSize: 12 },
  sitioTxt: { flex: 1, minWidth: 0 },
  sitioNombre: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  sitioMeta: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  sitioMotivo: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
