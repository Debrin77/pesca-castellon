import { calcularIndicePesca, CATEGORIA_INFO, IndicePescaDia } from "../services/fishingIndexService";
import type { FavoritoZona, PuntoGuardado } from "../services/storageService";

export type CandidatoRecomendacion = {
  id: string;
  nombre: string;
  lat: number;
  lng: number;
  tipo: "favorito" | "punto" | "actual";
  zoneId?: string;
};

export type RecomendacionHoy = {
  candidato: CandidatoRecomendacion;
  dia: IndicePescaDia;
  motivo: string;
};

function motivoDe(dia: IndicePescaDia, nombre: string): string {
  const cat = CATEGORIA_INFO[dia.categoria];
  const luna = dia.iconoLuna ? ` · ${dia.iconoLuna}` : "";
  return `${cat.texto} (${dia.puntuacion})${luna} · ${nombre}`;
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
