import tramos from "../data/tramosOficiales.json";
import {
  Aprovechamiento,
  diaHabilMijares,
  etiquetaTemporadaTrucha,
  temporadaTruchaAbierta,
} from "../data/normativa2026";
import { distanciaKm } from "./geoService";

export interface TramoOficial {
  id: string;
  codigo: string;
  nombre: string;
  rio: string;
  lat: number;
  lng: number;
  radioKm: number;
  vocacion: string;
  regimen: string;
  aprovechamiento: Aprovechamiento;
  notaAnexo?: string | null;
  matriculaCoto?: string;
  fichaId?: string | null;
  especies: string[];
}

export type VeredictoPesca =
  | "libre"
  | "coto"
  | "vedado"
  | "reserva_trucha"
  | "fuera_catalogo";

export interface ConsultaPesca {
  veredicto: VeredictoPesca;
  titulo: string;
  color: string;
  tramo: TramoOficial | null;
  distanciaKm: number | null;
  dentroDelRadio: boolean;
  sePuedePescarHoy: boolean;
  restriccionesHoy: string[];
  permisos: string[];
}

const COLORES: Record<VeredictoPesca, string> = {
  libre: "#2f7d4a",
  coto: "#c45c12",
  vedado: "#b42318",
  reserva_trucha: "#5b4aa8",
  fuera_catalogo: "#4d5d54",
};

function notaDias(nota: string | null | undefined): "ZPL1" | "ZPL2" | null {
  if (nota === "ZPL1" || nota === "ZPL2") return nota;
  return null;
}

export function colorAprovechamiento(a: Aprovechamiento): string {
  if (a === "ZPL") return COLORES.libre;
  if (a === "ZPC") return COLORES.coto;
  if (a === "ZRTC") return COLORES.reserva_trucha;
  return COLORES.vedado;
}

export function etiquetaAprovechamiento(a: Aprovechamiento): string {
  if (a === "ZPL") return "Zona libre (ZPL)";
  if (a === "ZPC") return "Coto / zona controlada (ZPC)";
  if (a === "ZRTC") return "Reserva de trucha común";
  return "Vedado de pesca";
}

export function buscarTramoCercano(lat: number, lng: number): { tramo: TramoOficial; distanciaKm: number; dentro: boolean } | null {
  let mejor: TramoOficial | null = null;
  let mejorD = Infinity;
  for (const t of tramos as TramoOficial[]) {
    const d = distanciaKm(lat, lng, t.lat, t.lng);
    if (d < mejorD) {
      mejorD = d;
      mejor = t;
    }
  }
  if (!mejor) return null;
  return { tramo: mejor, distanciaKm: mejorD, dentro: mejorD <= mejor.radioKm };
}

export function consultarPuntoPesca(lat: number, lng: number, fecha: Date = new Date()): ConsultaPesca {
  const hallado = buscarTramoCercano(lat, lng);
  if (!hallado || !hallado.dentro) {
    return {
      veredicto: "fuera_catalogo",
      titulo: hallado
        ? `Fuera de tramo cartografiado (el más cercano: ${hallado.tramo.nombre}, ${hallado.distanciaKm.toFixed(1)} km)`
        : "Fuera del catálogo de tramos",
      color: COLORES.fuera_catalogo,
      tramo: hallado?.tramo ?? null,
      distanciaKm: hallado?.distanciaKm ?? null,
      dentroDelRadio: false,
      sePuedePescarHoy: false,
      restriccionesHoy: [
        "Este punto no cae dentro del radio de un tramo del anexo I (aprox. al centroide oficial). Puede ser secano, mar o un cauce menor no listado.",
        "No pesques si no hay agua continental señalizada. En mar rige la normativa marítima, no esta app.",
      ],
      permisos: ["Si hay un río o embalse a la vista, acércate a la orilla y vuelve a pulsar, o consulta el visor de caza y pesca de la GVA."],
    };
  }

  const t = hallado.tramo;
  const salmonicola = /salmon/i.test(t.vocacion);
  const truchaOk = temporadaTruchaAbierta(fecha);
  const nota = notaDias(t.notaAnexo);
  const diaOk = diaHabilMijares(nota, fecha);
  const dow = fecha.toLocaleDateString("es-ES", { weekday: "long" });

  const restricciones: string[] = [];
  const permisos: string[] = ["Licencia de pesca continental GVA."];

  if (t.aprovechamiento === "VP") {
    restricciones.push("Aprovechamiento vedado: pesca prohibida en este tramo.");
    return {
      veredicto: "vedado",
      titulo: `Vedado · ${t.nombre}`,
      color: COLORES.vedado,
      tramo: t,
      distanciaKm: hallado.distanciaKm,
      dentroDelRadio: true,
      sePuedePescarHoy: false,
      restriccionesHoy: restricciones,
      permisos,
    };
  }

  if (t.aprovechamiento === "ZRTC") {
    restricciones.push("Zona de reserva de trucha común: no se pesca. Cabecera protegida.");
    return {
      veredicto: "reserva_trucha",
      titulo: `Reserva de trucha · ${t.nombre}`,
      color: COLORES.reserva_trucha,
      tramo: t,
      distanciaKm: hallado.distanciaKm,
      dentroDelRadio: true,
      sePuedePescarHoy: false,
      restriccionesHoy: restricciones,
      permisos,
    };
  }

  if (t.aprovechamiento === "ZPC") {
    permisos.push(
      `Permiso de coto intransferible (${t.matriculaCoto ?? "ZPC"}). Lo expide el titular / servicios territoriales.`
    );
    restricciones.push("Sin ese permiso no es zona libre: es coto (zona de pesca controlada).");
  } else {
    permisos.push("No hace falta permiso de coto: es zona de pesca libre (ZPL).");
  }

  if (salmonicola) {
    permisos.push(`Tramos trucheros: ${etiquetaTemporadaTrucha(fecha.getFullYear())}.`);
    permisos.push("Una caña, sin abandono, anzuelo sin arpón, solo mosca o cucharilla. Trucha común siempre sin muerte.");
    if (!truchaOk) {
      restricciones.push("Fuera de temporada salmonícola: no pesques trucha común. El tramo puede estar cerrado a salmónidos.");
    }
    if (nota === "ZPL1") {
      restricciones.push("Días hábiles (nota 1 del anexo, primer tramo del Mijares): martes, jueves, sábados y domingo.");
      if (!diaOk) restricciones.push(`Hoy es ${dow}: no es día hábil en este tramo.`);
    }
    if (nota === "ZPL2") {
      restricciones.push("Días hábiles (nota 2): solo martes y jueves.");
      if (!diaOk) restricciones.push(`Hoy es ${dow}: no es día hábil en este tramo.`);
    }
  } else {
    permisos.push("Aguas no trucheras: artículos 2 y 8 de la Orden 30/2016. Lombriz/asticot permitidos. Autóctonos de la tabla 2.2 con talla o sin muerte según especie.");
  }

  let sePuedePescarHoy = true;
  if (salmonicola && (!truchaOk || !diaOk)) sePuedePescarHoy = false;

  return {
    veredicto: t.aprovechamiento === "ZPC" ? "coto" : "libre",
    titulo: `${etiquetaAprovechamiento(t.aprovechamiento)} · ${t.nombre}`,
    color: colorAprovechamiento(t.aprovechamiento),
    tramo: t,
    distanciaKm: hallado.distanciaKm,
    dentroDelRadio: true,
    sePuedePescarHoy,
    restriccionesHoy: restricciones,
    permisos,
  };
}

export function todosLosTramos(): TramoOficial[] {
  return tramos as TramoOficial[];
}
