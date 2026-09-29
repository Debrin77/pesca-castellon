/**
 * Nombre de sitio al guardar un punto: siempre el del mapa/catálogo,
 * nunca una fecha automática («Punto del 26/08/2026» / «26/08/2026»).
 */
import { consultarToqueMapa } from "./consultaCostaService";
import { esNombrePuntoSoloFecha } from "./fechaCapturaUtils";
import { formatearCoords } from "./coordsUtils";

function limpiarTituloMapa(titulo: string): string {
  const t = titulo.trim();
  if (!t) return "";
  if (/^Sin tramo/i.test(t)) return "";
  if (/^fuera de catálogo/i.test(t)) return "";
  const partes = t
    .split("·")
    .map((p) => p.trim())
    .filter(Boolean);
  // Preferir la parte más específica (después del ·), p. ej. «Aguas libres · Guadalquivir…»
  const candidato = partes[partes.length - 1] || t;
  if (esNombrePuntoSoloFecha(candidato)) return "";
  // Evitar títulos legales largos sin toponimia útil
  if (candidato.length > 60) return candidato.slice(0, 57).trimEnd() + "…";
  return candidato;
}

/** Nombre de lugar según mapa en unas coordenadas. */
export function nombreSitioDesdeCoords(lat: number, lng: number): string {
  try {
    const c = consultarToqueMapa(lat, lng);
    const tramo = c.tramo?.nombre?.trim();
    if (tramo && !esNombrePuntoSoloFecha(tramo)) return limpiarTituloMapa(tramo) || tramo;
    return limpiarTituloMapa(c.titulo || "");
  } catch {
    return "";
  }
}

/** Texto en chips/listas: nunca muestra una fecha cruda como nombre. */
export function etiquetaPuntoEnUi(p: { nombre: string; lat: number; lng: number }): string {
  if (!esNombrePuntoSoloFecha(p.nombre)) return p.nombre;
  return nombreSitioDesdeCoords(p.lat, p.lng) || "Sitio sin nombre";
}

/** Valor inicial del campo editable al registrar captura en un punto. */
export function nombreInicialEdicionCaptura(p: { nombre: string; lat: number; lng: number }): string {
  if (esNombrePuntoSoloFecha(p.nombre)) {
    return nombreSitioDesdeCoords(p.lat, p.lng);
  }
  return p.nombre;
}

export function esNombreSitioEditableValido(nombre: string): boolean {
  const n = nombre.trim();
  if (!n) return false;
  if (esNombrePuntoSoloFecha(n)) return false;
  if (/^Punto del\s+/i.test(n)) return false;
  return true;
}

/**
 * Nombre definitivo al guardar un punto.
 * Prioridad: sugerido usable → mapa → coords (nunca fecha).
 */
export function nombreParaPuntoGuardado(opts: {
  lat: number;
  lng: number;
  sugerido?: string | null;
}): string {
  const sug = opts.sugerido?.trim() || "";
  if (sug && !esNombrePuntoSoloFecha(sug) && !/^Punto del\s+/i.test(sug)) {
    const limpio = limpiarTituloMapa(sug) || sug;
    if (limpio && !esNombrePuntoSoloFecha(limpio)) return limpio;
  }
  const mapa = nombreSitioDesdeCoords(opts.lat, opts.lng);
  if (mapa) return mapa;
  return `Sitio ${formatearCoords(opts.lat, opts.lng)}`;
}
