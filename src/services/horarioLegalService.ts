/**
 * Franjas horarias legales / de luz según ámbito.
 * Continental CV / Andalucía: 1 h antes del orto → 1 h después del ocaso.
 * Costa caña desde tierra (CV): sin veda nocturna general; orto/ocaso como referencia de luz.
 * Submarina: ocaso → orto prohibido (no cubierta por la app).
 */
import {
  HORARIO_LEGAL_ORILLA_MAR,
  HORARIO_SUBMARINA_CV,
} from "../data/normativaMaritima";
import { HORARIO_LEGAL_PESCA } from "../data/normativa2026";
import { HORARIO_ORIENTATIVO_ANDALUCIA } from "../provincias/sevilla/normativa";
import { HORARIO_LEGAL_CLM } from "../provincias/cuenca/normativa";
import { getProvinciaActiva } from "../provincias/runtime";
import { esProvinciaAndalucia, esProvinciaCastillaLaMancha } from "../provincias/types";
import { GRAO_CASTELLON, OrtoOcasoDia, obtenerOrtoOcaso } from "./weatherService";

export type AmbitoHorario = "continental" | "maritimo";

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
}): AvisoHorarioLegal {
  const ahora = args.ahora ?? new Date();
  const disclaimer =
    "Orientativo (orto/ocaso Open-Meteo). No sustituye BOE, DOGV ni bandos municipales.";

  if (args.ambito === "maritimo") {
    const ortoTxt = args.ortoOcaso?.ortoTxt ?? null;
    const ocasoTxt = args.ortoOcaso?.ocasoTxt ?? null;
    let estado: EstadoFranja = "sin_datos";
    let estadoTxt = "Sin datos de sol ahora.";
    if (args.ortoOcaso) {
      const orto = parseIsoLocal(args.ortoOcaso.ortoIso);
      const ocaso = parseIsoLocal(args.ortoOcaso.ocasoIso);
      const deDia = ahora.getTime() >= orto.getTime() && ahora.getTime() <= ocaso.getTime();
      estado = deDia ? "luz_dia" : "noche";
      estadoTxt = deDia
        ? "Ahora hay luz solar (referencia, no semáforo legal de caña)."
        : "Ahora es de noche astronómica (luz). En caña desde tierra no hay veda nocturna general.";
    }
    return {
      ambito: "maritimo",
      titulo: "Horario · costa (caña desde tierra)",
      franjaTxt:
        ortoTxt && ocasoTxt
          ? `Hoy luz solar: orto ${ortoTxt} → ocaso ${ocasoTxt}`
          : "Hoy: orto/ocaso no disponibles (sin red o caché).",
      estado,
      estadoTxt,
      normaTxt: `${HORARIO_LEGAL_ORILLA_MAR} ${HORARIO_SUBMARINA_CV}`,
      disclaimer,
      ortoTxt,
      ocasoTxt,
      inicioTxt: ortoTxt,
      finTxt: ocasoTxt,
    };
  }

  const normaTxt = normaContinentalTxt(args.provinciaId);
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
  const inicio = sumarHoras(orto, -1);
  const fin = sumarHoras(ocaso, 1);
  const inicioTxt = ajustarHoraTxt(args.ortoOcaso.ortoTxt, -1);
  const finTxt = ajustarHoraTxt(args.ortoOcaso.ocasoTxt, 1);
  const dentro =
    ahora.getTime() >= inicio.getTime() && ahora.getTime() <= fin.getTime();

  return {
    ambito: "continental",
    titulo: "Horario legal · continental",
    franjaTxt: `Hoy permitido (aprox.): ${inicioTxt} – ${finTxt}`,
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
}): Promise<AvisoHorarioLegal> {
  const provincia = getProvinciaActiva();
  const fallback =
    args.ambito === "maritimo"
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
  });
}
