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

/** Notas locales sin referencias GVA/Castellón al mostrar en Sevilla. */
function adaptarEspecieSevilla(s: any): any {
  const copy = { ...s };
  if (typeof copy.normativaResumen === "string") {
    copy.normativaResumen = copy.normativaResumen
      .replace(/Licencia GVA\.?/gi, "Licencia de pesca continental de Andalucía (Junta).")
      .replace(/Comunitat Valenciana/gi, "Andalucía");
  }
  if (typeof copy.normativaEspecial === "string") {
    copy.normativaEspecial = copy.normativaEspecial.replace(
      /Comunitat Valenciana/gi,
      "Andalucía"
    );
  }
  if (s.id === "black_bass") {
    copy.notas =
      "Invasora (RD 630/2013). No devolver al agua. En embalses sevillanos (Minilla, Pintado, Melonares…) es una de las estrellas: colas y coberturas en primavera, puntas profundas en verano.";
    copy.habitats =
      "Colas y coberturas en Minilla, Pintado, Melonares y José Torán; orillas con cañas y cambios de cota";
  }
  if (s.id === "tenca") {
    copy.notas =
      "Talla mínima habitual 25 cm (confirma orden de vedas). Aguas lentas y con vegetación en embalses y remansos sevillanos.";
  }
  if (s.id === "carpa") {
    copy.notas =
      "Muy presente en embalses y tramos lentos del Guadalquivir sevillano. Confirma cupos/tallas en la orden de vedas de Andalucía.";
  }
  return copy;
}

const speciesSevilla = [
  ...(speciesBase as any[]).filter((s) => IDS_COMPARTIDOS.has(s.id)).map(adaptarEspecieSevilla),
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
