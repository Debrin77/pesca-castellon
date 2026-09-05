/**
 * Sitios personales (puntos guardados + capturas con GPS) para el mapa:
 * búsqueda, chips de acceso rápido y marcadores.
 */
import type { Captura, PuntoGuardado } from "./storageService";
import type { RegionMapa } from "../provincias/types";
import { puntoEnRegionMapa } from "./geoService";
import { formatearCoords } from "./coordsUtils";

export type SitioPersonal = {
  id: string;
  tipo: "punto" | "captura";
  titulo: string;
  meta: string;
  lat: number;
  lng: number;
};

function capturaConCoords(
  c: Captura
): c is Captura & { lat: number; lng: number } {
  return (
    typeof c.lat === "number" &&
    Number.isFinite(c.lat) &&
    typeof c.lng === "number" &&
    Number.isFinite(c.lng)
  );
}

/** Une puntos y capturas geolocalizadas; opcionalmente filtra por región de provincia. */
export function listarSitiosPersonales(
  puntos: PuntoGuardado[],
  capturas: Captura[],
  opts: {
    region?: RegionMapa;
    nombreEspecie?: (especieId: string) => string;
    limite?: number;
  } = {}
): SitioPersonal[] {
  const out: SitioPersonal[] = [];
  const dentro = (lat: number, lng: number) =>
    !opts.region || puntoEnRegionMapa(lat, lng, opts.region);

  for (const p of puntos) {
    if (!dentro(p.lat, p.lng)) continue;
    out.push({
      id: `punto:${p.id}`,
      tipo: "punto",
      titulo: p.nombre,
      meta: formatearCoords(p.lat, p.lng, 4),
      lat: p.lat,
      lng: p.lng,
    });
  }

  for (const c of capturas) {
    if (!capturaConCoords(c)) continue;
    // Si la captura ya está enlazada a un punto guardado, el marcador del punto basta.
    if (c.puntoId) continue;
    if (!dentro(c.lat, c.lng)) continue;
    const especie =
      opts.nombreEspecie?.(c.especieId) ?? c.especieId.replace(/_/g, " ");
    const lugar = c.nombreLugar?.trim();
    out.push({
      id: `captura:${c.id}`,
      tipo: "captura",
      titulo: lugar || especie,
      meta: lugar
        ? `Captura · ${especie} · ${c.fecha}`
        : `Captura · ${c.fecha} · ${formatearCoords(c.lat, c.lng, 4)}`,
      lat: c.lat,
      lng: c.lng,
    });
  }

  const limite = opts.limite ?? 40;
  return out.slice(0, limite);
}
