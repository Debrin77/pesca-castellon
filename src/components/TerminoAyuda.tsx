import React, { useState } from "react";
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Platform,
  Image,
  ScrollView,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { terminoGlosario } from "../data/glosario";
import { primeraFotoGuia } from "../data/consejosMedia";
import { COLORS, RADIUS, SHADOW, SPACING } from "../theme";

type Props = {
  id: string;
  children?: React.ReactNode;
  textStyle?: object;
  variante?: "clara" | "sobreOscuro";
};

/** Palabra con «?» que abre ficha corta del glosario (con foto si hay). */
export default function TerminoAyuda({
  id,
  children,
  textStyle,
  variante = "clara",
}: Props) {
  const [abierto, setAbierto] = useState(false);
  const navigation = useNavigation<any>();
  const t = terminoGlosario(id);
  if (!t) {
    return <Text style={textStyle}>{children ?? id}</Text>;
  }
  const sobreOscuro = variante === "sobreOscuro";
  const foto = primeraFotoGuia(t.diagramaId);

  const irFicha = () => {
    setAbierto(false);
    if (!t.consejoId) return;
    navigation.navigate("Consejos", {
      consejoId: t.consejoId,
      categoria: "vocabulario",
    });
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setAbierto(true)}
        accessibilityRole="button"
        accessibilityLabel={`Qué es ${t.etiqueta}`}
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        style={styles.hit}
      >
        <Text style={[styles.label, sobreOscuro && styles.labelOscuro, textStyle]}>
          {children ?? t.etiqueta}
          <Text style={[styles.q, sobreOscuro && styles.qOscuro]}> ?</Text>
        </Text>
      </TouchableOpacity>

      <Modal visible={abierto} transparent animationType="fade" onRequestClose={() => setAbierto(false)}>
        <Pressable style={styles.backdrop} onPress={() => setAbierto(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <ScrollView style={{ maxHeight: Platform.OS === "web" ? 520 : 480 }} bounces={false}>
              <Text style={styles.sheetKicker}>Glosario</Text>
              <Text style={styles.sheetTitle}>{t.etiqueta}</Text>
              {foto ? (
                <Image
                  source={foto}
                  style={styles.foto}
                  resizeMode="cover"
                  accessibilityLabel={`Ejemplo de ${t.etiqueta}`}
                />
              ) : null}
              <Text style={styles.sheetResumen}>{t.resumen}</Text>
              {t.detalle ? <Text style={styles.sheetDetalle}>{t.detalle}</Text> : null}
            </ScrollView>
            <View>
              {t.consejoId ? (
                <TouchableOpacity
                  style={styles.secundario}
                  onPress={irFicha}
                  accessibilityRole="button"
                  accessibilityLabel={`Ver ficha de ${t.etiqueta} en Consejos`}
                >
                  <Text style={styles.secundarioTxt}>Ver ficha con foto</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={styles.cerrar}
                onPress={() => setAbierto(false)}
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
              >
                <Text style={styles.cerrarTxt}>Entendido</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  hit: { flexDirection: "row", alignItems: "center" },
  label: { fontSize: 13, fontWeight: "800", color: COLORS.waterDark },
  labelOscuro: { color: "rgba(255,255,255,0.95)" },
  q: { fontSize: 12, fontWeight: "700", color: COLORS.goldText },
  qOscuro: { color: "rgba(255,255,255,0.7)" },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(12, 44, 32, 0.45)",
    justifyContent: "center",
    padding: SPACING.xl,
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    ...SHADOW,
    ...Platform.select({ web: { maxWidth: 420, alignSelf: "center", width: "100%" } }),
  },
  sheetKicker: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: COLORS.textMuted,
    marginBottom: 6,
  },
  sheetTitle: { fontSize: 20, fontWeight: "800", color: COLORS.textPrimary, marginBottom: 8 },
  foto: {
    width: "100%",
    height: 160,
    borderRadius: RADIUS.md,
    marginBottom: 12,
    backgroundColor: COLORS.background,
  },
  sheetResumen: { fontSize: 15, fontWeight: "600", color: COLORS.textPrimary, lineHeight: 22 },
  sheetDetalle: { marginTop: 10, fontSize: 14, color: COLORS.textSecondary, lineHeight: 21 },
  secundario: {
    marginTop: SPACING.md,
    alignSelf: "flex-start",
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: RADIUS.sm,
  },
  secundarioTxt: { color: COLORS.primaryDark, fontWeight: "800", fontSize: 14 },
  cerrar: {
    marginTop: SPACING.sm,
    alignSelf: "flex-start",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
  },
  cerrarTxt: { color: "#fff", fontWeight: "800", fontSize: 14 },
});
