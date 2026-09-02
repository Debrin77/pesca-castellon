import puertos from "../data/puertosCastellon.json";
import vedados from "../data/vedadosCosta.json";
import playasData from "../data/playasEspigonesCosta.json";
import { puntoEnPoligono, distanciaKm, distanciaAPolylineKm } from "./geoService";
import { ConsultaPesca, consultarPuntoPesca } from "./consultaPescaService";
import { FUENTE_MARITIMA, REGLAS_ORILLA_MAR } from "../data/normativaMaritima";

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
  radioKm: number;
  especies: string;
  especiesIds: string[];
  sitios: { nombre: string; especies: string; cuando: string; detalle: string }[];
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

export function playaMasCercana(lat: number, lng: number): { playa: PlayaCosta; km: number } | null {
  let mejor: PlayaCosta | null = null;
  let dMin = Infinity;
  for (const p of todasLasPlayas()) {
    const d = distanciaKm(lat, lng, p.lat, p.lng);
    if (d < dMin) {
      dMin = d;
      mejor = p;
    }
  }
  return mejor ? { playa: mejor, km: dMin } : null;
}

export function esFranjaCosteraCastellon(lat: number, lng: number): boolean {
  return distanciaAPolylineKm(lat, lng, playasData.lineaCosta) <= playasData.kmOrilla;
}

const COLORES = { libre: "#2f7d4a", vedado: "#b42318", fuera: "#4d5d54" };

function baseMar(): Pick<ConsultaPesca, "tramo" | "fuenteGeometria" | "confianza" | "ambito"> {
  return { tramo: null, fuenteGeometria: "ninguna", confianza: "aproximada", ambito: "maritimo" };
}

function fichaPlaya(lat: number, lng: number): PlayaCosta | null {
  const c = playaMasCercana(lat, lng);
  if (!c) return null;
  if (c.km <= c.playa.radioKm) return c.playa;
  if (c.km <= 1.6) return c.playa;
  return null;
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
    const cerca = playaMasCercana(lat, lng);
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
        cerca
          ? `La pesca a pie se hace en la playa de al lado (${cerca.playa.nombre}), cara al mar, no aquí dentro.`
          : "Sal de la dársena y consulta la playa contigua.",
      ],
      permisos: ["Modalidad: pesca marítima desde tierra, no desde barco."],
    };
  }

  if (!esFranjaCosteraCastellon(lat, lng)) {
    return {
      ...baseMar(),
      veredicto: "fuera_catalogo",
      titulo: "Fuera de la orilla de Castellón",
      color: COLORES.fuera,
      distanciaKm: null,
      dentroDelRadio: false,
      sePuedePescarHoy: false,
      restriccionesHoy: [
        "Ese toque no está en la franja de playa (unos 2 km de la orilla).",
        "Columbretes y pesca en barco no están en esta versión.",
      ],
      permisos: [],
    };
  }

  const playa = fichaPlaya(lat, lng);
  return {
    ...baseMar(),
    veredicto: "libre",
    titulo: playa ? playa.nombre : "Orilla de Castellón · playa o rompiente",
    color: COLORES.libre,
    distanciaKm: playa ? distanciaKm(lat, lng, playa.lat, playa.lng) : null,
    dentroDelRadio: true,
    sePuedePescarHoy: true,
    especiesHabituales: playa?.especies ?? playasData.especiesPorDefecto,
    especiesIds: playa?.especiesIds ?? ["lubina", "dorada", "sargo", "llisa", "sepia"],
    sitiosCosta: playa?.sitios ?? [],
    restriccionesHoy: [
      ...REGLAS_ORILLA_MAR.slice(1),
      "Identifica la especie: catálogo Orilla mar (tallas BOE) y pestaña No tocar.",
    ],
    permisos: [
      FUENTE_MARITIMA.titulo,
      REGLAS_ORILLA_MAR[0],
      playa
        ? "Sí se pesca aquí a caña desde tierra (uso habitual). No es un permiso extra ni un ranking oficial."
        : "Orilla abierta a consulta: licencia marítima desde tierra y las reglas de abajo.",
      "Tallas: RD 560/1995 anexo II (Mediterráneo). Especies autorizadas: RD 347/2011.",
    ],
  };
}

/** Un toque en el mapa: orilla si estás en la playa; si no, ríos. */
export function consultarToqueMapa(lat: number, lng: number): ConsultaPesca {
  if (esFranjaCosteraCastellon(lat, lng)) return consultarCosta(lat, lng);
  return consultarPuntoPesca(lat, lng);
}
