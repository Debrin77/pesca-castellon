import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from "react-native";
import { useProvincia } from "../context/ProvinciaContext";
import { getProvinciaActiva } from "../provincias/runtime";
import { calcularSolunarDia } from "../services/solunarService";
import { calcularMareaHoy, claveMareaProvincia } from "../services/tideService";
import { concursosParaProvincia } from "../data/concursos";
import { infoPermisoCoto } from "../data/permisosCoto";
import PescaRecBanner from "./PescaRecBanner";
import PanelOfflineMapa from "./PanelOfflineMapa";
import CalendarioConcursos from "./CalendarioConcursos";
import { COLORS, RADIUS, SHADOW_SOFT } from "../theme";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Props {
  navigation: any;
}

function irATab(
  navigation: any,
  tab: string,
  screen: string,
  params?: Record<string, unknown>
) {
  navigation.navigate(tab, params ? { screen, params } : { screen });
}

/**
 * Ritual diario en Inicio: 3 acciones de “ahora” + herramientas plegadas.
 * Identidad bosque/agua; sin dump de features en el primer pantallazo.
 */
export default function PanelCampoHoy({ navigation }: Props) {
  const { provincia: provinciaCtx, provinciaId } = useProvincia();
  const provincia = provinciaCtx ?? getProvinciaActiva();
  const hoy = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const solunar = useMemo(
    () => calcularSolunarDia(hoy, provincia.regionMapa.latitude),
    [hoy, provincia.regionMapa.latitude]
  );
  const marea = useMemo(() => {
    const clave = claveMareaProvincia(provincia.id, provincia.continentalOnly);
    return clave ? calcularMareaHoy(clave) : null;
  }, [provincia.id, provincia.continentalOnly]);
  const nConcursos = concursosParaProvincia(provincia.id).length;
  const permisoGen = infoPermisoCoto(provincia.id);
  const [mas, setMas] = useState(false);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    setTick((t) => t + 1);
  }, [provinciaId]);

  function toggleMas() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMas((v) => !v);
  }

  return (
    <View
      style={styles.wrap}
      accessibilityLabel={`Ahora en el campo · ${provincia.nombre}`}
      key={`campo-${provinciaId}-${tick}`}
    >
      <Text style={styles.kicker}>AHORA · {provincia.nombre.toUpperCase()}</Text>
      <Text style={styles.title} accessibilityRole="header">
        Para salir hoy
      </Text>
      <Text style={styles.sub}>Tres decisiones rápidas. El resto, cuando lo necesites.</Text>

      <View style={styles.trio}>
        <TouchableOpacity
          style={[styles.trioCard, styles.trioPrimario]}
          activeOpacity={0.88}
          onPress={() => irATab(navigation, "Previsión", "PrevisionMain")}
          accessibilityRole="button"
          accessibilityLabel="Abrir previsión solunar"
        >
          <Text style={styles.trioOver}>Solunar {solunar.iconoLuna}</Text>
          <Text style={styles.trioBig}>
            {solunar.mejorHoraInicio}–{solunar.mejorHoraFin}
          </Text>
          <Text style={styles.trioMeta} numberOfLines={1}>
            {solunar.fase}
            {marea?.proximaPleamar ? ` · pleamar ${marea.proximaPleamar}` : ""}
          </Text>
          <Text style={styles.trioLink}>Previsión →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.trioCard}
          activeOpacity={0.88}
          onPress={() => irATab(navigation, "Mapa", "ZonasLibresMain", { activarRadar: true })}
          accessibilityRole="button"
          accessibilityLabel="Abrir mapa con radar"
        >
          <Text style={styles.trioOver}>Cielo</Text>
          <Text style={styles.trioBigSm}>Radar</Text>
          <Text style={styles.trioMeta}>Lluvia sobre el mapa</Text>
          <Text style={styles.trioLink}>Abrir →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.trioCard}
          activeOpacity={0.88}
          onPress={() => irATab(navigation, "Capturas", "CapturasMain", { abrirIdentificar: true })}
          accessibilityRole="button"
          accessibilityLabel="Identificar especie por rasgos o foto"
        >
          <Text style={styles.trioOver}>Captura</Text>
          <Text style={styles.trioBigSm}>ID</Text>
          <Text style={styles.trioMeta}>Rasgos / foto</Text>
          <Text style={styles.trioLink}>Identificar →</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.atajos}>
        <TouchableOpacity
          style={styles.atajo}
          onPress={() => irATab(navigation, "Especies", "EspeciesMain")}
          accessibilityRole="button"
        >
          <Text style={styles.atajoTxt}>Catálogo especies</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.atajo}
          onPress={() => navigation.navigate("Aparejos")}
          accessibilityRole="button"
        >
          <Text style={styles.atajoTxt}>Aparejos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.atajo}
          onPress={() => navigation.navigate("Consejos")}
          accessibilityRole="button"
        >
          <Text style={styles.atajoTxt}>Nudos</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.masBtn}
        onPress={toggleMas}
        accessibilityRole="button"
        accessibilityState={{ expanded: mas }}
        accessibilityLabel={mas ? "Ocultar más herramientas" : "Ver más herramientas de campo"}
      >
        <Text style={styles.masBtnTxt}>{mas ? "Menos herramientas ▲" : "Más herramientas de campo ▼"}</Text>
      </TouchableOpacity>

      {mas ? (
        <View style={styles.masBox}>
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => irATab(navigation, "Capturas", "CapturasMain")}
          >
            <Text style={styles.cardTitle}>Exportar GPX</Text>
            <Text style={styles.cardBody}>
              Puntos, capturas y rutas de {provincia.nombre} (este dispositivo).
            </Text>
            <Text style={styles.linkTxt}>Ir a Capturas →</Text>
          </TouchableOpacity>

          {provincia.continentalOnly ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>PescaREC</Text>
              <Text style={styles.cardBody}>
                En {provincia.nombre} la guía es continental: PescaREC aplica a gestiones marítimas
                estatales.
              </Text>
              <PescaRecBanner compacto />
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>PescaREC (marítima)</Text>
              <Text style={styles.cardBody}>Obligatorio en gestiones marítimas estatales.</Text>
              <PescaRecBanner />
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Cupos y permisos de coto</Text>
            <Text style={styles.cardBody}>{permisoGen.comoObtener}</Text>
            <Text style={styles.cardMeta}>{permisoGen.avisoPtop}</Text>
            <TouchableOpacity style={styles.linkBtn} onPress={() => navigation.navigate("License")}>
              <Text style={styles.linkTxtInline}>Licencias y cupos →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Concursos ({nConcursos})</Text>
            <Text style={styles.cardBody}>Calendario de {provincia.nombre} (+ nacionales).</Text>
          </View>
          <CalendarioConcursos provinciaId={provincia.id} limite={3} />

          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => irATab(navigation, "Mapa", "ZonasLibresMain")}
          >
            <Text style={styles.cardTitle}>Modalidad y rutas GPS</Text>
            <Text style={styles.cardBody}>
              En el mapa: modalidad
              {provincia.continentalOnly ? " continental" : " (río / mar / kayak…)"} y grabar ruta.
            </Text>
            <Text style={styles.linkTxt}>Abrir mapa →</Text>
          </TouchableOpacity>

          <PanelOfflineMapa />

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Normativa en vigor</Text>
            <Text style={styles.cardBody}>{provincia.fuenteNormativa.titulo}</Text>
            <Text style={styles.cardMeta}>{provincia.fuenteNormativa.vigenciaNota}</Text>
            <Text style={styles.cardMeta}>Consulta en app: {hoy}</Text>
            <TouchableOpacity style={styles.linkBtn} onPress={() => navigation.navigate("License")}>
              <Text style={styles.linkTxtInline}>Ver fuente →</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 4,
    marginBottom: 8,
    ...SHADOW_SOFT,
  },
  kicker: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: 0.7,
  },
  title: { fontSize: 18, fontWeight: "800", color: COLORS.textPrimary, marginTop: 2 },
  sub: { fontSize: 12.5, color: COLORS.textSecondary, marginTop: 4, marginBottom: 12, lineHeight: 17 },
  trio: { flexDirection: "row", gap: 8 },
  trioCard: {
    flex: 1,
    backgroundColor: COLORS.mist,
    borderRadius: RADIUS.md,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 118,
    justifyContent: "space-between",
  },
  trioPrimario: {
    backgroundColor: COLORS.primaryLight,
    borderColor: "#c5d9cc",
    flex: 1.25,
  },
  trioOver: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  trioBig: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginTop: 6,
    letterSpacing: -0.2,
  },
  trioBigSm: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginTop: 6,
  },
  trioMeta: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4, lineHeight: 14 },
  trioLink: { paddingTop: 8, color: COLORS.waterDark, fontWeight: "800", fontSize: 12 },
  atajos: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  atajo: {
    backgroundColor: COLORS.waterLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
  },
  atajoTxt: { fontSize: 12.5, fontWeight: "800", color: COLORS.waterDark },
  masBtn: {
    marginTop: 12,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.mist,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  masBtnTxt: { fontSize: 13, fontWeight: "800", color: COLORS.primary },
  masBox: { marginTop: 10 },
  card: {
    backgroundColor: COLORS.mist,
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: { fontSize: 13.5, fontWeight: "800", color: COLORS.textPrimary },
  cardBody: { fontSize: 12.5, color: COLORS.textSecondary, marginTop: 4, lineHeight: 17 },
  cardMeta: { fontSize: 11.5, color: COLORS.textMuted, marginTop: 4, lineHeight: 16 },
  linkBtn: { marginTop: 8 },
  linkTxt: { color: COLORS.waterDark, fontWeight: "800", fontSize: 13, marginTop: 8 },
  linkTxtInline: { color: COLORS.waterDark, fontWeight: "800", fontSize: 13 },
});
