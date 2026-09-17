/**
 * Candidatos cercanos al toque del mapa, ordenados por índice de pesca (o barco).
 * Best-effort: no bloquea el veredicto legal; si no hay datos, null.
 * Nunca recomienda vedados / reservas / sitios donde hoy no se puede.
 */
import type { ModoPescaGlobal } from "../data/modoPesca";
import { sitiosFacilesDe } from "../data/sitiosFaciles";
import { getProvinciaActiva } from "../provincias/runtime";
import type { ProvinciaId } from "../provincias/types";
import {
  calcularIndiceBarco,
  CATEGORIA_BARCO_INFO,
  type IndiceBarco,
} from "../services/boatIndexService";
import {
  consultarEmbarcacion,
  todasLasRampas,
} from "../services/consultaEmbarcacionService";
import { consultarCosta, todasLasPlayas } from "../services/consultaCostaService";
import {
  consultarPorTramo,
  consultarPuntoPesca,
  todosLosTramos,
  type ConsultaPesca,
} from "../services/consultaPescaService";
import {
  calcularIndicePesca,
  CATEGORIA_INFO,
  type IndicePescaDia,
} from "../services/fishingIndexService";
import { distanciaKm } from "../services/geoService";
import { listarWaypointsMarinos } from "../services/navegacionEmbarcacionService";
import { obtenerPuntosGuardados } from "../services/storageService";

export type OrigenCandidatoCerca =
  | "tramo"
  | "playa"
  | "rampa"
  | "waypoint"
  | "punto"
  | "facil";

export type CandidatoCerca = {
  id: string;
  nombre: string;
  lat: number;
  lng: number;
  distanciaKm: number;
  origen: OrigenCandidatoCerca;
};

export type FilaCercaMejorPinta = CandidatoCerca & {
  puntuacion: number;
  etiqueta: string;
  color: string;
  fondo: string;
  alerta: boolean;
};

const RADIO_KM: Record<ModoPescaGlobal, number> = {
  rio: 15,
  orilla: 12,
  barco: 18,
};

/** Cuántos más cercanos puntuamos (red); luego nos quedamos con top 3. */
const MAX_A_PUNTUAR = 6;
const TOP_N = 3;
/** Excluir el propio toque / casi mismo punto. */
const EXCLUIR_KM = 0.35;

function claveCoord(lat: number, lng: number): string {
  return `${lat.toFixed(3)},${lng.toFixed(3)}`;
}

function radioDe(modo: ModoPescaGlobal): number {
  return RADIO_KM[modo];
}

/** Cotos sí (con permiso); vedados / reservas / HOY NO / fuera de catálogo no. */
function esPescableHoy(c: ConsultaPesca): boolean {
  if (c.veredicto === "vedado" || c.veredicto === "reserva_trucha") return false;
  if (c.veredicto === "fuera_catalogo") return false;
  if (c.veredicto === "coto") return true;
  return c.sePuedePescarHoy;
}

function pasaFiltroLegal(
  modo: ModoPescaGlobal,
  origen: OrigenCandidatoCerca,
  lat: number,
  lng: number,
  tramoId?: string
): boolean {
  try {
    if (origen === "tramo") {
      const t = todosLosTramos().find((x) => x.id === tramoId);
      if (!t) return false;
      if (t.aprovechamiento === "VP" || t.aprovechamiento === "ZRTC") return false;
      return esPescableHoy(consultarPorTramo(t));
    }
    if (origen === "playa") return esPescableHoy(consultarCosta(lat, lng));
    if (origen === "rampa" || origen === "waypoint") {
      return esPescableHoy(consultarEmbarcacion(lat, lng));
    }
    if (modo === "rio") return esPescableHoy(consultarPuntoPesca(lat, lng));
    if (modo === "orilla") return esPescableHoy(consultarCosta(lat, lng));
    return esPescableHoy(consultarEmbarcacion(lat, lng));
  } catch {
    return false;
  }
}

/** Pool sync (catálogo). Waypoints / puntos se añaden aparte (async). */
export function listarCandidatosCercaSync(opts: {
  lat: number;
  lng: number;
  modo: ModoPescaGlobal;
  radioKm?: number;
}): CandidatoCerca[] {
  const radio = opts.radioKm ?? radioDe(opts.modo);
  const provincia = getProvinciaActiva();
  const origenKey = claveCoord(opts.lat, opts.lng);
  const vistos = new Set<string>([origenKey]);
  const out: CandidatoCerca[] = [];

  function push(
    id: string,
    nombre: string,
    lat: number,
    lng: number,
    origen: OrigenCandidatoCerca,
    tramoId?: string
  ) {
    const key = claveCoord(lat, lng);
    if (vistos.has(key)) return;
    const d = distanciaKm(opts.lat, opts.lng, lat, lng);
    if (d < EXCLUIR_KM || d > radio) return;
    if (!pasaFiltroLegal(opts.modo, origen, lat, lng, tramoId)) return;
    vistos.add(key);
    out.push({ id, nombre, lat, lng, distanciaKm: d, origen });
  }

  if (opts.modo === "rio") {
    for (const t of todosLosTramos()) {
      push(`tramo:${t.id}`, t.nombre, t.lat, t.lng, "tramo", t.id);
    }
    for (const s of sitiosFacilesDe(provincia.id as ProvinciaId)) {
      if (s.ambito !== "continental") continue;
      push(`facil:${s.id}`, s.nombre, s.lat, s.lng, "facil");
    }
  } else if (opts.modo === "orilla") {
    for (const p of todasLasPlayas()) {
      if (p.vedaOrilla) continue;
      push(`playa:${p.id}`, p.nombre, p.lat, p.lng, "playa");
    }
    for (const s of sitiosFacilesDe(provincia.id as ProvinciaId)) {
      if (s.ambito !== "maritimo") continue;
      push(`facil:${s.id}`, s.nombre, s.lat, s.lng, "facil");
    }
  } else {
    for (const r of todasLasRampas()) {
      push(`rampa:${r.id}`, r.nombre, r.lat, r.lng, "rampa");
    }
  }

  return out.sort((a, b) => a.distanciaKm - b.distanciaKm);
}

async function candidatosConPersonales(opts: {
  lat: number;
  lng: number;
  modo: ModoPescaGlobal;
}): Promise<CandidatoCerca[]> {
  const radio = radioDe(opts.modo);
  const base = listarCandidatosCercaSync(opts);
  const vistos = new Set(base.map((c) => claveCoord(c.lat, c.lng)));
  vistos.add(claveCoord(opts.lat, opts.lng));
  const extra: CandidatoCerca[] = [];

  try {
    const puntos = await obtenerPuntosGuardados();
    for (const p of puntos) {
      const key = claveCoord(p.lat, p.lng);
      if (vistos.has(key)) continue;
      const d = distanciaKm(opts.lat, opts.lng, p.lat, p.lng);
      if (d < EXCLUIR_KM || d > radio) continue;
      if (!pasaFiltroLegal(opts.modo, "punto", p.lat, p.lng)) continue;
      vistos.add(key);
      extra.push({
        id: `pto:${p.id}`,
        nombre: p.nombre,
        lat: p.lat,
        lng: p.lng,
        distanciaKm: d,
        origen: "punto",
      });
    }
  } catch {
    /* ignore storage */
  }

  if (opts.modo === "barco") {
    try {
      const wps = await listarWaypointsMarinos();
      for (const w of wps) {
        const key = claveCoord(w.lat, w.lng);
        if (vistos.has(key)) continue;
        const d = distanciaKm(opts.lat, opts.lng, w.lat, w.lng);
        if (d < EXCLUIR_KM || d > radio) continue;
        if (!pasaFiltroLegal(opts.modo, "waypoint", w.lat, w.lng)) continue;
        vistos.add(key);
        extra.push({
          id: `wp:${w.id}`,
          nombre: w.nombre,
          lat: w.lat,
          lng: w.lng,
          distanciaKm: d,
          origen: "waypoint",
        });
      }
    } catch {
      /* ignore */
    }
  }

  return [...base, ...extra].sort((a, b) => a.distanciaKm - b.distanciaKm);
}

function filaDesdePesca(c: CandidatoCerca, dia: IndicePescaDia): FilaCercaMejorPinta {
  const cat = CATEGORIA_INFO[dia.categoria];
  return {
    ...c,
    puntuacion: dia.puntuacion,
    etiqueta: cat.texto,
    color: cat.color,
    fondo: cat.fondo,
    alerta: dia.categoria === "mala",
  };
}

function filaDesdeBarco(c: CandidatoCerca, ind: IndiceBarco): FilaCercaMejorPinta {
  const cat = CATEGORIA_BARCO_INFO[ind.categoria];
  return {
    ...c,
    puntuacion: ind.puntuacion,
    etiqueta: cat.texto,
    color: cat.color,
    fondo: cat.fondo,
    alerta: ind.alertaSalida,
  };
}

/**
 * Top 3 cercanos con mejor pinta hoy según modo.
 * Devuelve null si no hay candidatos o falla la meteo.
 */
export async function rankearCercaMejorPinta(opts: {
  lat: number;
  lng: number;
  modo: ModoPescaGlobal;
  topN?: number;
}): Promise<FilaCercaMejorPinta[] | null> {
  const topN = opts.topN ?? TOP_N;
  const candidatos = await candidatosConPersonales(opts);
  if (candidatos.length === 0) return null;

  const aPuntuar = candidatos.slice(0, MAX_A_PUNTUAR);

  if (opts.modo === "barco") {
    const resultados = await Promise.all(
      aPuntuar.map(async (c) => {
        try {
          const ind = await calcularIndiceBarco(c.lat, c.lng);
          return filaDesdeBarco(c, ind);
        } catch {
          return null;
        }
      })
    );
    const filas = resultados.filter((f): f is FilaCercaMejorPinta => !!f);
    if (filas.length === 0) return null;
    filas.sort((a, b) => b.puntuacion - a.puntuacion || a.distanciaKm - b.distanciaKm);
    return filas.slice(0, topN);
  }

  const resultados = await Promise.all(
    aPuntuar.map(async (c) => {
      try {
        const dias = await calcularIndicePesca(c.lat, c.lng, 1);
        const dia = dias[0];
        return dia ? filaDesdePesca(c, dia) : null;
      } catch {
        return null;
      }
    })
  );
  const filas = resultados.filter((f): f is FilaCercaMejorPinta => !!f);
  if (filas.length === 0) return null;
  filas.sort((a, b) => b.puntuacion - a.puntuacion || a.distanciaKm - b.distanciaKm);
  return filas.slice(0, topN);
}

export function formatearDistanciaKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(km < 10 ? 1 : 0)} km`;
}
