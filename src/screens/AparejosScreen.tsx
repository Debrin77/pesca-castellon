import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useScrollToTop } from "@react-navigation/native";
import speciesCatalog from "../data/species.json";
import orilla from "../data/especiesOrilla.json";
import aparejosOrilla from "../data/aparejosOrilla.json";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, GRADIENTS, RADIUS, SHADOW } from "../theme";
import ListaAnimada from "../components/ListaAnimada";
import MejorHoraPesca from "../components/MejorHoraPesca";

interface Props {
  route?: { params?: { especieId?: string } };
}

type Equipo = {
  cana: string;
  carrete: string;
  linea: string;
  senuelosCebos: string[];
  tecnica: string;
};

export default function AparejosScreen({ route }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);
  const costaLista = useMemo(
    () => [...(orilla.invasorasOrilla as any[]), ...(orilla.pescablesOrilla as any[])],
    []
  );
  const costaIds = useMemo(() => new Set(costaLista.map((s) => s.id)), [costaLista]);
  const [ambito, setAmbito] = useState<"rio" | "costa">("rio");
  const [seleccionada, setSeleccionada] = useState<string | null>(speciesCatalog[0]?.id ?? null);

  useEffect(() => {
    const id = route?.params?.especieId;
    if (!id) return;
    if (costaIds.has(id)) {
      setAmbito("costa");
      setSeleccionada(id);
    } else {
      setAmbito("rio");
      setSeleccionada(id);
    }
  }, [route?.params?.especieId, costaIds]);

  const lista = ambito === "costa" ? costaLista : speciesCatalog;
  const sp: any = lista.find((s: any) => s.id === seleccionada) ?? lista[0];
  const equipo: Equipo | undefined =
    ambito === "costa" ? (aparejosOrilla.porId as Record<string, Equipo>)[sp?.id] : sp?.equipo;

  return (
    <View style={styles.container}>
      <View style={styles.modoBar}>
        <TouchableOpacity
          style={[styles.modoBtn, ambito === "rio" && styles.modoBtnOn]}
          onPress={() => {
            setAmbito("rio");
            setSeleccionada(speciesCatalog[0]?.id ?? null);
          }}
        >
          <Text style={[styles.modoTxt, ambito === "rio" && styles.modoTxtOn]}>Ríos y embalses</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modoBtn, ambito === "costa" && styles.modoBtnOn]}
          onPress={() => {
            setAmbito("costa");
            setSeleccionada(costaLista[0]?.id ?? null);
          }}
        >
          <Text style={[styles.modoTxt, ambito === "costa" && styles.modoTxtOn]}>Costa (orilla)</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipBar}
        contentContainerStyle={{ paddingHorizontal: 12 }}
      >
        {lista.map((s: any) => (
          <TouchableOpacity
            key={s.id}
            style={[styles.chip, seleccionada === s.id && styles.chipActive]}
            onPress={() => setSeleccionada(s.id)}
          >
            <Text style={[styles.chipText, seleccionada === s.id && styles.chipTextActive]}>
              {s.icono ? `${s.icono} ` : ""}
              {s.nombre}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView ref={scrollRef} style={styles.content} contentContainerStyle={{ padding: 16, paddingBottom: 110 }}>
        {sp ? (
          <ListaAnimada key={`${ambito}-${sp.id}`} replayKey={`${ambito}-${sp.id}`} index={0}>
            <LinearGradient
              colors={sp.invasora || sp.id === "cangrejo_azul" ? GRADIENTS.sunset : ambito === "costa" ? GRADIENTS.water : GRADIENTS.primary}
              style={styles.headerCard}
            >
              <Text style={styles.headerKicker}>{ambito === "costa" ? "Desde tierra · Mediterráneo" : "Continental · Castellón"}</Text>
              <Text style={styles.headerName}>{sp.nombre}</Text>
              <Text style={styles.headerScientific}>{sp.nombreCientifico}</Text>
              {(sp.invasora || sp.id === "cangrejo_azul") && (
                <Text style={styles.headerBadge}>ESPECIE INVASORA · NO DEVOLVER</Text>
              )}
            </LinearGradient>

            {ambito === "costa" ? (
              <Text style={styles.stat}>
                Talla: {sp.tallaCm != null ? `${sp.tallaCm} cm` : sp.tallaOficial ?? "sin cifra en anexo II"}
                {sp.tallaNota ? ` · ${sp.tallaNota}` : ""}
              </Text>
            ) : (
              <>
                {sp.tallaOficial ? <Text style={styles.stat}>Talla / régimen: {sp.tallaOficial}</Text> : null}
                {sp.cupo ? <Text style={styles.stat}>Cupo: {sp.cupo}</Text> : null}
              </>
            )}

            {sp.normativaResumen ? <Text style={styles.notes}>{sp.normativaResumen}</Text> : null}
            <Text style={styles.notes}>{sp.notas}</Text>
            {sp.noConfundirCon ? (
              <Text style={styles.notes}>No lo confundas con: {sp.noConfundirCon}</Text>
            ) : null}

            <MejorHoraPesca especie={sp} />

            {ambito === "rio" && (sp.habitats || sp.senuelosClave?.length) ? (
              <View style={[styles.gearCard, { marginTop: 12 }]}>
                {sp.habitats ? (
                  <>
                    <Text style={styles.gearRowLabel}>Dónde en Castellón</Text>
                    <Text style={styles.gearRowValue}>{sp.habitats}</Text>
                  </>
                ) : null}
                {sp.senuelosClave?.length > 0 && (
                  <>
                    <Text style={styles.gearRowLabel}>Señuelos que más funcionan</Text>
                    {sp.senuelosClave.map((s: string, i: number) => (
                      <Text key={i} style={styles.gearBullet}>
                        • {s}
                      </Text>
                    ))}
                  </>
                )}
              </View>
            ) : null}

            {sp.normativaEspecial && (
              <View style={styles.avisoLegalBox}>
                <Text style={styles.avisoLegalText}>{sp.normativaEspecial}</Text>
              </View>
            )}

            {equipo ? (
              <View style={styles.gearCard}>
                <Text style={styles.gearTitle}>Equipo de orilla</Text>
                {ambito === "costa" ? <Text style={styles.gearAviso}>{aparejosOrilla.aviso}</Text> : null}
                <Text style={styles.gearRowLabel}>Caña</Text>
                <Text style={styles.gearRowValue}>{equipo.cana}</Text>
                <Text style={styles.gearRowLabel}>Carrete</Text>
                <Text style={styles.gearRowValue}>{equipo.carrete}</Text>
                <Text style={styles.gearRowLabel}>Línea</Text>
                <Text style={styles.gearRowValue}>{equipo.linea}</Text>
                {equipo.senuelosCebos?.length > 0 && (
                  <>
                    <Text style={styles.gearRowLabel}>Señuelos / cebos</Text>
                    {equipo.senuelosCebos.map((s: string, i: number) => (
                      <Text key={i} style={styles.gearBullet}>
                        • {s}
                      </Text>
                    ))}
                  </>
                )}
                <Text style={styles.gearRowLabel}>Técnica</Text>
                <Text style={styles.gearRowValue}>{equipo.tecnica}</Text>
              </View>
            ) : (
              <Text style={styles.emptyText}>No hay recomendaciones de equipo para esta especie.</Text>
            )}
          </ListaAnimada>
        ) : (
          <Text style={styles.emptyText}>Elige una especie arriba.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  modoBar: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 6,
    backgroundColor: COLORS.surface,
  },
  modoBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },
  modoBtnOn: { backgroundColor: COLORS.waterDark, borderColor: COLORS.waterDark },
  modoTxt: { fontSize: 14, fontWeight: "700", color: COLORS.textSecondary },
  modoTxtOn: { color: "#fff" },
  chipBar: { maxHeight: 56, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.mist,
    marginRight: 8,
    marginVertical: 10,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: { backgroundColor: COLORS.waterDark, borderColor: COLORS.waterDark },
  chipText: { fontSize: 13, color: COLORS.primaryDark, fontWeight: "600" },
  chipTextActive: { color: "#fff", fontWeight: "700" },
  content: { flex: 1 },
  headerCard: {
    borderRadius: RADIUS.xl,
    padding: 22,
    alignItems: "center",
    marginBottom: 14,
    ...SHADOW,
  },
  headerKicker: {
    fontSize: 11,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  headerName: { fontSize: 24, fontWeight: "800", color: "#fff", marginTop: 8, letterSpacing: -0.4 },
  headerScientific: { fontSize: 13, color: "rgba(255,255,255,0.85)", fontStyle: "italic", marginTop: 4 },
  headerBadge: { fontSize: 11, color: "#fff", fontWeight: "800", marginTop: 10, letterSpacing: 0.6 },
  notes: { fontSize: 15, color: COLORS.textSecondary, marginBottom: 10, lineHeight: 22 },
  stat: { fontSize: 14, fontWeight: "700", color: COLORS.waterDark, marginBottom: 8, lineHeight: 20 },
  avisoLegalBox: {
    marginBottom: 12,
    backgroundColor: COLORS.dangerLight,
    borderRadius: RADIUS.sm,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  avisoLegalText: { fontSize: 13, color: "#7a1414", lineHeight: 19, fontWeight: "600" },
  gearCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 8,
    ...SHADOW,
  },
  gearTitle: { fontSize: 16, fontWeight: "800", color: COLORS.primaryDark, marginBottom: 6 },
  gearAviso: { fontSize: 12, color: COLORS.textMuted, lineHeight: 18, marginBottom: 8 },
  gearRowLabel: { fontSize: 12, fontWeight: "800", color: COLORS.water, marginTop: 14, letterSpacing: 0.4, textTransform: "uppercase" },
  gearRowValue: { fontSize: 15, color: COLORS.textPrimary, marginTop: 4, lineHeight: 22 },
  gearBullet: { fontSize: 15, color: COLORS.textPrimary, marginTop: 4, marginLeft: 4, lineHeight: 22 },
  emptyText: { fontSize: 14, color: COLORS.textMuted, textAlign: "center", marginTop: 20, lineHeight: 20 },
});
