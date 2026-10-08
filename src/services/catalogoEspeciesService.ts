/**
 * Catálogos de especies por ámbito (continental, orilla, embarcación).
 * Sevilla es solo continental: no mezcla especiesOrilla.
 * Orilla/embarcación admiten overlay OTA (`contenidoVivoService`).
 */
import orillaBundle from "../data/especiesOrilla.json";
import embarcacionBundle from "../data/especiesEmbarcacion.json";
import { modalidadPorId, esModalidadEmbarcacionMar, type ModalidadPesca } from "../data/modalidades";
import { caraDeEspecie } from "../data/carasVisuales";
import { catalogoCostaVivo } from "./contenidoVivoService";

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

type CatalogoOrilla = {
  usualesIds?: string[];
  pescablesOrilla?: EspecieCatalogo[];
  invasorasOrilla?: EspecieCatalogo[];
  noCapturar?: EspecieCatalogo[];
  fuenteTallas?: string;
};

type CatalogoEmbarcacion = {
  usualesIds?: string[];
  pescables?: EspecieCatalogo[];
  tecnicas?: { id: string; etiqueta: string; resumen: string }[];
  aviso?: string;
};

function orillaActiva(): CatalogoOrilla {
  const vivo = catalogoCostaVivo().orilla as CatalogoOrilla | null;
  return vivo && Array.isArray(vivo.pescablesOrilla) ? vivo : (orillaBundle as CatalogoOrilla);
}

/** Catálogo orilla completo (bundle o pack OTA). */
export function catalogoOrillaActivo(): CatalogoOrilla {
  return orillaActiva();
}

function embarcacionActiva(): CatalogoEmbarcacion {
  const vivo = catalogoCostaVivo().embarcacion as CatalogoEmbarcacion | null;
  return vivo && Array.isArray(vivo.pescables) ? vivo : (embarcacionBundle as CatalogoEmbarcacion);
}

function usualesOrillaIds(): string[] {
  const o = orillaActiva();
  return Array.isArray(o.usualesIds) ? [...o.usualesIds] : [];
}

function usualesEmbarcacionIds(): string[] {
  const e = embarcacionActiva();
  return Array.isArray(e.usualesIds) ? [...e.usualesIds] : [];
}

function conIcono(sp: EspecieCatalogo): EspecieCatalogo {
  if (sp.icono) return sp;
  return { ...sp, icono: caraDeEspecie(sp).emoji };
}

function mapaPescables(): Map<string, EspecieCatalogo> {
  return new Map((orillaActiva().pescablesOrilla ?? []).map((s) => [s.id, s]));
}

function mapaEmbarcacion(): Map<string, EspecieCatalogo> {
  return new Map((embarcacionActiva().pescables ?? []).map((s) => [s.id, s]));
}

/** Las 15 especies de orilla más habituales en Castellón (surfcasting / rockfishing). */
export function especiesOrillaUsuales(): EspecieCatalogo[] {
  const byId = mapaPescables();
  const ordenadas = usualesOrillaIds().map((id) => byId.get(id)).filter(Boolean) as EspecieCatalogo[];
  return ordenadas.map(conIcono);
}

/** Invasoras de orilla (p. ej. cangrejo azul) + 15 usuales. */
export function especiesOrillaParaSeleccion(): EspecieCatalogo[] {
  const invasoras = (orillaActiva().invasorasOrilla ?? []).map((s) =>
    conIcono({ ...s, invasora: true })
  );
  return [...invasoras, ...especiesOrillaUsuales()];
}

/** Todas las pescables de orilla (tallas / normativa; incluye las menos frecuentes). */
export function especiesOrillaTodas(): EspecieCatalogo[] {
  return (orillaActiva().pescablesOrilla ?? []).map(conIcono);
}

export function idsOrillaConocidos(): Set<string> {
  const ids = new Set<string>();
  for (const s of orillaActiva().pescablesOrilla ?? []) ids.add(s.id);
  for (const s of orillaActiva().invasorasOrilla ?? []) ids.add(s.id);
  return ids;
}

export function idsOrillaUsuales(): string[] {
  return [...usualesOrillaIds()];
}

/** Catálogo embarcación / kayak mar (Castellón). */
export function especiesEmbarcacionUsuales(): EspecieCatalogo[] {
  const byId = mapaEmbarcacion();
  return usualesEmbarcacionIds().map((id) => byId.get(id)).filter(Boolean).map(conIcono) as EspecieCatalogo[];
}

export function especiesEmbarcacionTodas(): EspecieCatalogo[] {
  return (embarcacionActiva().pescables ?? []).map(conIcono);
}

export function tecnicasEmbarcacion(): { id: string; etiqueta: string; resumen: string }[] {
  return embarcacionActiva().tecnicas ?? [];
}

export function avisoEmbarcacionCatalogo(): string {
  return embarcacionActiva().aviso ?? "";
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
  const invasora = (orillaActiva().invasorasOrilla ?? []).find((s) => s.id === id);
  if (invasora) return conIcono({ ...invasora, invasora: true });
  const pescable = (orillaActiva().pescablesOrilla ?? []).find((s) => s.id === id);
  if (pescable) return conIcono(pescable);
  const barco = (embarcacionActiva().pescables ?? []).find((s) => s.id === id);
  return barco ? conIcono(barco) : undefined;
}
