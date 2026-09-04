import tramos from "./tramosOficiales.json";
import zones from "./zones.json";
import speciesExtra from "./speciesExtra.json";
import speciesOverrides from "./speciesOverrides.json";
import {
  CHECKLIST_ANTES_DE_PESCAR_ANDALUCIA,
  FUENTE_NORMATIVA_ANDALUCIA,
} from "./normativa";
import type { ProvinciaConfig } from "../types";

/**
 * Catálogo Sevilla 100 % independiente: NO importamos ni fusionamos
 * src/data/species.json (textos Castellón/GVA). Solo overrides + extras andaluces.
 */
function construirSpeciesSevilla(): any[] {
  const porId = new Map<string, any>();

  for (const o of speciesOverrides as any[]) {
    porId.set(o.id, { ...o, provinciaId: "sevilla" as const });
  }

  for (const s of speciesExtra as any[]) {
    porId.set(s.id, { ...(porId.get(s.id) ?? {}), ...s, provinciaId: "sevilla" as const });
  }

  return Array.from(porId.values());
}

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
  cuencas: ["Guadalquivir", "Guadaíra", "Rivera de Huelva", "Corbones", "Otras"],
  tramos: tramos as ProvinciaConfig["tramos"],
  zones: zones as any[],
  species: construirSpeciesSevilla(),
  tieneIcv: true,
  tieneSaih: true,
  embalsesPanel: [
    {
      nombre: "E64 Cala",
      etiqueta: "Cala",
      zoneId: "embalse_de_cala",
      red: "chg",
      urlPagina: "https://www.chguadalquivir.es/saih/EmbalSE.aspx",
    },
    {
      nombre: "E63 La Minilla",
      etiqueta: "Minilla",
      zoneId: "embalse_de_la_minilla",
      red: "chg",
      urlPagina: "https://www.chguadalquivir.es/saih/EmbalSE.aspx",
    },
    {
      nombre: "E57 El Pintado",
      etiqueta: "Pintado",
      zoneId: "embalse_del_pintado",
      red: "chg",
      urlPagina: "https://www.chguadalquivir.es/saih/EmbalSE.aspx",
    },
    {
      nombre: "E54 José Torán",
      etiqueta: "José Torán",
      zoneId: "embalse_de_jose_toran",
      red: "chg",
      urlPagina: "https://www.chguadalquivir.es/saih/EmbalCO.aspx",
    },
    {
      nombre: "E55 Puebla de Cazalla",
      etiqueta: "Puebla Cazalla",
      zoneId: "embalse_de_la_puebla_de_cazalla",
      red: "chg",
      urlPagina: "https://www.chguadalquivir.es/saih/EmbalSE.aspx",
    },
    {
      nombre: "E68 Torre del Águila",
      etiqueta: "Torre Águila",
      zoneId: "embalse_de_torre_del_aguila",
      red: "chg",
      urlPagina: "https://www.chguadalquivir.es/saih/EmbalSE.aspx",
    },
    {
      nombre: "E56 Huesna",
      etiqueta: "Huésna",
      zoneId: "embalse_huesna",
      red: "chg",
      urlPagina: "https://www.chguadalquivir.es/saih/EmbalSE.aspx",
    },
    {
      nombre: "E67 El Agrio",
      etiqueta: "Agrio",
      zoneId: "embalse_agrio",
      red: "chg",
      urlPagina: "https://www.chguadalquivir.es/saih/EmbalSE.aspx",
    },
  ],
  fuenteNormativa: {
    titulo: FUENTE_NORMATIVA_ANDALUCIA.titulo,
    vigenciaNota: FUENTE_NORMATIVA_ANDALUCIA.vigenciaNota,
    urlOrden: FUENTE_NORMATIVA_ANDALUCIA.urlNormativa,
    urlLicencia: FUENTE_NORMATIVA_ANDALUCIA.urlLicencia,
  },
  checklistAntesDePescar: CHECKLIST_ANTES_DE_PESCAR_ANDALUCIA,
  etiquetaLicenciaContinental: "Licencia de pesca continental de Andalucía (Junta).",
  requisitosLicencia: {
    resumen:
      "Para pescar en ríos y embalses de Sevilla necesitas la licencia de pesca continental de Andalucía, el NIR del Registro Andaluz y el seguro obligatorio de responsabilidad civil del pescador. Confirma siempre la orden de vedas vigente.",
    seguroObligatorio: true,
    seguroNota:
      "Seguro obligatorio de responsabilidad civil del pescador (Junta de Andalucía). Hay que acreditarlo al tramitar la licencia y llevar el justificante al pescar, junto con la licencia y el DNI/NIE.",
    requisitos: [
      "Inscripción en el Registro Andaluz de Caza y Pesca Continental (NIR).",
      "Licencia de pesca continental de Andalucía en vigor.",
      "Seguro obligatorio de responsabilidad civil del pescador vigente.",
      "DNI/NIE; en cotos, permiso del titular además de la licencia.",
    ],
  },
  notaConsultaAprox:
    "Este punto no cae en un polígono oficial DERA (refugio o masa cartografiada) de Sevilla. Puede ser secano, cauce menor o otra provincia. Las aguas libres no listadas siguen el art. 5.2: confirma señalización y espacios protegidos.",
};
