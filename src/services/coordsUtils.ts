/** Validación y parseo de coordenadas lat/lng introducidas a mano. */

export type Coords = { lat: number; lng: number };

function aNumero(raw: string): number {
  return Number(raw.trim().replace(",", "."));
}

/**
 * Acepta dos campos (lat / lng) o un solo texto "39.986, -0.049".
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
    // Un solo campo: "39.986, -0.049" o "39,986; -0,049"
    const partes = latTrim.split(/[;]/).map((p) => p.trim()).filter(Boolean);
    if (partes.length === 2) {
      latStr = partes[0];
      lngStr = partes[1];
    } else {
      const espacios = latTrim.split(/\s+/).filter(Boolean);
      if (espacios.length === 2) {
        latStr = espacios[0];
        lngStr = espacios[1];
      }
    }
  }

  const lat = aNumero(latStr);
  const lng = aNumero(lngStr);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { ok: false, error: "Introduce latitud y longitud numéricas (ej. 39.986 y −0.049)." };
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
