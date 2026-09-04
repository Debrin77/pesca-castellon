import icv from "../data/icvPescaCastellon.json";
import sevillaOficial from "../provincias/sevilla/pescaOficial.json";
import { getProvinciaActiva } from "../provincias/runtime";
import { distanciaKm } from "./geoService";

export type CapaIcv = "zpc" | "zrtc" | "zra" | "refugio" | "zpl";

export interface PoligonoIcv {
  capa: CapaIcv;
  id: string;
  nombre: string;
  matricula: string | null;
  masa: string | null;
  vocacion: string | null;
  tramoId: string | null;
  estrecho?: boolean;
  bufferM?: number;
}

export const FUENTE_ICV =
  "Cartografía ICV (WFS Caza y Pesca) · CC BY 4.0. QGIS puede reexportar el mismo GeoPackage oficial.";

export const FUENTE_DERA_SEVILLA =
  "IECA / Junta de Andalucía · DERA 08_10_CotosPesca · CC BY 4.0. Orden 13/01/2023 (BOJA nº 15).";

export function fuentePoligonosOficiales(): string {
  return getProvinciaActiva().id === "sevilla" ? FUENTE_DERA_SEVILLA : FUENTE_ICV;
}

export function poligonosIcv(): { type: string; properties: PoligonoIcv; geometry: { type: string; coordinates: any } }[] {
  const p = getProvinciaActiva();
  if (p.id === "sevilla") return sevillaOficial.features as any;
  return icv.features as any;
}

function puntoEnAnillo(lng: number, lat: number, ring: number[][]): boolean {
  let dentro = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0],
      yi = ring[i][1];
    const xj = ring[j][0],
      yj = ring[j][1];
    const cruza = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi + 1e-18) + xi;
    if (cruza) dentro = !dentro;
  }
  return dentro;
}

function puntoEnPoligono(lng: number, lat: number, poly: number[][][]): boolean {
  if (!poly[0] || !puntoEnAnillo(lng, lat, poly[0])) return false;
  for (let h = 1; h < poly.length; h++) {
    if (puntoEnAnillo(lng, lat, poly[h])) return false;
  }
  return true;
}

export function puntoEnGeometria(lng: number, lat: number, geom: { type: string; coordinates: any }): boolean {
  if (geom.type === "Polygon") return puntoEnPoligono(lng, lat, geom.coordinates);
  if (geom.type === "MultiPolygon") {
    return geom.coordinates.some((poly: number[][][]) => puntoEnPoligono(lng, lat, poly));
  }
  return false;
}

function distPuntoSegM(lat: number, lng: number, a: number[], b: number[]): number {
  const lat1 = a[1],
    lng1 = a[0],
    lat2 = b[1],
    lng2 = b[0];
  const vx = lng2 - lng1;
  const vy = lat2 - lat1;
  const wx = lng - lng1;
  const wy = lat - lat1;
  const c2 = vx * vx + vy * vy;
  const t = c2 === 0 ? 0 : Math.max(0, Math.min(1, (wx * vx + wy * vy) / c2));
  return distanciaKm(lat, lng, lat1 + t * vy, lng1 + t * vx) * 1000;
}

function distAAnilloM(lat: number, lng: number, ring: number[][]): number {
  let min = Infinity;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    min = Math.min(min, distPuntoSegM(lat, lng, ring[j], ring[i]));
  }
  return min;
}

function distAGeomM(lat: number, lng: number, geom: { type: string; coordinates: any }): number {
  const polys = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
  let min = Infinity;
  for (const poly of polys) {
    if (puntoEnPoligono(lng, lat, poly)) return 0;
    min = Math.min(min, distAAnilloM(lat, lng, poly[0]));
  }
  return min;
}

/** Refugios / reservas primero; cotos después; aguas libres cartografiadas al final. */
const ORDEN: CapaIcv[] = ["refugio", "zrtc", "zra", "zpc", "zpl"];

export function buscarPoligonoIcv(lat: number, lng: number): PoligonoIcv | null {
  const candidatos: { props: PoligonoIcv; d: number }[] = [];
  for (const ft of poligonosIcv()) {
    const d = distAGeomM(lat, lng, ft.geometry);
    const buffer = ft.properties.bufferM ?? (ft.properties.estrecho ? 60 : 22);
    if (d <= buffer) candidatos.push({ props: ft.properties as PoligonoIcv, d });
  }
  candidatos.sort((a, b) => {
    const oa = ORDEN.indexOf(a.props.capa);
    const ob = ORDEN.indexOf(b.props.capa);
    if (oa !== ob) return oa - ob;
    return a.d - b.d;
  });
  return candidatos[0]?.props ?? null;
}

export function matriculasConPoligono(): Set<string> {
  return new Set(
    poligonosIcv()
      .filter((f) => f.properties.capa === "zpc" && f.properties.matricula)
      .map((f) => f.properties.matricula as string)
  );
}

export function tramosConPoligono(): Set<string> {
  return new Set(poligonosIcv().map((f) => f.properties.tramoId).filter(Boolean) as string[]);
}

export function colorCapaIcv(capa: CapaIcv): string {
  if (capa === "zpc") return "#9a4a0a";
  if (capa === "zpl") return "#1a6b3c";
  return "#b42318";
}
