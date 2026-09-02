import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Linking, TouchableOpacity } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import zones from "../data/zones.json";
import speciesCatalog from "../data/species.json";
import { estaEnVeda, notaVeda } from "../services/vedaService";
import { getEstadoHidrologico, EstacionHidrologica } from "../services/saihService";
import { alternarFavorito, esFavorito } from "../services/storageService";
import { CHECKLIST_ANTES_DE_PESCAR, FUENTE_NORMATIVA, TALLAS_OFICIALES } from "../data/normativa2026";
import LicenseBanner from "../components/LicenseBanner";
import SitiosOrientativos from "../components/SitiosOrientativos";
import TarjetaEspecie from "../components/TarjetaEspecie";
import TemporadaBanner from "../components/TemporadaBanner";
import { sitiosDeFicha } from "../services/sitiosComunidad";
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
  const [favorito, setFavorito] = useState(false);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    getEstadoHidrologico(zone?.saihNombre ?? null, zone?.saihFichaId).then((data) => {
      if (activo) {
        setHidro(data);
        setCargando(false);
      }
    });
    return () => {
      activo = false;
    };
  }, [zoneId, zone?.saihNombre, zone?.saihFichaId]);

  useFocusEffect(
    useCallback(() => {
      esFavorito(zoneId).then(setFavorito);
    }, [zoneId])
  );

  if (!zone) {
    return (
      <View style={styles.center}>
        <Text>Zona no encontrada.</Text>
      </View>
    );
  }

  const mesActual = MESES[new Date().getMonth()];

  async function toggleFav() {
    const ahora = await alternarFavorito(zone.id, zone.nombre);
    setFavorito(ahora);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
      <LinearGradient colors={GRADIENTS.primary} style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.title}>{zone.nombre}</Text>
            <Text style={styles.subtitle}>
              {zone.rio} · {zone.municipio}
              {zone.cuenca ? ` · cuenca ${zone.cuenca}` : ""}
            </Text>
          </View>
          <TouchableOpacity style={styles.favBtn} onPress={toggleFav} accessibilityLabel="Favorito">
            <Text style={styles.favIcon}>{favorito ? "★" : "☆"}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.badgeRow}>
          <Text style={styles.badgeVocacion}>{zone.vocacionOficial}</Text>
          <Text style={styles.badgeEstado}>Zona {zone.estadoZona}</Text>
        </View>
        <Text style={styles.desc}>{zone.descripcion}</Text>
      </LinearGradient>

      <TemporadaBanner compact />
      <LicenseBanner onPress={() => navigation.navigate("License")} />

      {sitiosDeFicha(zone.id).map((bloque) => (
        <SitiosOrientativos
          key={bloque.tramoNombre}
          titulo={`Sitios que más se citan · ${bloque.tramoNombre}`}
          sitios={bloque.sitios}
        />
      ))}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Estado del embalse (SAIH Júcar)</Text>
        {cargando ? (
          <ActivityIndicator color={COLORS.water} />
        ) : hidro ? (
          <View>
            {hidro.porcentajeLleno !== null && (
              <View style={styles.gaugeWrap}>
                <View style={styles.gaugeTrack}>
                  <View
                    style={[
                      styles.gaugeFill,
                      {
                        width: `${Math.max(0, Math.min(100, hidro.porcentajeLleno))}%`,
                        backgroundColor:
                          hidro.porcentajeLleno < 25
                            ? COLORS.danger
                            : hidro.porcentajeLleno < 50
                              ? COLORS.warning
                              : COLORS.water,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.gaugeLabel}>{hidro.porcentajeLleno.toFixed(1)}% de capacidad</Text>
              </View>
            )}
            {hidro.volumenEmbalsadoHm3 !== null && hidro.volumenMaximoHm3 !== null && (
              <Text style={styles.cardText}>
                {hidro.volumenEmbalsadoHm3.toFixed(2)} hm³ de {hidro.volumenMaximoHm3.toFixed(2)} hm³ (NMN)
              </Text>
            )}
            {hidro.cotaM !== null && <Text style={styles.cardText}>Cota: {hidro.cotaM.toFixed(2)} m</Text>}
            {hidro.caudalRecibido !== null && (
              <Text style={styles.cardText}>Caudal recibido: {hidro.caudalRecibido} m³/s</Text>
            )}
            {hidro.caudalSalida !== null && (
              <Text style={styles.cardText}>Caudal de salida: {hidro.caudalSalida} m³/s</Text>
            )}
            {hidro.fechaDato && <Text style={styles.cardNote}>Dato del {hidro.fechaDato}</Text>}
            <Text style={styles.cardNote}>
              {hidro.fuente === "simulado"
                ? "No se pudo consultar el SAIH ahora mismo — dato de ejemplo. En web puede fallar por CORS; reintenta o abre la ficha oficial."
                : "Fuente en vivo: SAIH Confederación Hidrográfica del Júcar"}
            </Text>
            {hidro.urlFicha && (
              <Text style={styles.linkText} onPress={() => Linking.openURL(hidro.urlFicha!)}>
                Ver ficha oficial completa →
              </Text>
            )}
          </View>
        ) : (
          <Text style={styles.cardText}>Sin estación hidrológica asociada a esta zona (tramo de río sin embalse SAIH).</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Antes de pescar aquí</Text>
        {CHECKLIST_ANTES_DE_PESCAR.map((r, i) => (
          <Text key={i} style={styles.bullet}>
            • {r}
          </Text>
        ))}
        <Text style={styles.cardNote}>{FUENTE_NORMATIVA.titulo}</Text>
      </View>

      <Text style={styles.sectionTitle}>Especies presentes</Text>
      {zone.especies.map((especieId: string) => {
        const sp = speciesCatalog.find((s: any) => s.id === especieId);
        if (!sp) return null;
        const enVeda = estaEnVeda(especieId);
        const mejoresMeses: string[] = zone.mejoresEpocas?.[especieId] ?? [];
        const esBuenMes = mejoresMeses.includes(mesActual);
        const talla = TALLAS_OFICIALES[especieId];
        const nota = notaVeda(especieId);

        return (
          <TarjetaEspecie
            key={especieId}
            sp={sp}
            index={0}
            enVeda={enVeda}
            extra={
              <>
                {talla && <Text style={styles.cardText}>Talla / régimen: {talla}</Text>}
                {nota && <Text style={styles.cardNote}>{nota}</Text>}
                {mejoresMeses.length > 0 && (
                  <Text style={styles.cardText}>
                    Mejores meses: {mejoresMeses.join(", ")}{" "}
                    {esBuenMes ? <Text style={{ color: COLORS.success, fontWeight: "bold" }}>Ahora es buena época</Text> : null}
                  </Text>
                )}
                {sp.equipo && (
                  <View style={styles.equipoBox}>
                    <Text style={styles.equipoTitle}>Equipo recomendado</Text>
                    <Text style={styles.equipoItem}>Caña: {sp.equipo.cana}</Text>
                    <Text style={styles.equipoItem}>Carrete: {sp.equipo.carrete}</Text>
                    <Text style={styles.equipoItem}>Línea: {sp.equipo.linea}</Text>
                    {sp.equipo.senuelosCebos?.length > 0 && (
                      <Text style={styles.equipoItem}>Señuelos/cebos: {sp.equipo.senuelosCebos.join(", ")}</Text>
                    )}
                    <Text style={styles.equipoItem}>Técnica: {sp.equipo.tecnica}</Text>
                  </View>
                )}
              </>
            }
          />
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
  headerTop: { flexDirection: "row", alignItems: "flex-start" },
  favBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  favIcon: { color: "#ffe08a", fontSize: 22, fontWeight: "700" },
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
  cardTitle: { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 6 },
  cardText: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  cardNote: { fontSize: 11, color: COLORS.textMuted, marginTop: 4, fontStyle: "italic", lineHeight: 15 },
  linkText: { fontSize: 12.5, color: COLORS.water, fontWeight: "600", marginTop: 8 },
  bullet: { fontSize: 12.5, color: COLORS.textSecondary, marginBottom: 4, lineHeight: 17 },
  gaugeWrap: { marginBottom: 8, marginTop: 4 },
  gaugeTrack: {
    height: 10,
    borderRadius: 6,
    backgroundColor: COLORS.background,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  gaugeFill: { height: "100%", borderRadius: 6 },
  gaugeLabel: { fontSize: 13, fontWeight: "700", color: COLORS.textPrimary, marginTop: 6 },
  equipoBox: {
    marginTop: 10,
    backgroundColor: COLORS.waterLight,
    borderRadius: RADIUS.sm,
    padding: 10,
  },
  equipoTitle: { fontSize: 12.5, fontWeight: "700", color: COLORS.water, marginBottom: 4 },
  equipoItem: { fontSize: 12, color: "#0d3c5c", marginBottom: 2, lineHeight: 16 },
});
