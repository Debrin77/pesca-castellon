import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAcceso } from "../context/AccesoContext";
import {
  activarBloqueoConContrasena,
  cambiarContrasena,
  desactivarBloqueo,
  setBiometriaActiva,
} from "../services/accesoService";
import { COLORS, RADIUS, SHADOW_SOFT, SPACING } from "../theme";

function avisar(titulo: string, mensaje: string) {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.alert(`${titulo}\n\n${mensaje}`);
    return;
  }
  Alert.alert(titulo, mensaje);
}

export default function AjustesScreen() {
  const { config, biometria, refrescar, marcarDesbloqueado } = useAcceso();
  const [cargando, setCargando] = useState(false);
  const [nuevaClave, setNuevaClave] = useState("");
  const [repetirClave, setRepetirClave] = useState("");
  const [claveActual, setClaveActual] = useState("");
  const [modoCambio, setModoCambio] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refrescar();
    }, [refrescar])
  );

  async function activar() {
    if (nuevaClave.trim().length < 4) {
      avisar("Contraseña corta", "Usa al menos 4 caracteres.");
      return;
    }
    if (nuevaClave !== repetirClave) {
      avisar("No coinciden", "Las dos contraseñas deben ser iguales.");
      return;
    }
    setCargando(true);
    try {
      await activarBloqueoConContrasena(nuevaClave);
      setNuevaClave("");
      setRepetirClave("");
      await refrescar();
      marcarDesbloqueado();
      avisar("Listo", "La app pedirá contraseña al abrirla o al volver tras unos segundos en segundo plano.");
    } catch (e: any) {
      avisar("Error", e?.message ?? "No se pudo activar el bloqueo.");
    } finally {
      setCargando(false);
    }
  }

  async function desactivar() {
    if (claveActual.trim().length < 4) {
      avisar("Contraseña", "Introduce tu contraseña actual para desactivar el bloqueo.");
      return;
    }
    setCargando(true);
    try {
      await desactivarBloqueo(claveActual);
      setClaveActual("");
      await refrescar();
      avisar("Desactivado", "Ya no se pedirá contraseña al entrar.");
    } catch (e: any) {
      avisar("Error", e?.message ?? "No se pudo desactivar.");
    } finally {
      setCargando(false);
    }
  }

  async function guardarCambioClave() {
    if (nuevaClave.trim().length < 4 || nuevaClave !== repetirClave) {
      avisar("Revisa la contraseña", "Mínimo 4 caracteres y deben coincidir.");
      return;
    }
    setCargando(true);
    try {
      await cambiarContrasena(claveActual, nuevaClave);
      setClaveActual("");
      setNuevaClave("");
      setRepetirClave("");
      setModoCambio(false);
      await refrescar();
      avisar("Actualizada", "La contraseña se ha cambiado.");
    } catch (e: any) {
      avisar("Error", e?.message ?? "No se pudo cambiar.");
    } finally {
      setCargando(false);
    }
  }

  async function onToggleBiometria(valor: boolean) {
    setCargando(true);
    try {
      await setBiometriaActiva(valor);
      await refrescar();
    } catch (e: any) {
      avisar("Biometría", e?.message ?? "No disponible.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.lead}>
        Protege capturas, favoritos y puntos guardados en este dispositivo.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Acceso a la app</Text>
        <View style={styles.row}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.rowTitle}>Bloqueo con contraseña</Text>
            <Text style={styles.rowSub}>
              {config.bloqueoActivo
                ? "Activo · se pide al abrir o al volver a la app"
                : "Desactivado"}
            </Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeTxt}>{config.bloqueoActivo ? "ON" : "OFF"}</Text>
          </View>
        </View>

        {!config.bloqueoActivo ? (
          <View style={styles.form}>
            <Text style={styles.label}>Nueva contraseña</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={nuevaClave}
              onChangeText={setNuevaClave}
              placeholder="Mínimo 4 caracteres"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="none"
            />
            <Text style={styles.label}>Repetir contraseña</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={repetirClave}
              onChangeText={setRepetirClave}
              placeholder="Repite la contraseña"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.btn} onPress={activar} disabled={cargando}>
              {cargando ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnTxt}>Activar bloqueo</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.label}>Contraseña actual</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={claveActual}
              onChangeText={setClaveActual}
              placeholder="Para desactivar o cambiar"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="none"
            />

            {!modoCambio ? (
              <>
                <TouchableOpacity style={styles.btnGhost} onPress={() => setModoCambio(true)}>
                  <Text style={styles.btnGhostTxt}>Cambiar contraseña</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnDanger} onPress={desactivar} disabled={cargando}>
                  <Text style={styles.btnTxt}>Desactivar bloqueo</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.label}>Nueva contraseña</Text>
                <TextInput
                  style={styles.input}
                  secureTextEntry
                  value={nuevaClave}
                  onChangeText={setNuevaClave}
                  autoCapitalize="none"
                />
                <Text style={styles.label}>Repetir nueva</Text>
                <TextInput
                  style={styles.input}
                  secureTextEntry
                  value={repetirClave}
                  onChangeText={setRepetirClave}
                  autoCapitalize="none"
                />
                <TouchableOpacity style={styles.btn} onPress={guardarCambioClave} disabled={cargando}>
                  <Text style={styles.btnTxt}>Guardar nueva contraseña</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnGhost} onPress={() => setModoCambio(false)}>
                  <Text style={styles.btnGhostTxt}>Cancelar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{biometria.etiqueta}</Text>
        <View style={styles.row}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.rowTitle}>Entrar con biometría</Text>
            <Text style={styles.rowSub}>
              {biometria.detalle ||
                (config.bloqueoActivo
                  ? "Usa Face ID / huella y, si falla, la contraseña."
                  : "Activa primero el bloqueo con contraseña.")}
            </Text>
          </View>
          <Switch
            value={config.biometriaActiva}
            onValueChange={onToggleBiometria}
            disabled={
              cargando ||
              !config.bloqueoActivo ||
              !biometria.disponible ||
              !biometria.enrolada
            }
            trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
            thumbColor={config.biometriaActiva ? COLORS.primary : "#f4f4f4"}
          />
        </View>
        {Platform.OS === "web" ? (
          <Text style={styles.note}>
            En la web puedes usar contraseña. Face ID / huella requiere la app en el móvil.
          </Text>
        ) : null}
      </View>

      <Text style={styles.footer}>
        La contraseña se guarda cifrada (hash) en este dispositivo. No se envía a ningún servidor.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingBottom: 120 },
  lead: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.md,
    fontWeight: "600",
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOW_SOFT,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.primaryDark,
    marginBottom: 12,
  },
  row: { flexDirection: "row", alignItems: "center" },
  rowTitle: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary },
  rowSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 3, lineHeight: 16 },
  badge: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeTxt: { fontSize: 11, fontWeight: "800", color: COLORS.primaryDark },
  form: { marginTop: 14 },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "web" ? 10 : 12,
    fontSize: 15,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.mist,
  },
  btn: {
    marginTop: 14,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 13,
    alignItems: "center",
  },
  btnDanger: {
    marginTop: 10,
    backgroundColor: COLORS.danger,
    borderRadius: RADIUS.md,
    paddingVertical: 13,
    alignItems: "center",
  },
  btnGhost: {
    marginTop: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  btnTxt: { color: "#fff", fontWeight: "800", fontSize: 14 },
  btnGhostTxt: { color: COLORS.water, fontWeight: "800", fontSize: 13 },
  note: {
    marginTop: 12,
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 17,
  },
  footer: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    lineHeight: 16,
    textAlign: "center",
    marginTop: 8,
  },
});
