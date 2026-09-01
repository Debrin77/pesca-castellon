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

const CLAVE_PUNTOS = "@pesca_castellon/puntos_guardados";
const CLAVE_CAPTURAS = "@pesca_castellon/capturas";

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
