import puertos from "../data/puertosCastellon.json";
import vedados from "../data/vedadosCosta.json";
import { puntoEnPoligono } from "./geoService";
import { ConsultaPesca } from "./consultaPescaService";
import { FUENTE_MARITIMA, REGLAS_ORILLA_MAR } from "../data/normativaMaritima";

export type AnilloCosta = { lat: number; lng: number }[];

export type ZonaCosta = {
  id: string;
  nombre: string;
  anillo: AnilloCosta;
  tipo?: string;
  norma?: string;
};

export function todosLosPuertos(): ZonaCosta[] {
  return puertos as ZonaCosta[];
}

export function todosLosVedadosCosta(): ZonaCosta[] {
  return vedados as ZonaCosta[];
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

export function esFranjaCosteraCastellon(lat: number, lng: number): boolean {
  if (lat < 39.68 || lat > 40.56) return false;
  if (lng < -0.22 || lng > 0.55) return false;
  return true;
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
      restriccionesHoy: [vedado.norma ?? "Pesca desde tierra prohibida aquí.", "El polígono es orientativo: el cartel del paraje manda."],
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
        "El polígono aproxima el recinto. Si hay valla o cartel, prevalece.",
      ],
      permisos: ["Modalidad: pesca marítima desde tierra, no desde barco."],
    };
  }

  if (!esFranjaCosteraCastellon(lat, lng)) {
    return {
      ...baseMar(),
      veredicto: "fuera_catalogo",
      titulo: "Fuera de la franja costera de Castellón",
      color: COLORES.fuera,
      distanciaKm: null,
      dentroDelRadio: false,
      sePuedePescarHoy: false,
      restriccionesHoy: [
        "Estás en modo Costa. Para ríos y embalses cambia a Continental.",
        "Columbretes y pesca en barco no están en esta versión.",
      ],
      permisos: [],
    };
  }

  return {
    ...baseMar(),
    veredicto: "libre",
    titulo: "Costa de Castellón · pesca marítima desde tierra",
    color: COLORES.libre,
    distanciaKm: null,
    dentroDelRadio: true,
    sePuedePescarHoy: true,
    restriccionesHoy: [
      ...REGLAS_ORILLA_MAR.slice(1),
      "Identifica la especie antes de guardarla: el catálogo de orilla marca tallas y lo que no se toca (nácar, dátil de mar, caballito, tortuga).",
    ],
    permisos: [
      FUENTE_MARITIMA.titulo,
      REGLAS_ORILLA_MAR[0],
      "Tallas: RD 560/1995 anexo II (Mediterráneo). Especies autorizadas: RD 347/2011.",
    ],
  };
}
