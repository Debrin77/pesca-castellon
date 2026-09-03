import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import ListaAnimada from "./ListaAnimada";
import MejorHoraPesca from "./MejorHoraPesca";
import SiluetaEspecie from "./SiluetaEspecie";
import { caraDeEspecie } from "../data/carasVisuales";
import { COLORS, RADIUS, SHADOW } from "../theme";

export function tallaDestacada(sp: any): { valor: string; unidad: string; pie: string } {
  if (sp?.tallaCm != null) {
    return { valor: String(sp.tallaCm), unidad: "cm", pie: `Talla mínima ${sp.tallaCm} cm${sp.tallaNota ? ` · ${sp.tallaNota}` : ""}` };
  }
  if (sp?.tallaKg != null) {
    return { valor: String(sp.tallaKg), unidad: "kg", pie: `Peso mínimo ${sp.tallaKg} kg${sp.tallaNota ? ` · ${sp.tallaNota}` : ""}` };
  }
  const fuente = `${sp?.tallaOficial ?? ""} ${sp?.tallaNota ?? ""}`;
  const m = fuente.match(/(\d+(?:[.,]\d+)?)\s*(cm|kg)/i);
  if (m) {
    const n = m[1].replace(",", ".");
    const u = m[2].toLowerCase();
    return {
      valor: n,
      unidad: u,
      pie: u === "kg" ? `Peso mínimo ${n} kg` : `Talla mínima ${n} cm${sp.tallaOficial ? ` · ${sp.tallaOficial}` : ""}`,
    };
  }
  if (/sin muerte/i.test(fuente)) return { valor: "SM", unidad: "", pie: "Sin muerte · no hay talla de retención" };
  if (sp?.invasora || sp?.id === "cangrejo_azul") return { valor: "INV", unidad: "", pie: sp.tallaOficial ?? "Invasora · no devolver" };
  return { valor: "—", unidad: "", pie: sp?.tallaOficial ?? sp?.tallaNota ?? "Sin talla mínima en el anexo" };
}

export default function TarjetaEspecie({
  sp,
  index,
  enVeda,
  onAparejos,
  extra,
}: {
  sp: any;
  index: number;
  enVeda?: boolean;
  onAparejos?: () => void;
  extra?: React.ReactNode;
}) {
  const talla = tallaDestacada(sp);
  const invasora = sp.invasora || sp.id === "cangrejo_azul";
  const cara = caraDeEspecie(sp);

  return (
    <ListaAnimada key={sp.id} index={index} replayKey={sp.id}>
      <View style={[styles.card, invasora && styles.cardInvasora]}>
        <LinearGradient colors={[...cara.gradiente]} style={styles.cara}>
          <Text style={styles.caraEmoji}>{cara.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.caraKicker}>{cara.etiqueta}</Text>
            <Text style={styles.caraNombre} numberOfLines={1}>
              {sp.nombre}
            </Text>
          </View>
        </LinearGradient>
        <View style={styles.hero}>
          <SiluetaEspecie id={sp.id} nombre={sp.nombre} color={invasora ? COLORS.warning : COLORS.waterDark} />
          <View style={styles.tallaCaja}>
            <Text style={styles.tallaKicker}>{talla.unidad === "kg" ? "Peso mínimo" : talla.unidad ? "Talla mínima" : "Régimen"}</Text>
            <Text style={styles.tallaNum}>
              {talla.valor}
              {talla.unidad ? <Text style={styles.tallaUnidad}> {talla.unidad}</Text> : null}
            </Text>
            <Text style={styles.tallaPie} numberOfLines={2}>
              {talla.pie}
            </Text>
          </View>
        </View>
        <Text style={styles.cardTitle}>
          {sp.nombre} {invasora ? <Text style={styles.badgeInvasora}>INVASORA</Text> : null}
        </Text>
        <Text style={styles.cardNote}>{sp.nombreCientifico}</Text>
        {sp.cupo ? <Text style={styles.cardStatus}>Cupo: {sp.cupo}</Text> : null}
        {sp.notas ? <Text style={styles.cardText}>{sp.notas}</Text> : null}
        {sp.noConfundirCon ? <Text style={styles.cardText}>No lo confundas con: {sp.noConfundirCon}</Text> : null}
        {sp.motivo ? <Text style={styles.avisoLegalText}>{sp.motivo}</Text> : null}
        <MejorHoraPesca especie={sp} />
        {enVeda != null && (
          <Text style={styles.cardStatus}>
            Estado ahora:{" "}
            <Text style={{ fontWeight: "800", color: enVeda ? COLORS.danger : COLORS.success }}>
              {enVeda ? "EN VEDA" : "Periodo hábil"}
            </Text>
          </Text>
        )}
        {extra}
        {sp.normativaEspecial || sp.normativaResumen ? (
          <View style={[styles.avisoLegalBox, /PROHIB|siluro/i.test(sp.normativaEspecial || "") && styles.avisoFuerte]}>
            <Text style={styles.normativaKicker}>Normativa</Text>
            <Text style={[styles.avisoLegalText, /PROHIB|siluro/i.test(sp.normativaEspecial || "") && styles.avisoFuerteTxt]}>
              {sp.normativaEspecial || sp.normativaResumen}
            </Text>
          </View>
        ) : null}
        {onAparejos ? (
          <TouchableOpacity onPress={onAparejos} style={styles.gearBtn}>
            <Text style={styles.gearLink}>Ver aparejos →</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </ListaAnimada>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 0,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    ...SHADOW,
  },
  cara: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  caraEmoji: { fontSize: 28 },
  caraKicker: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  caraNombre: { color: "#fff", fontSize: 16, fontWeight: "800", marginTop: 1 },
  cardInvasora: { borderColor: COLORS.warning, backgroundColor: "#fffaf3" },
  hero: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8, paddingHorizontal: 16, paddingTop: 12 },
  tallaCaja: { flex: 1 },
  tallaKicker: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.waterDark,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  tallaNum: { fontSize: 44, fontWeight: "800", color: COLORS.textPrimary, letterSpacing: -1.2, lineHeight: 48 },
  tallaUnidad: { fontSize: 22, fontWeight: "700", color: COLORS.waterDark },
  tallaPie: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2, lineHeight: 16 },
  cardTitle: { fontSize: 18, fontWeight: "800", color: COLORS.textPrimary, letterSpacing: -0.3, paddingHorizontal: 16 },
  cardNote: { fontSize: 12, color: COLORS.textSecondary, marginTop: 3, fontStyle: "italic", paddingHorizontal: 16 },
  cardText: { fontSize: 15, color: COLORS.textSecondary, marginTop: 6, lineHeight: 22, paddingHorizontal: 16 },
  avisoLegalBox: {
    marginTop: 12,
    marginHorizontal: 16,
    backgroundColor: COLORS.mist,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  normativaKicker: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  avisoLegalText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19, fontWeight: "600", paddingHorizontal: 16 },
  cardStatus: { fontSize: 14, color: COLORS.textSecondary, marginTop: 8, lineHeight: 20, paddingHorizontal: 16 },
  badgeInvasora: { fontSize: 11, color: COLORS.warning, fontWeight: "800" },
  avisoFuerte: { backgroundColor: COLORS.dangerLight, borderColor: COLORS.danger },
  avisoFuerteTxt: { color: "#7a1414" },
  gearBtn: { marginTop: 12, marginBottom: 14, marginLeft: 16, alignSelf: "flex-start" },
  gearLink: { fontSize: 15, color: COLORS.waterDark, fontWeight: "800" },
});
