import AsyncStorage from "@react-native-async-storage/async-storage";
import { getProvinciaIdActiva, getProvinciaActiva } from "../provincias/runtime";
import rampasData from "../data/rampasEmbarcacion.json";

/**
 * Paquete offline: calienta caché HTTP de teselas + marca provincia lista.
 * No es MBTiles completo (eso llegará con build nativa); sí reduce huecos en campo.
 * En Castellón también calienta costa (regionCosta) y entorno de cada rampa.
 */

export interface EstadoOfflineMapa {
  provinciaId: string;
  preparadoEn: string | null;
  teselasPedidas: number;
  teselasOk: number;
  nota: string;
}

function claveEstado(): string {
  return `@pesca_app/${getProvinciaIdActiva()}/offline_mapa`;
}

export async function leerEstadoOfflineMapa(): Promise<EstadoOfflineMapa> {
  try {
    const raw = await AsyncStorage.getItem(claveEstado());
    if (raw) return JSON.parse(raw);
  } catch {
    /* empty */
  }
  return {
    provinciaId: getProvinciaIdActiva(),
    preparadoEn: null,
    teselasPedidas: 0,
    teselasOk: 0,
    nota: "Aún no has preparado el mapa offline de esta provincia.",
  };
}

function tilesForBbox(
  lat: number,
  lng: number,
  latDelta: number,
  zoom: number
): { z: number; x: number; y: number }[] {
  const n = 2 ** zoom;
  const latRad = (lat * Math.PI) / 180;
  const x = Math.floor(((lng + 180) / 360) * n);
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
  const radio = zoom <= 10 ? 2 : 1;
  const out: { z: number; x: number; y: number }[] = [];
  for (let dx = -radio; dx <= radio; dx++) {
    for (let dy = -radio; dy <= radio; dy++) {
      out.push({ z: zoom, x: x + dx, y: y + dy });
    }
  }
  // ampliar un poco con latDelta
  if (latDelta > 1) {
    for (let dx = -radio - 1; dx <= radio + 1; dx++) {
      out.push({ z: zoom, x: x + dx, y });
    }
  }
  return out;
}

function dedupeTiles(tiles: { z: number; x: number; y: number }[]) {
  const seen = new Set<string>();
  return tiles.filter((t) => {
    const k = `${t.z}/${t.x}/${t.y}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export async function prepararMapaOffline(
  onProgreso?: (ok: number, total: number) => void
): Promise<EstadoOfflineMapa> {
  const p = getProvinciaActiva();
  const { latitude, longitude, latitudeDelta } = p.regionMapa;
  const zooms = [9, 10, 11];
  let tiles = zooms.flatMap((z) => tilesForBbox(latitude, longitude, latitudeDelta, z));

  // Costa Castellón: centro marítimo + entorno de cada rampa (ritual embarcación).
  if (!p.continentalOnly && p.regionCosta) {
    const costaDelta = 0.55;
    tiles = tiles.concat(
      zooms.flatMap((z) =>
        tilesForBbox(p.regionCosta!.latitude, p.regionCosta!.longitude, costaDelta, z)
      )
    );
    try {
      const rampas = (rampasData as { rampas?: { lat: number; lng: number }[] }).rampas ?? [];
      for (const r of rampas) {
        tiles = tiles.concat(zooms.flatMap((z) => tilesForBbox(r.lat, r.lng, 0.2, z)));
      }
    } catch {
      /* ignore */
    }
  }

  const unique = dedupeTiles(tiles);

  let ok = 0;
  for (let i = 0; i < unique.length; i++) {
    const t = unique[i];
    const url = `https://a.basemaps.cartocdn.com/rastertiles/voyager/${t.z}/${t.x}/${t.y}.png`;
    try {
      const res = await fetch(url);
      if (res.ok) {
        // leer cuerpo para forzar caché HTTP del navegador / runtime
        await res.arrayBuffer();
        ok++;
      }
    } catch {
      /* skip */
    }
    onProgreso?.(ok, unique.length);
  }

  const costaNota =
    !p.continentalOnly && p.regionCosta
      ? " Incluye costa y entorno de rampas de embarcación."
      : "";
  const estado: EstadoOfflineMapa = {
    provinciaId: p.id,
    preparadoEn: new Date().toISOString(),
    teselasPedidas: unique.length,
    teselasOk: ok,
    nota:
      ok > unique.length * 0.5
        ? `Teselas de mapa calentadas en caché.${costaNota} Normativa, rampas y especies ya van en la app. En campo sin red verás el último mapa cacheado + datos locales.`
        : "Pocas teselas cacheadas (red limitada). Reintenta con Wi‑Fi. Los datos legales/especies siguen disponibles offline.",
  };
  await AsyncStorage.setItem(claveEstado(), JSON.stringify(estado));
  return estado;
}
