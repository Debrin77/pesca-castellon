import AsyncStorage from "@react-native-async-storage/async-storage";

export interface PuntoGuardado {
  id: string;
  nombre: string;
  lat: number;
  lng: number;
  notas?: string;
  creadoEn: string; // ISO
  zonaRelacionadaId?: string | null;
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
}

export interface FavoritoZona {
  zonaId: string;
  nombre: string;
  creadoEn: string;
}

const CLAVE_PUNTOS = "@pesca_castellon/puntos_guardados";
const CLAVE_CAPTURAS = "@pesca_castellon/capturas";
const CLAVE_FAVORITOS = "@pesca_castellon/favoritos_zonas";

function generarId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// --- Puntos guardados ---

export async function obtenerPuntosGuardados(): Promise<PuntoGuardado[]> {
  try {
    const raw = await AsyncStorage.getItem(CLAVE_PUNTOS);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn("Error leyendo puntos guardados:", err);
    return [];
  }
}

export async function guardarPunto(punto: Omit<PuntoGuardado, "id" | "creadoEn">): Promise<PuntoGuardado> {
  const puntos = await obtenerPuntosGuardados();
  const nuevo: PuntoGuardado = { ...punto, id: generarId(), creadoEn: new Date().toISOString() };
  await AsyncStorage.setItem(CLAVE_PUNTOS, JSON.stringify([nuevo, ...puntos]));
  return nuevo;
}

export async function eliminarPunto(id: string): Promise<void> {
  const puntos = await obtenerPuntosGuardados();
  await AsyncStorage.setItem(CLAVE_PUNTOS, JSON.stringify(puntos.filter((p) => p.id !== id)));
}

// --- Registro de capturas ---

export async function obtenerCapturas(): Promise<Captura[]> {
  try {
    const raw = await AsyncStorage.getItem(CLAVE_CAPTURAS);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn("Error leyendo capturas:", err);
    return [];
  }
}

export async function guardarCaptura(captura: Omit<Captura, "id">): Promise<Captura> {
  const capturas = await obtenerCapturas();
  const nueva: Captura = { ...captura, id: generarId() };
  await AsyncStorage.setItem(CLAVE_CAPTURAS, JSON.stringify([nueva, ...capturas]));
  return nueva;
}

export async function eliminarCaptura(id: string): Promise<void> {
  const capturas = await obtenerCapturas();
  await AsyncStorage.setItem(CLAVE_CAPTURAS, JSON.stringify(capturas.filter((c) => c.id !== id)));
}

// --- Favoritos de fichas / zonas ---

export async function obtenerFavoritos(): Promise<FavoritoZona[]> {
  try {
    const raw = await AsyncStorage.getItem(CLAVE_FAVORITOS);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn("Error leyendo favoritos:", err);
    return [];
  }
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
    siguiente = [{ zonaId, nombre, creadoEn: new Date().toISOString() }, ...favs];
  }
  await AsyncStorage.setItem(CLAVE_FAVORITOS, JSON.stringify(siguiente));
  return !existe;
}

export async function eliminarFavorito(zonaId: string): Promise<void> {
  const favs = await obtenerFavoritos();
  await AsyncStorage.setItem(CLAVE_FAVORITOS, JSON.stringify(favs.filter((f) => f.zonaId !== zonaId)));
}
