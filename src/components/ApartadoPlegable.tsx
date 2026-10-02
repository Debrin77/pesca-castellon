/**
 * Apartado plegable para Inicio (y paneles densos).
 * Superficie limpia sin borde duro: jerarquía por tipografía y espacio.
 */
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { COLORS, FONTS, RADIUS, SPACING } from "../theme";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export type ApartadoPlegableProps = {
  /** Etiqueta opcional a la izquierda del título (poco habitual; preferir sin número). */
  orden?: string | number;
  titulo: string;
  /** Resumen cuando está cerrado; detalle cuando abierto. */
  subCerrado: string;
  subAbierto?: string;
  /** Abierto al montar (por defecto cerrado). */
  inicialAbierto?: boolean;
  /** Control externo opcional. */
  abierto?: boolean;
  onAbiertoChange?: (abierto: boolean) => void;
  /** Variante anidada (dentro de otro apartado). */
  interno?: boolean;
  accessibilityLabelAbrir?: string;
  accessibilityLabelCerrar?: string;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

export default function ApartadoPlegable({
  orden,
  titulo,
  subCerrado,
  subAbierto,
  inicialAbierto = false,
  abierto: abiertoCtrl,
  onAbiertoChange,
  interno = false,
  accessibilityLabelAbrir,
  accessibilityLabelCerrar,
  style,
  children,
}: ApartadoPlegableProps) {
  const [abiertoLocal, setAbiertoLocal] = useState(inicialAbierto);
  const controlado = abiertoCtrl !== undefined;
  const abierto = controlado ? !!abiertoCtrl : abiertoLocal;

  useEffect(() => {
    if (!controlado) setAbiertoLocal(inicialAbierto);
  }, [inicialAbierto, controlado]);

  function toggle() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const next = !abierto;
    if (!controlado) setAbiertoLocal(next);
    onAbiertoChange?.(next);
  }

  const labelAbrir =
    accessibilityLabelAbrir ?? `Desplegar ${titulo}: ${subCerrado}`;
  const labelCerrar =
    accessibilityLabelCerrar ?? `Ocultar ${titulo}`;

  return (
    <View
      style={[interno ? styles.wrapInterno : styles.wrap, style]}
      accessibilityRole="summary"
    >
      <TouchableOpacity
        onPress={toggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: abierto }}
        accessibilityLabel={abierto ? labelCerrar : labelAbrir}
        style={styles.cabecera}
        activeOpacity={0.7}
      >
        {orden != null ? (
          <View style={[styles.ordenBadge, interno && styles.ordenBadgeInterno]}>
            <Text style={styles.ordenTxt}>{String(orden)}</Text>
          </View>
        ) : null}
        <View style={styles.titulos}>
          <Text style={[styles.titulo, interno && styles.tituloInterno]} numberOfLines={2}>
            {titulo}
          </Text>
          <Text style={[styles.sub, interno && styles.subInterno]} numberOfLines={2}>
            {abierto ? subAbierto ?? subCerrado : subCerrado}
          </Text>
        </View>
        <View style={[styles.chevronWrap, abierto && styles.chevronWrapAbierto]}>
          <Text style={styles.chevron} accessibilityElementsHidden>
            ›
          </Text>
        </View>
      </TouchableOpacity>
      {abierto ? <View style={styles.cuerpo}>{children}</View> : null}
    </View>
  );
}

/** Cabecera fija (sin plegar) para bloques que deben quedar siempre a la vista. */
export function ApartadoFijo({
  orden,
  titulo,
  sub,
  style,
  children,
}: {
  orden?: string | number;
  titulo: string;
  sub?: string;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.wrap, style]} accessibilityRole="summary">
      <View style={styles.cabeceraFija}>
        {orden != null ? (
          <View style={styles.ordenBadge}>
            <Text style={styles.ordenTxt}>{String(orden)}</Text>
          </View>
        ) : null}
        <View style={styles.titulos}>
          <Text style={styles.titulo}>{titulo}</Text>
          {sub ? (
            <Text style={styles.sub} numberOfLines={2}>
              {sub}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={styles.cuerpoFijo}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: SPACING.md,
    marginTop: 14,
    marginBottom: 2,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    overflow: "hidden",
  },
  wrapInterno: {
    marginHorizontal: 0,
    marginTop: 10,
    marginBottom: 2,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.mist,
    overflow: "hidden",
  },
  cabecera: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 12,
  },
  cabeceraFija: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 2,
    gap: 12,
  },
  ordenBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.primaryDark,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  ordenBadgeInterno: {
    minWidth: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: COLORS.waterDark,
  },
  ordenTxt: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
    fontFamily: FONTS.extrabold,
  },
  titulos: { flex: 1, minWidth: 0 },
  titulo: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: FONTS.displaySemi,
    color: COLORS.textPrimary,
    letterSpacing: -0.25,
  },
  tituloInterno: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    letterSpacing: -0.1,
  },
  sub: {
    marginTop: 3,
    fontSize: 13.5,
    lineHeight: 18,
    color: COLORS.textSecondary,
    fontWeight: "500",
    fontFamily: FONTS.regular,
  },
  subInterno: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  chevronWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.mist,
    alignItems: "center",
    justifyContent: "center",
  },
  chevronWrapAbierto: {
    transform: [{ rotate: "90deg" }],
    backgroundColor: COLORS.primaryLight,
  },
  chevron: {
    fontSize: 18,
    color: COLORS.primaryDark,
    fontWeight: "600",
    marginTop: -1,
  },
  cuerpo: {
    paddingHorizontal: 14,
    paddingBottom: 16,
    paddingTop: 2,
  },
  cuerpoFijo: {
    paddingHorizontal: 14,
    paddingBottom: 16,
    paddingTop: 8,
  },
});
