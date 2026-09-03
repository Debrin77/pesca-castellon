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
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderTopWidth: 2,
    overflow: "hidden",
    ...Platform.select({
      web: { boxShadow: "0 -12px 40px rgba(12,44,32,0.22)" } as any,
      default: {
        shadowColor: "#0c2c20",
        shadowOpacity: 0.18,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: -6 },
        elevation: 16,
      },
    }),
  },
  handleWrap: { alignItems: "center", paddingTop: 10, paddingBottom: 4 },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(18,32,24,0.22)",
  },
  cabecera: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.surface,
    minHeight: 54,
  },
  titulo: {
    flex: 1,
    fontSize: 16.5,
    fontWeight: "800",
    paddingRight: 8,
    letterSpacing: -0.25,
  },
  cerrar: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  cerrarX: { fontSize: 24, lineHeight: 28, color: "#fff", fontWeight: "300", marginTop: -1 },
  cuerpo: { flexGrow: 1 },
  cuerpoInner: { padding: 16, paddingBottom: 48 },
});
