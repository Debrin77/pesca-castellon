/**
 * Identidad visual: bosque de interior + agua de embalse.
 * Superficies claras, acentos profundos, sin recargar de degradados.
 *
 * Contraste WCAG 2.1 AA (≥4.5:1 texto normal) sobre fondos claros/oscuros
 * de la app. Los acentos usados como color de texto van oscurecidos a
 * propósito; `gold` queda para rellenos/pines y `goldText` para tipografía.
 */
export const COLORS = {
  primary: "#164a36",
  primaryDark: "#0c2c20",
  primaryLight: "#e4efe8",
  water: "#1a6f8a",
  waterDark: "#0e4456",
  waterLight: "#e6f3f7",
  /** Ámbar oscuro: legible sobre blanco y admite blanco encima (semáforo coto). */
  warning: "#9a4a0a",
  warningLight: "#fef3e6",
  danger: "#b42318",
  dangerLight: "#fdecea",
  /** Verde más profundo para contrastar también sobre primaryLight. */
  success: "#246b3d",
  /** Relleno / pin (no usar como color de texto pequeño). */
  gold: "#c4921a",
  /** Texto / icono tipográfico sobre fondos claros. */
  goldText: "#7a5c0d",
  surface: "#ffffff",
  background: "#eef2ee",
  border: "#d8e2db",
  textPrimary: "#122018",
  textSecondary: "#4d5d54",
  /** Antes #87948c (~2.8:1 sobre fondo); ahora ≥4.5:1. */
  textMuted: "#55665e",
  mist: "#f7faf7",
  puerto: "#4b5563",
};

/** Semáforo legal: un verde, un rojo, un ámbar. */
export const SEMAFORO = {
  si: COLORS.success,
  no: COLORS.danger,
  coto: COLORS.warning,
  neutro: COLORS.textSecondary,
};

/**
 * Pines del mapa (campo): cada significado un color distinto.
 * Antes captura/yo/playa compartían el mismo azul → ilegible al vuelo.
 */
export const PIN = {
  playa: COLORS.water,
  libre: COLORS.success,
  coto: COLORS.warning,
  vedado: COLORS.danger,
  puerto: COLORS.puerto,
  /** Tu GPS. */
  yo: COLORS.water,
  /** Puntos guardados / spots personales. */
  spot: COLORS.gold,
  /** Capturas del diario: terracota, no confundir con agua/GPS. */
  captura: "#a84828",
  /** Punto de consulta seleccionado (anillo visual + color propio). */
  seleccion: "#5b2d8e",
};

export const GRADIENTS = {
  primary: ["#1a5640", "#0f3326"] as const,
  water: ["#2a7a94", "#13485a"] as const,
  sunset: ["#b8860b", "#9a4a0a"] as const,
  dusk: ["#24352c", "#0f3326"] as const,
  danger: ["#c53030", "#8a1f1f"] as const,
};

export const RADIUS = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
};

export const SHADOW = {
  shadowColor: "#0c2c20",
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.1,
  shadowRadius: 18,
  elevation: 5,
};

export const SHADOW_SOFT = {
  shadowColor: "#0c2c20",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
};

export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

/**
 * Source Sans 3 (cuerpo) + Fraunces (titulares UI) + Syne (marca / vámonos).
 * Syne: sans geométrica moderna; contraste con el parche bordado y curiosidad.
 */
export const FONTS = {
  regular: "SourceSans3_400Regular",
  semibold: "SourceSans3_600SemiBold",
  bold: "SourceSans3_700Bold",
  extrabold: "SourceSans3_800ExtraBold",
  /** Display para héroes y presentación App Store. */
  display: "Fraunces_700Bold",
  displaySemi: "Fraunces_600SemiBold",
  displayItalic: "Fraunces_600SemiBold_Italic",
  /** Wordmark «Vámonos de pesca» (splash / puerta). */
  brand: "Syne_800ExtraBold",
  brandSemi: "Syne_600SemiBold",
};

/**
 * Escala tipográfica de producto (pesca de campo).
 * Syne = wordmark de marca (vámonos de pesca).
 * Fraunces = veredicto / títulos de sheet.
 * Source Sans = UI, chips de mapa, cuerpo y meta.
 */
export const TYPE = {
  /** Wordmark splash / puerta. */
  brandMark: {
    fontFamily: FONTS.brand,
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -0.8,
    fontWeight: "800" as const,
  },
  displayHero: {
    fontFamily: FONTS.display,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.4,
    fontWeight: "700" as const,
  },
  displayTitle: {
    fontFamily: FONTS.display,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.3,
    fontWeight: "700" as const,
  },
  displaySheet: {
    fontFamily: FONTS.display,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.35,
    fontWeight: "700" as const,
  },
  /** Veredicto legal grande (HOY SÍ / HOY NO). */
  displayVerdict: {
    fontFamily: FONTS.display,
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: 0.4,
    fontWeight: "700" as const,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.2,
    fontWeight: "700" as const,
  },
  body: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "400" as const,
  },
  bodyStrong: {
    fontFamily: FONTS.semibold,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600" as const,
  },
  caption: {
    fontFamily: FONTS.semibold,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600" as const,
  },
  overline: {
    fontFamily: FONTS.extrabold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.7,
    textTransform: "uppercase" as const,
    fontWeight: "800" as const,
  },
  mapChip: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "700" as const,
  },
  mapLegend: {
    fontFamily: FONTS.semibold,
    fontSize: 11.5,
    lineHeight: 14,
    letterSpacing: 0.15,
    fontWeight: "600" as const,
  },
};
