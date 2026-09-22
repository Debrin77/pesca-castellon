/**
 * Top sitios hoy para una especie: presencia en catálogo + índice del día.
 * Continental (zonas/tramos) y orilla (playas). Barco: sin catálogo por punto —
 * devolvemos nota honesta + rampas por índice de salida (no predice picada).
 */
import type { ModoPescaGlobal } from "../data/modoPesca";
import { boostHabitatEspecie, resumenHabitat } from "../data/habitat";
import { getProvinciaActiva } from "../provincias/runtime";
import {
  calcularIndiceBarco,
  CATEGORIA_BARCO_INFO,
} from "../services/boatIndexService";
import { todasLasPlayas } from "../services/consultaCostaService";
import { todasLasRampas } from "../services/consultaEmbarcacionService";
import {
  consultarPuntoPesca,
  todosLosTramos,
} from "../services/consultaPescaService";
import {
  calcularIndicePesca,
  CATEGORIA_INFO,
} from "../services/fishingIndexService";
import { distanciaKm } from "../services/geoService";
import { habitatDeCandidatoId, habitatDePlaya, habitatDeZona } from "../services/habitatService";

export type SitioEspecieHoy = {
  id: string;
  nombre: string;
  lat: number;
  lng: number;
  puntuacion: number;
  etiqueta: string;
  color: string;
  fondo: string;
  iconoLuna?: string;
  distanciaKm: number;
  /** zoneId de ficha si existe en provincia.zones */
  zoneId?: string;
  origen: "zona" | "tramo" | "playa" | "rampa";
  motivo: string;
  /** Resumen corto de hábitat (tags/profundidad) si hay enriquecimiento. */
  habitatResumen?: string;
};

export type PackSitiosEspecie = {
  modo: ModoPescaGlobal;
  especieId: string;
  filas: SitioEspecieHoy[];
  /**
   * Barco (u orilla sin playas etiquetadas): el ranking no es por presencia
   * de la especie en el punto, sino por índice genérico / salida.
   */
  orientativoSinCatalogo: boolean;
  aviso?: string;
};

const TOP_N = 3;
/** Cuántos candidatos puntuamos con meteo (API). */
const MAX_A_PUNTUAR = 8;

/** Soft boost: tipo de masa de agua habitual para la especie (continental). */
const PREF_TIPO: Record<string, Array<"embalse" | "rio">> = {
  carpin: ["embalse"],
  carpa: ["embalse"],
  black_bass: ["embalse"],
  lucio: ["embalse"],
  siluro: ["embalse", "rio"],
  alburno: ["embalse", "rio"],
  barbo_gitano: ["rio"],
  trucha_comun: ["rio"],
};

function pescableHoy(veredicto: string, sePuede: boolean): boolean {
  if (veredicto === "vedado" || veredicto === "reserva_trucha" || veredicto === "fuera_catalogo") {
    return false;
  }
  if (veredicto === "coto") return true;
  return sePuede;
}

function boostTipo(especieId: string, tipo?: string): number {
  if (!tipo) return 0;
  const normalizado =
    tipo === "embalse"
      ? "embalse"
      : tipo.startsWith("rio") || tipo === "mixto"
        ? "rio"
        : null;
  if (!normalizado) return 0;
  const prefs = PREF_TIPO[especieId];
  if (!prefs) return 0;
  return prefs.includes(normalizado) ? 4 : 0;
}

type Candidato = {
  id: string;
  nombre: string;
  lat: number;
  lng: number;
  origen: SitioEspecieHoy["origen"];
  zoneId?: string;
  tipo?: string;
  playaId?: string;
};

function dedupe(cands: Candidato[]): Candidato[] {
  const vistos = new Set<string>();
  const out: Candidato[] = [];
  for (const c of cands) {
    const key = `${c.lat.toFixed(3)},${c.lng.toFixed(3)}`;
    if (vistos.has(key)) continue;
    vistos.add(key);
    out.push(c);
  }
  return out;
}

function candidatosContinental(especieId: string): Candidato[] {
  const provincia = getProvinciaActiva();
  const zonas = (provincia.zones as {
    id: string;
    nombre: string;
    lat?: number;
    lng?: number;
    especies?: string[];
    estadoZona?: string;
    tipo?: string;
  }[]) ?? [];
  const out: Candidato[] = [];

  for (const z of zonas) {
    if (!z.especies?.includes(especieId)) continue;
    if (z.estadoZona === "vedada" || z.estadoZona === "reserva") continue;
    if (z.lat == null || z.lng == null) continue;
    out.push({
      id: `zona:${z.id}`,
      nombre: z.nombre,
      lat: z.lat,
      lng: z.lng,
      origen: "zona",
      zoneId: z.id,
      tipo: z.tipo,
    });
  }

  for (const t of todosLosTramos()) {
    if (!t.especies?.includes(especieId)) continue;
    try {
      const c = consultarPuntoPesca(t.lat, t.lng);
      if (!pescableHoy(c.veredicto, c.sePuedePescarHoy)) continue;
    } catch {
      continue;
    }
    out.push({
      id: `tramo:${t.id}`,
      nombre: t.nombre,
      lat: t.lat,
      lng: t.lng,
      origen: "tramo",
      zoneId: t.fichaId ?? undefined,
    });
  }

  return dedupe(out);
}

function candidatosOrilla(especieId: string): Candidato[] {
  const out: Candidato[] = [];
  for (const p of todasLasPlayas()) {
    if (p.vedaOrilla) continue;
    if (!p.especiesIds?.includes(especieId)) continue;
    out.push({
      id: `playa:${p.id}`,
      nombre: p.nombre,
      lat: p.lat,
      lng: p.lng,
      origen: "playa",
      playaId: p.id,
    });
  }
  return dedupe(out);
}

function candidatosRampas(): Candidato[] {
  return todasLasRampas().map((r) => ({
    id: `rampa:${r.id}`,
    nombre: r.nombre,
    lat: r.lat,
    lng: r.lng,
    origen: "rampa" as const,
  }));
}

async function puntuarPesca(
  c: Candidato,
  ancla: { lat: number; lng: number },
  especieId: string
): Promise<SitioEspecieHoy | null> {
  try {
    const dias = await calcularIndicePesca(c.lat, c.lng, 1);
    const dia = dias[0];
    if (!dia) return null;
    const cat = CATEGORIA_INFO[dia.categoria];
    const bonusTipo = boostTipo(especieId, c.tipo);
    const habitat =
      (c.zoneId ? habitatDeZona(c.zoneId) : null) ||
      (c.playaId ? habitatDePlaya(c.playaId) : null) ||
      habitatDeCandidatoId(c.id);
    const bonusHabitat = boostHabitatEspecie(especieId, habitat);
    const puntuacion = Math.min(100, dia.puntuacion + bonusTipo + bonusHabitat);
    const partesMotivo: string[] = [cat.texto];
    if (bonusHabitat) partesMotivo.push(`hábitat +${bonusHabitat}`);
    else if (bonusTipo) partesMotivo.push(`tipo +${bonusTipo}`);
    else partesMotivo.push("pulso del día");
    return {
      id: c.id,
      nombre: c.nombre,
      lat: c.lat,
      lng: c.lng,
      puntuacion,
      etiqueta: cat.texto,
      color: cat.color,
      fondo: cat.fondo,
      iconoLuna: dia.iconoLuna,
      distanciaKm: distanciaKm(ancla.lat, ancla.lng, c.lat, c.lng),
      zoneId: c.zoneId,
      origen: c.origen,
      motivo: partesMotivo.join(" · "),
      habitatResumen: resumenHabitat(habitat) ?? undefined,
    };
  } catch {
    return null;
  }
}

async function puntuarBarco(
  c: Candidato,
  ancla: { lat: number; lng: number }
): Promise<SitioEspecieHoy | null> {
  try {
    const ind = await calcularIndiceBarco(c.lat, c.lng);
    const cat = CATEGORIA_BARCO_INFO[ind.categoria];
    return {
      id: c.id,
      nombre: c.nombre,
      lat: c.lat,
      lng: c.lng,
      puntuacion: ind.puntuacion,
      etiqueta: cat.texto,
      color: cat.color,
      fondo: cat.fondo,
      distanciaKm: distanciaKm(ancla.lat, ancla.lng, c.lat, c.lng),
      origen: c.origen,
      motivo: "Índice de salida (oleaje/viento) · no predice picada",
    };
  } catch {
    return null;
  }
}

/**
 * Top 3 sitios donde consta la especie, ordenados por pulso del día (+ hábitat).
 */
export async function elegirTopSitiosPorEspecie(opts: {
  especieId: string;
  modo: ModoPescaGlobal;
  ancla: { lat: number; lng: number };
  topN?: number;
}): Promise<PackSitiosEspecie> {
  const topN = opts.topN ?? TOP_N;
  const { especieId, modo, ancla } = opts;

  if (modo === "barco") {
    const rampas = candidatosRampas()
      .map((c) => ({
        ...c,
        d: distanciaKm(ancla.lat, ancla.lng, c.lat, c.lng),
      }))
      .sort((a, b) => a.d - b.d)
      .slice(0, MAX_A_PUNTUAR);
    const puntuados = await Promise.all(rampas.map((c) => puntuarBarco(c, ancla)));
    const filas = puntuados
      .filter((f): f is SitioEspecieHoy => !!f)
      .sort((a, b) => b.puntuacion - a.puntuacion || a.distanciaKm - b.distanciaKm)
      .slice(0, topN);
    return {
      modo,
      especieId,
      filas,
      orientativoSinCatalogo: true,
      aviso:
        "Barco: no hay catálogo de especies por punto. Rampas por índice de salida (oleaje/viento), no por picada esperada.",
    };
  }

  const crudos =
    modo === "orilla" ? candidatosOrilla(especieId) : candidatosContinental(especieId);

  if (crudos.length === 0) {
    return {
      modo,
      especieId,
      filas: [],
      orientativoSinCatalogo: false,
      aviso:
        modo === "orilla"
          ? "Ninguna playa del catálogo lista esta especie."
          : "Ninguna zona de la provincia lista esta especie.",
    };
  }

  const ordenados = crudos
    .map((c) => {
      const habitat =
        (c.zoneId ? habitatDeZona(c.zoneId) : null) ||
        (c.playaId ? habitatDePlaya(c.playaId) : null) ||
        habitatDeCandidatoId(c.id);
      return {
        ...c,
        d: distanciaKm(ancla.lat, ancla.lng, c.lat, c.lng),
        pref: boostTipo(especieId, c.tipo) + boostHabitatEspecie(especieId, habitat),
      };
    })
    // Preferir hábitat afin + cercanía antes de gastar llamadas de meteo.
    .sort((a, b) => b.pref - a.pref || a.d - b.d)
    .slice(0, MAX_A_PUNTUAR);

  const puntuados = await Promise.all(
    ordenados.map((c) => puntuarPesca(c, ancla, especieId))
  );
  const filas = puntuados
    .filter((f): f is SitioEspecieHoy => !!f)
    .sort((a, b) => b.puntuacion - a.puntuacion || a.distanciaKm - b.distanciaKm)
    .slice(0, topN);

  return {
    modo,
    especieId,
    filas,
    orientativoSinCatalogo: false,
  };
}
