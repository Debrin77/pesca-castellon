import tramos from "./tramosOficiales.json";
import zones from "./zones.json";
import speciesExtra from "./speciesExtra.json";
import speciesOverrides from "./speciesOverrides.json";
import speciesBase from "../../data/species.json";
import {
  CHECKLIST_ANTES_DE_PESCAR_ANDALUCIA,
  FUENTE_NORMATIVA_ANDALUCIA,
} from "./normativa";
import type { ProvinciaConfig } from "../types";

/**
 * IDs que también existen en el catálogo base (Castellón/GVA).
 * Nunca se copian textos legales/hábitat de ese JSON: solo metadatos técnicos
 * si el override andaluz no los trae. Sin override → no se publica la ficha.
 */
const IDS_COMPARTIDOS = new Set([
  "black_bass",
  "lucio",
  "carpa",
  "siluro",
  "cangrejo_americano",
  "carpin",
]);

/** Campos técnicos reutilizables; nunca notas/tallas/cupos/normativa/hábitats de Castellón. */
function metadatosTecnicos(base: Record<string, any>) {
  return {
    id: base.id,
    nombre: base.nombre,
    nombreCientifico: base.nombreCientifico,
    categoria: base.categoria,
    invasora: base.invasora,
    icono: base.icono,
    mejoresMeses: base.mejoresMeses,
    ventanas: base.ventanas,
    mejorHora: base.mejorHora,
    equipo: base.equipo,
    senuelosClave: base.senuelosClave,
  };
}

function fusionarEspecie(base: Record<string, any> | null, override: Record<string, any>) {
  const tecnicos = base ? metadatosTecnicos(base) : {};
  return {
    ...tecnicos,
    ...override,
    mejorHora: override.mejorHora ?? (base as any)?.mejorHora,
    equipo: override.equipo ?? (base as any)?.equipo,
    senuelosClave: override.senuelosClave ?? (base as any)?.senuelosClave,
    provinciaId: "sevilla" as const,
  };
}

/** Catálogo Sevilla independiente: textos 100 % Andalucía (overrides + extras). */
function construirSpeciesSevilla(): any[] {
  const overrides = new Map((speciesOverrides as any[]).map((o) => [o.id as string, o]));
  const basePorId = new Map(
    (speciesBase as any[]).filter((s) => IDS_COMPARTIDOS.has(s.id)).map((s) => [s.id as string, s])
  );
  const porId = new Map<string, any>();

  for (const [id, o] of overrides) {
    porId.set(id, fusionarEspecie(basePorId.get(id) ?? null, o));
  }

  for (const s of speciesExtra as any[]) {
    if (porId.has(s.id)) porId.set(s.id, fusionarEspecie(porId.get(s.id), s));
    else porId.set(s.id, { ...s, provinciaId: "sevilla" });
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
