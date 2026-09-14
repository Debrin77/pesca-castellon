/**
 * Catálogos de especies por ámbito (continental, orilla, embarcación).
 * Sevilla es solo continental: no mezcla especiesOrilla.
 */
import orilla from "../data/especiesOrilla.json";
import embarcacion from "../data/especiesEmbarcacion.json";
import { modalidadPorId, esModalidadEmbarcacionMar, type ModalidadPesca } from "../data/modalidades";
import { caraDeEspecie } from "../data/carasVisuales";

export type EspecieCatalogo = {
  id: string;
  nombre: string;
  icono?: string;
  nombreCientifico?: string;
  invasora?: boolean;
  tallaCm?: number | null;
  tallaOficial?: string;
  notas?: string;
  tecnicas?: string[];
  profundidadM?: string;
  [key: string]: unknown;
};

const USUALES_ORILLA_IDS: string[] = Array.isArray((orilla as { usualesIds?: string[] }).usualesIds)
  ? ([...(orilla as { usualesIds: string[] }).usualesIds] as string[])
  : [];

const USUALES_EMBARCACION_IDS: string[] = Array.isArray(
  (embarcacion as { usualesIds?: string[] }).usualesIds
)
  ? ([...(embarcacion as { usualesIds: string[] }).usualesIds] as string[])
  : [];

function conIcono(sp: EspecieCatalogo): EspecieCatalogo {
  if (sp.icono) return sp;
  return { ...sp, icono: caraDeEspecie(sp).emoji };
}

function mapaPescables(): Map<string, EspecieCatalogo> {
  return new Map((orilla.pescablesOrilla as EspecieCatalogo[]).map((s) => [s.id, s]));
}

function mapaEmbarcacion(): Map<string, EspecieCatalogo> {
  return new Map((embarcacion.pescables as EspecieCatalogo[]).map((s) => [s.id, s]));
}

/** Las 15 especies de orilla más habituales en Castellón (surfcasting / rockfishing). */
export function especiesOrillaUsuales(): EspecieCatalogo[] {
  const byId = mapaPescables();
  const ordenadas = USUALES_ORILLA_IDS.map((id) => byId.get(id)).filter(Boolean) as EspecieCatalogo[];
  return ordenadas.map(conIcono);
}

/** Invasoras de orilla (p. ej. cangrejo azul) + 15 usuales. */
export function especiesOrillaParaSeleccion(): EspecieCatalogo[] {
  const invasoras = (orilla.invasorasOrilla as EspecieCatalogo[]).map((s) =>
    conIcono({ ...s, invasora: true })
  );
  return [...invasoras, ...especiesOrillaUsuales()];
}

/** Todas las pescables de orilla (tallas / normativa; incluye las menos frecuentes). */
export function especiesOrillaTodas(): EspecieCatalogo[] {
  return (orilla.pescablesOrilla as EspecieCatalogo[]).map(conIcono);
}

export function idsOrillaConocidos(): Set<string> {
  const ids = new Set<string>();
  for (const s of orilla.pescablesOrilla as EspecieCatalogo[]) ids.add(s.id);
  for (const s of orilla.invasorasOrilla as EspecieCatalogo[]) ids.add(s.id);
  return ids;
}

export function idsOrillaUsuales(): string[] {
  return [...USUALES_ORILLA_IDS];
}

/** Catálogo embarcación / kayak mar (Castellón). */
export function especiesEmbarcacionUsuales(): EspecieCatalogo[] {
  const byId = mapaEmbarcacion();
  return USUALES_EMBARCACION_IDS.map((id) => byId.get(id)).filter(Boolean).map(conIcono) as EspecieCatalogo[];
}

export function especiesEmbarcacionTodas(): EspecieCatalogo[] {
  return (embarcacion.pescables as EspecieCatalogo[]).map(conIcono);
}

export function tecnicasEmbarcacion(): { id: string; etiqueta: string; resumen: string }[] {
  return ((embarcacion as { tecnicas?: { id: string; etiqueta: string; resumen: string }[] }).tecnicas ??
    []) as { id: string; etiqueta: string; resumen: string }[];
}

export function avisoEmbarcacionCatalogo(): string {
  return (embarcacion as { aviso?: string }).aviso ?? "";
}

/**
 * Catálogo seleccionable según modalidad.
 * - orilla mar → orilla
 * - embarcación/kayak con marEmbarcacion → catálogo embarcación
 * - continental → especies de la provincia
 * - kayak/barco sin flag → embarcación + continental
 */
export function catalogoParaModalidad(
  modalidad: ModalidadPesca,
  speciesContinentales: EspecieCatalogo[],
  opts?: { continentalOnly?: boolean; marEmbarcacion?: boolean }
): EspecieCatalogo[] {
  if (opts?.continentalOnly) return speciesContinentales;
  if (opts?.marEmbarcacion && esModalidadEmbarcacionMar(modalidad)) {
    return especiesEmbarcacionUsuales();
  }
  if (modalidad === "orilla_mar" || modalidad === "submarina") return especiesOrillaParaSeleccion();
  const ambito = modalidadPorId(modalidad).ambito;
  if (ambito === "maritimo") return especiesOrillaParaSeleccion();
  if (ambito === "continental") return speciesContinentales;
  if (esModalidadEmbarcacionMar(modalidad)) {
    const barco = especiesEmbarcacionUsuales();
    const vistos = new Set(barco.map((s) => s.id));
    const extra = speciesContinentales.filter((s) => !vistos.has(s.id));
    return [...barco, ...extra];
  }
  const vistos = new Set(speciesContinentales.map((s) => s.id));
  const extra = especiesOrillaParaSeleccion().filter((s) => !vistos.has(s.id));
  return [...speciesContinentales, ...extra];
}

/** Resuelve nombre/ficha para capturas ya guardadas (río, costa u embarcación). */
export function resolverEspecie(
  id: string,
  speciesContinentales: EspecieCatalogo[]
): EspecieCatalogo | undefined {
  const enRio = speciesContinentales.find((s) => s.id === id);
  if (enRio) return enRio;
  const invasora = (orilla.invasorasOrilla as EspecieCatalogo[]).find((s) => s.id === id);
  if (invasora) return conIcono({ ...invasora, invasora: true });
  const pescable = (orilla.pescablesOrilla as EspecieCatalogo[]).find((s) => s.id === id);
  if (pescable) return conIcono(pescable);
  const barco = (embarcacion.pescables as EspecieCatalogo[]).find((s) => s.id === id);
  return barco ? conIcono(barco) : undefined;
}
