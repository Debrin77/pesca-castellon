import tramos from "./tramosOficiales.json";
import zones from "./zones.json";
import speciesExtra from "./speciesExtra.json";
import speciesOverrides from "./speciesOverrides.json";
import {
  CHECKLIST_ANTES_DE_PESCAR_CLM,
  FUENTE_NORMATIVA_CLM,
} from "./normativa";
import type { ProvinciaConfig } from "../types";

/**
 * Catálogo Cuenca 100 % independiente: NO importamos ni fusionamos
 * src/data/species.json (textos Castellón/GVA) ni packs de Andalucía.
 */
function construirSpeciesCuenca(): any[] {
  const porId = new Map<string, any>();

  for (const o of speciesOverrides as any[]) {
    porId.set(o.id, { ...o, provinciaId: "cuenca" as const });
  }

  for (const s of speciesExtra as any[]) {
    porId.set(s.id, { ...(porId.get(s.id) ?? {}), ...s, provinciaId: "cuenca" as const });
  }

  return Array.from(porId.values());
}

export const cuencaConfig: ProvinciaConfig = {
  id: "cuenca",
  nombre: "Cuenca",
  nombreApp: "Pesca Cuenca",
  continentalOnly: true,
  regionMapa: {
    latitude: 39.95,
    longitude: -2.15,
    latitudeDelta: 1.55,
    longitudeDelta: 1.65,
  },
  cuencas: ["Júcar", "Cabriel", "Tajo", "Guadiela", "Turia", "Otras"],
  tramos: tramos as ProvinciaConfig["tramos"],
  zones: zones as any[],
  species: construirSpeciesCuenca(),
  tieneIcv: true,
  tieneSaih: true,
  embalsesPanel: [
    {
      nombre: "EMBALSE DE ALARCÓN",
      etiqueta: "Alarcón",
      zoneId: "embalse_de_alarcon",
      red: "chj",
    },
    {
      nombre: "EMBALSE DE CONTRERAS",
      etiqueta: "Contreras",
      zoneId: "embalse_de_contreras",
      red: "chj",
    },
  ],
  fuenteNormativa: {
    titulo: FUENTE_NORMATIVA_CLM.titulo,
    vigenciaNota: FUENTE_NORMATIVA_CLM.vigenciaNota,
    urlOrden: FUENTE_NORMATIVA_CLM.urlNormativa,
    urlLicencia: FUENTE_NORMATIVA_CLM.urlLicencia,
  },
  checklistAntesDePescar: CHECKLIST_ANTES_DE_PESCAR_CLM,
  etiquetaLicenciaContinental: "Licencia de pesca de Castilla-La Mancha (JCCM).",
  requisitosLicencia: {
    resumen:
      "Para pescar en ríos y embalses de Cuenca necesitas la licencia de pesca de Castilla-La Mancha (plataforma DIANA o Delegación). En cotos especiales o intensivos hace falta además el permiso del día. No se exige seguro RC del pescador. Confirma siempre la Orden de vedas vigente.",
    seguroObligatorio: false,
    seguroNota:
      "En Castilla-La Mancha no se exige seguro de responsabilidad civil del pescador para tramitar ni ejercer la licencia de pesca (a diferencia de Andalucía).",
    requisitos: [
      "Licencia de pesca de Castilla-La Mancha en vigor (DIANA / Delegación Provincial).",
      "En cotos especiales o intensivos: permiso del día además de la licencia.",
      "DNI/NIE encima.",
      "No hace falta seguro de RC de pescador.",
    ],
  },
  notaConsultaAprox:
    "Sin tramo en el catálogo: no cae en masa cartografiada ni en el radio de un tramo. No es veda automática — confirma visor JCCM, Orden 20/2026 y cartel.",
  coberturaCartografica: {
    resumen:
      "Vedados, refugios y cotos del Anexo II tienen ficha en la app (radio u OSM). El visor oficial JCCM es la referencia. Aguas libres no listadas pueden existir fuera del mapa.",
    prohibiciones:
      "Vedados y refugios (Anexo II / Orden de vedas): si el punto cae en rojo, la pesca está prohibida. Confirma visor JCCM.",
    aguasLibres:
      "Aguas libres y embalses principales (Buendía, Alarcón, Contreras…) con geometría orientativa OSM o radio. Fuera del mapa ≠ prohibido: confirma Orden y cartel.",
    fueraCatalogoPermisos: [
      "No es veda automática: «sin tramo» = fuera del catálogo de la app, no «pesca prohibida».",
      "Si hay embalse o río a la vista, acércate a la orilla y vuelve a consultar, o abre el visor de pesca de Castilla-La Mancha.",
    ],
    fueraCatalogoPrecauciones: [
      "Puede ser secano, cauce de otra provincia o zona con señalización local / espacio protegido.",
      "Art. 4.e: no pescar en escalas/pasos ni a menos de 50 m (trucheras) / 10 m (resto).",
    ],
    urlVisor: FUENTE_NORMATIVA_CLM.urlVisor,
  },
};
