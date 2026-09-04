import AsyncStorage from "@react-native-async-storage/async-storage";
import { getProvinciaIdActiva } from "../provincias/runtime";
import { obtenerCapturas } from "./storageService";

/**
 * Seguimiento de cupo diario por especie (solo retención local del usuario).
 * No inventa cupos legales: compara con el texto de cupo del catálogo.
 */

export interface CupoEspecieInfo {
  especieId: string;
  cupoTexto: string;
  /** Máximo numérico si se puede parsear ("4 ud", "5 kg"). */
  maxUnidades: number | null;
  maxKg: number | null;
  retenidasHoy: number;
  kgHoy: number;
  aviso: string | null;
}

function claveManual(): string {
  return `@pesca_app/${getProvinciaIdActiva()}/cupos_manual`;
}

export function parsearCupo(texto: string | undefined | null): { maxUnidades: number | null; maxKg: number | null } {
  if (!texto) return { maxUnidades: null, maxKg: null };
  const t = texto.toLowerCase();
  if (/sin\s*(cupo|l[ií]mite)|no se retiene|devoluci[oó]n|sin muerte|fomentada|prohibida/.test(t)) {
    return { maxUnidades: null, maxKg: null };
  }
  const ud = t.match(/(\d+)\s*(ud|u\.|piezas|ejemplares)/);
  const kg = t.match(/(\d+(?:[.,]\d+)?)\s*kg/);
  return {
    maxUnidades: ud ? parseInt(ud[1], 10) : null,
    maxKg: kg ? parseFloat(kg[1].replace(",", ".")) : null,
  };
}

export async function resumenCupoHoy(
  especieId: string,
  cupoTexto: string | undefined,
  hoyIso = new Date().toISOString().slice(0, 10)
): Promise<CupoEspecieInfo> {
  const capturas = await obtenerCapturas();
  const delDia = capturas.filter((c) => c.especieId === especieId && c.fecha === hoyIso);
  const { maxUnidades, maxKg } = parsearCupo(cupoTexto);
  const retenidasHoy = delDia.length;
  const kgHoy = delDia.reduce((s, c) => s + (c.pesoKg ?? 0), 0);
  let aviso: string | null = null;
  if (maxUnidades != null && retenidasHoy >= maxUnidades) {
    aviso = `Has registrado ${retenidasHoy} capturas hoy (cupo orientativo ${maxUnidades} ud). Revisa la norma del tramo/PTOP.`;
  } else if (maxKg != null && kgHoy >= maxKg) {
    aviso = `Has registrado ${kgHoy.toFixed(1)} kg hoy (cupo orientativo ${maxKg} kg).`;
  } else if (/sin muerte|devoluci[oó]n|no se retiene/i.test(cupoTexto ?? "")) {
    aviso = "Especie de devolución / sin retención: el diario es solo estadística, no cupo de sacar.";
  }
  return { especieId, cupoTexto: cupoTexto ?? "Sin dato de cupo", maxUnidades, maxKg, retenidasHoy, kgHoy, aviso };
}

/** Notas locales del usuario sobre permiso de coto del día (no oficial). */
export interface PermisoDiaLocal {
  matricula: string;
  fecha: string;
  notas?: string;
}

export async function obtenerPermisosDia(): Promise<PermisoDiaLocal[]> {
  try {
    const raw = await AsyncStorage.getItem(claveManual());
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function guardarPermisoDia(p: PermisoDiaLocal): Promise<void> {
  const lista = await obtenerPermisosDia();
  const siguiente = [p, ...lista.filter((x) => !(x.matricula === p.matricula && x.fecha === p.fecha))];
  await AsyncStorage.setItem(claveManual(), JSON.stringify(siguiente.slice(0, 40)));
}

export async function tienePermisoHoy(matricula: string, hoy = new Date().toISOString().slice(0, 10)): Promise<boolean> {
  const lista = await obtenerPermisosDia();
  return lista.some((p) => p.matricula === matricula && p.fecha === hoy);
}
