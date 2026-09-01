/**
 * Sistema de diseño de la app. Paleta natural (verde bosque + azul agua)
 * con acabado moderno: gradientes suaves, esquinas grandes y sombras
 * elevadas en vez de bordes planos.
 */
export const COLORS = {
  primary: "#1b5e3f",
  primaryDark: "#0f3d29",
  primaryLight: "#e8f3ec",
  water: "#0277bd",
  waterDark: "#01466e",
  waterLight: "#e3f2fd",
  warning: "#ef6c00",
  warningLight: "#fff3e0",
  danger: "#c62828",
  dangerLight: "#fdecea",
  success: "#2e7d32",
  gold: "#f9a825",
  surface: "#ffffff",
  background: "#f4f7f5",
  border: "#e6ebe8",
  textPrimary: "#132019",
  textSecondary: "#5b6b62",
  textMuted: "#98a39c",
};

/** Pares de colores para gradientes (usar con expo-linear-gradient). */
export const GRADIENTS = {
  primary: ["#1f6b47", "#123f2a"] as const,
  water: ["#0288d1", "#01466e"] as const,
  sunset: ["#f9a825", "#ef6c00"] as const,
  dusk: ["#2c3e50", "#0f3d29"] as const,
  danger: ["#e53935", "#8e1414"] as const,
};

export const RADIUS = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
};

export const SHADOW = {
  shadowColor: "#0f3d29",
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.1,
  shadowRadius: 14,
  elevation: 4,
};

export const SHADOW_SOFT = {
  shadowColor: "#0f3d29",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 6,
  elevation: 2,
};

export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
