/** Validación y parseo de coordenadas lat/lng introducidas a mano. */

export type Coords = { lat: number; lng: number };

/** Unifica símbolos tipográficos habituales (°, ′, ″, comillas, etc.). */
function normalizarSimbolos(raw: string): string {
  return raw
    .trim()
    .replace(/\u00A0/g, " ")
    .replace(/[º°˚]/g, "°")
    .replace(/[′'ʼ´`]/g, "'")
    .replace(/[″"“”]/g, '"')
    .replace(/\s+/g, " ");
}

type Hemisferio = "N" | "S" | "E" | "O";

function parsearHemisferio(token: string): Hemisferio | null {
  const h = token.trim().toUpperCase();
  if (h === "N" || h === "NORTE" || h === "NORTH") return "N";
  if (h === "S" || h === "SUR" || h === "SOUTH") return "S";
  if (h === "E" || h === "ESTE" || h === "EAST") return "E";
  // Español O / Oeste = West
  if (h === "O" || h === "OESTE" || h === "W" || h === "WEST") return "O";
  return null;
}

function signoHemisferio(hemi: Hemisferio): number {
  return hemi === "S" || hemi === "O" ? -1 : 1;
}

function extraerHemisferio(t: string): { resto: string; hemi: Hemisferio | null } {
  const reFin =
    /\s*(Norte|Sur|Este|Oeste|North|South|East|West|[NSEOW])\s*$/i;
  const mFin = t.match(reFin);
  if (mFin && mFin.index != null) {
    const hemi = parsearHemisferio(mFin[1]);
    if (hemi) return { resto: t.slice(0, mFin.index).trim(), hemi };
  }
  const reIni =
    /^(Norte|Sur|Este|Oeste|North|South|East|West|[NSEOW])\s+/i;
  const mIni = t.match(reIni);
  if (mIni) {
    const hemi = parsearHemisferio(mIni[1]);
    if (hemi) return { resto: t.slice(mIni[0].length).trim(), hemi };
  }
  return { resto: t, hemi: null };
}

/**
 * Parsea un ángulo: decimal (37.765 / −5,46) o sexagesimal
 * (37°45'55.489" N, 5°27'40.669" O).
 * Devuelve null si el texto no es válido (rechaza vacío → 0).
 */
function aNumero(raw: string): number | null {
  const norm = normalizarSimbolos(raw);
  if (!norm) return null;

  const { resto, hemi } = extraerHemisferio(norm);
  let s = resto.trim();
  if (!s) return null;

  let signoExplicito = 1;
  if (/^[-−–]/.test(s)) {
    signoExplicito = -1;
    s = s.slice(1).trim();
  } else if (s.startsWith("+")) {
    s = s.slice(1).trim();
  }
  if (!s) return null;

  // Hemisferio manda sobre el signo escrito (p. ej. "5°27' O" → negativo).
  const signo = hemi != null ? signoHemisferio(hemi) : signoExplicito;

  const aDecimal = (txt: string): number | null => {
    const n = Number(txt.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  };

  // DMS: 37°45'55.489"  (comillas finales opcionales)
  let m = s.match(/^(\d+)\s*°\s*(\d{1,2})\s*'\s*(\d{1,2}(?:[.,]\d+)?)\s*"?\s*$/);
  if (m) {
    const deg = Number(m[1]);
    const min = Number(m[2]);
    const sec = aDecimal(m[3]);
    if (sec == null || min >= 60 || sec >= 60) return null;
    return signo * (deg + min / 60 + sec / 3600);
  }

  // DM: 37°45.912' o 37°45'
  m = s.match(/^(\d+)\s*°\s*(\d{1,2}(?:[.,]\d+)?)\s*'?\s*$/);
  if (m) {
    const deg = Number(m[1]);
    const min = aDecimal(m[2]);
    if (min == null || min >= 60) return null;
    return signo * (deg + min / 60);
  }

  // Solo grados con símbolo: 37° o −5.46°
  m = s.match(/^(\d+(?:[.,]\d+)?)\s*°\s*$/);
  if (m) {
    const deg = aDecimal(m[1]);
    return deg == null ? null : signo * deg;
  }

  // Tres números sin símbolos: 37 45 55.489
  m = s.match(/^(\d+)\s+(\d{1,2})\s+(\d{1,2}(?:[.,]\d+)?)\s*$/);
  if (m) {
    const deg = Number(m[1]);
    const min = Number(m[2]);
    const sec = aDecimal(m[3]);
    if (sec == null || min >= 60 || sec >= 60) return null;
    return signo * (deg + min / 60 + sec / 3600);
  }

  // Dos números sin símbolos: 37 45.912
  m = s.match(/^(\d+)\s+(\d{1,2}(?:[.,]\d+)?)\s*$/);
  if (m) {
    const deg = Number(m[1]);
    const min = aDecimal(m[2]);
    if (min == null || min >= 60) return null;
    return signo * (deg + min / 60);
  }

  // Decimal clásico: 37.765 / 37,765 (sin letras ni °)
  if (/^\d+([.,]\d+)?$/.test(s)) {
    const n = aDecimal(s);
    return n == null ? null : signo * n;
  }

  return null;
}

/**
 * Acepta dos campos (lat / lng) o un solo texto "39.986, -0.049".
 * También sexagesimal: 37°45'55.489" N y 5°27'40.669" O (Oeste).
 * Coma decimal europea o punto anglosajón.
 */
export function parsearLatLng(
  latRaw: string,
  lngRaw?: string
): { ok: true; coords: Coords } | { ok: false; error: string } {
  const latTrim = latRaw.trim();
  const lngTrim = (lngRaw ?? "").trim();

  let latStr = latTrim;
  let lngStr = lngTrim;

  if (!lngStr) {
    // Un solo campo: "39.986, -0.049" o "37°45'55\" N; 5°27'40\" O"
    const partes = latTrim.split(/;|,/).map((p) => p.trim()).filter(Boolean);
    if (partes.length === 2) {
      latStr = partes[0];
      lngStr = partes[1];
    } else {
      // Separación por hemisferios: "... N ... O"
      const porHemi = latTrim.match(
        /^(.+?\s(?:N|S|Norte|Sur|North|South))\s+(.+?\s(?:E|O|W|Este|Oeste|East|West))$/i
      );
      if (porHemi) {
        latStr = porHemi[1].trim();
        lngStr = porHemi[2].trim();
      } else {
        const espacios = latTrim.split(/\s+/).filter(Boolean);
        if (espacios.length === 2) {
          latStr = espacios[0];
          lngStr = espacios[1];
        }
      }
    }
  }

  if (!latStr || !lngStr) {
    return {
      ok: false,
      error:
        "Introduce latitud y longitud (ej. 39.986 y −0.049, o 37°45'55\" N y 5°27'40\" O).",
    };
  }

  const lat = aNumero(latStr);
  const lng = aNumero(lngStr);
  if (lat == null || lng == null) {
    return {
      ok: false,
      error:
        "Introduce latitud y longitud (ej. 39.986 y −0.049, o 37°45'55\" N y 5°27'40\" O).",
    };
  }
  if (lat < -90 || lat > 90) {
    return { ok: false, error: "La latitud debe estar entre −90 y 90." };
  }
  if (lng < -180 || lng > 180) {
    return { ok: false, error: "La longitud debe estar entre −180 y 180." };
  }
  return { ok: true, coords: { lat, lng } };
}

export function formatearCoords(lat: number, lng: number, digitos = 5): string {
  return `${lat.toFixed(digitos)}, ${lng.toFixed(digitos)}`;
}
