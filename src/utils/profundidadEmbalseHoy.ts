/**
 * Lectura práctica de embalse: nivel SAIH (oficial) + hábitat fino (orientativo).
 * No hay batimetría abierta del vaso; el %/cota vivos son lo oficial usable.
 */
import type { HabitatSitio } from "../data/habitat";
import { ETIQUETA_PROFUNDIDAD, ETIQUETA_TAG } from "../data/habitat";
import type { EstacionHidrologica } from "../services/saihService";

export type BandaNivelEmbalse = "muy_bajo" | "bajo" | "medio" | "alto" | "muy_alto";

export type SelloDato = "oficial" | "orientativo" | "ejemplo";

export type BloqueSello = {
  sello: SelloDato;
  titulo: string;
  lineas: string[];
  chips?: string[];
};

export type LecturaProfundidadHoy = {
  banda: BandaNivelEmbalse | null;
  lecturaPesca: string;
  oficial: BloqueSello | null;
  orientativo: BloqueSello | null;
};

export function bandaNivelEmbalse(pct: number | null | undefined): BandaNivelEmbalse | null {
  if (pct == null || !Number.isFinite(pct)) return null;
  if (pct < 25) return "muy_bajo";
  if (pct < 40) return "bajo";
  if (pct < 70) return "medio";
  if (pct < 85) return "alto";
  return "muy_alto";
}

export function etiquetaBandaNivel(banda: BandaNivelEmbalse): string {
  switch (banda) {
    case "muy_bajo":
      return "Nivel muy bajo";
    case "bajo":
      return "Nivel bajo";
    case "medio":
      return "Nivel medio";
    case "alto":
      return "Nivel alto";
    case "muy_alto":
      return "Nivel muy alto";
  }
}

/** Consejo de pesca según % (orientativo; no es batimetría). */
export function consejoPescaPorNivel(banda: BandaNivelEmbalse): string {
  switch (banda) {
    case "muy_bajo":
      return "Orillas de nivel alto al descubierto; pez más concentrado en canal, presa y pozas restantes.";
    case "bajo":
      return "Colas más cortas; prioriza canal, puntas y estructura profunda.";
    case "medio":
      return "Situación mixta: colas y brazos accesibles; combina orilla y cambios de cota.";
    case "alto":
      return "Vegetación y troncos de orilla inundados; buena ventana en cobertura somera (bass/ciprínidos).";
    case "muy_alto":
      return "Lámina amplia: orillas altas inundadas y estructura de ribera bajo agua.";
  }
}

function lineasOficiales(hidro: EstacionHidrologica): string[] {
  const out: string[] = [];
  if (hidro.porcentajeLleno != null) {
    out.push(`Vaso al ${hidro.porcentajeLleno.toFixed(1)}% de capacidad (NMN)`);
  }
  if (hidro.volumenEmbalsadoHm3 != null && hidro.volumenMaximoHm3 != null) {
    out.push(
      `${hidro.volumenEmbalsadoHm3.toFixed(2)} hm³ de ${hidro.volumenMaximoHm3.toFixed(2)} hm³`
    );
  }
  if (hidro.cotaM != null) {
    out.push(`Cota actual ${hidro.cotaM.toFixed(2)} m s.n.m.`);
  }
  if (hidro.fechaDato) {
    out.push(`Dato del ${hidro.fechaDato}`);
  }
  return out;
}

/**
 * Combina SAIH (oficial/ejemplo) + hábitat curado (orientativo).
 */
export function lecturaProfundidadHoy(opts: {
  hidro?: EstacionHidrologica | null;
  habitat?: HabitatSitio | null;
}): LecturaProfundidadHoy {
  const { hidro, habitat } = opts;
  const banda = bandaNivelEmbalse(hidro?.porcentajeLleno ?? null);

  let oficial: BloqueSello | null = null;
  if (hidro && (hidro.porcentajeLleno != null || hidro.cotaM != null || hidro.volumenEmbalsadoHm3 != null)) {
    const esEjemplo = hidro.fuente === "simulado";
    const lineas = lineasOficiales(hidro);
    if (banda) {
      lineas.unshift(`${etiquetaBandaNivel(banda)} · lectura para pescar`);
    }
    oficial = {
      sello: esEjemplo ? "ejemplo" : "oficial",
      titulo: esEjemplo ? "Nivel del embalse (dato de ejemplo)" : "Nivel del embalse (SAIH)",
      lineas,
    };
  }

  let orientativo: BloqueSello | null = null;
  if (habitat) {
    const chips = [
      ...(habitat.profundidad ? [ETIQUETA_PROFUNDIDAD[habitat.profundidad]] : []),
      ...habitat.tags.slice(0, 5).map((t) => ETIQUETA_TAG[t]),
    ];
    orientativo = {
      sello: "orientativo",
      titulo: "Estructura del vaso (guías / campo)",
      lineas: [habitat.nota, ...(habitat.fuente ? [`Fuente: ${habitat.fuente}`] : [])],
      chips,
    };
  }

  let lecturaPesca = "";
  if (banda) {
    lecturaPesca = consejoPescaPorNivel(banda);
    if (habitat?.tags?.includes("estiaje")) {
      lecturaPesca += " Este vaso es sensible al estiaje: confirma el % antes de desplazarte.";
    }
  } else if (habitat) {
    lecturaPesca =
      habitat.profundidad != null
        ? `${ETIQUETA_PROFUNDIDAD[habitat.profundidad]}. ${habitat.nota}`
        : habitat.nota;
  } else {
    lecturaPesca = "Sin nivel SAIH ni hábitat curado para este punto.";
  }

  return { banda, lecturaPesca, oficial, orientativo };
}

export function etiquetaSello(sello: SelloDato): string {
  if (sello === "oficial") return "Oficial";
  if (sello === "ejemplo") return "Ejemplo";
  return "Orientativo";
}
