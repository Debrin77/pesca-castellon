/**
 * Lógica de periodos hábiles (vedas) por especie.
 *
 * Temporada de referencia 2026: Orden 30/2016 + resoluciones anuales.
 * La trucha usa el tercer domingo de marzo (función compartida con normativa2026).
 * Verifica cada temporada en: https://mediambient.gva.es/es/web/medio-natural/caca-i-pesca
 */

import {
  etiquetaTemporadaTrucha,
  temporadaTruchaAbierta,
  TALLAS_OFICIALES,
} from "../data/normativa2026";

export interface PeriodoHabil {
  especieId: string;
  inicio: { mes: number; dia: number };
  fin: { mes: number; dia: number };
  todoElAnio?: boolean;
  notas?: string;
}

export const PERIODOS_HABILES: PeriodoHabil[] = [
  {
    especieId: "trucha_comun",
    inicio: { mes: 3, dia: 15 },
    fin: { mes: 8, dia: 31 },
    notas: `Temporada ${new Date().getFullYear()}: ${etiquetaTemporadaTrucha()}. Pesca sin muerte. Confirmar orden anual.`,
  },
  {
    especieId: "trucha_arcoiris",
    inicio: { mes: 3, dia: 15 },
    fin: { mes: 8, dia: 31 },
    notas: "Misma ventana que la trucha común en tramos trucheros. Fuera de ellos, retención y sacrificio si se captura. Solo mosca o cucharilla, un anzuelo sin arponcillo en tramo truchero.",
  },
  {
    especieId: "black_bass",
    inicio: { mes: 1, dia: 1 },
    fin: { mes: 12, dia: 31 },
    todoElAnio: true,
    notas: "Invasora (RD 630/2013): captura fomentada; no devolver al agua donde la norma lo prohíba.",
  },
  {
    especieId: "lucio",
    inicio: { mes: 1, dia: 1 },
    fin: { mes: 12, dia: 31 },
    todoElAnio: true,
    notas: "Invasora: captura fomentada todo el año; no devolver.",
  },
  {
    especieId: "carpa",
    inicio: { mes: 1, dia: 1 },
    fin: { mes: 12, dia: 31 },
    todoElAnio: true,
    notas: "Sin veda general. Revisa cupos del coto (PTOP) si pescas en ZPC.",
  },
  {
    especieId: "barbo",
    inicio: { mes: 1, dia: 1 },
    fin: { mes: 12, dia: 31 },
    todoElAnio: true,
    notas: "Barbos autóctonos: pesca sin muerte (devolución inmediata). Talla de retención no aplica.",
  },
  {
    especieId: "siluro",
    inicio: { mes: 1, dia: 1 },
    fin: { mes: 12, dia: 31 },
    todoElAnio: true,
    notas: "Prohibida tenencia/transporte (vivo o muerto). Notificar a agentes medioambientales.",
  },
  {
    especieId: "tenca",
    inicio: { mes: 1, dia: 1 },
    fin: { mes: 12, dia: 31 },
    todoElAnio: true,
    notas: `Talla mínima orientativa: ${TALLAS_OFICIALES.tenca}.`,
  },
  {
    especieId: "anguila",
    inicio: { mes: 1, dia: 1 },
    fin: { mes: 12, dia: 31 },
    todoElAnio: true,
    notas: TALLAS_OFICIALES.anguila,
  },
];

export function estaEnVeda(especieId: string, fecha: Date = new Date()): boolean {
  if (especieId === "trucha_comun" || especieId === "trucha_arcoiris") {
    return !temporadaTruchaAbierta(fecha);
  }
  const periodo = PERIODOS_HABILES.find((p) => p.especieId === especieId);
  if (!periodo) return false;
  if (periodo.todoElAnio) return false;

  const mes = fecha.getMonth() + 1;
  const dia = fecha.getDate();
  const enRango =
    (mes > periodo.inicio.mes || (mes === periodo.inicio.mes && dia >= periodo.inicio.dia)) &&
    (mes < periodo.fin.mes || (mes === periodo.fin.mes && dia <= periodo.fin.dia));

  return !enRango;
}

export function notaVeda(especieId: string): string | null {
  return PERIODOS_HABILES.find((p) => p.especieId === especieId)?.notas ?? null;
}

export function resumenTemporadaActual(fecha: Date = new Date()): {
  truchaAbierta: boolean;
  etiquetaTrucha: string;
  texto: string;
} {
  const abierta = temporadaTruchaAbierta(fecha);
  const etiqueta = etiquetaTemporadaTrucha(fecha.getFullYear());
  return {
    truchaAbierta: abierta,
    etiquetaTrucha: etiqueta,
    texto: abierta
      ? `Temporada de trucha ABIERTA (${etiqueta}).`
      : `Temporada de trucha CERRADA. Ventana hábil ${etiqueta}.`,
  };
}
