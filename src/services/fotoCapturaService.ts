/**
 * Persistencia de fotos de capturas.
 *
 * ImagePicker / cámara devuelven URIs temporales (blob:, file:// en caché, content://…).
 * Si se guardan tal cual en AsyncStorage, al reabrir la app la foto deja de verse.
 * Convertimos a data URI (base64) para que el diario funcione offline en web y nativo.
 *
 * En web/PWA el diálogo de archivo DEBE abrirse en el mismo turno del gesto del usuario
 * (sin await antes de input.click()). Safari bloquea el picker si se pierde la activación.
 */

import { Platform } from "react-native";

const MAX_DATA_URI_CHARS = 900_000; // ~0.7 MB: deja margen en localStorage / AsyncStorage
const MAX_LADO_PX = 1280;

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
    if (uri.startsWith("data:") && uri.length > MAX_DATA_URI_CHARS) {
      return comprimirDataUriSiHaceFalta(uri);
    }
    return uri;
  }

  try {
    if (Platform.OS === "web" && typeof fetch === "function") {
      const res = await fetch(uri);
      const blob = await res.blob();
      return fotoDesdeFile(blob);
    }

    const FileSystem = await import("expo-file-system");
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const mime = mimeDesdeUri(uri);
    const dataUri = `data:${mime};base64,${base64}`;
    if (dataUri.length > MAX_DATA_URI_CHARS) {
      return comprimirDataUriSiHaceFalta(dataUri);
    }
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
  const mime =
    asset.mimeType && asset.mimeType.startsWith("image/") ? asset.mimeType : "image/jpeg";
  // HEIC/HEIF no se previsualiza bien en web/PWA → forzar conversión vía uri si hay.
  const esHeic = /heic|heif/i.test(mime) || /heic|heif/i.test(asset.uri || "");
  if (asset.base64 && !esHeic) {
    const dataUri = `data:${mime};base64,${asset.base64}`;
    if (dataUri.length > MAX_DATA_URI_CHARS) {
      return comprimirDataUriSiHaceFalta(dataUri);
    }
    return dataUri;
  }
  return persistirFotoCaptura(asset.uri);
}

/** File (web) → data URI JPEG comprimido (evita blob: temporal e icono rojo). */
export async function fotoDesdeFile(file: Blob & { type?: string }): Promise<string | null> {
  try {
    const type = (file.type || "").toLowerCase();
    if (type && !type.startsWith("image/")) return null;
    // Siempre intentar canvas→JPEG (Safari/HEIC/PNG grandes → preview estable).
    const fromCanvas = await blobAJpegComprimido(file);
    if (fromCanvas && fromCanvas.startsWith("data:image/jpeg")) return fromCanvas;
    // Fallback: solo si ya es un formato web seguro y cabe.
    const dataUri = await blobADataUri(file);
    if (!dataUri) return null;
    if (/heic|heif/i.test(dataUri.slice(0, 40)) || /heic|heif/i.test(type)) return null;
    if (!/^data:image\/(jpeg|jpg|png|webp|gif);/i.test(dataUri)) return null;
    if (dataUri.length > MAX_DATA_URI_CHARS) {
      return comprimirDataUriSiHaceFalta(dataUri);
    }
    return dataUri;
  } catch {
    return null;
  }
}

/**
 * Abre el selector de archivos en web SIN await previo (mantiene el gesto del usuario).
 * `capture`: true → cámara (si el navegador lo permite); false → galería/archivos.
 * Devuelve null si el usuario cancela.
 */
export function elegirFotoWebSync(opts?: { capture?: boolean }): Promise<File | null> {
  return new Promise((resolve) => {
    if (typeof document === "undefined") {
      resolve(null);
      return;
    }
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,image/jpeg,image/png,image/webp";
    if (opts?.capture) {
      input.setAttribute("capture", "environment");
    }
    // visibility/opacity (no display:none): iOS Safari a veces ignora click() en inputs ocultos.
    input.style.cssText =
      "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0.01;z-index:99999;";
    let settled = false;
    const finish = (file: File | null) => {
      if (settled) return;
      settled = true;
      try {
        input.remove();
      } catch {
        /* ignore */
      }
      resolve(file);
    };
    input.addEventListener("change", () => {
      finish(input.files?.[0] ?? null);
    });
    const onFocus = () => {
      window.setTimeout(() => {
        if (!settled && (!input.files || input.files.length === 0)) finish(null);
      }, 700);
    };
    window.addEventListener("focus", onFocus, { once: true });
    document.body.appendChild(input);
    input.click();
  });
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

async function comprimirDataUriSiHaceFalta(dataUri: string): Promise<string | null> {
  if (dataUri.length <= MAX_DATA_URI_CHARS) return dataUri;
  if (typeof document === "undefined") return null;
  try {
    const img = await cargarImagen(dataUri);
    return canvasAJpeg(img, 0.55);
  } catch {
    return null;
  }
}

async function blobAJpegComprimido(blob: Blob): Promise<string | null> {
  if (typeof document === "undefined" || typeof createImageBitmap === "undefined") {
    // Fallback sin createImageBitmap: object URL + Image
    if (typeof document === "undefined" || typeof URL === "undefined") return null;
    const url = URL.createObjectURL(blob);
    try {
      const img = await cargarImagen(url);
      return canvasAJpeg(img, 0.7);
    } catch {
      return null;
    } finally {
      try {
        URL.revokeObjectURL(url);
      } catch {
        /* ignore */
      }
    }
  }
  try {
    const bmp = await createImageBitmap(blob);
    try {
      return canvasAJpeg(bmp, 0.7);
    } finally {
      bmp.close?.();
    }
  } catch {
    return null;
  }
}

function cargarImagen(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("img"));
    img.src = src;
  });
}

function canvasAJpeg(
  source: { width: number; height: number; close?: () => void } | HTMLImageElement,
  quality: number
): string | null {
  if (typeof document === "undefined") return null;
  let w = source.width;
  let h = source.height;
  if (!w || !h) return null;
  const scale = Math.min(1, MAX_LADO_PX / Math.max(w, h));
  w = Math.max(1, Math.round(w * scale));
  h = Math.max(1, Math.round(h * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(source as CanvasImageSource, 0, 0, w, h);
  let q = quality;
  let out = canvas.toDataURL("image/jpeg", q);
  while (out.length > MAX_DATA_URI_CHARS && q > 0.35) {
    q -= 0.1;
    out = canvas.toDataURL("image/jpeg", q);
  }
  if (out.length > MAX_DATA_URI_CHARS) return null;
  return out;
}
