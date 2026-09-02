/**
 * Identidad visual: bosque de interior + agua de embalse.
 * Superficies claras, acentos profundos, sin recargar de degradados.
 */
export const COLORS = {
  primary: "#164a36",
  primaryDark: "#0c2c20",
  primaryLight: "#e4efe8",
  water: "#1a6f8a",
  waterDark: "#0e4456",
  waterLight: "#e6f3f7",
  warning: "#c45c12",
  warningLight: "#fef3e6",
  danger: "#b42318",
  dangerLight: "#fdecea",
  success: "#2f7d4a",
  gold: "#c4921a",
  surface: "#ffffff",
  background: "#eef2ee",
  border: "#d8e2db",
  textPrimary: "#122018",
  textSecondary: "#4d5d54",
  textMuted: "#87948c",
  mist: "#f7faf7",
  puerto: "#6b7280",
};

/** Semáforo legal: un verde, un rojo, un ámbar. */
export const SEMAFORO = {
  si: COLORS.success,
  no: COLORS.danger,
  coto: COLORS.warning,
  neutro: COLORS.textSecondary,
};

/** Pines del mapa: tres significados + tú / mis puntos. */
export const PIN = {
  playa: COLORS.water,
  libre: COLORS.success,
  coto: COLORS.warning,
  vedado: COLORS.danger,
  puerto: COLORS.puerto,
  yo: COLORS.water,
  spot: COLORS.gold,
};

export const GRADIENTS = {
  primary: ["#1a5640", "#0f3326"] as const,
  water: ["#2a7a94", "#13485a"] as const,
  sunset: ["#d4a017", "#c45c12"] as const,
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
