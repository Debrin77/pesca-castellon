/**
 * Franjas horarias legales / de luz según ámbito.
 * Continental CV / Andalucía: 1 h antes del orto → 1 h después del ocaso.
 * Costa caña desde tierra (CV): sin veda nocturna general; orto/ocaso como referencia de luz.
 * Embarcación / kayak: luz solar orienta seguridad/regreso — no reutilizar el texto de orilla.
 * Submarina: ocaso → orto prohibido (no cubierta por la app).
 */
import {
  HORARIO_LEGAL_ORILLA_MAR,
  HORARIO_LEGAL_EMBARCACION_MAR,
  HORARIO_SUBMARINA_CV,
} from "../data/normativaMaritima";
import { HORARIO_LEGAL_PESCA } from "../data/normativa2026";
import { HORARIO_ORIENTATIVO_ANDALUCIA } from "../provincias/sevilla/normativa";
import { HORARIO_LEGAL_CLM } from "../provincias/cuenca/normativa";
import { getProvinciaActiva } from "../provincias/runtime";
import { esProvinciaAndalucia, esProvinciaCastillaLaMancha } from "../provincias/types";
import { GRAO_CASTELLON, OrtoOcasoDia, obtenerOrtoOcaso } from "./weatherService";

export type AmbitoHorario = "continental" | "maritimo" | "embarcacion";

export type EstadoFranja = "dentro" | "fuera" | "luz_dia" | "noche" | "sin_datos";

export type AvisoHorarioLegal = {
  ambito: AmbitoHorario;
  titulo: string;
  /** Franja principal (horas concretas o resumen). */
  franjaTxt: string;
  estado: EstadoFranja;
  estadoTxt: string;
  normaTxt: string;
  disclaimer: string;
  ortoTxt: string | null;
  ocasoTxt: string | null;
  inicioTxt: string | null;
  finTxt: string | null;
};

const MS_HORA = 60 * 60 * 1000;

export function parseIsoLocal(iso: string): Date {
  // Open-Meteo con timezone=auto suele devolver offset (`…+02:00`).
  const d = new Date(iso);
  if (!Number.isNaN(d.getTime())) return d;
  // Fallback: tratar como local sin Z.
  return new Date(iso.replace(/(\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/, ""));
}

export function sumarHoras(fecha: Date, horas: number): Date {
  return new Date(fecha.getTime() + horas * MS_HORA);
}

export function formatearHoraLocal(d: Date): string {
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

/** Ajusta HH:MM civil (±horas) sin depender de la TZ del dispositivo. */
export function ajustarHoraTxt(hhmm: string, deltaHoras: number): string {
  const partes = hhmm.split(":").map((x) => Number(x));
  const h0 = partes[0];
  const m0 = partes[1] ?? 0;
  if (!Number.isFinite(h0) || !Number.isFinite(m0)) return hhmm;
  let total = h0 * 60 + m0 + deltaHoras * 60;
  total = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const nh = Math.floor(total / 60);
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

export function normaContinentalTxt(provinciaId?: string): string {
  const id = provinciaId ?? getProvinciaActiva().id;
  if (esProvinciaAndalucia(id)) return HORARIO_ORIENTATIVO_ANDALUCIA;
  if (esProvinciaCastillaLaMancha(id)) return HORARIO_LEGAL_CLM;
  return HORARIO_LEGAL_PESCA;
}

export function construirAvisoHorario(args: {
  ambito: AmbitoHorario;
  ortoOcaso: OrtoOcasoDia | null;
  ahora?: Date;
  provinciaId?: string;
  /**
   * Margen legal en horas alrededor de orto/ocaso (continental).
   * Art. 4 Andalucía / CV / CLM genérico = 1.
   * Iznájar Anexo V.2 = 0 (orto → ocaso sin ±1 h).
   * Si solo se informa margenHoras, aplica simétrico a orto y ocaso.
   */
  margenHoras?: number;
  /** Margen distinto tras el ocaso (p. ej. cangrejo CLM = 2 h). */
  margenFinHoras?: number;
  /** Sustituye el texto de norma continental (p. ej. Anexo V.2 Iznájar). */
  normaOverride?: string | null;
}): AvisoHorarioLegal {
  const ahora = args.ahora ?? new Date();
  const disclaimer =
    "Orientativo (orto/ocaso Open-Meteo). No sustituye BOE, DOGV ni bandos municipales.";

  if (args.ambito === "maritimo" || args.ambito === "embarcacion") {
    const ortoTxt = args.ortoOcaso?.ortoTxt ?? null;
    const ocasoTxt = args.ortoOcaso?.ocasoTxt ?? null;
    const embarcacion = args.ambito === "embarcacion";
    let estado: EstadoFranja = "sin_datos";
    let estadoTxt = "Sin datos de sol ahora.";
    if (args.ortoOcaso) {
      const orto = parseIsoLocal(args.ortoOcaso.ortoIso);
      const ocaso = parseIsoLocal(args.ortoOcaso.ocasoIso);
      const deDia = ahora.getTime() >= orto.getTime() && ahora.getTime() <= ocaso.getTime();
      estado = deDia ? "luz_dia" : "noche";
      estadoTxt = embarcacion
        ? deDia
          ? "Ahora hay luz solar (referencia de seguridad para zarpar / volver)."
          : "Ahora es de noche astronómica. En barco prioriza no zarpar sin plan de luz y regreso."
        : deDia
          ? "Ahora hay luz solar (referencia, no semáforo legal de caña)."
          : "Ahora es de noche astronómica (luz). En caña desde tierra no hay veda nocturna general.";
    }
    return {
      ambito: args.ambito,
      titulo: embarcacion
        ? "Horario · embarcación / kayak"
        : "Horario · costa (caña desde tierra)",
      franjaTxt:
        ortoTxt && ocasoTxt
          ? embarcacion
            ? `Hoy luz solar (seguridad): orto ${ortoTxt} → ocaso ${ocasoTxt}`
            : `Hoy luz solar: orto ${ortoTxt} → ocaso ${ocasoTxt}`
          : "Hoy: orto/ocaso no disponibles (sin red o caché).",
      estado,
      estadoTxt,
      normaTxt: embarcacion
        ? `${HORARIO_LEGAL_EMBARCACION_MAR} ${HORARIO_SUBMARINA_CV}`
        : `${HORARIO_LEGAL_ORILLA_MAR} ${HORARIO_SUBMARINA_CV}`,
      disclaimer,
      ortoTxt,
      ocasoTxt,
      inicioTxt: ortoTxt,
      finTxt: ocasoTxt,
    };
  }

  const margenInicio = args.margenHoras ?? 1;
  const margenFin = args.margenFinHoras ?? args.margenHoras ?? 1;
  const normaTxt = args.normaOverride?.trim() || normaContinentalTxt(args.provinciaId);
  if (!args.ortoOcaso) {
    return {
      ambito: "continental",
      titulo: "Horario legal · continental",
      franjaTxt: "Franja de hoy: sin orto/ocaso (sin red o caché).",
      estado: "sin_datos",
      estadoTxt: "No se puede contrastar si estás dentro o fuera ahora.",
      normaTxt,
      disclaimer,
      ortoTxt: null,
      ocasoTxt: null,
      inicioTxt: null,
      finTxt: null,
    };
  }

  const orto = parseIsoLocal(args.ortoOcaso.ortoIso);
  const ocaso = parseIsoLocal(args.ortoOcaso.ocasoIso);
  const inicio = sumarHoras(orto, -margenInicio);
  const fin = sumarHoras(ocaso, margenFin);
  const inicioTxt = ajustarHoraTxt(args.ortoOcaso.ortoTxt, -margenInicio);
  const finTxt = ajustarHoraTxt(args.ortoOcaso.ocasoTxt, margenFin);
  const dentro =
    ahora.getTime() >= inicio.getTime() && ahora.getTime() <= fin.getTime();

  const iznajar = margenInicio === 0 && margenFin === 0;
  const cangrejo = margenFin === 2 && margenInicio === 1;
  return {
    ambito: "continental",
    titulo: iznajar
      ? "Horario legal · Iznájar (Anexo V.2)"
      : cangrejo
        ? "Horario legal · cangrejo (CLM)"
        : "Horario legal · continental",
    franjaTxt: iznajar
      ? `Hoy permitido (orto→ocaso, sin ±1 h): ${inicioTxt} – ${finTxt}`
      : cangrejo
        ? `Hoy permitido (cangrejo: orto−1 h → ocaso+2 h): ${inicioTxt} – ${finTxt}`
        : `Hoy permitido (aprox.): ${inicioTxt} – ${finTxt}`,
    estado: dentro ? "dentro" : "fuera",
    estadoTxt: dentro
      ? "Ahora estás dentro de la franja legal orientativa."
      : "Ahora estás fuera de la franja legal orientativa.",
    normaTxt,
    disclaimer,
    ortoTxt: args.ortoOcaso.ortoTxt,
    ocasoTxt: args.ortoOcaso.ocasoTxt,
    inicioTxt,
    finTxt,
  };
}

export async function obtenerAvisoHorarioLegal(args: {
  ambito: AmbitoHorario;
  lat?: number | null;
  lng?: number | null;
  provinciaId?: string;
  ahora?: Date;
  margenHoras?: number;
  margenFinHoras?: number;
  normaOverride?: string | null;
}): Promise<AvisoHorarioLegal> {
  const provincia = getProvinciaActiva();
  const fallback =
    args.ambito === "maritimo" || args.ambito === "embarcacion"
      ? GRAO_CASTELLON
      : { lat: provincia.regionMapa.latitude, lng: provincia.regionMapa.longitude };
  const lat = args.lat ?? fallback.lat;
  const lng = args.lng ?? fallback.lng;
  const ortoOcaso = await obtenerOrtoOcaso(lat, lng);
  return construirAvisoHorario({
    ambito: args.ambito,
    ortoOcaso,
    ahora: args.ahora,
    provinciaId: args.provinciaId,
    margenHoras: args.margenHoras,
    margenFinHoras: args.margenFinHoras,
    normaOverride: args.normaOverride,
  });
}

/** True si el tramo exige Anexo V.2 Iznájar (horario orto→ocaso sin ±1 h). */
export function esHorarioIznajarAnexoV2(tramo?: {
  id?: string | null;
  notaAnexo?: string | null;
  fichaId?: string | null;
  nombre?: string | null;
} | null): boolean {
  if (!tramo) return false;
  const nota = `${tramo.notaAnexo ?? ""}`.toUpperCase();
  if (nota === "ANEXO_V_2" || nota === "IZNAJAR") return true;
  const blob = `${tramo.id ?? ""} ${tramo.fichaId ?? ""} ${tramo.nombre ?? ""}`.toLowerCase();
  return blob.includes("iznajar");
}

/** CLM: control de cangrejo rojo → ocaso + 2 h (Ley 1/1992 / Orden vedas). */
export function esHorarioCangrejoClm(args: {
  provinciaId?: string | null;
  especieId?: string | null;
}): boolean {
  if (args.provinciaId !== "cuenca") return false;
  return /cangrejo/.test(`${args.especieId ?? ""}`.toLowerCase());
}
