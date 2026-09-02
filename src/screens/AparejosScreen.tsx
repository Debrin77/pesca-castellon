import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import speciesCatalog from "../data/species.json";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, GRADIENTS, RADIUS, SHADOW } from "../theme";

interface Props {
  route?: { params?: { especieId?: string } };
}

export default function AparejosScreen({ route }: Props) {
  const [seleccionada, setSeleccionada] = useState<string | null>(speciesCatalog[0]?.id ?? null);

  // Si venimos desde la pestaña de Especies con una especie concreta, la preseleccionamos
  useEffect(() => {
    if (route?.params?.especieId) {
      setSeleccionada(route.params.especieId);
    }
  }, [route?.params?.especieId]);

  const sp = speciesCatalog.find((s: any) => s.id === seleccionada);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipBar}
        contentContainerStyle={{ paddingHorizontal: 12 }}
      >
        {speciesCatalog.map((s: any) => (
          <TouchableOpacity
            key={s.id}
            style={[styles.chip, seleccionada === s.id && styles.chipActive]}
            onPress={() => setSeleccionada(s.id)}
          >
            <Text style={[styles.chipText, seleccionada === s.id && styles.chipTextActive]}>
              {s.icono} {s.nombre}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {sp && (
          <>
            <LinearGradient
              colors={sp.invasora ? GRADIENTS.sunset : GRADIENTS.primary}
              style={styles.headerCard}
            >
              <Text style={styles.headerIcon}>{sp.icono}</Text>
              <Text style={styles.headerName}>{sp.nombre}</Text>
              <Text style={styles.headerScientific}>{sp.nombreCientifico}</Text>
              {sp.invasora && <Text style={styles.headerBadge}>ESPECIE INVASORA</Text>}
            </LinearGradient>

            {sp.tallaOficial ? <Text style={styles.stat}>Talla / régimen: {sp.tallaOficial}</Text> : null}
            {sp.cupo ? <Text style={styles.stat}>Cupo: {sp.cupo}</Text> : null}
            {sp.normativaResumen ? <Text style={styles.notes}>{sp.normativaResumen}</Text> : null}

            <Text style={styles.notes}>{sp.notas}</Text>

            {sp.ventanas ? (
              <View style={styles.gearCard}>
                <Text style={styles.gearRowLabel}>Cuándo</Text>
                <Text style={styles.gearRowValue}>{sp.ventanas}</Text>
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
                      <Text key={i} style={styles.gearBullet}>• {s}</Text>
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

            {sp.equipo ? (
              <View style={styles.gearCard}>
                <Text style={styles.gearRowLabel}>🎣 Caña</Text>
                <Text style={styles.gearRowValue}>{sp.equipo.cana}</Text>

                <Text style={styles.gearRowLabel}>🎡 Carrete</Text>
                <Text style={styles.gearRowValue}>{sp.equipo.carrete}</Text>

                <Text style={styles.gearRowLabel}>🧵 Línea</Text>
                <Text style={styles.gearRowValue}>{sp.equipo.linea}</Text>

                {sp.equipo.senuelosCebos?.length > 0 && (
                  <>
                    <Text style={styles.gearRowLabel}>🪱 Señuelos / cebos</Text>
                    {sp.equipo.senuelosCebos.map((s: string, i: number) => (
                      <Text key={i} style={styles.gearBullet}>• {s}</Text>
                    ))}
                  </>
                )}

                <Text style={styles.gearRowLabel}>🧭 Técnica</Text>
                <Text style={styles.gearRowValue}>{sp.equipo.tecnica}</Text>
              </View>
            ) : (
              <Text style={styles.emptyText}>No hay recomendaciones de equipo para esta especie.</Text>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  chipBar: { maxHeight: 56, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    marginRight: 8,
    marginVertical: 10,
    justifyContent: "center",
  },
  chipActive: { backgroundColor: COLORS.primary },
  chipText: { fontSize: 13, color: COLORS.primaryDark },
  chipTextActive: { color: "#fff", fontWeight: "600" },
  content: { flex: 1 },
  headerCard: {
    borderRadius: RADIUS.lg,
    padding: 20,
    alignItems: "center",
    marginBottom: 12,
    ...SHADOW,
  },
  headerIcon: { fontSize: 36 },
  headerName: { fontSize: 19, fontWeight: "700", color: "#fff", marginTop: 4 },
  headerScientific: { fontSize: 12.5, color: "#e3f2fd", fontStyle: "italic", marginTop: 2 },
  headerBadge: { fontSize: 11, color: "#fff", fontWeight: "700", marginTop: 8, letterSpacing: 0.5 },
  notes: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 12, lineHeight: 19 },
  stat: { fontSize: 13, fontWeight: "700", color: COLORS.primary, marginBottom: 6 },
  avisoLegalBox: {
    marginBottom: 12,
    backgroundColor: COLORS.dangerLight,
    borderRadius: RADIUS.sm,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  avisoLegalText: { fontSize: 12.5, color: "#7a1414", lineHeight: 18, fontWeight: "600" },
  gearCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW,
  },
  gearRowLabel: { fontSize: 12.5, fontWeight: "700", color: COLORS.water, marginTop: 12 },
  gearRowValue: { fontSize: 13.5, color: COLORS.textPrimary, marginTop: 3, lineHeight: 19 },
  gearBullet: { fontSize: 13, color: COLORS.textPrimary, marginTop: 3, marginLeft: 4 },
  emptyText: { fontSize: 13, color: COLORS.textMuted, fontStyle: "italic", textAlign: "center", marginTop: 20 },
});
