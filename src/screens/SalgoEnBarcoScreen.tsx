import React, { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { obtenerUbicacionActual, solicitarPermisoUbicacion } from "../services/locationService";
import { consultarEmbarcacion, todasLasRampas } from "../services/consultaEmbarcacionService";
import type { ConsultaPesca } from "../services/consultaPescaService";
import { calcularIndiceBarco, type IndiceBarco } from "../services/boatIndexService";
import { CHECKLIST_EMBARCACION, FUENTE_EMBARCACION } from "../data/normativaMaritima";
import { useProvincia } from "../context/ProvinciaContext";
import { usePuntoConsulta } from "../context/PuntoConsultaContext";
import { getProvinciaActiva } from "../provincias/runtime";
import { etaAPuerto, estimarProfundidadMarCastellon } from "../services/navegacionEmbarcacionService";
import SemaforoVeredicto from "../components/SemaforoVeredicto";
import ConsultaPescaCard from "../components/ConsultaPescaCard";
import IndiceBarcoCard from "../components/IndiceBarcoCard";
import ChecklistInteractivo, { itemsDesdeTextos } from "../components/ChecklistInteractivo";
import PescaRecBanner from "../components/PescaRecBanner";
import EjeLegalMeteo from "../components/EjeLegalMeteo";
import PasoSalida from "../components/PasoSalida";
import PulsePress from "../components/PulsePress";
import { COLORS, FONTS, GRADIENTS, RADIUS, SPACING } from "../theme";
import { Linking } from "react-native";

interface Props {
  navigation: any;
}

/**
 * Ritual «Salgo en barco» (Castellón): rampa → legal → índice marino → checklist.
 */
export default function SalgoEnBarcoScreen({ navigation }: Props) {
  const { provincia: provinciaCtx } = useProvincia();
  const provincia = provinciaCtx ?? getProvinciaActiva();
  const { fijarPunto } = usePuntoConsulta();
  const [paso, setPaso] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [consulta, setConsulta] = useState<ConsultaPesca | null>(null);
  const [indice, setIndice] = useState<IndiceBarco | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [etiqueta, setEtiqueta] = useState<string | null>(null);
  const [navTxt, setNavTxt] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      if (provincia.id !== "castellon") {
        Alert.alert("Embarcación", "El ritual de barco está disponible en Castellón.");
      }
    }, [provincia.id])
  );

  async function cargarPunto(lat: number, lng: number, etiquetaPunto: string) {
    setCargando(true);
    setEtiqueta(etiquetaPunto);
    setCoords({ lat, lng });
    const c = consultarEmbarcacion(lat, lng);
    setConsulta(c);
    const ind = await calcularIndiceBarco(lat, lng);
    setIndice(ind);
    const prof = estimarProfundidadMarCastellon(lat, lng);
    const eta = etaAPuerto(lat, lng);
    setNavTxt([prof.etiqueta, eta?.etiqueta].filter(Boolean).join("\n"));
    void fijarPunto({ lat, lng, fuente: "zona", etiqueta: etiquetaPunto });
    setPaso(1);
    setCargando(false);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  async function usarGps() {
    setCargando(true);
    const ok = await solicitarPermisoUbicacion();
    const loc = ok ? await obtenerUbicacionActual() : null;
    if (!loc) {
      setCargando(false);
      Alert.alert("GPS", "No se pudo obtener la ubicación.");
      return;
    }
    await cargarPunto(loc.lat, loc.lng, "Tu posición");
  }

  if (provincia.id !== "castellon") {
    return (
      <View style={styles.wrap}>
        <Text style={styles.aviso}>Salgo en barco está pensado para la costa de Castellón.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView ref={scrollRef} style={styles.wrap} contentContainerStyle={styles.content}>
      <LinearGradient colors={[...GRADIENTS.water]} style={styles.hero}>
        <Text style={styles.heroKicker}>CASTELLÓN · EMBARCACIÓN</Text>
        <Text style={styles.heroTitle}>Salgo en barco</Text>
        <Text style={styles.heroSub}>Legal · meteo marina · checklist · PescaREC</Text>
        <PasoSalida
          pasos={["Salida", "¿Puedo?", "¿Pinta?", "Checklist"]}
          activo={paso}
          sobreOscuro
        />
      </LinearGradient>

      {paso === 0 ? (
        <View style={styles.bloque}>
          <Text style={styles.bloqueTitulo}>1. Elige rampa o GPS</Text>
          <Text style={styles.bloqueSub}>Zarpas desde puerto; pescas fuera de dársena. Columbretes es reserva.</Text>
          <PulsePress onPress={() => void usarGps()} style={styles.btnPrimary}>
            <Text style={styles.btnPrimaryTxt}>{cargando ? "Localizando…" : "Usar mi GPS"}</Text>
          </PulsePress>
          {todasLasRampas().map((r) => (
            <TouchableOpacity
              key={r.id}
              style={styles.rampa}
              onPress={() => void cargarPunto(r.lat, r.lng, r.nombre)}
              disabled={cargando}
            >
              <Text style={styles.rampaNombre}>{r.nombre}</Text>
              <Text style={styles.rampaNota}>{r.nota}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.linkMapa}
            onPress={() =>
              navigation.navigate("Mapa", {
                screen: "ZonasLibresMain",
                params: { modoMapa: "costa" },
              })
            }
          >
            <Text style={styles.link}>Elegir en el mapa (modalidad Barco / Kayak)</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {cargando ? <ActivityIndicator color={COLORS.water} style={{ marginVertical: 16 }} /> : null}

      {paso >= 1 && consulta ? (
        <View style={styles.bloque}>
          <EjeLegalMeteo eje="legal" />
          <Text style={styles.bloqueTitulo}>2. ¿Puedo aquí?</Text>
          {etiqueta ? <Text style={styles.etiqueta}>{etiqueta}</Text> : null}
          <SemaforoVeredicto consulta={consulta} />
          <ConsultaPescaCard consulta={consulta} />
          {navTxt ? <Text style={styles.navTxt}>{navTxt}</Text> : null}
          <TouchableOpacity style={styles.btnSec} onPress={() => setPaso(2)}>
            <Text style={styles.btnSecTxt}>Siguiente · meteo marina</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {paso >= 2 ? (
        <View style={styles.bloque}>
          <EjeLegalMeteo eje="meteo" />
          <Text style={styles.bloqueTitulo}>3. ¿Pinta zarpar?</Text>
          <IndiceBarcoCard indice={indice} cargando={cargando && !indice} />
          {indice?.alertaSalida ? (
            <Text style={styles.alerta}>Con esta meteo el índice recomienda no salir. Tú decides.</Text>
          ) : null}
          <TouchableOpacity style={styles.btnSec} onPress={() => setPaso(3)}>
            <Text style={styles.btnSecTxt}>Siguiente · checklist</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {paso >= 3 ? (
        <View style={styles.bloque}>
          <Text style={styles.bloqueTitulo}>4. Checklist de seguridad</Text>
          <PescaRecBanner />
          <ChecklistInteractivo
            provinciaId={provincia.id}
            items={itemsDesdeTextos(CHECKLIST_EMBARCACION)}
            onLicencia={() => navigation.navigate("License")}
            onMapa={() =>
              navigation.navigate("Mapa", {
                screen: "ZonasLibresMain",
                params: { modoMapa: "costa" },
              })
            }
          />
          <TouchableOpacity
            style={styles.linkMapa}
            onPress={() => Linking.openURL(FUENTE_EMBARCACION.urlPescaRec)}
          >
            <Text style={styles.link}>Abrir info PescaREC (MAPA)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.linkMapa}
            onPress={() => Linking.openURL(FUENTE_EMBARCACION.urlColumbretes)}
          >
            <Text style={styles.link}>Reserva Columbretes (oficial)</Text>
          </TouchableOpacity>
          <PulsePress
            onPress={() => {
              navigation.navigate("Aparejos", { especieId: "lubina", ambitoEmbarcacion: true });
            }}
            style={styles.btnPrimary}
          >
            <Text style={styles.btnPrimaryTxt}>Ver aparejos de embarcación</Text>
          </PulsePress>
          <TouchableOpacity style={styles.btnSec} onPress={() => setPaso(0)}>
            <Text style={styles.btnSecTxt}>Elegir otra salida</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: 24 },
  hero: { padding: SPACING.lg, paddingTop: SPACING.xl, gap: 6 },
  heroKicker: { fontFamily: FONTS.semibold, fontSize: 11, color: "rgba(255,255,255,0.75)", letterSpacing: 0.8 },
  heroTitle: { fontFamily: FONTS.display, fontSize: 28, color: "#fff" },
  heroSub: { fontFamily: FONTS.regular, fontSize: 14, color: "rgba(255,255,255,0.85)", marginBottom: 8 },
  bloque: {
    margin: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  bloqueTitulo: { fontFamily: FONTS.displaySemi, fontSize: 18, color: COLORS.textPrimary },
  bloqueSub: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  etiqueta: { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.waterDark },
  navTxt: { fontFamily: FONTS.regular, fontSize: 12.5, color: COLORS.textSecondary, lineHeight: 18 },
  alerta: { fontFamily: FONTS.semibold, fontSize: 13, color: COLORS.danger },
  rampa: {
    padding: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.waterLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rampaNombre: { fontFamily: FONTS.semibold, fontSize: 15, color: COLORS.textPrimary },
  rampaNota: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  btnPrimary: {
    backgroundColor: COLORS.water,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnPrimaryTxt: { fontFamily: FONTS.bold, fontSize: 15, color: "#fff" },
  btnSec: {
    borderWidth: 1,
    borderColor: COLORS.water,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnSecTxt: { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.waterDark },
  linkMapa: { paddingVertical: 8 },
  link: { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.water, textAlign: "center" },
  aviso: { fontFamily: FONTS.regular, fontSize: 15, color: COLORS.textPrimary, margin: 24, textAlign: "center" },
});
