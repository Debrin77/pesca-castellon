import puertos from "../data/puertosCastellon.json";
import vedados from "../data/vedadosCosta.json";
import playasData from "../data/playasEspigonesCosta.json";
import { puntoEnPoligono, distanciaAPolylineKm } from "./geoService";
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
  anchoKm: number;
  tramo: { lat: number; lng: number }[];
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

const COLORES = { libre: "#2f7d4a", vedado: "#b42318", fuera: "#4d5d54" };

function baseMar(): Pick<ConsultaPesca, "tramo" | "fuenteGeometria" | "confianza" | "ambito"> {
  return { tramo: null, fuenteGeometria: "ninguna", confianza: "aproximada", ambito: "maritimo" };
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

  const hit = playaPulsada(lat, lng);
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
        : "Este toque no cae en una playa fichada. No te asignamos la de al lado: pulsa el arenal concreto (pin verde).",
    ],
    permisos: [
      FUENTE_MARITIMA.titulo,
      REGLAS_ORILLA_MAR[0],
      playa
        ? "Sí se pesca en esta playa a caña desde tierra (uso habitual)."
        : "Orilla abierta a consulta legal, pero sin ficha de playa hasta que pulses una nombrada.",
      "Tallas: RD 560/1995 anexo II (Mediterráneo). Especies autorizadas: RD 347/2011.",
    ],
  };
}

/** Un toque en el mapa: orilla si estás en la playa; si no, ríos. */
export function consultarToqueMapa(lat: number, lng: number): ConsultaPesca {
  if (esFranjaCosteraCastellon(lat, lng)) return consultarCosta(lat, lng);
  return consultarPuntoPesca(lat, lng);
}
