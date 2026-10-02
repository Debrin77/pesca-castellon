import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import type { GrupoModoPesca, ModoPescaGlobal } from "../data/modoPesca";
import {
  etiquetaGrupoModo,
  etiquetaModo,
  esModoKayak,
  modosDelGrupo,
  pistaModo,
  subtituloModo,
  textoPedirModo,
} from "../data/modoPesca";
import { COLORS, RADIUS, TYPE } from "../theme";

type Props = {
  /** Null / no elegido: ninguna pestaña marcada hasta que el usuario pulse. */
  modo: ModoPescaGlobal | null;
  disponibles: ModoPescaGlobal[];
  onChange: (modo: ModoPescaGlobal) => void;
  /**
   * Última modalidad de una sesión anterior. Chip «¿Seguir en…?» (un toque)
   * sin marcar el selector ni asumir el veredicto.
   */
  modoRecordado?: ModoPescaGlobal | null;
  /** Variante sobre hero oscuro */
  sobreOscuro?: boolean;
  compacto?: boolean;
};

function tonoBoton(m: ModoPescaGlobal): "rio" | "mar" | "kayak" {
  if (esModoKayak(m)) return "kayak";
  if (m === "orilla" || m === "barco") return "mar";
  return "rio";
}

function GrupoFila({
  grupo,
  modos,
  modo,
  elegido,
  sobreOscuro,
  compacto,
  onChange,
}: {
  grupo: GrupoModoPesca;
  modos: ModoPescaGlobal[];
  modo: ModoPescaGlobal | null;
  elegido: boolean;
  sobreOscuro?: boolean;
  compacto?: boolean;
  onChange: (modo: ModoPescaGlobal) => void;
}) {
  if (modos.length === 0) return null;
  return (
    <View style={styles.grupo}>
      {!compacto ? (
        <Text style={[styles.grupoLbl, sobreOscuro && styles.grupoLblOscuro]}>
          {etiquetaGrupoModo(grupo)}
        </Text>
      ) : null}
      <View style={styles.row}>
        {modos.map((m) => {
          const on = elegido && m === modo;
          const tono = tonoBoton(m);
          const kayak = esModoKayak(m);
          return (
            <TouchableOpacity
              key={m}
              style={[
                styles.btn,
                kayak && styles.btnKayakIdle,
                sobreOscuro && styles.btnOscuro,
                sobreOscuro && kayak && styles.btnKayakIdleOscuro,
                on && tono === "rio" && styles.btnOnRio,
                on && tono === "mar" && styles.btnOnMar,
                on && tono === "kayak" && styles.btnOnKayak,
              ]}
              onPress={() => onChange(m)}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${etiquetaModo(m)}. ${pistaModo(m)}`}
            >
              {kayak && !compacto ? (
                <Text style={[styles.estrella, on && styles.estrellaOn]} accessibilityElementsHidden>
                  ★
                </Text>
              ) : null}
              <Text
                style={[
                  styles.btnTxt,
                  kayak && styles.btnTxtKayak,
                  sobreOscuro && styles.btnTxtOscuro,
                  on && styles.btnTxtOn,
                ]}
              >
                {etiquetaModo(m)}
              </Text>
              {!compacto ? (
                <Text
                  style={[
                    styles.btnPista,
                    kayak && styles.btnPistaKayak,
                    sobreOscuro && styles.btnPistaOscuro,
                    on && styles.btnPistaOn,
                  ]}
                  numberOfLines={1}
                >
                  {pistaModo(m)}
                </Text>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

/**
 * Selector agrupado: Continental (Río / Embalse / Kayak) y Costa (Orilla / Kayak / Barco).
 * Kayak va destacado — es modalidad propia, no un subtítulo de «Barco».
 */
export default function SelectorModoPesca({
  modo,
  disponibles,
  onChange,
  modoRecordado = null,
  sobreOscuro,
  compacto,
}: Props) {
  if (disponibles.length <= 1) return null;

  const elegido = modo != null;
  const mostrarSeguir =
    !elegido && !!modoRecordado && disponibles.includes(modoRecordado);
  const continental = modosDelGrupo(disponibles, "continental");
  const costa = modosDelGrupo(disponibles, "costa");
  const hayDosGrupos = continental.length > 0 && costa.length > 0;

  return (
    <View
      style={[styles.wrap, sobreOscuro && styles.wrapOscuro, compacto && styles.wrapCompacto]}
      accessibilityRole="tablist"
    >
      {!compacto ? (
        <Text style={[styles.kicker, sobreOscuro && styles.kickerOscuro]}>¿Cómo vas a pescar?</Text>
      ) : null}

      <GrupoFila
        grupo="continental"
        modos={continental}
        modo={modo}
        elegido={elegido}
        sobreOscuro={sobreOscuro}
        compacto={compacto}
        onChange={onChange}
      />
      {hayDosGrupos ? <View style={styles.separador} /> : null}
      <GrupoFila
        grupo="costa"
        modos={costa}
        modo={modo}
        elegido={elegido}
        sobreOscuro={sobreOscuro}
        compacto={compacto}
        onChange={onChange}
      />

      {mostrarSeguir ? (
        <TouchableOpacity
          style={[
            styles.seguirChip,
            esModoKayak(modoRecordado!) && styles.seguirChipKayak,
            sobreOscuro && styles.seguirChipOscuro,
          ]}
          onPress={() => onChange(modoRecordado!)}
          accessibilityRole="button"
          accessibilityLabel={`Seguir en ${etiquetaModo(modoRecordado!)}`}
        >
          <Text
            style={[
              styles.seguirTxt,
              esModoKayak(modoRecordado!) && styles.seguirTxtKayak,
              sobreOscuro && styles.seguirTxtOscuro,
            ]}
          >
            ¿Seguir en {etiquetaModo(modoRecordado!)}
            {modoRecordado === "kayak_mar" ? " (mar)" : modoRecordado === "kayak" ? " (embalse)" : ""}?
          </Text>
          <Text
            style={[
              styles.seguirCta,
              esModoKayak(modoRecordado!) && styles.seguirCtaKayak,
              sobreOscuro && styles.seguirCtaOscuro,
            ]}
          >
            Sí ›
          </Text>
        </TouchableOpacity>
      ) : null}

      {!compacto ? (
        <Text style={[styles.sub, sobreOscuro && styles.subOscuro]} numberOfLines={3}>
          {elegido
            ? subtituloModo(modo)
            : `${textoPedirModo(disponibles)} para el veredicto y tu punto de hoy`}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  wrapOscuro: {},
  wrapCompacto: { marginBottom: 8 },
  kicker: {
    ...TYPE.overline,
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  kickerOscuro: { color: "rgba(255,255,255,0.85)" },
  grupo: { gap: 6 },
  grupoLbl: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: COLORS.textMuted,
  },
  grupoLblOscuro: { color: "rgba(255,255,255,0.7)" },
  separador: { height: 10 },
  row: { flexDirection: "row", gap: 8 },
  btn: {
    flex: 1,
    minHeight: 48,
    borderRadius: RADIUS.lg,
    borderWidth: 0,
    backgroundColor: COLORS.mist,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  btnKayakIdle: {
    borderColor: "transparent",
    backgroundColor: COLORS.kayakLight,
    borderWidth: 0,
  },
  btnOscuro: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderColor: "transparent",
  },
  btnKayakIdleOscuro: {
    backgroundColor: "rgba(26, 138, 120, 0.35)",
    borderColor: "transparent",
  },
  btnOnRio: {
    backgroundColor: COLORS.primaryDark,
    borderColor: COLORS.primaryDark,
  },
  btnOnMar: {
    backgroundColor: COLORS.waterDark,
    borderColor: COLORS.waterDark,
  },
  btnOnKayak: {
    backgroundColor: COLORS.kayakDark,
    borderColor: COLORS.kayakDark,
    borderWidth: 0,
  },
  estrella: {
    position: "absolute",
    top: 4,
    right: 6,
    fontSize: 11,
    color: COLORS.kayakSun,
    fontWeight: "800",
  },
  estrellaOn: { color: "#ffd089" },
  btnTxt: { fontSize: 14, fontWeight: "800", color: COLORS.textSecondary },
  btnTxtKayak: { color: COLORS.kayakDark },
  btnTxtOscuro: { color: "rgba(255,255,255,0.9)" },
  btnTxtOn: { color: "#fff" },
  btnPista: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textMuted,
  },
  btnPistaKayak: { color: COLORS.kayak },
  btnPistaOscuro: { color: "rgba(255,255,255,0.7)" },
  btnPistaOn: { color: "rgba(255,255,255,0.9)" },
  seguirChip: {
    marginTop: 10,
    minHeight: 44,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.water,
    backgroundColor: "rgba(26, 117, 136, 0.1)",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  seguirChipKayak: {
    borderColor: COLORS.kayak,
    backgroundColor: COLORS.kayakLight,
  },
  seguirChipOscuro: {
    backgroundColor: "rgba(255,255,255,0.16)",
    borderColor: "rgba(255,255,255,0.45)",
  },
  seguirTxt: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.waterDark,
  },
  seguirTxtKayak: { color: COLORS.kayakDark },
  seguirTxtOscuro: { color: "#fff" },
  seguirCta: { fontSize: 14, fontWeight: "800", color: COLORS.waterDark },
  seguirCtaKayak: { color: COLORS.kayakDark },
  seguirCtaOscuro: { color: "#fff" },
  sub: {
    marginTop: 8,
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "600",
    lineHeight: 16,
  },
  subOscuro: { color: "rgba(255,255,255,0.8)" },
});
