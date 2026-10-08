/**
 * Sync OTA de contenido normativo / especies / zonas.
 *
 * - Bundle embebido = baseline (siempre disponible offline).
 * - Al abrir la app (flujo «Actualizando…») se consulta
 *   `content/manifest.json` en GitHub Pages y, si hay versión nueva,
 *   se descarga `pack.json` y se guarda en AsyncStorage.
 * - La UI lee overlays vía `provinciaConContenidoVivo` y catálogos costa.
 *
 * Clima, índice, SAIH y avisos de crecida NO van en este pack:
 * se piden en vivo a sus APIs en el mismo bootstrap.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import type { ProvinciaConfig, ProvinciaId } from "../provincias/types";
import { provinciaPorId as provinciaBundle } from "../provincias";

const CLAVE_PACK = "@pesca_app/contenido_vivo_pack_v1";
const CLAVE_VERSION = "@pesca_app/contenido_vivo_version_v1";

/** URL pública del sitio (Expo Go / nativo). Web usa ruta relativa al baseUrl. */
const URL_CONTENIDO_REMOTO =
  "https://debrin77.github.io/pesca-castellon/content/";

export type FuenteNormativaPack = {
  titulo: string;
  vigenciaNota: string;
  urlOrden: string;
  urlLicencia: string;
};

export type PackProvincia = {
  fuenteNormativa?: FuenteNormativaPack;
  species?: unknown[];
  zones?: unknown[];
  tramos?: unknown[];
  speciesOverrides?: unknown[];
  speciesExtra?: unknown[];
};

export type PackContenidoVivo = {
  schema: number;
  version: string;
  generatedAt: string;
  bundleMinVersion?: string;
  costa?: {
    especiesOrilla?: unknown;
    especiesEmbarcacion?: unknown;
  };
  provincias?: Partial<Record<ProvinciaId, PackProvincia>>;
};

export type ManifestContenidoVivo = {
  schema: number;
  version: string;
  generatedAt: string;
  pack: string;
  sha256Prefix?: string;
};

export type ResultadoSyncContenido = {
  ok: boolean;
  actualizado: boolean;
  version: string | null;
  error?: string;
};

type Listener = () => void;
const listeners = new Set<Listener>();

let packMemoria: PackContenidoVivo | null = null;
let versionMemoria: string | null = null;
let hidratado = false;

export function suscribirContenidoVivo(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function notificar() {
  for (const fn of listeners) {
    try {
      fn();
    } catch {
      /* no romper UI */
    }
  }
}

export function versionContenidoVivo(): string | null {
  return versionMemoria;
}

export function packContenidoVivo(): PackContenidoVivo | null {
  return packMemoria;
}

function baseContenidoUrl(): string {
  if (Platform.OS === "web" && typeof window !== "undefined" && window.location?.origin) {
    const path = window.location.pathname || "/";
    // Repo Pages: /pesca-castellon/… → /pesca-castellon/content/
    if (path.includes("/pesca-castellon")) {
      return `${window.location.origin}/pesca-castellon/content/`;
    }
    // Dev local (expo web en /)
    return `${window.location.origin}/content/`;
  }
  return URL_CONTENIDO_REMOTO;
}

async function fetchJson<T>(url: string, timeoutMs = 12000): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

function construirSpeciesDesdePack(p: PackProvincia, provinciaId: ProvinciaId): unknown[] | null {
  if (Array.isArray(p.species) && p.species.length) return p.species;
  const overrides = Array.isArray(p.speciesOverrides) ? p.speciesOverrides : null;
  const extra = Array.isArray(p.speciesExtra) ? p.speciesExtra : null;
  if (!overrides && !extra) return null;
  const porId = new Map<string, Record<string, unknown>>();
  for (const o of overrides ?? []) {
    const row = o as Record<string, unknown>;
    if (typeof row.id === "string") porId.set(row.id, { ...row, provinciaId });
  }
  for (const s of extra ?? []) {
    const row = s as Record<string, unknown>;
    if (typeof row.id !== "string") continue;
    porId.set(row.id, { ...(porId.get(row.id) ?? {}), ...row, provinciaId });
  }
  return Array.from(porId.values());
}

/** Aplica el pack vivo sobre la config embebida (sin mutar el bundle). */
export function provinciaConContenidoVivo(id: ProvinciaId): ProvinciaConfig {
  const base = provinciaBundle(id);
  const pack = packMemoria?.provincias?.[id];
  if (!pack) return base;

  const species = construirSpeciesDesdePack(pack, id);
  return {
    ...base,
    fuenteNormativa: pack.fuenteNormativa
      ? { ...base.fuenteNormativa, ...pack.fuenteNormativa }
      : base.fuenteNormativa,
    species: (species as ProvinciaConfig["species"]) ?? base.species,
    zones: (Array.isArray(pack.zones) ? pack.zones : base.zones) as ProvinciaConfig["zones"],
    tramos: (Array.isArray(pack.tramos) ? pack.tramos : base.tramos) as ProvinciaConfig["tramos"],
  };
}

/** Catálogo costa (orilla / embarcación) con overlay si existe. */
export function catalogoCostaVivo(): {
  orilla: unknown | null;
  embarcacion: unknown | null;
} {
  return {
    orilla: packMemoria?.costa?.especiesOrilla ?? null,
    embarcacion: packMemoria?.costa?.especiesEmbarcacion ?? null,
  };
}

async function persistirPack(pack: PackContenidoVivo): Promise<void> {
  packMemoria = pack;
  versionMemoria = pack.version;
  await AsyncStorage.setItem(CLAVE_PACK, JSON.stringify(pack));
  await AsyncStorage.setItem(CLAVE_VERSION, pack.version);
  notificar();
}

/** Carga el último pack de disco (antes del fetch) para pintar datos ya sync. */
export async function hidratarContenidoVivo(): Promise<string | null> {
  if (hidratado && packMemoria) return versionMemoria;
  try {
    const [raw, ver] = await Promise.all([
      AsyncStorage.getItem(CLAVE_PACK),
      AsyncStorage.getItem(CLAVE_VERSION),
    ]);
    if (raw) {
      const pack = JSON.parse(raw) as PackContenidoVivo;
      if (pack?.schema === 1 && pack.version) {
        packMemoria = pack;
        versionMemoria = ver || pack.version;
      }
    }
  } catch {
    packMemoria = null;
    versionMemoria = null;
  }
  hidratado = true;
  return versionMemoria;
}

/**
 * Consulta manifest remoto y descarga pack si la versión cambió.
 * Fallo de red → se queda con caché/bundle; no lanza.
 */
export async function sincronizarContenidoVivo(): Promise<ResultadoSyncContenido> {
  await hidratarContenidoVivo();
  const base = baseContenidoUrl();
  try {
    const manifest = await fetchJson<ManifestContenidoVivo>(`${base}manifest.json`);
    if (!manifest?.version || !manifest.pack) {
      return { ok: false, actualizado: false, version: versionMemoria, error: "manifest inválido" };
    }
    if (versionMemoria && versionMemoria === manifest.version) {
      return { ok: true, actualizado: false, version: versionMemoria };
    }
    const packUrl = `${base}${manifest.pack.replace(/^\//, "")}`;
    const pack = await fetchJson<PackContenidoVivo>(packUrl);
    if (!pack?.schema || pack.schema !== 1 || !pack.version || !pack.provincias) {
      return { ok: false, actualizado: false, version: versionMemoria, error: "pack inválido" };
    }
    await persistirPack(pack);
    return { ok: true, actualizado: true, version: pack.version };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "sync falló";
    console.warn("contenidoVivo:", msg);
    return { ok: false, actualizado: false, version: versionMemoria, error: msg };
  }
}
