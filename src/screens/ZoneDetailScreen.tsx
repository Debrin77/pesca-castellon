import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Linking } from "react-native";
import zones from "../data/zones.json";
import speciesCatalog from "../data/species.json";
import { estaEnVeda } from "../services/vedaService";
import { getEstadoHidrologico, EstacionHidrologica } from "../services/saihService";
import LicenseBanner from "../components/LicenseBanner";
import MejorHoraPesca from "../components/MejorHoraPesca";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, GRADIENTS, RADIUS, SHADOW } from "../theme";

interface Props {
  route: { params: { zoneId: string } };
  navigation: any;
}

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export default function ZoneDetailScreen({ route, navigation }: Props) {
  const { zoneId } = route.params;
  const zone: any = (zones as any[]).find((z: any) => z.id === zoneId);
  const [hidro, setHidro] = useState<EstacionHidrologica | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;
    getEstadoHidrologico(zone?.saihNombre ?? null, zone?.saihFichaId).then((data) => {
      if (activo) {
        setHidro(data);
        setCargando(false);
      }
    });
    return () => {
      activo = false;
    };
  }, [zoneId]);

  if (!zone) {
    return (
      <View style={styles.center}>
        <Text>Zona no encontrada.</Text>
      </View>
    );
  }

  const mesActual = MESES[new Date().getMonth()];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
      <LinearGradient colors={GRADIENTS.primary} style={styles.headerCard}>
        <Text style={styles.title}>{zone.nombre}</Text>
        <Text style={styles.subtitle}>{zone.rio} · {zone.municipio}</Text>
        <View style={styles.badgeRow}>
          <Text style={styles.badgeVocacion}>{zone.vocacionOficial}</Text>
          <Text style={styles.badgeEstado}>Zona {zone.estadoZona}</Text>
        </View>
        <Text style={styles.desc}>{zone.descripcion}</Text>
      </LinearGradient>

      <LicenseBanner onPress={() => navigation.navigate("License")} />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>💧 Estado del embalse (SAIH)</Text>
        {cargando ? (
          <ActivityIndicator color={COLORS.water} />
        ) : hidro ? (
          <View>
            {hidro.porcentajeLleno !== null && (
              <Text style={styles.cardText}>Volumen: {hidro.porcentajeLleno.toFixed(1)}% de su capacidad</Text>
            )}
            {hidro.volumenEmbalsadoHm3 !== null && hidro.volumenMaximoHm3 !== null && (
              <Text style={styles.cardText}>
                {hidro.volumenEmbalsadoHm3.toFixed(2)} hm³ de {hidro.volumenMaximoHm3.toFixed(2)} hm³
              </Text>
            )}
            {hidro.caudalRecibido !== null && (
              <Text style={styles.cardText}>Caudal recibido: {hidro.caudalRecibido} m³/s</Text>
            )}
            {hidro.caudalSalida !== null && (
              <Text style={styles.cardText}>Caudal de salida: {hidro.caudalSalida} m³/s</Text>
            )}
            {hidro.fechaDato && <Text style={styles.cardNote}>Dato del {hidro.fechaDato}</Text>}
            <Text style={styles.cardNote}>
              {hidro.fuente === "simulado"
                ? "⚠️ No se pudo consultar el SAIH ahora mismo (puede ser por CORS en la versión web) — dato de ejemplo."
                : "Fuente: SAIH Confederación Hidrográfica del Júcar"}
            </Text>
            {hidro.urlFicha && (
              <Text style={styles.linkText} onPress={() => Linking.openURL(hidro.urlFicha!)}>
                Ver ficha oficial completa →
              </Text>
            )}
          </View>
        ) : (
          <Text style={styles.cardText}>Sin estación hidrológica asociada a esta zona.</Text>
        )}
      </View>

      <Text style={styles.sectionTitle}>Especies presentes</Text>
      {zone.especies.map((especieId: string) => {
        const sp = speciesCatalog.find((s: any) => s.id === especieId);
        if (!sp) return null;
        const enVeda = estaEnVeda(especieId);
        const mejoresMeses: string[] = zone.mejoresEpocas?.[especieId] ?? [];
        const esBuenMes = mejoresMeses.includes(mesActual);

        return (
          <View key={especieId} style={[styles.card, sp.invasora && styles.cardInvasora]}>
            <Text style={styles.cardTitle}>
              {sp.icono} {sp.nombre}{" "}
              {sp.invasora && <Text style={styles.badgeInvasora}> INVASORA</Text>}
            </Text>
            <Text style={styles.cardNote}>{sp.nombreCientifico}</Text>
            <Text style={styles.cardText}>{sp.notas}</Text>
            <MejorHoraPesca especie={sp} />

            {sp.normativaEspecial && (
              <View style={styles.avisoLegalBox}>
                <Text style={styles.avisoLegalText}>{sp.normativaEspecial}</Text>
              </View>
            )}

            <Text style={[styles.cardText, { marginTop: 6 }]}>
              Estado ahora:{" "}
              <Text style={{ fontWeight: "bold", color: enVeda ? COLORS.danger : COLORS.success }}>
                {enVeda ? "EN VEDA (no pescar)" : "Periodo hábil"}
              </Text>
            </Text>

            {mejoresMeses.length > 0 && (
              <Text style={styles.cardText}>
                Mejores meses: {mejoresMeses.join(", ")}{" "}
                {esBuenMes && <Text style={{ color: COLORS.success, fontWeight: "bold" }}>⭐ ¡Ahora es buena época!</Text>}
              </Text>
            )}

            {sp.equipo && (
              <View style={styles.equipoBox}>
                <Text style={styles.equipoTitle}>🎣 Equipo recomendado</Text>
                <Text style={styles.equipoItem}>Caña: {sp.equipo.cana}</Text>
                <Text style={styles.equipoItem}>Carrete: {sp.equipo.carrete}</Text>
                <Text style={styles.equipoItem}>Línea: {sp.equipo.linea}</Text>
                {sp.equipo.senuelosCebos?.length > 0 && (
                  <Text style={styles.equipoItem}>
                    Señuelos/cebos: {sp.equipo.senuelosCebos.join(", ")}
                  </Text>
                )}
                <Text style={styles.equipoItem}>Técnica: {sp.equipo.tecnica}</Text>
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerCard: {
    borderRadius: RADIUS.lg,
    padding: 18,
    marginBottom: 12,
    ...SHADOW,
  },
  title: { fontSize: 21, fontWeight: "800", color: "#fff" },
  subtitle: { fontSize: 13.5, color: "#dfeee5", marginTop: 2, marginBottom: 10 },
  badgeRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  badgeVocacion: {
    fontSize: 11,
    backgroundColor: "rgba(255,255,255,0.2)",
    color: "#fff",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    overflow: "hidden",
    fontWeight: "600",
  },
  badgeEstado: {
    fontSize: 11,
    backgroundColor: "rgba(255,255,255,0.2)",
    color: "#fff",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    overflow: "hidden",
    fontWeight: "600",
  },
  desc: { fontSize: 13.5, color: "#e3f2e9", lineHeight: 19 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginTop: 14, marginBottom: 8, color: COLORS.textPrimary },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW,
  },
  cardInvasora: { borderColor: COLORS.warning, backgroundColor: "#fffaf3" },
  cardTitle: { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary },
  cardText: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  cardNote: { fontSize: 11, color: COLORS.textMuted, marginTop: 2, fontStyle: "italic" },
  linkText: { fontSize: 12.5, color: COLORS.water, fontWeight: "600", marginTop: 8 },
  avisoLegalBox: {
    marginTop: 10,
    backgroundColor: COLORS.dangerLight,
    borderRadius: RADIUS.sm,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  avisoLegalText: { fontSize: 12, color: "#7a1414", lineHeight: 17, fontWeight: "600" },
  badgeInvasora: { fontSize: 11, color: COLORS.warning, fontWeight: "bold" },
  equipoBox: {
    marginTop: 10,
    backgroundColor: COLORS.waterLight,
    borderRadius: RADIUS.sm,
    padding: 10,
  },
  equipoTitle: { fontSize: 12.5, fontWeight: "700", color: COLORS.water, marginBottom: 4 },
  equipoItem: { fontSize: 12, color: "#0d3c5c", marginBottom: 2, lineHeight: 16 },
});
