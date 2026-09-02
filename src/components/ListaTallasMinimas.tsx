import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import speciesCatalog from "../data/species.json";
import orilla from "../data/especiesOrilla.json";
import { tallaDestacada } from "./TarjetaEspecie";
import { COLORS } from "../theme";

type Fila = { id: string; nombre: string; sp: any };

function filasCosta(): Fila[] {
  const lista = [...(orilla.invasorasOrilla as any[]), ...(orilla.pescablesOrilla as any[])];
  return lista.map((sp) => ({ id: sp.id, nombre: sp.nombre, sp }));
}

function filasRio(): Fila[] {
  return (speciesCatalog as any[]).map((sp) => ({ id: sp.id, nombre: sp.nombre, sp }));
}

function ordenar(filas: Fila[]) {
  return [...filas].sort((a, b) => {
    const ta = tallaDestacada(a.sp);
    const tb = tallaDestacada(b.sp);
    const na = ta.unidad ? Number(ta.valor) || 0 : -1;
    const nb = tb.unidad ? Number(tb.valor) || 0 : -1;
    if (na !== nb) return nb - na;
    return a.nombre.localeCompare(b.nombre, "es");
  });
}

function FilaTalla({ fila, onPress }: { fila: Fila; onPress?: () => void }) {
  const t = tallaDestacada(fila.sp);
  const cifra = t.unidad ? `${t.valor} ${t.unidad}` : t.valor;
  return (
    <TouchableOpacity style={styles.fila} onPress={onPress} disabled={!onPress} accessibilityRole="button">
      <Text style={styles.nombre} numberOfLines={1}>
        {fila.nombre}
      </Text>
      <Text style={[styles.cifra, !t.unidad && styles.cifraSuave]}>{cifra}</Text>
    </TouchableOpacity>
  );
}

export default function ListaTallasMinimas({ onEspecie }: { onEspecie?: (id: string) => void }) {
  return (
    <View>
      <Text style={styles.aviso}>
        Cifra = talla o peso mínimo para retener. SM = sin muerte. INV = invasora (no devolver). Guión = el anexo no fija
        número: no te lleves crías. Lisa: 16 cm en mar, 25 cm en río.
      </Text>
      <Text style={styles.bloque}>Costa · RD 560/1995 anexo II Mediterráneo</Text>
      {ordenar(filasCosta()).map((f) => (
        <FilaTalla key={`m-${f.id}`} fila={f} onPress={onEspecie ? () => onEspecie(f.id) : undefined} />
      ))}
      <Text style={styles.bloque}>Ríos y embalses · Orden 30/2016</Text>
      {ordenar(filasRio()).map((f) => (
        <FilaTalla key={`r-${f.id}`} fila={f} onPress={onEspecie ? () => onEspecie(f.id) : undefined} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  aviso: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19, marginBottom: 14 },
  bloque: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.waterDark,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginTop: 8,
    marginBottom: 6,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    minHeight: 44,
  },
  nombre: { flex: 1, fontSize: 15, fontWeight: "600", color: COLORS.textPrimary, paddingRight: 12 },
  cifra: { fontSize: 20, fontWeight: "800", color: COLORS.water, minWidth: 72, textAlign: "right" },
  cifraSuave: { fontSize: 16, color: COLORS.textSecondary },
});
