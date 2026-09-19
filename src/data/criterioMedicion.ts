/**
 * Criterio gráfico de medición de talla/peso mínimo por especie.
 *
 * Norma de referencia (mar / Mediterráneo):
 * - RD 560/1995 art. 2 → Reg. (CEE) 3094/86 y Reg. (CE) 1967/2006 Anexo IV:
 *   «la talla de cualquier pez se medirá… desde la punta del hocico hasta el
 *   extremo de la aleta caudal» (longitud total).
 * - Mundopesquero / guías recreativas ES: misma regla (hocico → extremo cola).
 * - Horquilla / tenedor NO es el criterio legal general (salvo pez espada LJFL, etc.).
 *
 * Orientativo: prevalece cartel del tramo / BOE vigente.
 */

export type PatronMedicion =
  | "pez_total"
  | "pez_horquilla"
  | "anguila"
  | "cefalopodo_manto"
  | "pulpo_peso"
  | "cangrejo_caparazon";

export type CriterioMedicion = {
  patron: PatronMedicion;
  desde: string;
  hasta: string;
  detalle: string;
  unidad: "cm" | "kg";
};

const PEZ_TOTAL: CriterioMedicion = {
  patron: "pez_total",
  desde: "Punta del hocico",
  hasta: "Extremo de la cola",
  detalle:
    "Longitud total (norma UE/RD 560): boca cerrada, de la punta del hocico al extremo de la aleta caudal (lóbulo más largo), pez extendido sin forzar la cola.",
  unidad: "cm",
};

/** Solo para especies que la norma mida a la horquilla (p. ej. pez espada LJFL). */
const PEZ_HORQUILLA: CriterioMedicion = {
  patron: "pez_horquilla",
  desde: "Punta del hocico",
  hasta: "Horquilla cola",
  detalle:
    "Longitud a la horquilla: de la punta del hocico al centro de la horquilla caudal (donde se separan los lóbulos).",
  unidad: "cm",
};

const ANGUILA: CriterioMedicion = {
  patron: "anguila",
  desde: "Punta del hocico",
  hasta: "Extremo de la cola",
  detalle: "Longitud total con el cuerpo extendido: de la punta del hocico al extremo de la aleta caudal.",
  unidad: "cm",
};

const CEFALOPODO_MANTO: CriterioMedicion = {
  patron: "cefalopodo_manto",
  desde: "Inicio del manto",
  hasta: "Extremo del manto",
  detalle:
    "Longitud del manto (cuerpo): no cuentes tentáculos ni brazos. Del borde anterior del manto al extremo posterior.",
  unidad: "cm",
};

const PULPO_PESO: CriterioMedicion = {
  patron: "pulpo_peso",
  desde: "Ejemplar entero",
  hasta: "En báscula",
  detalle: "Peso mínimo del ejemplar entero (escurrido). No basta con el tamaño a ojo: usa báscula.",
  unidad: "kg",
};

const CANGREJO: CriterioMedicion = {
  patron: "cangrejo_caparazon",
  desde: "Borde izquierdo",
  hasta: "Borde derecho",
  detalle: "Anchura del caparazón: de un borde lateral al otro, en la parte más ancha (sin pinzas).",
  unidad: "cm",
};

/** Overrides por id. Dorada y espáridos = longitud total (Anexo IV), no horquilla. */
const POR_ID: Record<string, CriterioMedicion> = {
  anguila: ANGUILA,
  sepia: CEFALOPODO_MANTO,
  calamar: CEFALOPODO_MANTO,
  pulpo: PULPO_PESO,
  cangrejo_americano: CANGREJO,
  cangrejo_azul: CANGREJO,
  // pez_espada usaría PEZ_HORQUILLA / LJFL si se añade al catálogo
};

function patronPorForma(id?: string | null, nombre?: string | null): CriterioMedicion {
  const k = `${id ?? ""} ${nombre ?? ""}`.toLowerCase();
  if (k.includes("pulpo")) return PULPO_PESO;
  if (k.includes("sepia") || k.includes("jibia") || k.includes("calamar")) return CEFALOPODO_MANTO;
  if (k.includes("cangrejo")) return CANGREJO;
  if (k.includes("anguila")) return ANGUILA;
  // Pez espada / billfish: LJFL (mandíbula inferior → horquilla)
  if (k.includes("espada") || k.includes("xiphias") || k.includes("marlin")) return PEZ_HORQUILLA;
  return PEZ_TOTAL;
}

/**
 * Devuelve el criterio gráfico si la especie tiene talla/peso mínimo medible.
 */
export function criterioMedicionDe(sp: {
  id?: string;
  nombre?: string;
  tallaCm?: number | null;
  tallaKg?: number | null;
  tallaOficial?: string | null;
  tallaNota?: string | null;
  invasora?: boolean;
} | null | undefined): CriterioMedicion | null {
  if (!sp) return null;

  const fuente = `${sp.tallaOficial ?? ""} ${sp.tallaNota ?? ""}`;
  if (/sin muerte|prohibid|no se retiene|no devolver|invasora/i.test(fuente) && sp.tallaCm == null && sp.tallaKg == null) {
    return null;
  }

  let unidad: "cm" | "kg" | null = null;
  if (sp.tallaCm != null && Number.isFinite(sp.tallaCm)) unidad = "cm";
  else if (sp.tallaKg != null && Number.isFinite(sp.tallaKg)) unidad = "kg";
  else {
    const m = fuente.match(/(\d+(?:[.,]\d+)?)\s*(cm|kg)/i);
    if (m) unidad = m[2].toLowerCase() as "cm" | "kg";
  }
  if (!unidad) return null;

  const base = (sp.id && POR_ID[sp.id]) || patronPorForma(sp.id, sp.nombre);

  if (unidad === "kg") {
    if (base.patron === "pulpo_peso" || /pulpo/i.test(`${sp.id} ${sp.nombre}`)) return PULPO_PESO;
    return { ...base, unidad: "kg", detalle: `Peso mínimo del ejemplar entero. ${base.detalle}` };
  }
  return { ...base, unidad };
}

export function etiquetaPatron(patron: PatronMedicion): string {
  switch (patron) {
    case "pez_horquilla":
      return "Longitud a la horquilla";
    case "anguila":
      return "Longitud total";
    case "cefalopodo_manto":
      return "Longitud del manto";
    case "pulpo_peso":
      return "Peso entero";
    case "cangrejo_caparazon":
      return "Anchura del caparazón";
    default:
      return "Longitud total";
  }
}
