import AsyncStorage from "@react-native-async-storage/async-storage";
import { getProvinciaIdActiva } from "../provincias/runtime";
import type { ProvinciaId } from "../provincias/types";
import { resolverPoblacionCercana } from "./poblacionCercanaService";

export type FuentePuntoConsulta = "mapa" | "gps" | "zona" | "centro";

export interface PuntoConsulta {
  lat: number;
  lng: number;
  fuente: FuentePuntoConsulta;
  /** Nombre del tramo / playa / consulta. */
  etiqueta?: string;
  /** Municipio/población de referencia de la predicción. */
  poblacion?: string;
  provinciaId: ProvinciaId;
  actualizadoEn: string;
}

function clave(provinciaId?: ProvinciaId): string {
  const id = provinciaId ?? getProvinciaIdActiva();
  return `@pesca_app/${id}/punto_consulta`;
}

export async function leerPuntoConsulta(provinciaId?: ProvinciaId): Promise<PuntoConsulta | null> {
  try {
    const raw = await AsyncStorage.getItem(clave(provinciaId));
    if (!raw) return null;
    const p = JSON.parse(raw) as PuntoConsulta;
    if (typeof p?.lat !== "number" || typeof p?.lng !== "number") return null;
    const id = provinciaId ?? getProvinciaIdActiva();
    if (p.provinciaId && p.provinciaId !== id) return null;
    // Migración: puntos guardados antes de tener población.
    if (!p.poblacion && (p.fuente === "mapa" || p.fuente === "zona" || p.fuente === "centro")) {
      const r = resolverPoblacionCercana(p.lat, p.lng, 35, id);
      if (r) p.poblacion = r.nombre;
    }
    return p;
  } catch {
    return null;
  }
}

export async function guardarPuntoConsulta(
  punto: Omit<PuntoConsulta, "actualizadoEn" | "provinciaId"> & { provinciaId?: ProvinciaId }
): Promise<PuntoConsulta> {
  const provinciaId = punto.provinciaId ?? getProvinciaIdActiva();
  let poblacion = punto.poblacion;
  if (!poblacion && punto.fuente !== "gps") {
    poblacion = resolverPoblacionCercana(punto.lat, punto.lng, 35, provinciaId)?.nombre;
  }
  const full: PuntoConsulta = {
    lat: punto.lat,
    lng: punto.lng,
    fuente: punto.fuente,
    etiqueta: punto.etiqueta,
    poblacion,
    provinciaId,
    actualizadoEn: new Date().toISOString(),
  };
  await AsyncStorage.setItem(clave(provinciaId), JSON.stringify(full));
  return full;
}

export async function borrarPuntoConsulta(provinciaId?: ProvinciaId): Promise<void> {
  await AsyncStorage.removeItem(clave(provinciaId));
}

export function etiquetaFuente(fuente: FuentePuntoConsulta): string {
  if (fuente === "mapa" || fuente === "zona") return "Punto del mapa";
  if (fuente === "gps") return "Tu ubicación";
  return "Centro de la provincia";
}

/** Texto claro para cabecera de previsión. */
export function textoOrigenPrevision(args: {
  fuente: FuentePuntoConsulta;
  etiqueta?: string;
  poblacion?: string;
  lat: number;
  lng: number;
}): string {
  const coords = `${args.lat.toFixed(3)}, ${args.lng.toFixed(3)}`;
  if (args.fuente === "gps") {
    return `Tu ubicación GPS · ${coords}`;
  }
  const fuente = etiquetaFuente(args.fuente);
  if (args.poblacion) {
    return `${fuente} · Predicción para ${args.poblacion} · ${coords}`;
  }
  return `${fuente} · ${coords}. Toca un tramo en el mapa para cambiar el punto.`;
}
