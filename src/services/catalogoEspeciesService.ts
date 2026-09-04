/**
 * Catálogos de especies por ámbito (continental vs orilla de Castellón).
 * Sevilla es solo continental: no mezcla especiesOrilla.
 */
import orilla from "../data/especiesOrilla.json";
import { modalidadPorId, type ModalidadPesca } from "../data/modalidades";
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
  [key: string]: unknown;
};

const USUALES_ORILLA_IDS: string[] = Array.isArray((orilla as { usualesIds?: string[] }).usualesIds)
  ? ([...(orilla as { usualesIds: string[] }).usualesIds] as string[])
  : [];

function conIcono(sp: EspecieCatalogo): EspecieCatalogo {
  if (sp.icono) return sp;
  return { ...sp, icono: caraDeEspecie(sp).emoji };
}

function mapaPescables(): Map<string, EspecieCatalogo> {
  return new Map((orilla.pescablesOrilla as EspecieCatalogo[]).map((s) => [s.id, s]));
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

/**
 * Catálogo seleccionable según modalidad.
 * - marítimo → orilla (15 usuales + invasoras)
 * - continental → especies de la provincia
 * - ambos (kayak/barco) → continental + orilla (sin duplicar id)
 */
export function catalogoParaModalidad(
  modalidad: ModalidadPesca,
  speciesContinentales: EspecieCatalogo[],
  opts?: { continentalOnly?: boolean }
): EspecieCatalogo[] {
  if (opts?.continentalOnly) return speciesContinentales;
  const ambito = modalidadPorId(modalidad).ambito;
  if (ambito === "maritimo") return especiesOrillaParaSeleccion();
  if (ambito === "continental") return speciesContinentales;
  const vistos = new Set(speciesContinentales.map((s) => s.id));
  const extra = especiesOrillaParaSeleccion().filter((s) => !vistos.has(s.id));
  return [...speciesContinentales, ...extra];
}

/** Resuelve nombre/ficha para capturas ya guardadas (río o costa). */
export function resolverEspecie(
  id: string,
  speciesContinentales: EspecieCatalogo[]
): EspecieCatalogo | undefined {
  const enRio = speciesContinentales.find((s) => s.id === id);
  if (enRio) return enRio;
  const invasora = (orilla.invasorasOrilla as EspecieCatalogo[]).find((s) => s.id === id);
  if (invasora) return conIcono({ ...invasora, invasora: true });
  const pescable = (orilla.pescablesOrilla as EspecieCatalogo[]).find((s) => s.id === id);
  return pescable ? conIcono(pescable) : undefined;
}
