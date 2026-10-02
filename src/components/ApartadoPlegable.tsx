/**
 * Apartado plegable para Inicio (y paneles densos).
 * Misma tipografía/cabecera en todos los bloques: diferencia clara sin omitir contenido.
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
import { COLORS, FONTS, RADIUS, SHADOW_SOFT, SPACING } from "../theme";

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
          <Text style={styles.sub} numberOfLines={2}>
            {abierto ? subAbierto ?? subCerrado : subCerrado}
          </Text>
        </View>
        <Text style={styles.chevron} accessibilityElementsHidden>
          {abierto ? "▲" : "▼"}
        </Text>
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
      <View style={styles.cuerpo}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: SPACING.sm,
    marginTop: 10,
    marginBottom: 6,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    ...SHADOW_SOFT,
  },
  wrapInterno: {
    marginHorizontal: 0,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.mist,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  cabecera: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  cabeceraFija: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 10,
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
    fontSize: 16,
    fontWeight: "800",
    fontFamily: FONTS.displaySemi,
    color: COLORS.textPrimary,
  },
  tituloInterno: {
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
  sub: {
    marginTop: 2,
    fontSize: 12.5,
    lineHeight: 17,
    color: COLORS.textSecondary,
    fontWeight: "600",
    fontFamily: FONTS.semibold,
  },
  chevron: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: "800",
    marginLeft: 4,
  },
  cuerpo: {
    paddingHorizontal: SPACING.sm,
    paddingBottom: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
  },
});
