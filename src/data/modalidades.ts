/** Modalidades de pesca que la app contempla (no red social). */
export type ModalidadPesca =
  | "orilla_continental"
  | "orilla_mar"
  | "kayak"
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
    corta: "Río",
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
    id: "kayak",
    etiqueta: "Kayak / paddle",
    corta: "Kayak",
    ambito: "ambos",
    notaLegal:
      "En mar CV: kayak = artefacto flotante (no lista 6.ª/7.ª). Licencia marítima desde tierra, personal. No confundir con la del barco.",
  },
  {
    id: "embarcacion",
    etiqueta: "Embarcación",
    corta: "Barco",
    ambito: "ambos",
    notaLegal:
      "En mar CV: licencia de embarcación (la pide el titular; ampara a invitados). Orilla/tierra no vale. PescaREC si hay especies de protección diferenciada.",
  },
  {
    id: "submarina",
    etiqueta: "Submarina",
    corta: "Sub",
    ambito: "maritimo",
    notaLegal: "Normativa específica (licencia submarina, zonas, horario). Esta app orienta; no sustituye el BOE/CCAA.",
  },
];

export function modalidadPorId(id: ModalidadPesca) {
  return MODALIDADES.find((m) => m.id === id) ?? MODALIDADES[0];
}
