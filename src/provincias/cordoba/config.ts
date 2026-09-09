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
 * Catálogo Córdoba 100 % independiente: NO importamos ni fusionamos
 * src/data/species.json (textos Castellón/GVA). Solo overrides + extras andaluces.
 */
function construirSpeciesCordoba(): any[] {
  const porId = new Map<string, any>();

  for (const o of speciesOverrides as any[]) {
    porId.set(o.id, { ...o, provinciaId: "cordoba" as const });
  }

  for (const s of speciesExtra as any[]) {
    porId.set(s.id, { ...(porId.get(s.id) ?? {}), ...s, provinciaId: "cordoba" as const });
  }

  return Array.from(porId.values());
}

export const cordobaConfig: ProvinciaConfig = {
  id: "cordoba",
  nombre: "Córdoba",
  nombreApp: "Pesca Córdoba",
  continentalOnly: true,
  regionMapa: {
    latitude: 37.95,
    longitude: -4.75,
    latitudeDelta: 1.45,
    longitudeDelta: 1.55,
  },
  cuencas: ["Guadalquivir", "Genil", "Guadiato", "Guadajoz", "Otras"],
  tramos: tramos as ProvinciaConfig["tramos"],
  zones: zones as any[],
  species: construirSpeciesCordoba(),
  tieneIcv: true,
  tieneSaih: true,
  embalsesPanel: [
    {
      nombre: "E05 Iznájar",
      etiqueta: "Iznájar",
      zoneId: "embalse_de_iznajar",
      red: "chg",
      urlPagina: "https://www.chguadalquivir.es/saih/EmbalCO.aspx",
    },
    {
      nombre: "E49 Guadalmellato",
      etiqueta: "Guadalmellato",
      zoneId: "embalse_guadalmellato",
      red: "chg",
      urlPagina: "https://www.chguadalquivir.es/saih/EmbalCO.aspx",
    },
    {
      nombre: "E51 Navallana",
      etiqueta: "Navallana",
      zoneId: "embalse_de_san_rafael_de_navallana",
      red: "chg",
      urlPagina: "https://www.chguadalquivir.es/saih/EmbalCO.aspx",
    },
    {
      nombre: "E50 Breña II",
      etiqueta: "Breña II",
      zoneId: "embalse_de_la_brena_brena_ii",
      red: "chg",
      urlPagina: "https://www.chguadalquivir.es/saih/EmbalCO.aspx",
    },
    {
      nombre: "E48 Puente Nuevo",
      etiqueta: "Puente Nuevo",
      zoneId: "embalse_de_puente_nuevo",
      red: "chg",
      urlPagina: "https://www.chguadalquivir.es/saih/EmbalCO.aspx",
    },
    {
      nombre: "E52 Yeguas",
      etiqueta: "Yeguas",
      zoneId: "embalse_de_yeguas",
      red: "chg",
      urlPagina: "https://www.chguadalquivir.es/saih/EmbalCO.aspx",
    },
    {
      nombre: "E39 Retortillo",
      etiqueta: "Retortillo",
      zoneId: "embalse_del_retortillo",
      red: "chg",
      urlPagina: "https://www.chguadalquivir.es/saih/EmbalCO.aspx",
    },
    {
      nombre: "E46 Arenoso",
      etiqueta: "Arenoso",
      zoneId: "embalse_arenoso",
      red: "chg",
      urlPagina: "https://www.chguadalquivir.es/saih/EmbalCO.aspx",
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
      "Para pescar en ríos y embalses de Córdoba necesitas la licencia de pesca continental de Andalucía, el NIR del Registro Andaluz y el seguro obligatorio de responsabilidad civil del pescador. Confirma siempre la orden de vedas vigente.",
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
    "Sin tramo en el catálogo DERA: no cae en refugio ni masa cartografiada. No es veda automática — en Córdoba las aguas libres no listadas pueden seguir el art. 5.2.",
  coberturaCartografica: {
    resumen:
      "Refugios (Anexo IV) tienen polígono DERA. Las aguas libres (art. 5.2) no hace falta que estén todas en el mapa: toda masa no delimitada como coto o refugio es libre, con licencia y resto de normas.",
    prohibiciones:
      "Refugios de pesca (Anexo IV / DERA): geometría oficial de la Junta. Si el punto cae en rojo, la pesca está prohibida con carácter permanente (Bembézar, Cordobilla, Malpasillo, lagunas de la campiña…).",
    aguasLibres:
      "Art. 5.2 Orden 13/01/2023: aguas libres = masa no delimitada como coto o refugio. DERA no dibuja todos los cauces; algunas masas libres van con radio orientativo. Fuera del mapa ≠ prohibido.",
    fueraCatalogoPermisos: [
      "No es veda automática: si hay agua continental y no es refugio ni espacio protegido restringido, el art. 5.2 puede permitir pescar (licencia + NIR + seguro RC).",
      "Si hay embalse o río a la vista, acércate a la orilla y vuelve a consultar, o abre el visor de pesca continental de la Junta.",
    ],
    fueraCatalogoPrecauciones: [
      "Puede ser secano, cauce de otra provincia o zona con señalización local / espacio protegido.",
      "Art. 6: no pescar a menos de 200 m de presas, escalas y pasos de peces. Confirma carteles.",
    ],
    urlVisor: FUENTE_NORMATIVA_ANDALUCIA.urlVisor,
  },
};
