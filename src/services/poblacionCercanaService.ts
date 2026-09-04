import { distanciaKm } from "./geoService";
import { getProvinciaActiva } from "../provincias/runtime";
import { provinciaPorId } from "../provincias";
import type { ProvinciaId } from "../provincias/types";

export type PoblacionResuelta = {
  nombre: string;
  /** Distancia al punto de referencia del catálogo (km). */
  distanciaKm: number;
  /** Nombre del tramo/zona usado para anclar la población. */
  ancla?: string;
};

/**
 * Población de referencia para un punto del mapa: municipio del tramo/zona
 * más cercano en el catálogo de la provincia indicada (o la activa).
 */
export function resolverPoblacionCercana(
  lat: number,
  lng: number,
  radioMaxKm = 35,
  provinciaId?: ProvinciaId
): PoblacionResuelta | null {
  const provincia = provinciaId ? provinciaPorId(provinciaId) : getProvinciaActiva();
  let mejor: PoblacionResuelta | null = null;

  for (const t of provincia.tramos as any[]) {
    const munis: string[] = Array.isArray(t.municipios)
      ? t.municipios.filter(Boolean)
      : t.municipio
        ? [String(t.municipio)]
        : [];
    if (!munis.length || t.lat == null || t.lng == null) continue;
    const d = distanciaKm(lat, lng, Number(t.lat), Number(t.lng));
    if (d > radioMaxKm) continue;
    if (!mejor || d < mejor.distanciaKm) {
      mejor = { nombre: munis[0], distanciaKm: d, ancla: t.nombre };
    }
  }

  for (const z of provincia.zones as any[]) {
    const nombre = z.municipio ? String(z.municipio).split("/")[0].trim() : "";
    if (!nombre || z.lat == null || z.lng == null) continue;
    const d = distanciaKm(lat, lng, Number(z.lat), Number(z.lng));
    if (d > radioMaxKm) continue;
    if (!mejor || d < mejor.distanciaKm) {
      mejor = { nombre, distanciaKm: d, ancla: z.nombre };
    }
  }

  return mejor;
}
