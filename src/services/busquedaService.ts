/**
 * Índice de búsqueda unificado: tramos oficiales + fichas de zona + playas,
 * por nombre, río, cuenca, municipio y código de anexo.
 */
import { getProvinciaActiva } from "../provincias/runtime";
import { todasLasPlayas } from "./consultaCostaService";
import { todosLosTramos, TramoOficial } from "./consultaPescaService";

export type TipoSugerencia = "tramo" | "ficha" | "playa" | "municipio" | "cuenca";

export interface SugerenciaBusqueda {
  id: string;
  tipo: TipoSugerencia;
  titulo: string;
  meta: string;
  /** Para centrar mapa / abrir consulta */
  lat?: number;
  lng?: number;
  tramoId?: string;
  fichaId?: string;
  playaId?: string;
  cuenca?: string;
  municipio?: string;
}

function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function coincide(haystack: string, q: string): boolean {
  return norm(haystack).includes(q);
}

/** Cuencas de la provincia activa (para chips del mapa). */
export function cuencasProvincia(): string[] {
  return getProvinciaActiva().cuencas;
}

/** @deprecated Usa cuencasProvincia(); se mantiene por compatibilidad. */
export const CUENCAS = ["Mijares", "Palancia", "Sénia", "Otras"] as const;

export function municipiosConocidos(): string[] {
  const set = new Set<string>();
  for (const z of getProvinciaActiva().zones as any[]) {
    String(z.municipio || "")
      .split("/")
      .map((p: string) => p.trim())
      .filter(Boolean)
      .forEach((m: string) => set.add(m));
  }
  for (const t of todosLosTramos() as (TramoOficial & { municipios?: string[] })[]) {
    (t.municipios ?? []).forEach((m) => set.add(m));
  }
  return [...set].sort((a, b) => a.localeCompare(b, "es"));
}

export function buscarZonas(
  texto: string,
  opts: { modo?: "continental" | "costa"; cuenca?: string | null; limite?: number } = {}
): SugerenciaBusqueda[] {
  const q = norm(texto);
  if (!q && !opts.cuenca) return [];
  const limite = opts.limite ?? 10;
  const out: SugerenciaBusqueda[] = [];
  const provincia = getProvinciaActiva();
  const zones = provincia.zones as any[];

  if (opts.modo !== "costa") {
    for (const t of todosLosTramos() as (TramoOficial & { municipios?: string[]; cuenca?: string })[]) {
      if (opts.cuenca && t.cuenca !== opts.cuenca) continue;
      const munis = t.municipios ?? [];
      const hit =
        !q ||
        coincide(t.nombre, q) ||
        coincide(t.rio, q) ||
        coincide(t.codigo, q) ||
        coincide(t.cuenca || "", q) ||
        munis.some((m) => coincide(m, q));
      if (!hit) continue;
      out.push({
        id: `tramo:${t.id}`,
        tipo: "tramo",
        titulo: t.nombre,
        meta: `${t.aprovechamiento} · ${t.cuenca ?? t.rio}${munis[0] ? ` · ${munis[0]}` : ""}`,
        lat: t.lat,
        lng: t.lng,
        tramoId: t.id,
        fichaId: t.fichaId ?? undefined,
        cuenca: t.cuenca,
      });
    }

    for (const z of zones) {
      if (opts.cuenca && z.cuenca !== opts.cuenca) continue;
      const hit =
        !q ||
        coincide(z.nombre, q) ||
        coincide(z.rio, q) ||
        coincide(z.municipio || "", q) ||
        coincide(z.cuenca || "", q);
      if (!hit) continue;
      if (out.some((s) => s.fichaId === z.id)) continue;
      out.push({
        id: `ficha:${z.id}`,
        tipo: "ficha",
        titulo: z.nombre,
        meta: `${z.tipo} · ${z.municipio || z.cuenca || ""}`,
        lat: z.lat,
        lng: z.lng,
        fichaId: z.id,
        cuenca: z.cuenca,
      });
    }
  }

  if (opts.modo !== "continental" && !provincia.continentalOnly) {
    for (const p of todasLasPlayas()) {
      const hit =
        !q ||
        coincide(p.nombre, q) ||
        coincide((p as any).municipio || "", q) ||
        coincide((p as any).localidad || "", q);
      if (!hit) continue;
      out.push({
        id: `playa:${p.id}`,
        tipo: "playa",
        titulo: p.nombre,
        meta: (p as any).municipio || "Costa",
        lat: p.lat,
        lng: p.lng,
        playaId: p.id,
      });
    }
  }

  return out.slice(0, limite);
}
