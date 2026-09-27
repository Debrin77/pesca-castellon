/** Modalidades de pesca que la app contempla (no red social). */
export type ModalidadPesca =
  | "orilla_continental"
  | "orilla_mar"
  | "kayak"
  | "kayak_embalse"
  | "embarcacion"
  | "submarina";

export const MODALIDADES: {
  id: ModalidadPesca;
  etiqueta: string;
  corta: string;
  ambito: "continental" | "maritimo" | "ambos";
  notaLegal: string;
}[] = [
  {
    id: "orilla_continental",
    etiqueta: "Orilla · río / embalse",
    corta: "Orilla",
    ambito: "continental",
    notaLegal: "Licencia continental. Una caña en tramos trucheros; respeta ZPL/ZPC/vedado.",
  },
  {
    id: "orilla_mar",
    etiqueta: "Orilla · mar",
    corta: "Mar",
    ambito: "maritimo",
    notaLegal: "Licencia marítima recreativa desde tierra. Cupo habitual 5 kg/día. PescaREC si aplica.",
  },
  {
    id: "kayak_embalse",
    etiqueta: "Kayak · embalse / río",
    corta: "Kayak",
    ambito: "continental",
    notaLegal:
      "Divertido y distinto: remas hasta el sitio. Navegación = organismo de cuenca (DR). Pesca = licencia continental. No se sustituyen.",
  },
  {
    id: "kayak",
    etiqueta: "Kayak · mar",
    corta: "Kayak",
    ambito: "maritimo",
    notaLegal:
      "Artefacto flotante: licencia marítima DESDE TIERRA (no la de embarcación). PescaREC si aplica. Columbretes: reserva.",
  },
  {
    id: "embarcacion",
    etiqueta: "Embarcación · barco",
    corta: "Barco",
    ambito: "maritimo",
    notaLegal:
      "Mar Castellón: licencia DESDE EMBARCACIÓN (matriculada). Distinta del kayak. Fuera de dársena, sin Columbretes. PescaREC cuando la norma lo exija.",
  },
  {
    id: "submarina",
    etiqueta: "Submarina",
    corta: "Sub",
    ambito: "maritimo",
    notaLegal:
      "Normativa específica (licencia submarina, zonas, horario ocaso→orto). Esta app orienta; no sustituye el BOE/CCAA.",
  },
];

/** Modalidades de mar que usan catálogo / consulta de embarcación (no orilla). */
export function esModalidadEmbarcacionMar(id: ModalidadPesca): boolean {
  return id === "embarcacion" || id === "kayak";
}

export function esModalidadKayak(id: ModalidadPesca): boolean {
  return id === "kayak" || id === "kayak_embalse";
}

export function modalidadPorId(id: ModalidadPesca) {
  return MODALIDADES.find((m) => m.id === id) ?? MODALIDADES[0];
}

/** Modalidad fina según modo global. */
export function modalidadDesdeModoGlobal(
  modo: "rio" | "embalse" | "orilla" | "barco" | "kayak" | "kayak_mar"
): ModalidadPesca {
  if (modo === "barco") return "embarcacion";
  if (modo === "kayak_mar") return "kayak";
  if (modo === "kayak") return "kayak_embalse";
  if (modo === "orilla") return "orilla_mar";
  return "orilla_continental";
}
