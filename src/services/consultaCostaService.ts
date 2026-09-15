import puertos from "../data/puertosCastellon.json";
import vedados from "../data/vedadosCosta.json";
import playasData from "../data/playasEspigonesCosta.json";
import { puntoEnPoligono, distanciaAPolylineKm } from "./geoService";
import {
  ConsultaPesca,
  colorSemaforo,
  consultarPuntoPesca,
  fuenteDetalleConsulta,
} from "./consultaPescaService";
import { FUENTE_MARITIMA, NOTA_CEFALOPODOS_ORILLA, REGLAS_ORILLA_MAR } from "../data/normativaMaritima";
import { getProvinciaActiva } from "../provincias/runtime";
import { SEMAFORO } from "../theme";

export type AnilloCosta = { lat: number; lng: number }[];

export type ZonaCosta = {
  id: string;
  nombre: string;
  anillo: AnilloCosta;
  tipo?: string;
  norma?: string;
};

export type PlayaCosta = {
  id: string;
  nombre: string;
  lat: number;
  lng: number;
  anchoKm: number;
  tramo: { lat: number; lng: number }[];
  especies: string;
  especiesIds: string[];
  sitios: { nombre: string; especies: string; cuando: string; detalle: string }[];
  vedaOrilla?: boolean;
  normaVeda?: string;
};

export function todosLosPuertos(): ZonaCosta[] {
  return puertos as ZonaCosta[];
}

export function todosLosVedadosCosta(): ZonaCosta[] {
  return vedados as ZonaCosta[];
}

export function todasLasPlayas(): PlayaCosta[] {
  return playasData.playas as PlayaCosta[];
}

export function avisoSitiosCosta(): string {
  return playasData.aviso;
}

export function centroZona(anillo: AnilloCosta): { lat: number; lng: number } {
  const n = anillo.length || 1;
  return {
    lat: anillo.reduce((s, p) => s + p.lat, 0) / n,
    lng: anillo.reduce((s, p) => s + p.lng, 0) / n,
  };
}

function busca(lat: number, lng: number, zonas: ZonaCosta[]): ZonaCosta | null {
  return zonas.find((z) => puntoEnPoligono(lat, lng, z.anillo)) ?? null;
}

export function playaPulsada(lat: number, lng: number): { playa: PlayaCosta; km: number } | null {
  let mejor: PlayaCosta | null = null;
  let dMin = Infinity;
  for (const p of todasLasPlayas()) {
    const d = distanciaAPolylineKm(lat, lng, p.tramo);
    if (d <= p.anchoKm && d < dMin) {
      dMin = d;
      mejor = p;
    }
  }
  return mejor ? { playa: mejor, km: dMin } : null;
}

export function esFranjaCosteraCastellon(lat: number, lng: number): boolean {
  return distanciaAPolylineKm(lat, lng, playasData.lineaCosta) <= playasData.kmOrilla;
}

/** Distancia aproximada (km) a la línea de costa de Castellón. */
export function distanciaACostaCastellonKm(lat: number, lng: number): number {
  return distanciaAPolylineKm(lat, lng, playasData.lineaCosta);
}

/**
 * ¿El punto queda al este (mar Mediterráneo) de la orilla de Castellón?
 * Heurística por longitud frente al vértice de costa más cercano en latitud.
 */
export function esMarCastellon(lat: number, lng: number): boolean {
  const linea = playasData.lineaCosta as { lat: number; lng: number }[];
  if (!linea?.length) return false;
  let mejor = linea[0];
  let dMin = Infinity;
  for (const p of linea) {
    const d = Math.abs(p.lat - lat);
    if (d < dMin) {
      dMin = d;
      mejor = p;
    }
  }
  return lng > mejor.lng;
}

const COLORES = { libre: SEMAFORO.si, vedado: SEMAFORO.no, fuera: SEMAFORO.neutro };

function baseMar(): Pick<
  ConsultaPesca,
  | "tramo"
  | "fuenteGeometria"
  | "confianza"
  | "ambito"
  | "modalidadMar"
  | "fuenteNormativaDetalle"
> {
  return {
    tramo: null,
    fuenteGeometria: "ninguna",
    confianza: "aproximada",
    ambito: "maritimo",
    modalidadMar: "orilla",
    fuenteNormativaDetalle: fuenteDetalleConsulta("maritimo"),
  };
}

export function consultarCosta(lat: number, lng: number): ConsultaPesca {
  const vedado = busca(lat, lng, todosLosVedadosCosta());
  if (vedado) {
    return {
      ...baseMar(),
      veredicto: "vedado",
      titulo: `Vedado de orilla · ${vedado.nombre}`,
      color: COLORES.vedado,
      distanciaKm: null,
      dentroDelRadio: true,
      sePuedePescarHoy: false,
      restriccionesHoy: [
        vedado.norma ?? "Pesca desde tierra prohibida aquí.",
        "El polígono es orientativo: el cartel del paraje manda.",
      ],
      permisos: ["Modalidad: pesca marítima desde tierra, no desde barco."],
    };
  }

  const puerto = busca(lat, lng, todosLosPuertos());
  if (puerto) {
    return {
      ...baseMar(),
      veredicto: "vedado",
      titulo: `Aguas portuarias · ${puerto.nombre}`,
      color: COLORES.vedado,
      distanciaKm: null,
      dentroDelRadio: true,
      sePuedePescarHoy: false,
      restriccionesHoy: [
        "Decreto 41/2013: prohibido en dársena, fondeo y varada, salvo autorización del puerto.",
        "Pulsa la playa concreta junto al puerto, no este recinto.",
      ],
      permisos: ["Modalidad: pesca marítima desde tierra, no desde barco."],
    };
  }

  const hit = playaPulsada(lat, lng);
  if (hit?.playa.vedaOrilla) {
    return {
      ...baseMar(),
      veredicto: "vedado",
      titulo: `Vedado de orilla · ${hit.playa.nombre}`,
      color: COLORES.vedado,
      distanciaKm: hit.km,
      dentroDelRadio: true,
      sePuedePescarHoy: false,
      restriccionesHoy: [
        hit.playa.normaVeda ?? "Pesca recreativa a pie prohibida en este tramo.",
        "El cartel del paraje manda.",
      ],
      permisos: ["Modalidad: pesca marítima desde tierra, no desde barco."],
    };
  }

  if (!esFranjaCosteraCastellon(lat, lng)) {
    const kmCosta = distanciaACostaCastellonKm(lat, lng);
    const enMar = esMarCastellon(lat, lng);
    const kmTxt = kmCosta.toFixed(1);
    return {
      ...baseMar(),
      veredicto: "fuera_catalogo",
      titulo: enMar
        ? `Mar abierto · ~${kmTxt} km de la orilla`
        : "Fuera de la orilla de Castellón",
      color: COLORES.fuera,
      distanciaKm: kmCosta,
      dentroDelRadio: false,
      sePuedePescarHoy: false,
      restriccionesHoy: enMar
        ? [
            `Este punto está en el mar (~${kmTxt} km de la costa), no en la franja de pesca desde orilla (~${playasData.kmOrilla} km).`,
            "No es un tramo continental (río/embalse): no uses este punto como pesca desde tierra.",
            "Si pescas desde barco o kayak, cambia a modalidad Embarcación en el mapa o usa Salgo en barco.",
          ]
        : [
            `Ese toque no está en la franja de playa (unos ${playasData.kmOrilla} km de la orilla; ~${kmTxt} km al trazo de costa).`,
            "Para ríos y embalses cambia a «Ríos y embalses». Para barco/kayak usa Embarcación.",
          ],
      permisos: enMar
        ? ["Modalidad actual: pesca marítima desde tierra — este punto no es orilla."]
        : [],
    };
  }

  const playa = hit?.playa ?? null;
  return {
    ...baseMar(),
    veredicto: "libre",
    titulo: playa ? playa.nombre : "Orilla sin nombre de playa en el catálogo",
    color: COLORES.libre,
    distanciaKm: hit?.km ?? null,
    dentroDelRadio: true,
    sePuedePescarHoy: true,
    especiesHabituales: playa?.especies ?? playasData.especiesPorDefecto,
    especiesIds: playa?.especiesIds ?? ["lubina", "dorada", "sargo", "llisa", "sepia"],
    sitiosCosta: playa?.sitios ?? [],
    restriccionesHoy: [
      ...REGLAS_ORILLA_MAR.slice(1),
      playa
        ? "Identifica la especie: catálogo Orilla mar (tallas BOE) y pestaña No tocar."
        : "Este toque no cae en una playa fichada. No te asignamos la de al lado: pulsa el arenal concreto (pin de agua).",
    ],
    permisos: [
      FUENTE_MARITIMA.titulo,
      REGLAS_ORILLA_MAR[0],
      playa
        ? "Sí se pesca en esta playa a caña desde tierra (uso habitual)."
        : "Orilla abierta a consulta legal, pero sin ficha de playa hasta que pulses una nombrada.",
      "Tallas: RD 560/1995 anexo II (Mediterráneo). Especies autorizadas: RD 347/2011.",
      NOTA_CEFALOPODOS_ORILLA,
    ],
  };
}

/**
 * Un toque en el mapa: orilla/mar si estás en la costa de Castellón; si no, ríos.
 * Importante: un toque en el mar NO debe caer al tramo continental más cercano.
 */
export function consultarToqueMapa(lat: number, lng: number): ConsultaPesca {
  const provincia = getProvinciaActiva();
  if (provincia.continentalOnly) {
    return consultarPuntoPesca(lat, lng);
  }
  if (provincia.id === "castellon" && (esFranjaCosteraCastellon(lat, lng) || esMarCastellon(lat, lng))) {
    return consultarCosta(lat, lng);
  }
  return consultarPuntoPesca(lat, lng);
}

/**
 * Color del pin de playa = mismo semáforo que la ficha (HOY SÍ / HOY NO).
 * Las playas con vedaOrilla dejan de verse azules/verdes si hoy no se puede.
 */
export function aspectoMapaPlaya(p: PlayaCosta): { color: string; identifier: "libre" | "vedado" } {
  const c = consultarCosta(p.lat, p.lng);
  const color = colorSemaforo(c);
  return { color, identifier: c.sePuedePescarHoy ? "libre" : "vedado" };
}

/** Puertos y vedados de orilla: siempre HOY NO (prohibido desde tierra). */
export function aspectoMapaZonaCostaProhibida(z: ZonaCosta): { color: string; identifier: "vedado" } {
  const c = centroZona(z.anillo);
  const cons = consultarCosta(c.lat, c.lng);
  return { color: colorSemaforo(cons), identifier: "vedado" };
}

export function colorMarcadorPlaya(p: PlayaCosta): string {
  return aspectoMapaPlaya(p).color;
}
