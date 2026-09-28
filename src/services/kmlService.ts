/**
 * Importación KML / KMZ (waypoints → puntos guardados).
 * KMZ = ZIP: lee entradas store (method 0) y, en web, deflate vía DecompressionStream.
 */
import type { PuntoGuardado } from "./storageService";
import { COLOR_PUNTO_DEFAULT, ICONO_PUNTO_DEFAULT } from "../data/iconosPunto";

export type PlacemarkImport = {
  nombre: string;
  lat: number;
  lng: number;
  notas?: string;
};

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function textoTag(xml: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const m = xml.match(re);
  return m ? decodeXmlEntities(m[1].trim()) : null;
}

/** Extrae placemarks con Point/coordinates de un documento KML. */
export function parsearKml(xml: string): PlacemarkImport[] {
  const out: PlacemarkImport[] = [];
  const chunks = xml.split(/<Placemark[\s>]/i);
  for (let i = 1; i < chunks.length; i++) {
    const block = chunks[i].split(/<\/Placemark>/i)[0] ?? "";
    const nombre = textoTag(block, "name") || `Punto KML ${i}`;
    const desc = textoTag(block, "description") || undefined;
    // coordinates: lon,lat[,alt] — puede ser Point o LineString (tomamos el primero)
    const coordBlock = textoTag(block, "coordinates");
    if (!coordBlock) continue;
    const primer = coordBlock.trim().split(/\s+/)[0];
    const parts = primer.split(",").map((x) => parseFloat(x.trim()));
    if (parts.length < 2 || !Number.isFinite(parts[0]) || !Number.isFinite(parts[1])) continue;
    const lng = parts[0];
    const lat = parts[1];
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) continue;
    out.push({
      nombre: nombre.slice(0, 80),
      lat,
      lng,
      notas: desc ? desc.replace(/<[^>]+>/g, " ").trim().slice(0, 200) : undefined,
    });
  }
  return out;
}

/** Convierte placemarks a payload de guardarPunto. */
export function placemarksAPuntos(
  places: PlacemarkImport[]
): Omit<PuntoGuardado, "id" | "creadoEn" | "provinciaId">[] {
  return places.map((p) => ({
    nombre: p.nombre,
    lat: p.lat,
    lng: p.lng,
    notas: p.notas,
    color: COLOR_PUNTO_DEFAULT,
    icono: ICONO_PUNTO_DEFAULT,
  }));
}

function leU16(u8: Uint8Array, off: number): number {
  return u8[off] | (u8[off + 1] << 8);
}

function leU32(u8: Uint8Array, off: number): number {
  return (
    (u8[off] | (u8[off + 1] << 8) | (u8[off + 2] << 16) | (u8[off + 3] << 24)) >>> 0
  );
}

async function inflarDeflateRaw(data: Uint8Array): Promise<Uint8Array | null> {
  const DS = (globalThis as any).DecompressionStream;
  if (typeof DS !== "function") return null;
  try {
    const stream = new DS("deflate-raw");
    const writer = stream.writable.getWriter();
    await writer.write(data);
    await writer.close();
    const reader = stream.readable.getReader();
    const chunks: Uint8Array[] = [];
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
    const total = chunks.reduce((n, c) => n + c.length, 0);
    const out = new Uint8Array(total);
    let o = 0;
    for (const c of chunks) {
      out.set(c, o);
      o += c.length;
    }
    return out;
  } catch {
    return null;
  }
}

/**
 * Extrae el primer .kml de un KMZ (ZIP).
 * Soporta método store (0) y deflate (8) cuando hay DecompressionStream.
 */
export async function extraerKmlDeKmz(bytes: ArrayBuffer): Promise<string | null> {
  const u8 = new Uint8Array(bytes);
  let offset = 0;
  while (offset + 30 < u8.length) {
    if (leU32(u8, offset) !== 0x04034b50) break;
    const method = leU16(u8, offset + 8);
    const compSize = leU32(u8, offset + 18);
    const nameLen = leU16(u8, offset + 26);
    const extraLen = leU16(u8, offset + 28);
    const nameStart = offset + 30;
    const nameEnd = nameStart + nameLen;
    const dataStart = nameEnd + extraLen;
    const dataEnd = dataStart + compSize;
    if (dataEnd > u8.length) break;
    const name = new TextDecoder("utf-8", { fatal: false }).decode(u8.slice(nameStart, nameEnd));
    const esKml = /\.kml$/i.test(name) && !name.includes("__MACOSX");
    if (esKml) {
      let raw: Uint8Array | null = null;
      if (method === 0) {
        raw = u8.slice(dataStart, dataEnd);
      } else if (method === 8) {
        raw = await inflarDeflateRaw(u8.slice(dataStart, dataEnd));
      }
      if (raw) {
        const xml = new TextDecoder("utf-8", { fatal: false }).decode(raw);
        if (/<kml[\s>]/i.test(xml)) return xml;
      }
    }
    offset = dataEnd;
  }

  // Fallback: KML store embebido sin cabeceras legibles
  const asLatin = Array.from(u8)
    .map((c) => (c >= 32 && c < 127 ? String.fromCharCode(c) : " "))
    .join("");
  const idx = asLatin.indexOf("<?xml");
  if (idx >= 0) {
    const slice = new TextDecoder("utf-8", { fatal: false }).decode(u8.slice(idx));
    if (/<kml[\s>]/i.test(slice)) {
      const end = slice.search(/<\/kml>/i);
      return end >= 0 ? slice.slice(0, end + 6) : slice;
    }
  }
  return null;
}

export async function importarKmlOKmzDesdeTextoOBytes(opts: {
  texto?: string;
  bytes?: ArrayBuffer;
  nombreArchivo?: string;
}): Promise<PlacemarkImport[]> {
  let xml = opts.texto?.trim() ?? "";
  if (!xml && opts.bytes) {
    const name = (opts.nombreArchivo || "").toLowerCase();
    const looksKmz =
      name.endsWith(".kmz") ||
      (opts.bytes.byteLength >= 4 &&
        new Uint8Array(opts.bytes)[0] === 0x50 &&
        new Uint8Array(opts.bytes)[1] === 0x4b);
    if (looksKmz) {
      const extracted = await extraerKmlDeKmz(opts.bytes);
      if (!extracted) {
        throw new Error(
          "No pude leer el KMZ automáticamente. Ábrelo y usa el .kml interno, o pega el KML."
        );
      }
      xml = extracted;
    } else {
      xml = new TextDecoder("utf-8", { fatal: false }).decode(opts.bytes);
    }
  }
  if (!xml || !/<kml[\s>]/i.test(xml)) {
    throw new Error("El archivo no parece un KML válido.");
  }
  const places = parsearKml(xml);
  if (!places.length) {
    throw new Error("No encontré placemarks con coordenadas en el KML.");
  }
  return places;
}
