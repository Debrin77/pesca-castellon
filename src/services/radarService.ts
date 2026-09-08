/**
 * Radar de precipitación vía RainViewer (teselas públicas, sin API key).
 * https://www.rainviewer.com/api.html
 */

export interface RadarFrame {
  path: string;
  time: number; // unix seconds
}

export type TipoFrameRadar = "observado" | "previsto";

export interface FrameRadarActivo {
  path: string;
  time: number;
  tipo: TipoFrameRadar;
}

export interface RadarDisponible {
  host: string;
  frames: RadarFrame[];
  /** Frames observados (past) y previstos (nowcast) por separado. */
  past: RadarFrame[];
  nowcast: RadarFrame[];
  /** Unix seconds del JSON RainViewer (`generated`). */
  generated: number | null;
  /** Frame que se pinta en el mapa (preferimos último observado). */
  frameActivo: FrameRadarActivo | null;
  ultimoPath: string | null;
  /** Plantilla Leaflet/RN: sustituye {z}/{x}/{y} */
  urlPlantilla: string | null;
}

let cache: { at: number; data: RadarDisponible } | null = null;

function elegirFrameActivo(past: RadarFrame[], nowcast: RadarFrame[]): FrameRadarActivo | null {
  // Capa estática: preferir el último observado (no el nowcast más lejano).
  const observado = past.length ? past[past.length - 1] : null;
  if (observado) {
    return { path: observado.path, time: observado.time, tipo: "observado" };
  }
  const previsto = nowcast.length ? nowcast[nowcast.length - 1] : null;
  if (previsto) {
    return { path: previsto.path, time: previsto.time, tipo: "previsto" };
  }
  return null;
}

export async function obtenerRadar(): Promise<RadarDisponible> {
  if (cache && Date.now() - cache.at < 5 * 60 * 1000) return cache.data;
  try {
    const res = await fetch("https://api.rainviewer.com/public/weather-maps.json");
    if (!res.ok) throw new Error(`RainViewer ${res.status}`);
    const data = await res.json();
    const host: string = data.host;
    const past: RadarFrame[] = data.radar?.past ?? [];
    const nowcast: RadarFrame[] = data.radar?.nowcast ?? [];
    const frames: RadarFrame[] = [...past, ...nowcast];
    const frameActivo = elegirFrameActivo(past, nowcast);
    const urlPlantilla = frameActivo
      ? `${host}${frameActivo.path}/256/{z}/{x}/{y}/2/1_1.png`
      : null;
    const generated =
      typeof data.generated === "number" && Number.isFinite(data.generated)
        ? data.generated
        : null;
    const out: RadarDisponible = {
      host,
      frames,
      past,
      nowcast,
      generated,
      frameActivo,
      ultimoPath: frameActivo?.path ?? null,
      urlPlantilla,
    };
    cache = { at: Date.now(), data: out };
    return out;
  } catch (err) {
    console.warn("Radar RainViewer:", err);
    return {
      host: "",
      frames: [],
      past: [],
      nowcast: [],
      generated: null,
      frameActivo: null,
      ultimoPath: null,
      urlPlantilla: null,
    };
  }
}

/** Hora local HH:MM. */
export function horaRadar(unixSec: number): string {
  const d = new Date(unixSec * 1000);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Fecha corta local, p. ej. «8 sep» o «8 sep 2025» si no es este año. */
export function fechaRadarCorta(unixSec: number, ahora = new Date()): string {
  const d = new Date(unixSec * 1000);
  const mismoAnio = d.getFullYear() === ahora.getFullYear();
  const base = d
    .toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      ...(mismoAnio ? {} : { year: "numeric" }),
    })
    .replace(/\./g, "");
  return base;
}

/**
 * Texto para pie del mapa / chip: para cuándo es la imagen del radar.
 * Ej.: «Observado a las 09:00 · 8 sep» / «Previsto para las 09:30 · 8 sep»
 */
export function etiquetaCuandoRadar(frame: FrameRadarActivo | null | undefined): string | null {
  if (!frame) return null;
  const hora = horaRadar(frame.time);
  const fecha = fechaRadarCorta(frame.time);
  const hoy = new Date();
  const d = new Date(frame.time * 1000);
  const esHoy =
    d.getFullYear() === hoy.getFullYear() &&
    d.getMonth() === hoy.getMonth() &&
    d.getDate() === hoy.getDate();
  const cuandoFecha = esHoy ? `hoy ${fecha}` : fecha;
  if (frame.tipo === "previsto") {
    return `Previsto para las ${hora} · ${cuandoFecha}`;
  }
  return `Observado a las ${hora} · ${cuandoFecha}`;
}

/** Chip corto: «09:00». */
export function etiquetaHoraRadarCorta(frame: FrameRadarActivo | null | undefined): string | null {
  if (!frame) return null;
  return horaRadar(frame.time);
}

/** Attribution obligatoria. */
export const RADAR_ATTRIBUTION = "RainViewer";
