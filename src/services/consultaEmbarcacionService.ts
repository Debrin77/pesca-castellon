/**
 * Consulta legal orientativa para pesca desde embarcación / kayak en Castellón.
 * Distinta de consultarCosta (orilla): dársena ≠ vedado de pesca en mar abierto;
 * Columbretes y reservas marinas sí bloquean.
 */
import vedadosMarinos from "../data/vedadosMarinos.json";
import rampasData from "../data/rampasEmbarcacion.json";
import {
  FUENTE_EMBARCACION,
  REGLAS_EMBARCACION_MAR,
} from "../data/normativaMaritima";
import { puntoEnPoligono, distanciaKm } from "./geoService";
import {
  ConsultaPesca,
  colorSemaforo,
  fuenteDetalleConsulta,
} from "./consultaPescaService";
import {
  todosLosPuertos,
  centroZona,
  esFranjaCosteraCastellon,
  type ZonaCosta,
} from "./consultaCostaService";
import { SEMAFORO } from "../theme";
import { getProvinciaActiva } from "../provincias/runtime";

export type RampaEmbarcacion = {
  id: string;
  nombre: string;
  lat: number;
  lng: number;
  municipio: string;
  nota: string;
};

export type VedadoMarino = ZonaCosta & { tipo?: string };

const COLORES = { libre: SEMAFORO.si, vedado: SEMAFORO.no, fuera: SEMAFORO.neutro };

export function todosLosVedadosMarinos(): VedadoMarino[] {
  return vedadosMarinos as VedadoMarino[];
}

export function todasLasRampas(): RampaEmbarcacion[] {
  return (rampasData as { rampas: RampaEmbarcacion[] }).rampas;
}

export function avisoRampas(): string {
  return (rampasData as { aviso: string }).aviso;
}

function buscaZona(lat: number, lng: number, zonas: ZonaCosta[]): ZonaCosta | null {
  return zonas.find((z) => puntoEnPoligono(lat, lng, z.anillo)) ?? null;
}

function baseMar(): Pick<
  ConsultaPesca,
  "tramo" | "fuenteGeometria" | "confianza" | "ambito" | "fuenteNormativaDetalle"
> {
  return {
    tramo: null,
    fuenteGeometria: "ninguna",
    confianza: "aproximada",
    ambito: "maritimo",
    fuenteNormativaDetalle: fuenteDetalleConsulta("maritimo"),
  };
}

/** ¿Punto en mar de Castellón (franja ampliada ~25 km) para consulta embarcación? */
export function esMarConsultaEmbarcacion(lat: number, lng: number): boolean {
  if (getProvinciaActiva().id !== "castellon") return false;
  // Amplía la franja de orilla: barco pesca más afuera.
  if (esFranjaCosteraCastellon(lat, lng)) return true;
  // Bounding box costa Castellón + Columbretes
  return lat >= 39.7 && lat <= 40.55 && lng >= -0.3 && lng <= 0.85;
}

export function rampaMasCercana(lat: number, lng: number): { rampa: RampaEmbarcacion; km: number } | null {
  let mejor: RampaEmbarcacion | null = null;
  let dMin = Infinity;
  for (const r of todasLasRampas()) {
    const d = distanciaKm(lat, lng, r.lat, r.lng);
    if (d < dMin) {
      dMin = d;
      mejor = r;
    }
  }
  return mejor ? { rampa: mejor, km: dMin } : null;
}

/**
 * Semáforo legal para modalidad embarcación/kayak.
 * - Columbretes / reserva marina → vedado
 * - Interior de dársena → vedado (no pescar en puerto)
 * - Resto del mar provincial → libre orientativo + reglas embarcación
 */
export function consultarEmbarcacion(lat: number, lng: number): ConsultaPesca {
  const reserva = buscaZona(lat, lng, todosLosVedadosMarinos());
  if (reserva) {
    return {
      ...baseMar(),
      veredicto: "vedado",
      titulo: `Reserva marina · ${reserva.nombre}`,
      color: COLORES.vedado,
      distanciaKm: null,
      dentroDelRadio: true,
      sePuedePescarHoy: false,
      restriccionesHoy: [
        reserva.norma ?? "Pesca recreativa restringida o prohibida en esta reserva.",
        "Polígono orientativo: BOE y cartografía oficial mandan.",
        FUENTE_EMBARCACION.urlColumbretes,
      ],
      permisos: [
        "Modalidad: embarcación / kayak — no entres a pescar aquí sin norma que lo permita.",
      ],
    };
  }

  const puerto = buscaZona(lat, lng, todosLosPuertos());
  if (puerto) {
    return {
      ...baseMar(),
      veredicto: "vedado",
      titulo: `Dársena / aguas portuarias · ${puerto.nombre}`,
      color: COLORES.vedado,
      distanciaKm: null,
      dentroDelRadio: true,
      sePuedePescarHoy: false,
      restriccionesHoy: [
        "No pesques en dársena, fondeo ni canales de entrada salvo autorización del puerto.",
        "Zarpa y consulta de nuevo fuera del recinto portuario.",
      ],
      permisos: ["Modalidad: embarcación — el puerto es para salir, no para pescar."],
      sitiosCosta: [
        {
          nombre: "Rampa de salida",
          especies: "—",
          cuando: "Antes de zarpar",
          detalle: puerto.nombre,
        },
      ],
    };
  }

  if (!esMarConsultaEmbarcacion(lat, lng)) {
    return {
      ...baseMar(),
      veredicto: "fuera_catalogo",
      titulo: "Fuera del mar de consulta (Castellón)",
      color: COLORES.fuera,
      distanciaKm: null,
      dentroDelRadio: false,
      sePuedePescarHoy: false,
      restriccionesHoy: [
        "Ese punto no está en el mar cubierto para embarcación en Castellón.",
        "Acércate a la costa o elige una rampa del catálogo.",
      ],
      permisos: [],
    };
  }

  const cerca = rampaMasCercana(lat, lng);
  return {
    ...baseMar(),
    veredicto: "libre",
    titulo: cerca ? `Mar · salida orientativa ${cerca.rampa.nombre}` : "Mar abierto (orientativo)",
    color: COLORES.libre,
    distanciaKm: cerca?.km ?? null,
    dentroDelRadio: true,
    sePuedePescarHoy: true,
    especiesHabituales: "Lubina, dorada, jurel, caballa, sepia, dentón (según profundidad)",
    especiesIds: ["lubina", "dorada", "jurel", "caballa", "sepia", "denton", "bonito"],
    restriccionesHoy: [
      ...REGLAS_EMBARCACION_MAR.slice(2, 7),
      "Índice «Salgo en barco» orienta meteo; no autoriza a zarpar si el patrón decide lo contrario.",
    ],
    permisos: [
      FUENTE_EMBARCACION.titulo,
      REGLAS_EMBARCACION_MAR[0],
      REGLAS_EMBARCACION_MAR[1],
      cerca
        ? `Rampa/puerto más cercano (~${cerca.km.toFixed(1)} km): ${cerca.rampa.nombre}.`
        : "Elige rampa de salida en el mapa.",
      "Tallas: RD 560/1995 anexo II. Especies: RD 347/2011. PescaREC cuando aplique.",
    ],
  };
}

export function aspectoMapaVedadoMarino(z: VedadoMarino): { color: string; identifier: "vedado" } {
  const c = centroZona(z.anillo);
  const cons = consultarEmbarcacion(c.lat, c.lng);
  return { color: colorSemaforo(cons), identifier: "vedado" };
}
