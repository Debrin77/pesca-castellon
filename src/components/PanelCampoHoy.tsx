import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useProvincia } from "../context/ProvinciaContext";
import { getProvinciaActiva } from "../provincias/runtime";
import { calcularSolunarDia } from "../services/solunarService";
import { calcularMareaHoy, claveMareaProvincia } from "../services/tideService";
import { concursosParaProvincia } from "../data/concursos";
import { infoPermisoCoto } from "../data/permisosCoto";
import PescaRecBanner from "./PescaRecBanner";
import PanelOfflineMapa from "./PanelOfflineMapa";
import CalendarioConcursos from "./CalendarioConcursos";
import { COLORS, RADIUS } from "../theme";

interface Props {
  navigation: any;
}

/**
 * Hub visible en Inicio: solunar, radar, GPX, PescaREC, cupos/permisos,
 * concursos, offline y fuente normativa — filtrado por provincia activa.
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
  const [tick, setTick] = useState(0);
  useEffect(() => {
    setTick((t) => t + 1);
  }, [provinciaId]);

  return (
    <View style={styles.wrap} accessibilityLabel={`Herramientas de campo · ${provincia.nombre}`} key={`campo-${provinciaId}-${tick}`}>
      <Text style={styles.kicker}>HERRAMIENTAS · {provincia.nombre.toUpperCase()}</Text>
      <Text style={styles.title} accessibilityRole="header">
        Campo de hoy
      </Text>
      <Text style={styles.sub}>
        Datos solo de {provincia.nombre}. No se mezclan con otras provincias.
      </Text>

      {/* 2 · Solunar / marea */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Solunar {solunar.iconoLuna} · {solunar.fase}
        </Text>
        <Text style={styles.cardBody}>
          Mejor ventana: {solunar.mejorHoraInicio}–{solunar.mejorHoraFin}
        </Text>
        {marea ? (
          <Text style={styles.cardMeta}>
            Marea {marea.puerto}
            {marea.proximaPleamar ? ` · pleamar ${marea.proximaPleamar}` : ""}
            {marea.proximaBajamar ? ` · bajamar ${marea.proximaBajamar}` : ""}
          </Text>
        ) : (
          <Text style={styles.cardMeta}>
            {provincia.continentalOnly
              ? "Provincia continental: sin carta de marea costera (mira SAIH / índice)."
              : "Sin estación de marea para esta provincia."}
          </Text>
        )}
        <TouchableOpacity
          style={styles.linkBtn}
          onPress={() => navigation.navigate("Prevision")}
          accessibilityRole="button"
          accessibilityLabel="Abrir previsión solunar"
        >
          <Text style={styles.linkTxt}>Ver ventanas en Previsión →</Text>
        </TouchableOpacity>
      </View>

      {/* 3 · Radar + ráfagas */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Radar de lluvia y ráfagas</Text>
        <Text style={styles.cardBody}>
          En el mapa, chip «Radar lluvia». Las ráfagas salen en Previsión (viento / por horas).
        </Text>
        <TouchableOpacity
          style={styles.linkBtn}
          onPress={() =>
            navigation.navigate("Mapa", {
              screen: "ZonasLibresMain",
              params: { activarRadar: true },
            })
          }
          accessibilityRole="button"
          accessibilityLabel="Abrir mapa con radar"
        >
          <Text style={styles.linkTxt}>Abrir mapa con radar →</Text>
        </TouchableOpacity>
      </View>

      {/* 5 · GPX */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Exportar GPX</Text>
        <Text style={styles.cardBody}>
          Puntos, capturas con GPS y rutas de {provincia.nombre} (solo este dispositivo).
        </Text>
        <TouchableOpacity
          style={styles.linkBtn}
          onPress={() => navigation.navigate("Capturas")}
          accessibilityRole="button"
          accessibilityLabel="Ir a capturas para exportar GPX"
        >
          <Text style={styles.linkTxt}>Ir a Capturas → Exportar GPX</Text>
        </TouchableOpacity>
      </View>

      {/* 7 · PescaREC */}
      {provincia.continentalOnly ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>PescaREC (estatal / marítima)</Text>
          <Text style={styles.cardBody}>
            En {provincia.nombre} esta guía es solo continental: PescaREC no aplica a ríos/embalses
            aquí. Si pescas en mar (otra provincia o costa), usa la app oficial del Ministerio.
          </Text>
          <PescaRecBanner compacto />
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>PescaREC (marítima)</Text>
          <Text style={styles.cardBody}>
            Obligatorio en gestiones marítimas estatales. En orilla de {provincia.nombre} también
            aparece en el veredicto de costa.
          </Text>
          <PescaRecBanner />
        </View>
      )}

      {/* 8 · Cupos / permisos */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Cupos y permisos de coto</Text>
        <Text style={styles.cardBody}>{permisoGen.comoObtener}</Text>
        <Text style={styles.cardMeta}>{permisoGen.avisoPtop}</Text>
        <TouchableOpacity
          style={styles.linkBtn}
          onPress={() => navigation.navigate("License")}
          accessibilityRole="button"
          accessibilityLabel="Abrir licencias y cupos"
        >
          <Text style={styles.linkTxt}>Licencias, tallas y cupos →</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.linkBtn}
          onPress={() => navigation.navigate("Capturas")}
          accessibilityRole="button"
        >
          <Text style={styles.linkTxt}>Diario de capturas (cupo del día) →</Text>
        </TouchableOpacity>
      </View>

      {/* 9 · Concursos */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Concursos ({nConcursos})</Text>
        <Text style={styles.cardBody}>Calendario filtrado a {provincia.nombre} (+ nacionales).</Text>
      </View>
      <CalendarioConcursos provinciaId={provincia.id} limite={3} />

      {/* 10 · Modalidades / tracks */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Modalidad y rutas GPS</Text>
        <Text style={styles.cardBody}>
          En el mapa: selector de modalidad
          {provincia.continentalOnly ? " (solo continental)" : " (río / mar / kayak…)"} y botón
          «Grabar ruta». Las rutas se exportan en el GPX.
        </Text>
        <TouchableOpacity
          style={styles.linkBtn}
          onPress={() => navigation.navigate("Mapa")}
          accessibilityRole="button"
        >
          <Text style={styles.linkTxt}>Abrir mapa →</Text>
        </TouchableOpacity>
      </View>

      {/* 11 · Offline */}
      <PanelOfflineMapa />

      {/* 14 · Normativa viva */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Normativa en vigor</Text>
        <Text style={styles.cardBody}>{provincia.fuenteNormativa.titulo}</Text>
        <Text style={styles.cardMeta}>{provincia.fuenteNormativa.vigenciaNota}</Text>
        <Text style={styles.cardMeta}>Consulta en app: {hoy}</Text>
        <TouchableOpacity
          style={styles.linkBtn}
          onPress={() => navigation.navigate("License")}
          accessibilityRole="button"
        >
          <Text style={styles.linkTxt}>Ver fuente y checklist →</Text>
        </TouchableOpacity>
      </View>
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
  },
  kicker: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: 0.6,
  },
  title: { fontSize: 17, fontWeight: "800", color: COLORS.textPrimary, marginTop: 2 },
  sub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4, marginBottom: 10, lineHeight: 17 },
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
  linkTxt: { color: COLORS.waterDark, fontWeight: "800", fontSize: 13 },
});
