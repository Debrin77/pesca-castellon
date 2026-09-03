import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAcceso } from "../context/AccesoContext";
import { COLORS, GRADIENTS, RADIUS, SPACING } from "../theme";

/** Capa a pantalla completa mientras la app está bloqueada. */
export default function PantallaBloqueo() {
  const {
    listo,
    bloqueado,
    config,
    biometria,
    desbloquearConContrasena,
    desbloquearConBiometria,
  } = useAcceso();
  const [clave, setClave] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [probando, setProbando] = useState(false);
  const [mostrarClave, setMostrarClave] = useState(false);

  useEffect(() => {
    if (!bloqueado || !config.biometriaActiva) return;
    let cancelado = false;
    (async () => {
      setProbando(true);
      const ok = await desbloquearConBiometria();
      if (!cancelado && !ok) {
        /* el usuario puede usar contraseña */
      }
      if (!cancelado) setProbando(false);
    })();
    return () => {
      cancelado = true;
    };
  }, [bloqueado, config.biometriaActiva, desbloquearConBiometria]);

  if (!listo || !bloqueado) return null;

  async function onDesbloquear() {
    setError(null);
    setProbando(true);
    const ok = await desbloquearConContrasena(clave);
    setProbando(false);
    if (!ok) {
      setError("Contraseña incorrecta");
      return;
    }
    setClave("");
  }

  async function onBiometria() {
    setError(null);
    setProbando(true);
    const ok = await desbloquearConBiometria();
    setProbando(false);
    if (!ok) setError("No se pudo verificar con biometría");
  }

  return (
    <View style={styles.overlay} accessibilityViewIsModal>
      <LinearGradient colors={[...GRADIENTS.primary]} style={styles.card}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <Text style={styles.brand}>Pesca Castellón</Text>
          <Text style={styles.title}>App bloqueada</Text>
          <Text style={styles.sub}>Introduce tu contraseña para continuar</Text>

          <TextInput
            value={clave}
            onChangeText={setClave}
            placeholder="Contraseña"
            placeholderTextColor="#9bb8a8"
            secureTextEntry={!mostrarClave}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
            onSubmitEditing={onDesbloquear}
            editable={!probando}
          />

          <TouchableOpacity onPress={() => setMostrarClave((v) => !v)} style={styles.linkBtn}>
            <Text style={styles.link}>{mostrarClave ? "Ocultar" : "Mostrar"} contraseña</Text>
          </TouchableOpacity>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.btn, probando && styles.btnOff]}
            onPress={onDesbloquear}
            disabled={probando || clave.trim().length < 4}
          >
            {probando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnTxt}>Entrar</Text>
            )}
          </TouchableOpacity>

          {config.biometriaActiva && biometria.disponible && biometria.enrolada ? (
            <TouchableOpacity style={styles.bioBtn} onPress={onBiometria} disabled={probando}>
              <Text style={styles.bioTxt}>Usar {biometria.etiqueta}</Text>
            </TouchableOpacity>
          ) : null}
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    backgroundColor: "rgba(12,44,32,0.55)",
    justifyContent: "center",
    padding: SPACING.lg,
  },
  card: {
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
  },
  brand: {
    color: "#cfe8db",
    fontWeight: "800",
    fontSize: 13,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  title: { color: "#fff", fontSize: 26, fontWeight: "800" },
  sub: { color: "#d5ebe0", marginTop: 6, marginBottom: 18, fontSize: 14 },
  input: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
    color: "#fff",
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "web" ? 12 : 14,
    fontSize: 16,
    fontWeight: "600",
  },
  linkBtn: { alignSelf: "flex-end", marginTop: 8, marginBottom: 8 },
  link: { color: "#cfe8db", fontWeight: "700", fontSize: 12 },
  error: { color: "#ffd0c8", fontWeight: "700", marginBottom: 8 },
  btn: {
    backgroundColor: COLORS.success,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 6,
  },
  btnOff: { opacity: 0.7 },
  btnTxt: { color: "#fff", fontWeight: "800", fontSize: 16 },
  bioBtn: {
    marginTop: 14,
    alignItems: "center",
    paddingVertical: 10,
  },
  bioTxt: { color: "#fff", fontWeight: "800", fontSize: 15 },
});
