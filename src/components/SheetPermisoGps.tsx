import React from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity, Pressable } from "react-native";
import { COLORS, RADIUS } from "../theme";

type Props = {
  visible: boolean;
  onCancelar: () => void;
  onContinuar: () => void;
};

/** Explica el GPS antes del diálogo del sistema. */
export default function SheetPermisoGps({ visible, onCancelar, onContinuar }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancelar}>
      <Pressable style={styles.backdrop} onPress={onCancelar}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.kicker}>UBICACIÓN</Text>
          <Text style={styles.title}>¿Para qué pedimos el GPS?</Text>
          <Text style={styles.body}>
            Solo para decirte si puedes pescar donde estás (norma del tramo) y pintar el clima de ese
            punto. No compartimos tu posición ni la usamos para seguimiento.
          </Text>
          <TouchableOpacity
            style={styles.cta}
            onPress={onContinuar}
            accessibilityRole="button"
            accessibilityLabel="Continuar y permitir ubicación"
          >
            <Text style={styles.ctaTxt}>Continuar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onCancelar} accessibilityRole="button">
            <Text style={styles.cancel}>Ahora no</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    padding: 20,
    paddingBottom: 28,
  },
  kicker: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: COLORS.textMuted,
    marginBottom: 6,
  },
  title: { fontSize: 20, fontWeight: "800", color: COLORS.textPrimary },
  body: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  cta: {
    marginTop: 18,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  ctaTxt: { color: "#fff", fontWeight: "800", fontSize: 15 },
  cancel: {
    marginTop: 14,
    textAlign: "center",
    color: COLORS.textSecondary,
    fontWeight: "700",
    fontSize: 14,
  },
});
