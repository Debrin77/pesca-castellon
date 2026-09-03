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

const CLAVE_LICENCIAS = "@pesca_castellon/licencias_vigor";

export const ETIQUETA_LICENCIA: Record<TipoLicencia, string> = {
  continental: "Pesca continental (GVA)",
  maritima_tierra: "Marítima recreativa desde tierra (GVA)",
};

export async function obtenerLicencias(): Promise<LicenciaGuardada[]> {
  try {
    const raw = await AsyncStorage.getItem(CLAVE_LICENCIAS);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn("Error leyendo licencias:", err);
    return [];
  }
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
  await AsyncStorage.setItem(CLAVE_LICENCIAS, JSON.stringify(siguiente));
  return item;
}

export async function eliminarLicencia(id: string): Promise<void> {
  const lista = await obtenerLicencias();
  await AsyncStorage.setItem(CLAVE_LICENCIAS, JSON.stringify(lista.filter((l) => l.id !== id)));
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
    const nombre =
      l.tipo === "continental" ? "Continental" : "Marítima desde tierra";
    if (dias < 0) return `${nombre}: caducada`;
    if (dias <= 30) return `${nombre}: caduca en ${dias} d`;
    return `${nombre}: en vigor`;
  });
  return partes.join(" · ");
}
