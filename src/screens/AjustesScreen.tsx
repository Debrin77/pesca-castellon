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
import { useProvincia } from "../context/ProvinciaContext";
import { getProvinciaActiva } from "../provincias/runtime";
import {
  activarBloqueoConContrasena,
  cambiarContrasena,
  desactivarBloqueo,
  setBiometriaActiva,
} from "../services/accesoService";
import { reiniciarPresentacionVirtudes } from "../services/offlineService";
import { COLORS, RADIUS, SHADOW_SOFT, SPACING } from "../theme";
import PanelOfflineMapa from "../components/PanelOfflineMapa";
import PescaRecBanner from "../components/PescaRecBanner";
import CalendarioConcursos from "../components/CalendarioConcursos";

function avisar(titulo: string, mensaje: string) {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.alert(`${titulo}\n\n${mensaje}`);
    return;
  }
  Alert.alert(titulo, mensaje);
}

function soloDigitos(v: string): string {
  return v.replace(/\D/g, "").slice(0, 8);
}

function esPinValido(v: string): boolean {
  return /^\d{4,8}$/.test(v.trim());
}

export default function AjustesScreen() {
  const { config, biometria, refrescar, marcarDesbloqueado } = useAcceso();
  const { provincia: provinciaCtx, cambiarProvincia } = useProvincia();
  const provincia = provinciaCtx ?? getProvinciaActiva();
  const [cargando, setCargando] = useState(false);
  const [nuevoPin, setNuevoPin] = useState("");
  const [repetirPin, setRepetirPin] = useState("");
  const [pinActual, setPinActual] = useState("");
  const [modoCambio, setModoCambio] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refrescar();
    }, [refrescar])
  );

  async function activar() {
    if (!esPinValido(nuevoPin)) {
      avisar("PIN inválido", "Usa entre 4 y 8 dígitos numéricos.");
      return;
    }
    if (nuevoPin !== repetirPin) {
      avisar("No coinciden", "Los dos PIN deben ser iguales.");
      return;
    }
    setCargando(true);
    try {
      await activarBloqueoConContrasena(nuevoPin.trim());
      setNuevoPin("");
      setRepetirPin("");
      await refrescar();
      marcarDesbloqueado();
      avisar(
        "Listo",
        "La app pedirá tu PIN al abrirla o al volver tras unos segundos en segundo plano. Puedes activar Face ID / huella debajo."
      );
    } catch (e: any) {
      avisar("Error", e?.message ?? "No se pudo activar el bloqueo.");
    } finally {
      setCargando(false);
    }
  }

  async function desactivar() {
    if (pinActual.trim().length < 4) {
      avisar("PIN", "Introduce tu PIN actual para desactivar el bloqueo.");
      return;
    }
    setCargando(true);
    try {
      await desactivarBloqueo(pinActual);
      setPinActual("");
      await refrescar();
      avisar("Desactivado", "Ya no se pedirá PIN al entrar.");
    } catch (e: any) {
      avisar("Error", e?.message ?? "No se pudo desactivar.");
    } finally {
      setCargando(false);
    }
  }

  async function guardarCambioPin() {
    if (!esPinValido(nuevoPin) || nuevoPin !== repetirPin) {
      avisar("Revisa el PIN", "Entre 4 y 8 dígitos, y deben coincidir.");
      return;
    }
    setCargando(true);
    try {
      await cambiarContrasena(pinActual, nuevoPin.trim());
      setPinActual("");
      setNuevoPin("");
      setRepetirPin("");
      setModoCambio(false);
      await refrescar();
      avisar("Actualizado", "El PIN se ha cambiado.");
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

  async function verPresentacionOtraVez() {
    await reiniciarPresentacionVirtudes();
    avisar(
      "Presentación",
      "La próxima vez que abras la app verás de nuevo la presentación de virtudes (puedes cerrarla con la X)."
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.lead}>
        Tu cuaderno de pesca es personal: PIN, biometria y datos locales en este
        dispositivo. Compartir un sitio es opcional, no el motivo de la app.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Provincia de pesca</Text>
        <View style={styles.row}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.rowTitle}>{provincia.nombre}</Text>
            <Text style={styles.rowSub}>
              El mapa, los sitios y las capturas guardados son por provincia.
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => cambiarProvincia()}
          accessibilityRole="button"
          accessibilityLabel="Cambiar provincia"
        >
          <Text style={styles.btnTxt}>Cambiar provincia</Text>
        </TouchableOpacity>
      </View>

      <PanelOfflineMapa />
      <CalendarioConcursos provinciaId={provincia.id} limite={8} />
      {!provincia.continentalOnly ? <PescaRecBanner /> : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Acceso a la app</Text>
        <View style={styles.row}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.rowTitle}>Bloqueo con PIN</Text>
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
            <Text style={styles.label}>Nuevo PIN (4-8 dígitos)</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              keyboardType="number-pad"
              value={nuevoPin}
              onChangeText={(t) => setNuevoPin(soloDigitos(t))}
              placeholder="Ej. 2580"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="none"
              maxLength={8}
            />
            <Text style={styles.label}>Repetir PIN</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              keyboardType="number-pad"
              value={repetirPin}
              onChangeText={(t) => setRepetirPin(soloDigitos(t))}
              placeholder="Repite el PIN"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="none"
              maxLength={8}
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
            <Text style={styles.label}>PIN actual</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              keyboardType="number-pad"
              value={pinActual}
              onChangeText={(t) => setPinActual(soloDigitos(t))}
              placeholder="Para desactivar o cambiar"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="none"
              maxLength={8}
            />

            {!modoCambio ? (
              <>
                <TouchableOpacity style={styles.btnGhost} onPress={() => setModoCambio(true)}>
                  <Text style={styles.btnGhostTxt}>Cambiar PIN</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnDanger} onPress={desactivar} disabled={cargando}>
                  <Text style={styles.btnTxt}>Desactivar bloqueo</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.label}>Nuevo PIN</Text>
                <TextInput
                  style={styles.input}
                  secureTextEntry
                  keyboardType="number-pad"
                  value={nuevoPin}
                  onChangeText={(t) => setNuevoPin(soloDigitos(t))}
                  autoCapitalize="none"
                  maxLength={8}
                />
                <Text style={styles.label}>Repetir nuevo PIN</Text>
                <TextInput
                  style={styles.input}
                  secureTextEntry
                  keyboardType="number-pad"
                  value={repetirPin}
                  onChangeText={(t) => setRepetirPin(soloDigitos(t))}
                  autoCapitalize="none"
                  maxLength={8}
                />
                <TouchableOpacity style={styles.btn} onPress={guardarCambioPin} disabled={cargando}>
                  <Text style={styles.btnTxt}>Guardar nuevo PIN</Text>
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
            <Text style={styles.rowTitle}>Entrar con biometria</Text>
            <Text style={styles.rowSub}>
              {biometria.detalle ||
                (config.bloqueoActivo
                  ? "Usa Face ID / huella y, si falla, el PIN."
                  : "Activa primero el bloqueo con PIN.")}
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
            En la web puedes usar el PIN. Face ID / huella requiere la app en el móvil.
          </Text>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Presentación</Text>
        <Text style={styles.rowSub}>
          Pantallas estilo App Store con las virtudes de la app. Se pueden cerrar
          con la X de arriba a la derecha.
        </Text>
        <TouchableOpacity style={styles.btnGhost} onPress={verPresentacionOtraVez}>
          <Text style={styles.btnGhostTxt}>Ver presentación otra vez</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>
        El PIN se guarda cifrado (hash) en este dispositivo. No se envía a ningún servidor.
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
