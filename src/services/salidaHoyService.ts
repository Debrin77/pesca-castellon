import AsyncStorage from "@react-native-async-storage/async-storage";

export type SalidaHoy = {
  fecha: string; // yyyy-mm-dd
  provinciaId: string;
  etiqueta: string;
  lat?: number;
  lng?: number;
  veredictoTexto: string;
  veredictoSub?: string;
  tituloTramo?: string;
  nota?: string;
  checklistCompleta: boolean;
  creadaEn: string; // ISO
};

const PREFIJO = "@pesca/salida_hoy";

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function clave(provinciaId: string): string {
  return `${PREFIJO}:${provinciaId}`;
}

/** Lee la salida de hoy (null si no hay o es de otro día). */
export async function leerSalidaHoy(provinciaId: string): Promise<SalidaHoy | null> {
  try {
    const raw = await AsyncStorage.getItem(clave(provinciaId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SalidaHoy;
    if (!parsed?.fecha || parsed.fecha !== hoyISO() || parsed.provinciaId !== provinciaId) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function guardarSalidaHoy(
  entrada: Omit<SalidaHoy, "fecha" | "creadaEn"> & { nota?: string }
): Promise<SalidaHoy> {
  const salida: SalidaHoy = {
    ...entrada,
    fecha: hoyISO(),
    creadaEn: new Date().toISOString(),
    nota: entrada.nota?.trim() || undefined,
  };
  await AsyncStorage.setItem(clave(entrada.provinciaId), JSON.stringify(salida));
  return salida;
}

export async function borrarSalidaHoy(provinciaId: string): Promise<void> {
  await AsyncStorage.removeItem(clave(provinciaId));
}

export function fechaHoyISO(): string {
  return hoyISO();
}
