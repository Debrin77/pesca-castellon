import AsyncStorage from "@react-native-async-storage/async-storage";
import { getProvinciaIdActiva } from "../provincias/runtime";
import type { ProvinciaId } from "../provincias";

export interface PuntoGuardado {
  id: string;
  nombre: string;
  lat: number;
  lng: number;
  notas?: string;
  creadoEn: string; // ISO
  zonaRelacionadaId?: string | null;
  provinciaId?: ProvinciaId;
}

export interface Captura {
  id: string;
  especieId: string;
  fecha: string; // ISO yyyy-mm-dd
  puntoId?: string | null;
  zonaId?: string | null;
  nombreLugar?: string;
  tallaCm?: number | null;
  pesoKg?: number | null;
  notas?: string;
  /** URI local de foto (opcional). */
  fotoUri?: string | null;
  lat?: number | null;
  lng?: number | null;
  provinciaId?: ProvinciaId;
}

export interface FavoritoZona {
  zonaId: string;
  nombre: string;
  creadoEn: string;
  provinciaId?: ProvinciaId;
}

/** Claves legacy (solo Castellón, migran al namespace nuevo). */
const LEGACY = {
  puntos: "@pesca_castellon/puntos_guardados",
  capturas: "@pesca_castellon/capturas",
  favoritos: "@pesca_castellon/favoritos_zonas",
  licencias: "@pesca_castellon/licencias_vigor",
};

function clave(base: string, provinciaId?: ProvinciaId): string {
  const id = provinciaId ?? getProvinciaIdActiva();
  return `@pesca_app/${id}/${base}`;
}

function generarId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function leerLista<T>(base: string, legacyKey?: string): Promise<T[]> {
  const id = getProvinciaIdActiva();
  try {
    const raw = await AsyncStorage.getItem(clave(base, id));
    if (raw) return JSON.parse(raw);
    // Migración: datos antiguos de Castellón
    if (id === "castellon" && legacyKey) {
      const old = await AsyncStorage.getItem(legacyKey);
      if (old) {
        await AsyncStorage.setItem(clave(base, id), old);
        return JSON.parse(old);
      }
    }
    return [];
  } catch (err) {
    console.warn(`Error leyendo ${base}:`, err);
    return [];
  }
}

async function escribirLista<T>(base: string, lista: T[]): Promise<void> {
  await AsyncStorage.setItem(clave(base), JSON.stringify(lista));
}

// --- Puntos guardados ---

export async function obtenerPuntosGuardados(): Promise<PuntoGuardado[]> {
  return leerLista<PuntoGuardado>("puntos_guardados", LEGACY.puntos);
}

export async function guardarPunto(punto: Omit<PuntoGuardado, "id" | "creadoEn">): Promise<PuntoGuardado> {
  const puntos = await obtenerPuntosGuardados();
  const nuevo: PuntoGuardado = {
    ...punto,
    id: generarId(),
    creadoEn: new Date().toISOString(),
    provinciaId: getProvinciaIdActiva(),
  };
  await escribirLista("puntos_guardados", [nuevo, ...puntos]);
  return nuevo;
}

export async function eliminarPunto(id: string): Promise<void> {
  const puntos = await obtenerPuntosGuardados();
  await escribirLista(
    "puntos_guardados",
    puntos.filter((p) => p.id !== id)
  );
}

// --- Registro de capturas ---

export async function obtenerCapturas(): Promise<Captura[]> {
  return leerLista<Captura>("capturas", LEGACY.capturas);
}

export async function guardarCaptura(captura: Omit<Captura, "id">): Promise<Captura> {
  const capturas = await obtenerCapturas();
  const nueva: Captura = { ...captura, id: generarId(), provinciaId: getProvinciaIdActiva() };
  await escribirLista("capturas", [nueva, ...capturas]);
  return nueva;
}

export async function eliminarCaptura(id: string): Promise<void> {
  const capturas = await obtenerCapturas();
  await escribirLista(
    "capturas",
    capturas.filter((c) => c.id !== id)
  );
}

// --- Favoritos de fichas / zonas ---

export async function obtenerFavoritos(): Promise<FavoritoZona[]> {
  return leerLista<FavoritoZona>("favoritos_zonas", LEGACY.favoritos);
}

export async function esFavorito(zonaId: string): Promise<boolean> {
  const favs = await obtenerFavoritos();
  return favs.some((f) => f.zonaId === zonaId);
}

export async function alternarFavorito(zonaId: string, nombre: string): Promise<boolean> {
  const favs = await obtenerFavoritos();
  const existe = favs.find((f) => f.zonaId === zonaId);
  let siguiente: FavoritoZona[];
  if (existe) {
    siguiente = favs.filter((f) => f.zonaId !== zonaId);
  } else {
    siguiente = [
      { zonaId, nombre, creadoEn: new Date().toISOString(), provinciaId: getProvinciaIdActiva() },
      ...favs,
    ];
  }
  await escribirLista("favoritos_zonas", siguiente);
  return !existe;
}

export async function eliminarFavorito(zonaId: string): Promise<void> {
  const favs = await obtenerFavoritos();
  await escribirLista(
    "favoritos_zonas",
    favs.filter((f) => f.zonaId !== zonaId)
  );
}

// --- Licencias en vigor (solo en este dispositivo) ---

export type TipoLicencia = "continental" | "maritima_tierra";

export interface LicenciaGuardada {
  id: string;
  tipo: TipoLicencia;
  /** Número o referencia de la licencia (opcional). */
  numero?: string;
  /** Caducidad ISO yyyy-mm-dd */
  caducaEl: string;
  notas?: string;
  actualizadoEn: string;
}

export const ETIQUETA_LICENCIA: Record<TipoLicencia, string> = {
  continental: "Pesca continental",
  maritima_tierra: "Marítima recreativa desde tierra",
};

export async function obtenerLicencias(): Promise<LicenciaGuardada[]> {
  return leerLista<LicenciaGuardada>("licencias_vigor", LEGACY.licencias);
}

export async function guardarLicencia(
  datos: Omit<LicenciaGuardada, "id" | "actualizadoEn"> & { id?: string }
): Promise<LicenciaGuardada> {
  const lista = await obtenerLicencias();
  const ahora = new Date().toISOString();
  const caducaEl = datos.caducaEl.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(caducaEl)) {
    throw new Error("La fecha de caducidad debe ser AAAA-MM-DD.");
  }
  const item: LicenciaGuardada = {
    id: datos.id ?? generarId(),
    tipo: datos.tipo,
    numero: datos.numero?.trim() || undefined,
    caducaEl,
    notas: datos.notas?.trim() || undefined,
    actualizadoEn: ahora,
  };
  const sinDuplicadoTipo = lista.filter((l) => l.tipo !== item.tipo || l.id === item.id);
  const siguiente = [item, ...sinDuplicadoTipo.filter((l) => l.id !== item.id)];
  await escribirLista("licencias_vigor", siguiente);
  return item;
}

export async function eliminarLicencia(id: string): Promise<void> {
  const lista = await obtenerLicencias();
  await escribirLista(
    "licencias_vigor",
    lista.filter((l) => l.id !== id)
  );
}

export function diasHastaCaducidad(caducaEl: string, hoy = new Date()): number {
  const [y, m, d] = caducaEl.split("-").map(Number);
  const fin = new Date(y, m - 1, d, 23, 59, 59);
  return Math.ceil((fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
}

export async function resumenLicenciasCortas(): Promise<string> {
  const lista = await obtenerLicencias();
  if (lista.length === 0) return "Aún no has guardado tus licencias en el móvil (opcional).";
  const partes = lista.map((l) => {
    const dias = diasHastaCaducidad(l.caducaEl);
    const nombre = l.tipo === "continental" ? "Continental" : "Marítima desde tierra";
    if (dias < 0) return `${nombre}: caducada`;
    if (dias <= 30) return `${nombre}: caduca en ${dias} d`;
    return `${nombre}: en vigor`;
  });
  return partes.join(" · ");
}
