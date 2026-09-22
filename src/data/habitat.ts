/**
 * Hábitat fino de sitios: tags controlados + nota corta.
 * No inventa metros exactos; bandas y estructura orientativas
 * a partir de guías/foros y cartografía habitual.
 */
export type HabitatTag =
  | "cola"
  | "presa"
  | "brazo"
  | "canal"
  | "remanso"
  | "corriente"
  | "poza"
  | "desembocadura"
  | "cobertura"
  | "troncos"
  | "vegetacion"
  | "juncos"
  | "piedra"
  | "roca"
  | "grava"
  | "arena"
  | "limo"
  | "escollera"
  | "orilla_suave"
  | "orilla_escarpada"
  | "agua_clara"
  | "estiaje"
  | "urbano"
  | "espigon"
  | "veril";

export type ProfundidadBand = "somera" | "media" | "profunda" | "variable";

export type HabitatSitio = {
  tags: HabitatTag[];
  /** Banda orientativa — no son metros topográficos oficiales. */
  profundidad?: ProfundidadBand;
  /** Una línea para UI (≤160 chars). */
  nota: string;
  /** Atribución corta (guía/foro/nota de campo). */
  fuente?: string;
};

export const ETIQUETA_TAG: Record<HabitatTag, string> = {
  cola: "Cola / entrada",
  presa: "Presa / dique",
  brazo: "Brazo",
  canal: "Canal sumergido",
  remanso: "Remanso",
  corriente: "Corriente",
  poza: "Poza",
  desembocadura: "Desembocadura",
  cobertura: "Cobertura",
  troncos: "Troncos / madera",
  vegetacion: "Vegetación",
  juncos: "Juncos",
  piedra: "Piedras",
  roca: "Roca",
  grava: "Grava",
  arena: "Arena",
  limo: "Fondo limoso",
  escollera: "Escollera",
  orilla_suave: "Orilla suave",
  orilla_escarpada: "Orilla escarpada",
  agua_clara: "Agua clara",
  estiaje: "Estiaje variable",
  urbano: "Tramo urbano",
  espigon: "Espigón",
  veril: "Veril",
};

export const ETIQUETA_PROFUNDIDAD: Record<ProfundidadBand, string> = {
  somera: "Somera (~1–4 m)",
  media: "Media (~3–8 m)",
  profunda: "Profunda (>8 m)",
  variable: "Profundidad variable",
};

/** Afinidad especie → tags (boost suave en ranking). */
export const AFINIDAD_ESPECIE_TAGS: Record<string, HabitatTag[]> = {
  carpin: ["limo", "vegetacion", "juncos", "orilla_suave", "brazo", "cola"],
  carpa: ["limo", "cola", "brazo", "vegetacion", "remanso"],
  black_bass: ["cobertura", "troncos", "vegetacion", "cola", "brazo", "piedra", "roca"],
  lucio: ["vegetacion", "juncos", "canal", "brazo", "cobertura"],
  siluro: ["canal", "presa", "remanso", "urbano", "limo"],
  alburno: ["cola", "corriente", "remanso"],
  barbo: ["corriente", "grava", "piedra", "cola"],
  barbo_gitano: ["corriente", "grava", "piedra", "cola"],
  trucha_comun: ["corriente", "poza", "grava", "agua_clara"],
  lubina: ["desembocadura", "espigon", "roca", "escollera"],
  dorada: ["arena", "desembocadura", "espigon"],
  sargo: ["roca", "escollera", "espigon"],
  sepia: ["arena", "roca", "espigon"],
  calamar: ["roca", "espigon", "veril"],
  jurel: ["veril", "espigon", "desembocadura"],
};

export function boostHabitatEspecie(especieId: string, habitat?: HabitatSitio | null): number {
  if (!habitat?.tags?.length) return 0;
  const prefs = AFINIDAD_ESPECIE_TAGS[especieId];
  if (!prefs?.length) return 0;
  let hits = 0;
  for (const t of habitat.tags) {
    if (prefs.includes(t)) hits += 1;
  }
  // Soft: +2 por tag afin (tope +8).
  return Math.min(8, hits * 2);
}

export function resumenHabitat(habitat?: HabitatSitio | null): string | null {
  if (!habitat) return null;
  const chips = habitat.tags.slice(0, 4).map((t) => ETIQUETA_TAG[t]).filter(Boolean);
  const prof = habitat.profundidad ? ETIQUETA_PROFUNDIDAD[habitat.profundidad] : null;
  const parts = [...chips, prof].filter(Boolean);
  return parts.length ? parts.join(" · ") : habitat.nota;
}
