import { etiquetaModo, type ModoPescaGlobal } from "../data/modoPesca";
import {
  calcularIndiceBarco,
  CATEGORIA_BARCO_INFO,
} from "../services/boatIndexService";
import { consultarCosta } from "../services/consultaCostaService";
import { consultarEmbarcacion } from "../services/consultaEmbarcacionService";
import { consultarPuntoPesca } from "../services/consultaPescaService";
import {
  calcularIndicePesca,
  CATEGORIA_INFO,
  type IndicePescaDia,
} from "../services/fishingIndexService";
import type { FavoritoZona, PuntoGuardado } from "../services/storageService";
import { rankearCercaMejorPinta } from "./cercaMejorPinta";

export type CandidatoRecomendacion = {
  id: string;
  nombre: string;
  lat: number;
  lng: number;
  tipo: "favorito" | "punto" | "actual" | "catalogo";
  zoneId?: string;
};

/** Recomendación clásica (un sitio) — provincias de un solo modo. */
export type RecomendacionHoy = {
  candidato: CandidatoRecomendacion;
  dia: IndicePescaDia;
  motivo: string;
};

/** Mejor sitio de una modalidad (río / orilla / barco). */
export type RecomendacionModoHoy = {
  modo: ModoPescaGlobal;
  candidato: CandidatoRecomendacion;
  puntuacion: number;
  etiqueta: string;
  color: string;
  fondo: string;
  iconoLuna?: string;
  motivo: string;
};

export type RecomendacionHoyPack = {
  /** La modalidad con mejor puntuación hoy (CTA principal). */
  destacada: RecomendacionModoHoy | null;
  /** Una fila por modalidad disponible (2+ modos). */
  porModo: RecomendacionModoHoy[];
};

function motivoDe(dia: IndicePescaDia, nombre: string): string {
  const cat = CATEGORIA_INFO[dia.categoria];
  const luna = dia.iconoLuna ? ` · ${dia.iconoLuna}` : "";
  return `${cat.texto} (${dia.puntuacion})${luna} · ${nombre}`;
}

function pescableHoy(veredicto: string, sePuede: boolean): boolean {
  if (veredicto === "vedado" || veredicto === "reserva_trucha" || veredicto === "fuera_catalogo") {
    return false;
  }
  if (veredicto === "coto") return true;
  return sePuede;
}

/** ¿Este punto encaja legalmente en la modalidad? */
function sitioEncajaModo(modo: ModoPescaGlobal, lat: number, lng: number): boolean {
  try {
    if (modo === "rio") {
      const c = consultarPuntoPesca(lat, lng);
      if (c.ambito === "maritimo") return false;
      return pescableHoy(c.veredicto, c.sePuedePescarHoy);
    }
    if (modo === "orilla") {
      const c = consultarCosta(lat, lng);
      return pescableHoy(c.veredicto, c.sePuedePescarHoy);
    }
    const c = consultarEmbarcacion(lat, lng);
    return pescableHoy(c.veredicto, c.sePuedePescarHoy);
  } catch {
    return false;
  }
}

function recolectarCandidatosUsuario(opts: {
  favoritos: FavoritoZona[];
  puntos: PuntoGuardado[];
  actual?: { lat: number; lng: number; nombre: string } | null;
  coordsFavorito: (zonaId: string) => { lat: number; lng: number } | null;
  modo: ModoPescaGlobal;
  max: number;
}): CandidatoRecomendacion[] {
  const vistos = new Set<string>();
  const out: CandidatoRecomendacion[] = [];

  function push(c: CandidatoRecomendacion) {
    if (out.length >= opts.max) return;
    const key = `${c.lat.toFixed(3)},${c.lng.toFixed(3)}`;
    if (vistos.has(key)) return;
    if (!sitioEncajaModo(opts.modo, c.lat, c.lng)) return;
    vistos.add(key);
    out.push(c);
  }

  for (const f of opts.favoritos) {
    const coords = opts.coordsFavorito(f.zonaId);
    if (!coords) continue;
    push({
      id: `fav:${f.zonaId}`,
      nombre: f.nombre,
      lat: coords.lat,
      lng: coords.lng,
      tipo: "favorito",
      zoneId: f.zonaId,
    });
  }
  for (const p of opts.puntos) {
    push({
      id: `pto:${p.id}`,
      nombre: p.nombre,
      lat: p.lat,
      lng: p.lng,
      tipo: "punto",
    });
  }
  if (opts.actual) {
    push({
      id: "actual",
      nombre: opts.actual.nombre,
      lat: opts.actual.lat,
      lng: opts.actual.lng,
      tipo: "actual",
    });
  }
  return out;
}

async function puntuarCandidato(
  modo: ModoPescaGlobal,
  c: CandidatoRecomendacion
): Promise<RecomendacionModoHoy | null> {
  try {
    if (modo === "barco") {
      const ind = await calcularIndiceBarco(c.lat, c.lng);
      const cat = CATEGORIA_BARCO_INFO[ind.categoria];
      return {
        modo,
        candidato: c,
        puntuacion: ind.puntuacion,
        etiqueta: cat.texto,
        color: cat.color,
        fondo: cat.fondo,
        motivo: `${etiquetaModo(modo)} · ${cat.texto} (${ind.puntuacion}) · ${c.nombre}`,
      };
    }
    const dias = await calcularIndicePesca(c.lat, c.lng, 1);
    const dia = dias[0];
    if (!dia) return null;
    const cat = CATEGORIA_INFO[dia.categoria];
    return {
      modo,
      candidato: c,
      puntuacion: dia.puntuacion,
      etiqueta: cat.texto,
      color: cat.color,
      fondo: cat.fondo,
      iconoLuna: dia.iconoLuna,
      motivo: `${etiquetaModo(modo)} · ${motivoDe(dia, c.nombre)}`,
    };
  } catch {
    return null;
  }
}

async function mejorDeLista(
  modo: ModoPescaGlobal,
  candidatos: CandidatoRecomendacion[]
): Promise<RecomendacionModoHoy | null> {
  if (candidatos.length === 0) return null;
  const resultados = await Promise.all(candidatos.map((c) => puntuarCandidato(modo, c)));
  let mejor: RecomendacionModoHoy | null = null;
  for (const r of resultados) {
    if (!r) continue;
    if (!mejor || r.puntuacion > mejor.puntuacion) mejor = r;
  }
  return mejor;
}

/**
 * Mejor sitio por modalidad (río / orilla / barco) + destacada global.
 * Usa sitios del usuario que encajan en cada modo; si faltan, el catálogo cercano al ancla.
 */
export async function elegirRecomendacionesHoyPack(opts: {
  modos: ModoPescaGlobal[];
  favoritos: FavoritoZona[];
  puntos: PuntoGuardado[];
  actual?: { lat: number; lng: number; nombre: string } | null;
  coordsFavorito: (zonaId: string) => { lat: number; lng: number } | null;
  /** Centro provincia o GPS: ancla del catálogo cercano. */
  ancla: { lat: number; lng: number };
}): Promise<RecomendacionHoyPack> {
  const porModo: RecomendacionModoHoy[] = [];

  for (const modo of opts.modos) {
    const propios = recolectarCandidatosUsuario({
      favoritos: opts.favoritos,
      puntos: opts.puntos,
      actual: opts.actual,
      coordsFavorito: opts.coordsFavorito,
      modo,
      max: 5,
    });
    let mejor = await mejorDeLista(modo, propios);

    // Catálogo cercano si no hay sitios propios (o para contrastar).
    try {
      const filas = await rankearCercaMejorPinta({
        lat: opts.ancla.lat,
        lng: opts.ancla.lng,
        modo,
        topN: 1,
      });
      const top = filas?.[0];
      if (top) {
        const desdeCatalogo: RecomendacionModoHoy = {
          modo,
          candidato: {
            id: top.id,
            nombre: top.nombre,
            lat: top.lat,
            lng: top.lng,
            tipo: "catalogo",
          },
          puntuacion: top.puntuacion,
          etiqueta: top.etiqueta,
          color: top.color,
          fondo: top.fondo,
          motivo: `${etiquetaModo(modo)} · ${top.etiqueta} (${top.puntuacion}) · ${top.nombre}`,
        };
        if (!mejor || desdeCatalogo.puntuacion > mejor.puntuacion) {
          mejor = desdeCatalogo;
        }
      }
    } catch {
      /* catálogo opcional */
    }

    if (mejor) porModo.push(mejor);
  }

  let destacada: RecomendacionModoHoy | null = null;
  for (const r of porModo) {
    if (!destacada || r.puntuacion > destacada.puntuacion) destacada = r;
  }
  return { destacada, porModo };
}

/** Elige el sitio con mejor índice entre favoritos, puntos y el punto actual. */
export async function elegirRecomendacionHoy(opts: {
  favoritos: FavoritoZona[];
  puntos: PuntoGuardado[];
  actual?: { lat: number; lng: number; nombre: string } | null;
  coordsFavorito: (zonaId: string) => { lat: number; lng: number } | null;
  maxCandidatos?: number;
}): Promise<RecomendacionHoy | null> {
  const max = opts.maxCandidatos ?? 5;
  const vistos = new Set<string>();
  const candidatos: CandidatoRecomendacion[] = [];

  for (const f of opts.favoritos) {
    if (candidatos.length >= max) break;
    const c = opts.coordsFavorito(f.zonaId);
    if (!c) continue;
    const key = `${c.lat.toFixed(3)},${c.lng.toFixed(3)}`;
    if (vistos.has(key)) continue;
    vistos.add(key);
    candidatos.push({
      id: `fav:${f.zonaId}`,
      nombre: f.nombre,
      lat: c.lat,
      lng: c.lng,
      tipo: "favorito",
      zoneId: f.zonaId,
    });
  }

  for (const p of opts.puntos) {
    if (candidatos.length >= max) break;
    const key = `${p.lat.toFixed(3)},${p.lng.toFixed(3)}`;
    if (vistos.has(key)) continue;
    vistos.add(key);
    candidatos.push({
      id: `pto:${p.id}`,
      nombre: p.nombre,
      lat: p.lat,
      lng: p.lng,
      tipo: "punto",
    });
  }

  if (opts.actual && candidatos.length < max) {
    const key = `${opts.actual.lat.toFixed(3)},${opts.actual.lng.toFixed(3)}`;
    if (!vistos.has(key)) {
      candidatos.push({
        id: "actual",
        nombre: opts.actual.nombre,
        lat: opts.actual.lat,
        lng: opts.actual.lng,
        tipo: "actual",
      });
    }
  }

  if (candidatos.length === 0) return null;

  const resultados = await Promise.all(
    candidatos.map(async (c) => {
      const dias = await calcularIndicePesca(c.lat, c.lng, 1);
      const dia = dias[0] ?? null;
      return dia ? { candidato: c, dia } : null;
    })
  );

  let mejor: { candidato: CandidatoRecomendacion; dia: IndicePescaDia } | null = null;
  for (const r of resultados) {
    if (!r) continue;
    if (!mejor || r.dia.puntuacion > mejor.dia.puntuacion) mejor = r;
  }
  if (!mejor) return null;
  return { ...mejor, motivo: motivoDe(mejor.dia, mejor.candidato.nombre) };
}
