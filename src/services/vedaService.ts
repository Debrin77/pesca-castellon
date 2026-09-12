/**
 * Periodos hábiles (vedas) por especie y provincia activa.
 *
 * Castellón → Orden 30/2016 + resoluciones GVA.
 * Sevilla / Córdoba → Orden 13/01/2023 (BOJA): barbo/boga con periodos propios.
 * Cuenca → Orden 20/2026 CLM + Ley 1/1992 (trucheras art. 2; barbos sin muerte salvo excepciones).
 */

import {
  etiquetaTemporadaTrucha,
  temporadaTruchaAbierta,
  TALLAS_OFICIALES,
} from "../data/normativa2026";
import { periodoBarboAbierto, periodoBogaAbierto } from "../provincias/sevilla/normativa";
import {
  etiquetaTemporadaTruchaCuenca,
  periodoTruchaCuencaAbierto,
} from "../provincias/cuenca/normativa";
import { getProvinciaActiva } from "../provincias/runtime";
import { esProvinciaAndalucia, esProvinciaCastillaLaMancha } from "../provincias/types";

export interface PeriodoHabil {
  especieId: string;
  inicio: { mes: number; dia: number };
  fin: { mes: number; dia: number };
  todoElAnio?: boolean;
  notas?: string;
}

/** Periodos Castellón / GVA. No usar bajo provincia Sevilla. */
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
    notas:
      "Misma ventana que la trucha común en tramos trucheros. Fuera de ellos, retención y sacrificio si se captura. Solo mosca o cucharilla, un anzuelo sin arponcillo en tramo truchero.",
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
    notas:
      "Comunitat Valenciana: prohibida tenencia/transporte (vivo o muerto). Notificar a agentes medioambientales.",
  },
  {
    especieId: "tenca",
    inicio: { mes: 1, dia: 1 },
    fin: { mes: 12, dia: 31 },
    todoElAnio: true,
    notas: `Régimen tenca: ${TALLAS_OFICIALES.tenca}.`,
  },
  {
    especieId: "anguila",
    inicio: { mes: 1, dia: 1 },
    fin: { mes: 12, dia: 31 },
    /** No es "todo el año hábil": la recreativa está vedada/prohibida en CV. */
    todoElAnio: false,
    notas: TALLAS_OFICIALES.anguila,
  },
];

export function estaEnVeda(especieId: string, fecha: Date = new Date()): boolean {
  const provincia = getProvinciaActiva();

  if (esProvinciaAndalucia(provincia.id)) {
    if (especieId === "barbo_gitano") return !periodoBarboAbierto(fecha);
    if (especieId === "boga") return !periodoBogaAbierto(fecha);
    if (especieId === "tenca" || especieId === "cacho") return true;
    return false;
  }

  if (esProvinciaCastillaLaMancha(provincia.id)) {
    if (especieId === "trucha_comun" || especieId === "trucha_arcoiris") {
      return !periodoTruchaCuencaAbierto(fecha);
    }
    if (especieId === "anguila" || especieId === "siluro") return true;
    return false;
  }

  if (especieId === "trucha_comun" || especieId === "trucha_arcoiris") {
    return !temporadaTruchaAbierta(fecha);
  }
  /** Anguila: pesca recreativa prohibida en CV (no hay periodo hábil de retención). */
  if (especieId === "anguila") return true;
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
  const provincia = getProvinciaActiva();

  if (esProvinciaAndalucia(provincia.id) || esProvinciaCastillaLaMancha(provincia.id)) {
    const sp = (provincia.species as any[]).find((s) => s.id === especieId);
    if (sp?.normativaEspecial) return sp.normativaEspecial as string;
    if (sp?.normativaResumen) return sp.normativaResumen as string;
  }

  if (esProvinciaAndalucia(provincia.id)) {
    if (especieId === "barbo_gitano") {
      return periodoBarboAbierto()
        ? "Barbo: captura y suelta, periodo hábil (1 jul–25 feb)."
        : "Barbo: veda (26 feb–30 jun). Solo captura y suelta en periodo hábil.";
    }
    if (especieId === "boga") {
      return periodoBogaAbierto()
        ? "Boga: captura y suelta, periodo hábil (1 may–31 ene)."
        : "Boga: veda (1 feb–30 abr). Solo captura y suelta en periodo hábil.";
    }
    return null;
  }

  if (esProvinciaCastillaLaMancha(provincia.id)) {
    if (especieId === "trucha_comun") {
      return periodoTruchaCuencaAbierto()
        ? "Trucha común CLM: solo sin muerte · periodo hábil de aguas trucheras."
        : "Trucha / aguas trucheras en veda (art. 2 Orden 20/2026), salvo régimen especial de ciprínidos señalizado.";
    }
    return null;
  }

  return PERIODOS_HABILES.find((p) => p.especieId === especieId)?.notas ?? null;
}

export function resumenTemporadaActual(fecha: Date = new Date()): {
  truchaAbierta: boolean;
  etiquetaTrucha: string;
  texto: string;
} {
  const provincia = getProvinciaActiva();
  if (esProvinciaAndalucia(provincia.id)) {
    const barboOk = periodoBarboAbierto(fecha);
    const bogaOk = periodoBogaAbierto(fecha);
    return {
      truchaAbierta: false,
      etiquetaTrucha: `No aplica (${provincia.nombre} ciprinícola)`,
      texto:
        !barboOk || !bogaOk
          ? `Autóctonos en veda parcial. Barbo: ${barboOk ? "hábil" : "veda"}. Boga: ${bogaOk ? "hábil" : "veda"}.`
          : "Aguas libres · exóticas todo el año. Barbo y boga en captura y suelta (periodos hábiles).",
    };
  }

  if (esProvinciaCastillaLaMancha(provincia.id)) {
    const abierta = periodoTruchaCuencaAbierto(fecha);
    const etiqueta = etiquetaTemporadaTruchaCuenca(fecha.getFullYear());
    return {
      truchaAbierta: abierta,
      etiquetaTrucha: etiqueta,
      texto: abierta
        ? `Temporada trucheras ABIERTA (baja montaña). Trucha solo sin muerte. Barbos: sin muerte salvo Contreras, Alarcón y Buendía (cupo 6).`
        : `Temporada trucheras CERRADA fuera de periodo art. 2. En aguas no trucheras la pesca con caña puede seguir todo el año (Orden 20/2026). Barbos: sin muerte salvo excepciones.`,
    };
  }

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
