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
  tieneIcv: true,
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
    "Este punto no cae en un polígono oficial DERA (refugio o masa cartografiada) de Sevilla. Puede ser secano, cauce menor o otra provincia. Las aguas libres no listadas siguen el art. 5.2: confirma señalización y espacios protegidos.",
};
