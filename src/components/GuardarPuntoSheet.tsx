import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Pressable,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  COLORES_PUNTO,
  ICONOS_PUNTO,
  COLOR_PUNTO_DEFAULT,
  ICONO_PUNTO_DEFAULT,
  type ColorPuntoId,
  type IconoPuntoId,
  esColorPuntoId,
  esIconoPuntoId,
} from "../data/iconosPunto";
import { COLORS, FONTS, RADIUS, SPACING } from "../theme";
import { formatearCoords } from "../services/coordsUtils";

export type BorradorPunto = {
  lat: number;
  lng: number;
  nombreSugerido?: string;
  zonaRelacionadaId?: string | null;
  /** Si edita un punto existente. */
  puntoId?: string | null;
  color?: string | null;
  icono?: string | null;
};

type Props = {
  visible: boolean;
  borrador: BorradorPunto | null;
  onCerrar: () => void;
  onGuardar: (datos: {
    nombre: string;
    color: ColorPuntoId;
    icono: IconoPuntoId;
    lat: number;
    lng: number;
    zonaRelacionadaId?: string | null;
    puntoId?: string | null;
  }) => void;
};

/**
 * Sheet para guardar o editar un punto: nombre + color + icono.
 */
export default function GuardarPuntoSheet({ visible, borrador, onCerrar, onGuardar }: Props) {
  const insets = useSafeAreaInsets();
  const [nombre, setNombre] = useState("");
  const [color, setColor] = useState<ColorPuntoId>(COLOR_PUNTO_DEFAULT);
  const [icono, setIcono] = useState<IconoPuntoId>(ICONO_PUNTO_DEFAULT);
  const editando = !!borrador?.puntoId;

  useEffect(() => {
    if (!visible || !borrador) return;
    setNombre(
      borrador.nombreSugerido?.trim() ||
        `Punto del ${new Date().toLocaleDateString("es-ES")}`
    );
    setColor(esColorPuntoId(borrador.color) ? borrador.color : COLOR_PUNTO_DEFAULT);
    setIcono(esIconoPuntoId(borrador.icono) ? borrador.icono : ICONO_PUNTO_DEFAULT);
  }, [visible, borrador]);

  if (!borrador) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCerrar}>
      <Pressable style={styles.backdrop} onPress={onCerrar} accessibilityLabel="Cerrar">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.flexEnd}
        >
          <Pressable
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}
            onPress={(e) => e.stopPropagation?.()}
          >
            <View style={styles.handle} />
            <Text style={styles.titulo}>{editando ? "Editar punto" : "Guardar punto"}</Text>
            <Text style={styles.coords}>
              {formatearCoords(borrador.lat, borrador.lng)}
            </Text>

            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={styles.input}
              value={nombre}
              onChangeText={setNombre}
              placeholder="Ej. Orilla del atardecer"
              placeholderTextColor={COLORS.textMuted}
              maxLength={60}
              autoFocus={Platform.OS !== "web"}
              accessibilityLabel="Nombre del punto"
            />

            <Text style={styles.label}>Color</Text>
            <View style={styles.row}>
              {COLORES_PUNTO.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.swatch,
                    { backgroundColor: c.hex },
                    color === c.id && styles.swatchOn,
                  ]}
                  onPress={() => setColor(c.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Color ${c.label}`}
                  accessibilityState={{ selected: color === c.id }}
                />
              ))}
            </View>

            <Text style={styles.label}>Icono</Text>
            <View style={styles.row}>
              {ICONOS_PUNTO.map((i) => (
                <TouchableOpacity
                  key={i.id}
                  style={[styles.iconChip, icono === i.id && styles.iconChipOn]}
                  onPress={() => setIcono(i.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Icono ${i.label}`}
                  accessibilityState={{ selected: icono === i.id }}
                >
                  <Text style={[styles.iconGlyph, icono === i.id && styles.iconGlyphOn]}>
                    {i.glyph}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.cta}
              onPress={() => {
                const n = nombre.trim() || `Punto del ${new Date().toLocaleDateString("es-ES")}`;
                onGuardar({
                  nombre: n,
                  color,
                  icono,
                  lat: borrador.lat,
                  lng: borrador.lng,
                  zonaRelacionadaId: borrador.zonaRelacionadaId ?? null,
                  puntoId: borrador.puntoId ?? null,
                });
              }}
              accessibilityRole="button"
              accessibilityLabel={editando ? "Guardar cambios del punto" : "Confirmar guardar punto"}
            >
              <Text style={styles.ctaTxt}>
                {editando ? "Guardar cambios" : "Guardar en mis sitios"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancel} onPress={onCerrar} accessibilityRole="button">
              <Text style={styles.cancelTxt}>Cancelar</Text>
            </TouchableOpacity>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(8, 18, 14, 0.45)",
    justifyContent: "flex-end",
  },
  flexEnd: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingTop: 10,
    maxHeight: "92%",
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    marginBottom: 12,
  },
  titulo: {
    fontFamily: FONTS.display,
    fontSize: 22,
    color: COLORS.primaryDark,
    letterSpacing: -0.4,
  },
  coords: {
    marginTop: 4,
    fontFamily: FONTS.semibold,
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 14,
  },
  label: {
    fontFamily: FONTS.bold,
    fontWeight: "700",
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "web" ? 12 : 11,
    fontFamily: FONTS.semibold,
    fontSize: 16,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.background,
    marginBottom: 14,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  swatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: "transparent",
  },
  swatchOn: {
    borderColor: COLORS.primaryDark,
    transform: [{ scale: 1.08 }],
  },
  iconChip: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  iconChipOn: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  iconGlyph: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: "700",
  },
  iconGlyphOn: { color: COLORS.primaryDark },
  cta: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: RADIUS.md,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 4,
  },
  ctaTxt: {
    color: "#fff",
    fontFamily: FONTS.extrabold,
    fontWeight: "800",
    fontSize: 15,
  },
  cancel: { paddingVertical: 12, alignItems: "center" },
  cancelTxt: {
    fontFamily: FONTS.semibold,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});
