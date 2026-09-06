/**
 * Copy único para no mezclar semáforo legal (¿puedo?) con índice meteo (¿pinta?).
 * Usar estos textos en Inicio, Salgo a pescar, Previsión y SemaforoVeredicto.
 */
export const EJE_LEGAL = {
  kicker: "NORMATIVA",
  pregunta: "¿Puedo pescar aquí?",
  /** Chip / título corto en Inicio */
  tituloCorto: "Normativa · ¿puedo?",
  /** Una línea: qué mide y qué no */
  aviso: "Permiso, veda y tipo de agua · no es el clima",
  /** Accesibilidad */
  a11y: "Normativa del punto: permiso y veda. No indica si el clima es bueno.",
} as const;

export const EJE_METEO = {
  kicker: "CLIMA",
  pregunta: "¿Cómo pinta el día?",
  tituloCorto: "Condiciones · clima",
  /** Etiqueta del índice 0–100 */
  indexLabel: "Condiciones (clima)",
  aviso: "Orientativo por tiempo y luna · no autoriza a pescar",
  a11y: "Condiciones de pesca por clima. No es el permiso legal del tramo.",
} as const;
