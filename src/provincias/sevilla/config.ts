import tramos from "./tramosOficiales.json";
import zones from "./zones.json";
import speciesExtra from "./speciesExtra.json";
import speciesBase from "../../data/species.json";
import {
  CHECKLIST_ANTES_DE_PESCAR_ANDALUCIA,
  FUENTE_NORMATIVA_ANDALUCIA,
} from "./normativa";
import type { ProvinciaConfig } from "../types";

/** Especies del catálogo base que también viven en Sevilla continental. */
const IDS_COMPARTIDOS = new Set([
  "black_bass",
  "lucio",
  "carpa",
  "siluro",
  "cangrejo_americano",
  "carpin",
  "tenca",
]);

const speciesSevilla = [
  ...(speciesBase as any[]).filter((s) => IDS_COMPARTIDOS.has(s.id)),
  ...(speciesExtra as any[]),
];

export const sevillaConfig: ProvinciaConfig = {
  id: "sevilla",
  nombre: "Sevilla",
  nombreApp: "Pesca Sevilla",
  continentalOnly: true,
  regionMapa: {
    latitude: 37.55,
    longitude: -5.85,
    latitudeDelta: 1.35,
    longitudeDelta: 1.35,
  },
  cuencas: ["Guadalquivir", "Rivera de Huelva", "Guadaíra", "Corbones", "Otras"],
  tramos: tramos as ProvinciaConfig["tramos"],
  zones: zones as any[],
  species: speciesSevilla,
  tieneIcv: false,
  tieneSaih: false,
  embalsesPanel: [],
  fuenteNormativa: {
    titulo: FUENTE_NORMATIVA_ANDALUCIA.titulo,
    vigenciaNota: FUENTE_NORMATIVA_ANDALUCIA.vigenciaNota,
    urlOrden: FUENTE_NORMATIVA_ANDALUCIA.urlNormativa,
    urlLicencia: FUENTE_NORMATIVA_ANDALUCIA.urlLicencia,
  },
  checklistAntesDePescar: CHECKLIST_ANTES_DE_PESCAR_ANDALUCIA,
  etiquetaLicenciaContinental: "Licencia de pesca continental de Andalucía (Junta).",
  notaConsultaAprox:
    "Este punto no cae en el radio de un tramo o embalse del catálogo de Sevilla. Puede ser secano, otra provincia o un cauce menor no listado.",
};
