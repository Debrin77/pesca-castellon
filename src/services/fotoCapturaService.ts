/**
 * Persistencia de fotos de capturas.
 *
 * ImagePicker / cámara devuelven URIs temporales (blob:, file:// en caché, content://…).
 * Si se guardan tal cual en AsyncStorage, al reabrir la app la foto deja de verse.
 * Convertimos a data URI (base64) para que el diario funcione offline en web y nativo.
 */

import { Platform } from "react-native";

const MAX_DATA_URI_CHARS = 900_000; // ~0.7 MB: deja margen en localStorage / AsyncStorage

/** True si la URI ya es durable (data:) o remota estable. */
export function esFotoPersistente(uri: string | null | undefined): boolean {
  if (!uri) return false;
  return uri.startsWith("data:image/") || uri.startsWith("https://") || uri.startsWith("http://");
}

/**
 * Convierte la URI del picker/cámara en una data URI durable.
 * Si falla o es demasiado grande, devuelve null (la captura se guarda sin foto).
 */
export async function persistirFotoCaptura(uri: string | null | undefined): Promise<string | null> {
  if (!uri) return null;
  if (esFotoPersistente(uri)) {
    if (uri.startsWith("data:") && uri.length > MAX_DATA_URI_CHARS) return null;
    return uri;
  }

  try {
    if (Platform.OS === "web" && typeof fetch === "function") {
      const res = await fetch(uri);
      const blob = await res.blob();
      const dataUri = await blobADataUri(blob);
      if (!dataUri || dataUri.length > MAX_DATA_URI_CHARS) return null;
      return dataUri;
    }

    // Nativo: leer bytes con expo-file-system (viene con Expo).
    const FileSystem = await import("expo-file-system");
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const mime = mimeDesdeUri(uri);
    const dataUri = `data:${mime};base64,${base64}`;
    if (dataUri.length > MAX_DATA_URI_CHARS) return null;
    return dataUri;
  } catch {
    return null;
  }
}

/**
 * Normaliza el asset de ImagePicker a una URI durable.
 * Preferimos base64 del propio picker (más fiable en web y Expo Go).
 */
export async function fotoDesdeAsset(asset: {
  uri?: string | null;
  base64?: string | null;
  mimeType?: string | null;
}): Promise<string | null> {
  const mime = asset.mimeType && asset.mimeType.startsWith("image/")
    ? asset.mimeType
    : "image/jpeg";
  if (asset.base64) {
    const dataUri = `data:${mime};base64,${asset.base64}`;
    if (dataUri.length > MAX_DATA_URI_CHARS) return null;
    return dataUri;
  }
  return persistirFotoCaptura(asset.uri);
}

function mimeDesdeUri(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.includes(".png")) return "image/png";
  if (lower.includes(".webp")) return "image/webp";
  if (lower.includes(".gif")) return "image/gif";
  return "image/jpeg";
}

function blobADataUri(blob: Blob): Promise<string | null> {
  return new Promise((resolve) => {
    if (typeof FileReader === "undefined") {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      resolve(result);
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });
}
