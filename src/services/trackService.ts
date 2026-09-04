import AsyncStorage from "@react-native-async-storage/async-storage";
import { getProvinciaIdActiva } from "../provincias/runtime";
import type { ModalidadPesca } from "../data/modalidades";

export interface TrackPunto {
  lat: number;
  lng: number;
  t: string; // ISO
}

export interface TrackPesca {
  id: string;
  nombre: string;
  modalidad: ModalidadPesca;
  iniciadoEn: string;
  finalizadoEn?: string;
  puntos: TrackPunto[];
  provinciaId?: string;
}

function clave(): string {
  return `@pesca_app/${getProvinciaIdActiva()}/tracks`;
}

function id(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function obtenerTracks(): Promise<TrackPesca[]> {
  try {
    const raw = await AsyncStorage.getItem(clave());
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function guardarTodos(lista: TrackPesca[]) {
  await AsyncStorage.setItem(clave(), JSON.stringify(lista));
}

export async function iniciarTrack(nombre: string, modalidad: ModalidadPesca): Promise<TrackPesca> {
  const lista = await obtenerTracks();
  const nuevo: TrackPesca = {
    id: id(),
    nombre,
    modalidad,
    iniciadoEn: new Date().toISOString(),
    puntos: [],
    provinciaId: getProvinciaIdActiva(),
  };
  await guardarTodos([nuevo, ...lista]);
  return nuevo;
}

export async function anadirPuntoTrack(trackId: string, lat: number, lng: number): Promise<TrackPesca | null> {
  const lista = await obtenerTracks();
  const i = lista.findIndex((t) => t.id === trackId);
  if (i < 0) return null;
  const t = lista[i];
  if (t.finalizadoEn) return t;
  const ultimo = t.puntos[t.puntos.length - 1];
  if (ultimo) {
    const dlat = ultimo.lat - lat;
    const dlng = ultimo.lng - lng;
    if (dlat * dlat + dlng * dlng < 1e-10) return t; // ~1 m ignore
  }
  t.puntos = [...t.puntos, { lat, lng, t: new Date().toISOString() }];
  lista[i] = t;
  await guardarTodos(lista);
  return t;
}

export async function finalizarTrack(trackId: string): Promise<TrackPesca | null> {
  const lista = await obtenerTracks();
  const i = lista.findIndex((t) => t.id === trackId);
  if (i < 0) return null;
  lista[i] = { ...lista[i], finalizadoEn: new Date().toISOString() };
  await guardarTodos(lista);
  return lista[i];
}

export async function eliminarTrack(trackId: string): Promise<void> {
  const lista = await obtenerTracks();
  await guardarTodos(lista.filter((t) => t.id !== trackId));
}

export function trackActivo(lista: TrackPesca[]): TrackPesca | null {
  return lista.find((t) => !t.finalizadoEn) ?? null;
}
