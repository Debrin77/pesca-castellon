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
      "En mar puede exigirse licencia de embarcación o artefacto flotante según CCAA/Estado. No confundir con orilla.",
  },
  {
    id: "embarcacion",
    etiqueta: "Embarcación",
    corta: "Barco",
    ambito: "ambos",
    notaLegal:
      "Modalidad distinta a orilla: licencia/autorización de embarcación y, en mar, PescaREC para especies protegidas.",
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
