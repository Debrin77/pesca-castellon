import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  guardarChecklistTicks,
  leerChecklistTicks,
  marcarLicenciaOk,
} from "../services/primeraSalidaService";
import { abrirPescaRecInfo, abrirPescaRecTienda } from "../services/pescaRecService";
import { COLORS, RADIUS } from "../theme";

export type AccionChecklist =
  | { tipo: "licencia" }
  | { tipo: "consejos"; consejoId?: string; categoria?: string }
  | { tipo: "mapa" }
  | { tipo: "pesca_rec" }
  | { tipo: "url"; url: string; etiqueta: string }
  | { tipo: "ninguna" };

export type ItemChecklist = {
  id: string;
  texto: string;
  accion?: AccionChecklist;
};

type Props = {
  provinciaId: string;
  items: ItemChecklist[];
  onLicencia?: () => void;
  onConsejos?: (opts: { consejoId?: string; categoria?: string }) => void;
  onMapa?: () => void;
};

function inferirAccion(texto: string): AccionChecklist {
  const t = texto.toLowerCase();
  if (/pescarec|pesca rec|marítima recreativa estatal|declaraci/.test(t)) {
    return { tipo: "pesca_rec" };
  }
  if (/licencia|nir|seguro|rc del pescador|rc obligatorio/.test(t)) {
    return { tipo: "licencia" };
  }
  if (/cartel|mapa|tramo|refugio|polígono|señaliz/.test(t)) {
    return { tipo: "mapa" };
  }
  if (/kit|montaje|nudo|aparejo|cebo/.test(t)) {
    return { tipo: "consejos", categoria: "montajes", consejoId: "ap-kit-principiante" };
  }
  return { tipo: "ninguna" };
}

export function itemsDesdeTextos(textos: string[], extras: ItemChecklist[] = []): ItemChecklist[] {
  const base = textos.map((texto, i) => ({
    id: `c-${i}`,
    texto,
    accion: inferirAccion(texto),
  }));
  return [...base, ...extras];
}

export default function ChecklistInteractivo({
  provinciaId,
  items,
  onLicencia,
  onConsejos,
  onMapa,
}: Props) {
  const [ticks, setTicks] = useState<Record<string, boolean>>({});

  const cargar = useCallback(() => {
    leerChecklistTicks(provinciaId).then(setTicks);
  }, [provinciaId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  async function toggle(id: string) {
    const next = { ...ticks, [id]: !ticks[id] };
    setTicks(next);
    await guardarChecklistTicks(provinciaId, next);
    const item = items.find((it) => it.id === id);
    if (next[id] && item?.accion?.tipo === "licencia") {
      await marcarLicenciaOk(true);
    }
  }

  async function ejecutar(accion: AccionChecklist | undefined) {
    if (!accion || accion.tipo === "ninguna") return;
    if (accion.tipo === "licencia") onLicencia?.();
    else if (accion.tipo === "mapa") onMapa?.();
    else if (accion.tipo === "consejos") onConsejos?.(accion);
    else if (accion.tipo === "pesca_rec") await abrirPescaRecTienda().catch(() => abrirPescaRecInfo());
    else if (accion.tipo === "url") await Linking.openURL(accion.url);
  }

  function etiquetaAccion(accion: AccionChecklist | undefined): string | null {
    if (!accion || accion.tipo === "ninguna") return null;
    if (accion.tipo === "licencia") return "Licencias";
    if (accion.tipo === "mapa") return "Mapa";
    if (accion.tipo === "consejos") return "Aprende";
    if (accion.tipo === "pesca_rec") return "PescaREC";
    if (accion.tipo === "url") return accion.etiqueta;
    return null;
  }

  const hechos = items.filter((it) => ticks[it.id]).length;
  const total = items.length;
  const pct = total > 0 ? hechos / total : 0;
  const listo = total > 0 && hechos === total;

  return (
    <View style={styles.wrap}>
      <View style={styles.progreso} accessibilityLabel={`Preparación ${hechos} de ${total}`}>
        <View style={styles.progresoTop}>
          <Text style={styles.progresoLbl}>Preparación</Text>
          <Text style={styles.progresoNum}>
            {hechos}/{total}
          </Text>
        </View>
        <View style={styles.barra}>
          <View style={[styles.barraFill, { width: `${Math.round(pct * 100)}%` }]} />
        </View>
      </View>

      {listo ? (
        <View style={styles.listo} accessibilityLiveRegion="polite">
          <Text style={styles.listoTitle}>Listo para salir</Text>
          <Text style={styles.listoSub}>Todo marcado. Buena pesca y respeta la normativa.</Text>
        </View>
      ) : null}

      {items.map((item) => {
        const on = !!ticks[item.id];
        const label = etiquetaAccion(item.accion);
        return (
          <View key={item.id} style={[styles.row, on && styles.rowOn]}>
            <TouchableOpacity
              onPress={() => toggle(item.id)}
              style={styles.checkHit}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={item.texto}
            >
              <View style={[styles.box, on && styles.boxOn]}>
                <Text style={styles.boxTxt}>{on ? "✓" : ""}</Text>
              </View>
              <Text style={[styles.txt, on && styles.txtOn]}>{item.texto}</Text>
            </TouchableOpacity>
            {label ? (
              <TouchableOpacity
                onPress={() => ejecutar(item.accion)}
                style={styles.linkBtn}
                accessibilityRole="button"
                accessibilityLabel={`Abrir ${label}`}
              >
                <Text style={styles.linkTxt}>{label}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  progreso: { marginBottom: 4 },
  progresoTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  progresoLbl: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: COLORS.textMuted,
  },
  progresoNum: { fontSize: 13, fontWeight: "800", color: COLORS.primary },
  barra: {
    height: 6,
    borderRadius: 999,
    backgroundColor: COLORS.mist,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  barraFill: {
    height: "100%",
    backgroundColor: COLORS.water,
    borderRadius: 999,
  },
  listo: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: "#c5d9cc",
    marginBottom: 4,
  },
  listoTitle: { fontSize: 15, fontWeight: "800", color: COLORS.primary },
  listoSub: { fontSize: 12.5, color: COLORS.textSecondary, marginTop: 2, lineHeight: 17 },
  row: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  rowOn: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  checkHit: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  boxOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  boxTxt: { color: "#fff", fontSize: 12, fontWeight: "900" },
  txt: { flex: 1, fontSize: 13, lineHeight: 18, color: COLORS.textPrimary, fontWeight: "600" },
  txtOn: { color: COLORS.textSecondary },
  linkBtn: {
    alignSelf: "flex-start",
    marginTop: 6,
    marginLeft: 32,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: COLORS.mist,
  },
  linkTxt: { fontSize: 12, fontWeight: "800", color: COLORS.primary },
});
