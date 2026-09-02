import zones from "../data/zones.json";

/** Distancia en km entre dos coordenadas (fórmula de Haversine). */
export function distanciaKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Distancia en km de un punto al segmento AB (aprox. local). */
export function distanciaPuntoASegmentoKm(
  lat: number,
  lng: number,
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const toXY = (p: { lat: number; lng: number }) => ({
    x: ((p.lng - lng) * Math.PI / 180) * Math.cos((lat * Math.PI) / 180) * 6371,
    y: ((p.lat - lat) * Math.PI / 180) * 6371,
  });
  const A = toXY(a);
  const B = toXY(b);
  const vx = B.x - A.x;
  const vy = B.y - A.y;
  const len2 = vx * vx + vy * vy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, (-A.x * vx - A.y * vy) / len2));
  const dx = A.x + t * vx;
  const dy = A.y + t * vy;
  return Math.sqrt(dx * dx + dy * dy);
}

export function distanciaAPolylineKm(
  lat: number,
  lng: number,
  linea: { lat: number; lng: number }[]
): number {
  if (linea.length === 1) return distanciaKm(lat, lng, linea[0].lat, linea[0].lng);
  let mejor = Infinity;
  for (let i = 0; i < linea.length - 1; i++) {
    mejor = Math.min(mejor, distanciaPuntoASegmentoKm(lat, lng, linea[i], linea[i + 1]));
  }
  return mejor;
}

/** Ray casting. Anillo cerrado o abierto. */
export function puntoEnPoligono(lat: number, lng: number, anillo: { lat: number; lng: number }[]): boolean {
  if (anillo.length < 3) return false;
  let dentro = false;
  for (let i = 0, j = anillo.length - 1; i < anillo.length; j = i++) {
    const yi = anillo[i].lat;
    const xi = anillo[i].lng;
    const yj = anillo[j].lat;
    const xj = anillo[j].lng;
    const cruza = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi + 1e-12) + xi;
    if (cruza) dentro = !dentro;
  }
  return dentro;
}

export interface ResultadoUbicacion {
  zona: any | null;
  distanciaKm: number | null;
  dentroDelRadio: boolean;
}

/** Distancia (km) a partir de la cual avisamos "te estás acercando". */
export const DISTANCIA_AVISO_KM = 1.2;

export type EstadoProximidad =
  | "dentro_coto"
  | "cerca_coto"
  | "dentro_libre"
  | "cerca_libre"
  | "sin_datos";

export interface ProximidadResultado {
  estado: EstadoProximidad;
  zona: any | null;
  distanciaKm: number | null;
  /** Zona libre_sin_muerte más cercana (aunque el estado principal sea otro), para sugerirla. */
  zonaLibreCercana: any | null;
  distanciaZonaLibreKm: number | null;
}

/**
 * Evalúa, para un punto (normalmente la ubicación en vivo del usuario),
 * si está dentro o cerca de una zona controlada (coto) o de una zona
 * libre_sin_muerte conocida. Prioriza avisar de cotos (para no pescar
 * donde no toca) sobre señalar zonas libres.
 */
export function evaluarProximidad(lat: number, lng: number): ProximidadResultado {
  let cotoMasCercano: any = null;
  let distCoto = Infinity;
  let libreMasCercana: any = null;
  let distLibre = Infinity;

  for (const zona of zones as any[]) {
    const d = distanciaKm(lat, lng, zona.lat, zona.lng);
    const esLibre = zona.estadoZona === "libre_sin_muerte";
    if (esLibre) {
      if (d < distLibre) {
        distLibre = d;
        libreMasCercana = zona;
      }
    } else {
      if (d < distCoto) {
        distCoto = d;
        cotoMasCercano = zona;
      }
    }
  }

  // Prioridad 1: dentro o cerca de un COTO (lo más importante de avisar)
  if (cotoMasCercano) {
    const radio = cotoMasCercano.radioAproxKm ?? 3;
    if (distCoto <= radio) {
      return {
        estado: "dentro_coto",
        zona: cotoMasCercano,
        distanciaKm: distCoto,
        zonaLibreCercana: libreMasCercana,
        distanciaZonaLibreKm: libreMasCercana ? distLibre : null,
      };
    }
    if (distCoto <= radio + DISTANCIA_AVISO_KM) {
      return {
        estado: "cerca_coto",
        zona: cotoMasCercano,
        distanciaKm: distCoto,
        zonaLibreCercana: libreMasCercana,
        distanciaZonaLibreKm: libreMasCercana ? distLibre : null,
      };
    }
  }

  // Prioridad 2: dentro o cerca de una zona LIBRE conocida
  if (libreMasCercana) {
    const radio = libreMasCercana.radioAproxKm ?? 2;
    if (distLibre <= radio) {
      return {
        estado: "dentro_libre",
        zona: libreMasCercana,
        distanciaKm: distLibre,
        zonaLibreCercana: libreMasCercana,
        distanciaZonaLibreKm: distLibre,
      };
    }
    if (distLibre <= radio + DISTANCIA_AVISO_KM) {
      return {
        estado: "cerca_libre",
        zona: libreMasCercana,
        distanciaKm: distLibre,
        zonaLibreCercana: libreMasCercana,
        distanciaZonaLibreKm: distLibre,
      };
    }
  }

  return {
    estado: "sin_datos",
    zona: null,
    distanciaKm: null,
    zonaLibreCercana: libreMasCercana,
    distanciaZonaLibreKm: libreMasCercana ? distLibre : null,
  };
}

/** Devuelve todas las zonas libre_sin_muerte ordenadas por distancia a un punto. */
export function zonasLibresCercanas(lat: number, lng: number): { zona: any; distanciaKm: number }[] {
  return (zones as any[])
    .filter((z) => z.estadoZona === "libre_sin_muerte")
    .map((z) => ({ zona: z, distanciaKm: distanciaKm(lat, lng, z.lat, z.lng) }))
    .sort((a, b) => a.distanciaKm - b.distanciaKm);
}

/**
 * Dado un punto tocado en el mapa, busca la zona conocida más cercana.
 *
 * IMPORTANTE: esto usa un radio aproximado (círculo) alrededor del
 * centroide de cada zona como sustituto provisional del polígono real
 * del coto (que existe en el WFS oficial de la GVA pero no está
 * embebido aquí por su tamaño). Es una aproximación razonable para una
 * v1, pero cerca de los límites del coto puede equivocarse.
 */
export function buscarZonaMasCercana(
  lat: number,
  lng: number
): ResultadoUbicacion {
  let mejor: any = null;
  let mejorDist = Infinity;

  for (const zona of zones as any[]) {
    const d = distanciaKm(lat, lng, zona.lat, zona.lng);
    if (d < mejorDist) {
      mejorDist = d;
      mejor = zona;
    }
  }

  if (!mejor) return { zona: null, distanciaKm: null, dentroDelRadio: false };

  return {
    zona: mejor,
    distanciaKm: mejorDist,
    dentroDelRadio: mejorDist <= (mejor.radioAproxKm ?? 3),
  };
}
