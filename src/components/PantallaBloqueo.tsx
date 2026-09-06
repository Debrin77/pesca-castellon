import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAcceso } from "../context/AccesoContext";
import { useProvincia } from "../context/ProvinciaContext";
import { getProvinciaActiva } from "../provincias/runtime";
import { FONTS, GRADIENTS, RADIUS, SPACING } from "../theme";

const TECLAS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"] as const;
const MAX_PIN = 8;

/** Capa a pantalla completa mientras la app está bloqueada (PIN + biometría). */
export default function PantallaBloqueo() {
  const {
    listo,
    bloqueado,
    config,
    biometria,
    desbloquearConContrasena,
    desbloquearConBiometria,
  } = useAcceso();
  const { provincia: provinciaCtx } = useProvincia();
  const provincia = provinciaCtx ?? getProvinciaActiva();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [probando, setProbando] = useState(false);

  useEffect(() => {
    if (!bloqueado || !config.biometriaActiva) return;
    let cancelado = false;
    (async () => {
      setProbando(true);
      await desbloquearConBiometria();
      if (!cancelado) setProbando(false);
    })();
    return () => {
      cancelado = true;
    };
  }, [bloqueado, config.biometriaActiva, desbloquearConBiometria]);

  useEffect(() => {
    if (!bloqueado || pin.length < 4 || probando) return;
    const t = setTimeout(async () => {
      setError(null);
      setProbando(true);
      const ok = await desbloquearConContrasena(pin);
      setProbando(false);
      if (!ok) {
        setError("PIN incorrecto");
        setPin("");
        return;
      }
      setPin("");
    }, 280);
    return () => clearTimeout(t);
  }, [pin, bloqueado, probando, desbloquearConContrasena]);

  if (!listo || !bloqueado) return null;

  async function onBiometria() {
    setError(null);
    setProbando(true);
    const ok = await desbloquearConBiometria();
    setProbando(false);
    if (!ok) setError("No se pudo verificar con biometría");
  }

  function pulsar(tecla: string) {
    if (probando) return;
    if (tecla === "") return;
    if (tecla === "⌫") {
      setPin((p) => p.slice(0, -1));
      setError(null);
      return;
    }
    setPin((prev) => (prev.length >= MAX_PIN ? prev : prev + tecla));
    setError(null);
  }

  const puntos = Array.from({ length: Math.max(4, Math.min(Math.max(pin.length, 4), MAX_PIN)) });

  return (
    <View style={styles.overlay} accessibilityViewIsModal>
      <LinearGradient colors={[...GRADIENTS.primary]} style={styles.card}>
        <Text style={styles.brand}>{provincia.nombreApp || "Pesca"}</Text>
        <Text style={styles.title}>App bloqueada</Text>
        <Text style={styles.sub}>Introduce tu PIN para continuar</Text>

        <View style={styles.dotsRow} accessibilityLabel={`PIN: ${pin.length} dígitos`}>
          {puntos.map((_, i) => (
            <View key={i} style={[styles.dot, i < pin.length && styles.dotOn]} />
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : <View style={{ height: 22 }} />}

        {probando ? (
          <ActivityIndicator color="#fff" style={{ marginVertical: 18 }} />
        ) : (
          <View style={styles.pad}>
            {TECLAS.map((tecla, idx) => (
              <TouchableOpacity
                key={`${tecla}-${idx}`}
                style={[styles.key, tecla === "" && styles.keyEmpty]}
                onPress={() => pulsar(tecla)}
                disabled={tecla === "" || probando}
                accessibilityLabel={tecla === "⌫" ? "Borrar" : tecla || undefined}
              >
                <Text style={styles.keyTxt}>{tecla}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {config.biometriaActiva && biometria.disponible && biometria.enrolada ? (
          <TouchableOpacity style={styles.bioBtn} onPress={onBiometria} disabled={probando}>
            <Text style={styles.bioTxt}>Usar {biometria.etiqueta}</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.hint}>
            {Platform.OS === "web"
              ? "En el móvil puedes activar Face ID / huella en Ajustes."
              : "Activa la biometría en Ajustes para entrar más rápido."}
          </Text>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    backgroundColor: "rgba(12,44,32,0.72)",
    justifyContent: "center",
    padding: SPACING.lg,
  },
  card: {
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: "center",
  },
  brand: {
    color: "#e8f5ee",
    fontWeight: "800",
    fontFamily: FONTS.extrabold,
    fontSize: 13,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 8,
    alignSelf: "flex-start",
  },
  title: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
    fontFamily: FONTS.extrabold,
    alignSelf: "flex-start",
  },
  sub: {
    color: "#eef7f1",
    marginTop: 6,
    marginBottom: 18,
    fontSize: 14,
    fontFamily: FONTS.semibold,
    alignSelf: "flex-start",
  },
  dotsRow: { flexDirection: "row", gap: 12, marginBottom: 8, minHeight: 16 },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.55)",
    backgroundColor: "transparent",
  },
  dotOn: { backgroundColor: "#fff", borderColor: "#fff" },
  error: {
    color: "#ffd0c8",
    fontWeight: "700",
    fontFamily: FONTS.bold,
    marginBottom: 8,
    height: 22,
  },
  pad: {
    width: "100%",
    maxWidth: 280,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginTop: 4,
  },
  key: {
    width: 72,
    height: 52,
    borderRadius: RADIUS.md,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
  keyEmpty: { backgroundColor: "transparent", borderColor: "transparent" },
  keyTxt: { color: "#fff", fontSize: 22, fontWeight: "700", fontFamily: FONTS.bold },
  bioBtn: { marginTop: 18, alignItems: "center", paddingVertical: 10 },
  bioTxt: { color: "#fff", fontWeight: "800", fontFamily: FONTS.extrabold, fontSize: 15 },
  hint: {
    marginTop: 16,
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    textAlign: "center",
    fontFamily: FONTS.semibold,
  },
});
