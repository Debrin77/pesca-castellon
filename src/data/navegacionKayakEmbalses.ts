/**
 * Kayak / remo en embalses del catálogo: navegación (organismo de cuenca)
 * vs pesca (licencia autonómica). Orientativo — confirma siempre la fuente.
 *
 * Fuentes principales:
 * - CHJ: listado embalses navegables + declaración responsable + anexos mejillón cebra
 * - CHG: tabla navegación Plan Hidrológico DH Guadalquivir + hoja informativa
 * - CHT: declaración responsable + confinamientos Buendía/Bolarque (2025)
 */

export type NavegacionKayakEstado =
  | "permitido"
  | "condicionado"
  | "no_autorizado"
  | "consultar";

export type OrganismoCuenca = "chj" | "chg" | "cht" | "otro";

export interface NavegacionKayakEmbalse {
  zoneId: string;
  provinciaId: "castellon" | "sevilla" | "cordoba" | "cuenca";
  nombre: string;
  organismo: OrganismoCuenca;
  /** ¿Se puede navegar a remo / kayak / pala según el organismo de cuenca? */
  navegacion: NavegacionKayakEstado;
  /**
   * ¿La pesca desde kayak es coherente si la navegación está OK?
   * Siempre exige licencia continental de la CCAA (+ cotos/permisos del día).
   */
  pescaDesdeKayak: NavegacionKayakEstado;
  /** Documentación / trámites típicos (navegación + pesca). */
  documentacion: string[];
  /** Límites del vaso (presa, motor, EEI…). */
  limitaciones: string[];
  fuentes: { etiqueta: string; url: string }[];
  actualizado: string;
  nota?: string;
}

const CHJ_NAV = {
  etiqueta: "CHJ · Navegación (declaración responsable)",
  url: "https://www.chj.es/es-es/ciudadano/tramitesysolicitudes/Paginas/M%C3%A1s%20informaci%C3%B3n%20sobre%20tr%C3%A1mites%20-%20Navegaci%C3%B3n.aspx",
};
const CHJ_LISTA = {
  etiqueta: "CHJ · Listado embalses navegables",
  url: "https://www.chj.es/es-es/ciudadano/tramitesysolicitudes/Documents/Listado%20de%20embalses%20d%C3%B3nde%20navegar.pdf",
};
const CHG_NAV = {
  etiqueta: "CHG · Navegación / declaración responsable",
  url: "https://www.chguadalquivir.es/",
};
const CHG_IDE = {
  etiqueta: "CHG · Vías navegables (IDE)",
  url: "https://idechg.chguadalquivir.es/geochg/areas/navigables",
};
const CHT_NAV = {
  etiqueta: "CHT · Navegación y flotación",
  url: "https://www.chtajo.es/",
};

const DOC_PESCA_CS = [
  "Licencia de pesca continental GVA (vigente).",
  "Si el tramo es coto (ZPC): permiso del coto además de la licencia.",
];
const DOC_PESCA_AND = [
  "Licencia continental Junta de Andalucía + Nº de Identificación de Pescador (NIR).",
  "Seguro de responsabilidad civil del pescador (obligatorio en Andalucía).",
  "Si hay coto/refugio con plan: permiso o cartel del titular.",
];
const DOC_PESCA_CLM = [
  "Licencia de pesca de Castilla-La Mancha (DIANA / Delegación).",
  "En cotos especiales o intensivos: permiso del día además de la licencia.",
];

const DOC_NAV_CHJ = [
  "Declaración responsable de navegación ante la CHJ (salvo exenciones por eslora muy corta: consulta hoja informativa vigente).",
  "En masas con mejillón cebra: protocolo de limpieza / confinamiento según zona marcada en la DR.",
  "Si el embalse es de otro concesionario: notificación previa al explotador (adjunto a la DR).",
];
const DOC_NAV_CHG = [
  "Declaración responsable de navegación ante la CHG (antelación según hoja informativa vigente).",
  "Canon de ocupación / navegación cuando proceda.",
  "En masas con EEI (mejillón cebra): protocolo de desinfección y, si hay confinamiento, no sacar la embarcación sin lavado autorizado.",
];
const DOC_NAV_CHT = [
  "Declaración responsable de navegación ante la CHT (sede electrónica MITECO / CHT).",
  "Documentación de la embarcación y seguro según instrucciones de la CHT.",
  "Desinfección / confinamiento cuando el embalse figure afectado (p. ej. Buendía, Bolarque).",
];

function chjRemo(opts: {
  zoneId: string;
  provinciaId: NavegacionKayakEmbalse["provinciaId"];
  nombre: string;
  distanciaPresaM: number;
  cebra?: "adulto" | "larvario" | "no";
  docPesca: string[];
  extraLimit?: string[];
  nota?: string;
}): NavegacionKayakEmbalse {
  const cebra = opts.cebra ?? "no";
  const lim = [
    `Solo remo / pala / motor eléctrico (prohibido gasolina/gasoil).`,
    `No aproximarse a menos de ${opts.distanciaPresaM} m de la presa` +
      (opts.zoneId === "embalse_sichar" ? " ni de los órganos de desagüe" : "") +
      ".",
    ...(opts.extraLimit ?? []),
  ];
  if (cebra === "adulto") {
    lim.push("Zona con mejillón cebra adulto: navegación con confinamiento / protocolo CHJ.");
  } else if (cebra === "larvario") {
    lim.push("Zona con mejillón cebra larvario: protocolo CHJ (una sola zona larvaria por DR).");
  }
  return {
    zoneId: opts.zoneId,
    provinciaId: opts.provinciaId,
    nombre: opts.nombre,
    organismo: "chj",
    navegacion: "permitido",
    pescaDesdeKayak: "permitido",
    documentacion: [...DOC_NAV_CHJ, ...opts.docPesca],
    limitaciones: lim,
    fuentes: [CHJ_NAV, CHJ_LISTA],
    actualizado: "2026-03",
    nota: opts.nota,
  };
}

/** Catálogo explícito por zoneId (embalses del panel SAIH + vasos clave del mapa). */
export const NAVEGACION_KAYAK_EMBALSES: NavegacionKayakEmbalse[] = [
  // ——— Castellón (CHJ) ———
  chjRemo({
    zoneId: "embalse_arenos",
    provinciaId: "castellon",
    nombre: "Embalse de Arenós",
    distanciaPresaM: 250,
    cebra: "larvario",
    docPesca: DOC_PESCA_CS,
  }),
  chjRemo({
    zoneId: "embalse_sichar",
    provinciaId: "castellon",
    nombre: "Embalse de Sichar",
    distanciaPresaM: 250,
    cebra: "adulto",
    docPesca: DOC_PESCA_CS,
    nota:
      "Figura en anexos/DR de la CHJ (zona A mejillón cebra). Confirma el listado y el formulario DR vigentes antes de sacar el kayak.",
  }),
  chjRemo({
    zoneId: "embalse_maria_cristina",
    provinciaId: "castellon",
    nombre: "Embalse de María Cristina",
    distanciaPresaM: 200,
    cebra: "no",
    docPesca: DOC_PESCA_CS,
  }),
  chjRemo({
    zoneId: "embalse_ulldecona",
    provinciaId: "castellon",
    nombre: "Embalse de Ulldecona",
    distanciaPresaM: 250,
    cebra: "no",
    docPesca: DOC_PESCA_CS,
  }),
  chjRemo({
    zoneId: "embalse_regajo_libre",
    provinciaId: "castellon",
    nombre: "Embalse del Regajo",
    distanciaPresaM: 200,
    cebra: "no",
    docPesca: DOC_PESCA_CS,
  }),

  // ——— Cuenca CHJ ———
  chjRemo({
    zoneId: "embalse_de_alarcon",
    provinciaId: "cuenca",
    nombre: "Embalse de Alarcón",
    distanciaPresaM: 250,
    cebra: "adulto",
    docPesca: DOC_PESCA_CLM,
  }),
  chjRemo({
    zoneId: "embalse_de_contreras",
    provinciaId: "cuenca",
    nombre: "Embalse de Contreras",
    distanciaPresaM: 300,
    cebra: "no",
    docPesca: DOC_PESCA_CLM,
  }),
  {
    zoneId: "embalse_de_la_toba",
    provinciaId: "cuenca",
    nombre: "Embalse de La Toba",
    organismo: "chj",
    navegacion: "condicionado",
    pescaDesdeKayak: "condicionado",
    documentacion: [
      ...DOC_NAV_CHJ,
      "Embalse de otro concesionario: correo de notificación previa al explotador (sin él la CHJ deniega la navegación).",
      ...DOC_PESCA_CLM,
    ],
    limitaciones: [
      "Solo con DR CHJ + notificación al concesionario.",
      "Respeta balizamientos y distancias a presa/infraestructuras del anexo vigente.",
    ],
    fuentes: [CHJ_NAV],
    actualizado: "2026-03",
  },

  // ——— Cuenca CHT ———
  {
    zoneId: "embalse_de_buendia",
    provinciaId: "cuenca",
    nombre: "Embalse de Buendía",
    organismo: "cht",
    navegacion: "condicionado",
    pescaDesdeKayak: "condicionado",
    documentacion: [...DOC_NAV_CHT, ...DOC_PESCA_CLM],
    limitaciones: [
      "Navegación permitida con declaración responsable CHT.",
      "Confinamiento de embarcaciones declarado (BOE nov. 2025: Buendía, Bolarque, Zorita): aplica medidas anti-mejillón cebra.",
      "Respeta distancias a islas / zonas protegidas según instrucciones CHT.",
    ],
    fuentes: [CHT_NAV],
    actualizado: "2026-03",
    nota: "Cuenca del Tajo (no CHJ). La licencia CLM no sustituye la DR de navegación de la CHT.",
  },
  {
    zoneId: "embalse_de_bolarque",
    provinciaId: "cuenca",
    nombre: "Embalse de Bolarque",
    organismo: "cht",
    navegacion: "condicionado",
    pescaDesdeKayak: "condicionado",
    documentacion: [...DOC_NAV_CHT, ...DOC_PESCA_CLM],
    limitaciones: [
      "DR CHT obligatoria.",
      "Confinamiento de embarcaciones (BOE nov. 2025) con Buendía y Zorita.",
      "Restricciones estacionales a motor y tramos prohibidos (consulta anexo CHT vigente).",
    ],
    fuentes: [CHT_NAV],
    actualizado: "2026-03",
  },

  // ——— Sevilla (CHG) ———
  // Tabla PHC: filas sin observación bajo SEVILLA = navegación no autorizada (Cala, Minilla, Huesna…).
  {
    zoneId: "embalse_de_cala",
    provinciaId: "sevilla",
    nombre: "Embalse de Cala",
    organismo: "chg",
    navegacion: "no_autorizado",
    pescaDesdeKayak: "no_autorizado",
    documentacion: [
      "Navegación recreativa no autorizada en la tabla CHG del Plan Hidrológico (consulta IDE / hoja vigente).",
      "La pesca continental desde orilla sigue el régimen andaluz (licencia + NIR + seguro RC), pero no desde kayak si no hay navegación autorizada.",
    ],
    limitaciones: ["Navegación recreativa: no autorizada según tabla CHG consultada."],
    fuentes: [CHG_NAV, CHG_IDE],
    actualizado: "2026-03",
  },
  {
    zoneId: "embalse_de_la_minilla",
    provinciaId: "sevilla",
    nombre: "Embalse de La Minilla",
    organismo: "chg",
    navegacion: "no_autorizado",
    pescaDesdeKayak: "no_autorizado",
    documentacion: [
      "Navegación recreativa no autorizada en la tabla CHG consultada.",
      ...DOC_PESCA_AND.map((d) => d + " (orilla, si el tramo lo permite)."),
    ],
    limitaciones: ["Navegación recreativa: no autorizada según tabla CHG."],
    fuentes: [CHG_NAV, CHG_IDE],
    actualizado: "2026-03",
  },
  {
    zoneId: "embalse_huesna",
    provinciaId: "sevilla",
    nombre: "Embalse de Huésna",
    organismo: "chg",
    navegacion: "no_autorizado",
    pescaDesdeKayak: "no_autorizado",
    documentacion: [
      "Navegación recreativa no autorizada en la tabla CHG consultada.",
      ...DOC_PESCA_AND.map((d) => d + " (orilla, si el tramo lo permite)."),
    ],
    limitaciones: ["Navegación recreativa: no autorizada según tabla CHG."],
    fuentes: [CHG_NAV, CHG_IDE],
    actualizado: "2026-03",
  },
  {
    zoneId: "embalse_del_pintado",
    provinciaId: "sevilla",
    nombre: "Embalse del Pintado",
    organismo: "chg",
    navegacion: "permitido",
    pescaDesdeKayak: "permitido",
    documentacion: [...DOC_NAV_CHG, ...DOC_PESCA_AND],
    limitaciones: [
      "Remo, pala, pedal, vela o motor eléctrico (tabla CHG).",
      "Sin motos acuáticas en toda la cuenca. Potencia motor explosión máx. 50 CV si estuviera autorizado para otros usos.",
      "Respeta balizamientos y distancias a presa / torre de toma.",
    ],
    fuentes: [CHG_NAV, CHG_IDE],
    actualizado: "2026-03",
  },
  {
    zoneId: "embalse_de_jose_toran",
    provinciaId: "sevilla",
    nombre: "Embalse de José Torán",
    organismo: "chg",
    navegacion: "permitido",
    pescaDesdeKayak: "permitido",
    documentacion: [...DOC_NAV_CHG, ...DOC_PESCA_AND],
    limitaciones: [
      "Sin restricciones específicas en la tabla CHG («Sin restricciones»), salvo normas generales de la cuenca.",
      "Sin motos acuáticas. Respeta balizamientos de presa/toma.",
    ],
    fuentes: [CHG_NAV, CHG_IDE],
    actualizado: "2026-03",
  },
  {
    zoneId: "embalse_de_la_puebla_de_cazalla",
    provinciaId: "sevilla",
    nombre: "Embalse de la Puebla de Cazalla",
    organismo: "chg",
    navegacion: "permitido",
    pescaDesdeKayak: "permitido",
    documentacion: [...DOC_NAV_CHG, ...DOC_PESCA_AND],
    limitaciones: ["Sin restricciones específicas en la tabla CHG, salvo normas generales."],
    fuentes: [CHG_NAV, CHG_IDE],
    actualizado: "2026-03",
  },
  {
    zoneId: "embalse_de_torre_del_aguila",
    provinciaId: "sevilla",
    nombre: "Embalse de Torre del Águila",
    organismo: "chg",
    navegacion: "permitido",
    pescaDesdeKayak: "permitido",
    documentacion: [...DOC_NAV_CHG, ...DOC_PESCA_AND],
    limitaciones: ["Sin restricciones específicas en la tabla CHG, salvo normas generales."],
    fuentes: [CHG_NAV, CHG_IDE],
    actualizado: "2026-03",
  },
  {
    zoneId: "embalse_agrio",
    provinciaId: "sevilla",
    nombre: "Embalse del Agrio",
    organismo: "chg",
    navegacion: "permitido",
    pescaDesdeKayak: "permitido",
    documentacion: [...DOC_NAV_CHG, ...DOC_PESCA_AND],
    limitaciones: ["Sin restricciones específicas en la tabla CHG, salvo normas generales."],
    fuentes: [CHG_NAV, CHG_IDE],
    actualizado: "2026-03",
  },

  // ——— Córdoba (CHG) ———
  {
    zoneId: "embalse_de_iznajar",
    provinciaId: "cordoba",
    nombre: "Embalse de Iznájar",
    organismo: "chg",
    navegacion: "condicionado",
    pescaDesdeKayak: "condicionado",
    documentacion: [...DOC_NAV_CHG, ...DOC_PESCA_AND],
    limitaciones: [
      "Remo, pala, pedal, vela o motor eléctrico / explosión de uso público (tabla CHG).",
      "EEI (mejillón cebra): desinfección obligatoria; historial de confinamiento de embarcaciones — no saques el kayak a otra masa sin lavado autorizado.",
    ],
    fuentes: [CHG_NAV, CHG_IDE],
    actualizado: "2026-03",
  },
  {
    zoneId: "embalse_de_la_brena_brena_ii",
    provinciaId: "cordoba",
    nombre: "Embalse de la Breña / Breña II",
    organismo: "chg",
    navegacion: "condicionado",
    pescaDesdeKayak: "condicionado",
    documentacion: [...DOC_NAV_CHG, ...DOC_PESCA_AND],
    limitaciones: [
      "Tabla CHG: «Confinado» (EEI). Navegación sujeta a confinamiento y protocolo de desinfección.",
      "Confirma en IDE CHG si tu modalidad (kayak) está admitida bajo el confinamiento vigente.",
    ],
    fuentes: [CHG_NAV, CHG_IDE],
    actualizado: "2026-03",
  },
  {
    zoneId: "embalse_de_san_rafael_de_navallana",
    provinciaId: "cordoba",
    nombre: "Embalse de San Rafael de Navallana",
    organismo: "chg",
    navegacion: "permitido",
    pescaDesdeKayak: "permitido",
    documentacion: [...DOC_NAV_CHG, ...DOC_PESCA_AND],
    limitaciones: ["Sin restricciones específicas en la tabla CHG, salvo normas generales."],
    fuentes: [CHG_NAV, CHG_IDE],
    actualizado: "2026-03",
  },
  {
    zoneId: "embalse_de_puente_nuevo",
    provinciaId: "cordoba",
    nombre: "Embalse de Puente Nuevo",
    organismo: "chg",
    navegacion: "condicionado",
    pescaDesdeKayak: "condicionado",
    documentacion: [...DOC_NAV_CHG, ...DOC_PESCA_AND],
    limitaciones: [
      "Navegación en función del volumen (> 70 hm³) y calidad de las aguas (resolución mayo 2018 citada por CHG).",
      "Si el embalse no cumple umbral/calidad: no asumas que puedes sacar el kayak.",
    ],
    fuentes: [CHG_NAV, CHG_IDE],
    actualizado: "2026-03",
  },
  {
    zoneId: "embalse_de_yeguas",
    provinciaId: "cordoba",
    nombre: "Embalse de Yeguas",
    organismo: "chg",
    navegacion: "permitido",
    pescaDesdeKayak: "permitido",
    documentacion: [...DOC_NAV_CHG, ...DOC_PESCA_AND],
    limitaciones: ["Sin restricciones específicas en la tabla CHG, salvo normas generales."],
    fuentes: [CHG_NAV, CHG_IDE],
    actualizado: "2026-03",
  },
  {
    zoneId: "embalse_arenoso",
    provinciaId: "cordoba",
    nombre: "Embalse del Arenoso",
    organismo: "chg",
    navegacion: "permitido",
    pescaDesdeKayak: "permitido",
    documentacion: [...DOC_NAV_CHG, ...DOC_PESCA_AND],
    limitaciones: ["Sin restricciones específicas en la tabla CHG, salvo normas generales."],
    fuentes: [CHG_NAV, CHG_IDE],
    actualizado: "2026-03",
  },
  {
    zoneId: "embalse_guadalmellato",
    provinciaId: "cordoba",
    nombre: "Embalse del Guadalmellato",
    organismo: "chg",
    navegacion: "consultar",
    pescaDesdeKayak: "consultar",
    documentacion: [
      "Consulta la tabla/IDE CHG vigente: la ficha del Plan Hidrológico no deja clara la fila de este vaso en el extracto usado por la app.",
      ...DOC_NAV_CHG,
      ...DOC_PESCA_AND,
    ],
    limitaciones: [
      "No demos por hecho el permiso de kayak sin mirar IDE CHG o la hoja informativa actualizada.",
    ],
    fuentes: [CHG_NAV, CHG_IDE],
    actualizado: "2026-03",
    nota: "Muy pescado a bass desde orilla/pato; aun así la navegación la marca la CHG, no la costumbre.",
  },
  {
    zoneId: "embalse_del_retortillo",
    provinciaId: "cordoba",
    nombre: "Embalse del Retortillo",
    organismo: "chg",
    navegacion: "consultar",
    pescaDesdeKayak: "consultar",
    documentacion: [
      "En la tabla SEVILLA el Retortillo aparece sin autorización de navegación recreativa; confirma si tu acceso es el vaso/tramo cordobés y qué dice el IDE CHG hoy.",
      ...DOC_PESCA_AND,
    ],
    limitaciones: ["Verifica IDE CHG antes de botar el kayak."],
    fuentes: [CHG_NAV, CHG_IDE],
    actualizado: "2026-03",
  },
];

const BY_ZONE = new Map(NAVEGACION_KAYAK_EMBALSES.map((e) => [e.zoneId, e]));

export function navegacionKayakDeZona(zoneId: string | null | undefined): NavegacionKayakEmbalse | null {
  if (!zoneId) return null;
  return BY_ZONE.get(zoneId) ?? null;
}

export function etiquetaNavegacionKayak(estado: NavegacionKayakEstado): string {
  if (estado === "permitido") return "Permitido (con trámites)";
  if (estado === "condicionado") return "Condicionado";
  if (estado === "no_autorizado") return "No autorizado";
  return "Consultar organismo";
}

export function colorNavegacionKayak(estado: NavegacionKayakEstado): string {
  if (estado === "permitido") return "#1B7A4A";
  if (estado === "condicionado") return "#B7791F";
  if (estado === "no_autorizado") return "#B42318";
  return "#1a6f8a";
}
