/**
 * Copia de seguridad / exportación del apartado Capturas (datos + fotos).
 * Web: descarga de archivo. Nativo: archivo en el dispositivo + Share.
 */
import { Alert, Platform, Share } from "react-native";
import * as FileSystem from "expo-file-system";
import { getProvinciaActiva, getProvinciaIdActiva } from "../provincias/runtime";
import type { Captura, PuntoGuardado } from "./storageService";
import { obtenerCapturas, obtenerPuntosGuardados } from "./storageService";

export const BACKUP_CAPTURA_VERSION = 1 as const;

export type BackupCapturasPayload = {
  version: typeof BACKUP_CAPTURA_VERSION;
  app: "vamos-de-pesca";
  tipo: "capturas";
  exportedAt: string;
  provinciaId: string;
  provinciaNombre: string;
  capturas: Captura[];
  /** Puntos referenciados por las capturas (para restaurar contexto de sitio). */
  puntos: PuntoGuardado[];
};

function escCsv(v: string | number | null | undefined): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function construirBackupCapturas(): Promise<BackupCapturasPayload> {
  const provincia = getProvinciaActiva();
  const capturas = await obtenerCapturas();
  const puntosTodos = await obtenerPuntosGuardados();
  const ids = new Set(
    capturas.map((c) => c.puntoId).filter((id): id is string => typeof id === "string" && !!id),
  );
  const puntos = puntosTodos.filter((p) => ids.has(p.id));
  return {
    version: BACKUP_CAPTURA_VERSION,
    app: "vamos-de-pesca",
    tipo: "capturas",
    exportedAt: new Date().toISOString(),
    provinciaId: getProvinciaIdActiva(),
    provinciaNombre: provincia.nombre,
    capturas,
    puntos,
  };
}

export function backupAJson(payload: BackupCapturasPayload): string {
  return JSON.stringify(payload, null, 2);
}

/** CSV sin fotos (hoja de cálculo / comprobación rápida). */
export function capturasACsv(capturas: Captura[]): string {
  const header = [
    "id",
    "fecha",
    "especieId",
    "nombreLugar",
    "tallaCm",
    "pesoKg",
    "lat",
    "lng",
    "modalidad",
    "notas",
    "tieneFoto",
    "puntoId",
  ].join(",");
  const rows = capturas.map((c) =>
    [
      escCsv(c.id),
      escCsv(c.fecha),
      escCsv(c.especieId),
      escCsv(c.nombreLugar),
      escCsv(c.tallaCm),
      escCsv(c.pesoKg),
      escCsv(c.lat),
      escCsv(c.lng),
      escCsv(c.modalidad),
      escCsv(c.notas),
      escCsv(c.fotoUri ? "si" : "no"),
      escCsv(c.puntoId),
    ].join(","),
  );
  return [header, ...rows].join("\n") + "\n";
}

function nombreArchivoBase(): string {
  const id = getProvinciaIdActiva();
  const dia = new Date().toISOString().slice(0, 10);
  return `capturas-${id}-${dia}`;
}

async function descargarWeb(nombre: string, contenido: string, mime: string): Promise<void> {
  if (typeof document === "undefined") {
    throw new Error("Descarga no disponible");
  }
  const blob = new Blob([contenido], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}

async function guardarYCompartirNativo(
  nombreArchivo: string,
  contenido: string,
  mimeHint: string,
): Promise<string> {
  const dir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
  if (!dir) throw new Error("Sin carpeta de archivos en el dispositivo");
  const uri = `${dir}${nombreArchivo}`;
  await FileSystem.writeAsStringAsync(uri, contenido, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  try {
    await Share.share(
      Platform.OS === "ios"
        ? { url: uri, title: nombreArchivo }
        : {
            title: nombreArchivo,
            message: `Copia de seguridad de capturas (${mimeHint})\n${uri}`,
          },
    );
  } catch (err) {
    console.warn(err);
    Alert.alert(
      "Copia de seguridad",
      `Archivo guardado en el dispositivo:\n${uri}\n\nÁbrelo desde Archivos o compártelo con Drive/WhatsApp.`,
    );
  }
  return uri;
}

/**
 * Copia de seguridad completa (JSON con fotos en data URI).
 * Ideal para guardar en el móvil / nube y no perder el registro.
 */
export async function exportarCopiaSeguridadCapturas(): Promise<{
  ok: boolean;
  count: number;
  archivo: string;
}> {
  const payload = await construirBackupCapturas();
  const archivo = `${nombreArchivoBase()}-backup.json`;
  const json = backupAJson(payload);
  if (payload.capturas.length === 0) {
    Alert.alert("Copia de seguridad", "No hay capturas que guardar en esta provincia.");
    return { ok: false, count: 0, archivo };
  }
  if (Platform.OS === "web") {
    await descargarWeb(archivo, json, "application/json");
    Alert.alert(
      "Copia de seguridad",
      `Descargado «${archivo}» con ${payload.capturas.length} captura(s) y fotos. Guárdalo en tu móvil o nube.`,
    );
    return { ok: true, count: payload.capturas.length, archivo };
  }
  await guardarYCompartirNativo(archivo, json, "JSON");
  return { ok: true, count: payload.capturas.length, archivo };
}

/** Exportación ligera CSV (sin fotos) para Excel / Sheets. */
export async function exportarCapturasCsv(): Promise<{
  ok: boolean;
  count: number;
  archivo: string;
}> {
  const capturas = await obtenerCapturas();
  const archivo = `${nombreArchivoBase()}.csv`;
  if (capturas.length === 0) {
    Alert.alert("Exportar", "No hay capturas que exportar en esta provincia.");
    return { ok: false, count: 0, archivo };
  }
  const csv = capturasACsv(capturas);
  if (Platform.OS === "web") {
    await descargarWeb(archivo, csv, "text/csv;charset=utf-8");
    Alert.alert("Exportar", `Descargado «${archivo}» (${capturas.length} filas).`);
    return { ok: true, count: capturas.length, archivo };
  }
  await guardarYCompartirNativo(archivo, csv, "CSV");
  return { ok: true, count: capturas.length, archivo };
}
