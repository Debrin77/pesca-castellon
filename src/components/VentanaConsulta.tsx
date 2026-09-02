import React from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, StatusBar } from "react-native";
import { COLORS, RADIUS } from "../theme";

type Props = {
  visible: boolean;
  titulo?: string;
  onCerrar: () => void;
  children: React.ReactNode;
};

export default function VentanaConsulta({ visible, titulo = "Consulta de pesca", onCerrar, children }: Props) {
  const tope = Platform.OS === "android" ? StatusBar.currentHeight ?? 24 : Platform.OS === "web" ? 12 : 52;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onCerrar}
      statusBarTranslucent
    >
      <View style={[styles.pantalla, { paddingTop: tope }]}>
        <View style={styles.cabecera}>
          <Text style={styles.titulo} numberOfLines={2}>
            {titulo}
          </Text>
          <TouchableOpacity
            onPress={onCerrar}
            style={styles.cerrar}
            accessibilityRole="button"
            accessibilityLabel="Cerrar consulta"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.cerrarX}>×</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          style={styles.cuerpo}
          contentContainerStyle={styles.cuerpoInner}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: COLORS.background },
  cabecera: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.water,
    backgroundColor: COLORS.surface,
    minHeight: 60,
  },
  titulo: {
    flex: 1,
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.primaryDark,
    paddingRight: 8,
    letterSpacing: -0.3,
  },
  cerrar: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primaryDark,
  },
  cerrarX: { fontSize: 28, lineHeight: 32, color: "#fff", fontWeight: "300", marginTop: -1 },
  cuerpo: { flex: 1 },
  cuerpoInner: { padding: 16, paddingBottom: 40 },
});
