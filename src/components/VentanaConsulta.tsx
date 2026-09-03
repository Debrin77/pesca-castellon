import React, { useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Animated,
  Dimensions,
  Pressable,
} from "react-native";
import { COLORS, RADIUS } from "../theme";

type Props = {
  visible: boolean;
  titulo?: string;
  onCerrar: () => void;
  children: React.ReactNode;
  acento?: "bosque" | "mar";
};

const H = Dimensions.get("window").height;

/**
 * Sheet inferior estilo iOS (en lugar de pantalla completa rígida).
 */
export default function VentanaConsulta({
  visible,
  titulo = "Consulta de pesca",
  onCerrar,
  children,
  acento = "bosque",
}: Props) {
  const mar = acento === "mar";
  const linea = mar ? COLORS.water : COLORS.primary;
  const boton = mar ? COLORS.waterDark : COLORS.primaryDark;
  const y = useRef(new Animated.Value(H)).current;

  useEffect(() => {
    if (visible) {
      y.setValue(H * 0.25);
      Animated.spring(y, {
        toValue: 0,
        friction: 9,
        tension: 80,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, y]);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onCerrar}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onCerrar} accessibilityLabel="Cerrar" />
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: mar ? COLORS.waterLight : COLORS.background,
              transform: [{ translateY: y }],
              borderTopColor: linea,
            },
          ]}
        >
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>
          <View style={[styles.cabecera, { borderBottomColor: linea }]}>
            <Text style={[styles.titulo, { color: mar ? COLORS.waterDark : COLORS.primaryDark }]} numberOfLines={2}>
              {titulo}
            </Text>
            <TouchableOpacity
              onPress={onCerrar}
              style={[styles.cerrar, { backgroundColor: boton }]}
              accessibilityRole="button"
              accessibilityLabel="Cerrar consulta"
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
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(12,44,32,0.45)" },
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheet: {
    maxHeight: H * 0.88,
    minHeight: H * 0.55,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 3,
    overflow: "hidden",
    ...Platform.select({
      web: { boxShadow: "0 -12px 40px rgba(12,44,32,0.25)" } as any,
      default: {
        shadowColor: "#0c2c20",
        shadowOpacity: 0.2,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: -6 },
        elevation: 16,
      },
    }),
  },
  handleWrap: { alignItems: "center", paddingTop: 8, paddingBottom: 2 },
  handle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  cabecera: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    backgroundColor: COLORS.surface,
    minHeight: 56,
  },
  titulo: {
    flex: 1,
    fontSize: 17,
    fontWeight: "800",
    paddingRight: 8,
    letterSpacing: -0.3,
  },
  cerrar: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  cerrarX: { fontSize: 26, lineHeight: 30, color: "#fff", fontWeight: "300", marginTop: -1 },
  cuerpo: { flexGrow: 1 },
  cuerpoInner: { padding: 16, paddingBottom: 48 },
});
