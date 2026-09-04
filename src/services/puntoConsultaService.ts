import AsyncStorage from "@react-native-async-storage/async-storage";
import { getProvinciaIdActiva } from "../provincias/runtime";
import type { ProvinciaId } from "../provincias/types";

export type FuentePuntoConsulta = "mapa" | "gps" | "zona" | "centro";

export interface PuntoConsulta {
  lat: number;
  lng: number;
  fuente: FuentePuntoConsulta;
  /** Nombre del tramo / playa / consulta. */
  etiqueta?: string;
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
    return p;
  } catch {
    return null;
  }
}

export async function guardarPuntoConsulta(punto: Omit<PuntoConsulta, "actualizadoEn" | "provinciaId"> & { provinciaId?: ProvinciaId }): Promise<PuntoConsulta> {
  const provinciaId = punto.provinciaId ?? getProvinciaIdActiva();
  const full: PuntoConsulta = {
    lat: punto.lat,
    lng: punto.lng,
    fuente: punto.fuente,
    etiqueta: punto.etiqueta,
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
