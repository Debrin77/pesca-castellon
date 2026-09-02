import puertos from "../data/puertosCastellon.json";
import { distanciaKm } from "./geoService";
import { ConsultaPesca } from "./consultaPescaService";
import { FUENTE_MARITIMA, REGLAS_ORILLA_MAR } from "../data/normativaMaritima";

export type PuertoCosta = {
  id: string;
  nombre: string;
  lat: number;
  lng: number;
  radioM: number;
};

export function todosLosPuertos(): PuertoCosta[] {
  return puertos as PuertoCosta[];
}

function dentroPuerto(lat: number, lng: number): PuertoCosta | null {
  for (const p of todosLosPuertos()) {
    if (distanciaKm(lat, lng, p.lat, p.lng) * 1000 <= p.radioM) return p;
  }
  return null;
}

/** Franja litoral aproximada de la provincia (no es la línea de deslinde). */
export function esFranjaCosteraCastellon(lat: number, lng: number): boolean {
  if (lat < 39.68 || lat > 40.56) return false;
  if (lng < -0.22 || lng > 0.55) return false;
  return true;
}

const COLORES = {
  libre: "#2f7d4a",
  vedado: "#b42318",
  fuera: "#4d5d54",
};

export function consultarCosta(lat: number, lng: number): ConsultaPesca {
  const puerto = dentroPuerto(lat, lng);
  if (puerto) {
    return {
      veredicto: "vedado",
      titulo: `Aguas portuarias · ${puerto.nombre}`,
      color: COLORES.vedado,
      tramo: null,
      distanciaKm: distanciaKm(lat, lng, puerto.lat, puerto.lng),
      dentroDelRadio: true,
      sePuedePescarHoy: false,
      fuenteGeometria: "ninguna",
      confianza: "aproximada",
      ambito: "maritimo",
      restriccionesHoy: [
        "Decreto 41/2013: pesca prohibida en aguas portuarias (dársena, fondeo y varada), salvo autorización del puerto.",
        "El círculo es orientativo: si hay valla o cartel del puerto, prevalece el cartel.",
      ],
      permisos: ["Modalidad de esta consulta: pesca marítima desde tierra, no desde barco."],
    };
  }

  if (!esFranjaCosteraCastellon(lat, lng)) {
    return {
      veredicto: "fuera_catalogo",
      titulo: "Fuera de la franja costera de Castellón",
      color: COLORES.fuera,
      tramo: null,
      distanciaKm: null,
      dentroDelRadio: false,
      sePuedePescarHoy: false,
      fuenteGeometria: "ninguna",
      confianza: "aproximada",
      ambito: "maritimo",
      restriccionesHoy: [
        "Estás en modo Costa. Para ríos y embalses cambia a Continental.",
        "Columbretes y pesca en barco no están en esta versión.",
      ],
      permisos: [],
    };
  }

  return {
    veredicto: "libre",
    titulo: "Costa de Castellón · pesca marítima desde tierra",
    color: COLORES.libre,
    tramo: null,
    distanciaKm: null,
    dentroDelRadio: true,
    sePuedePescarHoy: true,
    fuenteGeometria: "ninguna",
    confianza: "aproximada",
    ambito: "maritimo",
    restriccionesHoy: [
      ...REGLAS_ORILLA_MAR.slice(1),
      "Espacios como el Prat de Cabanes-Torreblanca o tramos señalizados pueden estar vedados: si hay cartel, no lances.",
      "La desembocadura del Millars es vedado continental; no la uses de atajo hacia el mar.",
    ],
    permisos: [
      FUENTE_MARITIMA.titulo,
      REGLAS_ORILLA_MAR[0],
      "Tallas y cupos: listado estatal/UE vigente, no el de trucha de interior.",
    ],
  };
}
