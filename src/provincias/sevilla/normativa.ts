/**
 * Marco normativo de pesca continental en Andalucía (provincia de Sevilla).
 *
 * Andalucía usa nomenclatura propia (aguas libres, cotos, vedados). En la app
 * se mapea a ZPL / ZPC / VP para mantener la misma UI que Castellón.
 *
 * No sustituye el BOJA, la orden de vedas vigente ni la señalización del tramo.
 */

export const FUENTE_NORMATIVA_ANDALUCIA = {
  titulo: "Junta de Andalucía — pesca continental (licencia y orden de vedas)",
  vigenciaNota:
    "Comprueba siempre la orden de vedas vigente en BOJA y los permisos de coto. Dataset orientativo de Sevilla (continental).",
  urlLicencia:
    "https://www.juntadeandalucia.es/organismos/agriculturapescaaguaydesarrollorural.html",
  urlNormativa:
    "https://www.juntadeandalucia.es/temas/medioambiente/biodiversidad/pesca.html",
};

/** Códigos de UI alineados con Castellón; en Andalucía = aguas libres / cotos / vedados. */
export type AprovechamientoAndalucia = "ZPL" | "ZPC" | "VP";

export const MAPA_APROVECHAMIENTO_ANDALUCIA: Record<
  AprovechamientoAndalucia,
  { nombreAndalucia: string; etiquetaUi: string }
> = {
  ZPL: { nombreAndalucia: "Aguas libres / zona de pesca libre", etiquetaUi: "Zona libre (ZPL)" },
  ZPC: { nombreAndalucia: "Coto de pesca", etiquetaUi: "Coto (ZPC)" },
  VP: { nombreAndalucia: "Vedado", etiquetaUi: "Vedado (VP)" },
};

/** En aguas ciprinícolas andaluzas la temporada suele estar abierta todo el año. */
export function temporadaCiprinicolaAbierta(_fecha: Date = new Date()): boolean {
  return true;
}

export function etiquetaTemporadaCiprinicola(): string {
  return "Temporada abierta todo el año en aguas de vocación ciprinícola (salvo veda puntual del tramo o coto).";
}

export const HORARIO_ORIENTATIVO_ANDALUCIA =
  "Como regla práctica: pesca de día (ortos–ocasos). Confirma horario exacto en la orden de vedas y en el permiso del coto.";

export const REGLAS_GENERALES_ANDALUCIA = [
  "Licencia de pesca continental de Andalucía (Junta) obligatoria.",
  "Aguas libres (ZPL en la app): normas generales de la orden de vedas.",
  "Cotos (ZPC): además, permiso del coto / sociedad y condiciones propias.",
  "Vedados (VP): pesca prohibida.",
  "Invasoras (bass, lucio, siluro, alburno, cangrejo americano, etc.): no traslocar; sigue RD 630/2013 y la orden andaluza.",
  "Autóctonos (barbo gitano, boga, etc.): respeta tallas, cupos y devolución si la norma lo exige.",
];

export const CHECKLIST_ANTES_DE_PESCAR_ANDALUCIA = [
  "Licencia de pesca continental de Andalucía en vigor.",
  "Si es coto (ZPC): permiso del día / plaza del coto.",
  "Comprobar que el tramo no es vedado (VP) ni espacio protegido sin pesca.",
  "Revisar especies invasoras: no devolver / no traslocar según norma.",
  "Horario y cebos permitidos según orden de vedas y cartel del tramo.",
  "Llevar DNI/NIE y la licencia (digital o física) por si lo pide un agente.",
];

export function textoVigenciaNormativaAndalucia(): string {
  return `${FUENTE_NORMATIVA_ANDALUCIA.titulo}. ${FUENTE_NORMATIVA_ANDALUCIA.vigenciaNota}`;
}
