/**
 * Radar de precipitación vía RainViewer (teselas públicas, sin API key).
 * https://www.rainviewer.com/api.html
 */

export interface RadarFrame {
  path: string;
  time: number; // unix seconds
}

export interface RadarDisponible {
  host: string;
  frames: RadarFrame[];
  ultimoPath: string | null;
  /** Plantilla Leaflet/RN: sustituye {z}/{x}/{y} */
  urlPlantilla: string | null;
}

let cache: { at: number; data: RadarDisponible } | null = null;

export async function obtenerRadar(): Promise<RadarDisponible> {
  if (cache && Date.now() - cache.at < 5 * 60 * 1000) return cache.data;
  try {
    const res = await fetch("https://api.rainviewer.com/public/weather-maps.json");
    if (!res.ok) throw new Error(`RainViewer ${res.status}`);
    const data = await res.json();
    const host: string = data.host;
    const frames: RadarFrame[] = [...(data.radar?.past ?? []), ...(data.radar?.nowcast ?? [])];
    const ultimo = frames.length ? frames[frames.length - 1] : null;
    const urlPlantilla = ultimo
      ? `${host}${ultimo.path}/256/{z}/{x}/{y}/2/1_1.png`
      : null;
    const out: RadarDisponible = {
      host,
      frames,
      ultimoPath: ultimo?.path ?? null,
      urlPlantilla,
    };
    cache = { at: Date.now(), data: out };
    return out;
  } catch (err) {
    console.warn("Radar RainViewer:", err);
    return { host: "", frames: [], ultimoPath: null, urlPlantilla: null };
  }
}

/** Attribution obligatoria. */
export const RADAR_ATTRIBUTION = "RainViewer";
