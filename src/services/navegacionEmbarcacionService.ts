/**
 * Navegación ligera para pesca embarcada (no plotter):
 * profundidad orientativa, rumbo/distancia, ETA a puerto, waypoints privados.
 */
import playasData from "../data/playasEspigonesCosta.json";
import { distanciaKm, distanciaAPolylineKm } from "./geoService";
import { rampaMasCercana, type RampaEmbarcacion } from "./consultaEmbarcacionService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getProvinciaIdActiva } from "../provincias/runtime";

export type WaypointMarino = {
  id: string;
  nombre: string;
  lat: number;
  lng: number;
  nota?: string;
  profundidadM?: number | null;
  creadoEn: string;
};

function claveWaypoints(): string {
  return `waypoints_marinos_${getProvinciaIdActiva()}`;
}

/**
 * Profundidad orientativa en la plataforma costera de Castellón.
 * Heurística por distancia a la orilla (no carta náutica).
 */
export function estimarProfundidadMarCastellon(lat: number, lng: number): {
  profundidadM: number | null;
  etiqueta: string;
  isobataAprox: string;
} {
  const linea = (playasData as { lineaCosta: { lat: number; lng: number }[] }).lineaCosta;
  if (!linea?.length) {
    return { profundidadM: null, etiqueta: "Sin línea de costa", isobataAprox: "—" };
  }
  const km = distanciaAPolylineKm(lat, lng, linea);
  // Tierra / playa
  if (km < 0.05) {
    return { profundidadM: 0, etiqueta: "En orilla / seco (orientativo)", isobataAprox: "0 m" };
  }
  // Perfil típico plataforma Castellón (muy aproximado)
  let profundidadM: number;
  if (km < 1) profundidadM = 2 + km * 8;
  else if (km < 3) profundidadM = 10 + (km - 1) * 8;
  else if (km < 8) profundidadM = 26 + (km - 3) * 5;
  else if (km < 20) profundidadM = 50 + (km - 8) * 4;
  else profundidadM = 100 + (km - 20) * 2;

  profundidadM = Math.round(profundidadM);
  let isobataAprox = ">100 m";
  if (profundidadM <= 5) isobataAprox = "≈5 m";
  else if (profundidadM <= 10) isobataAprox = "≈10 m";
  else if (profundidadM <= 20) isobataAprox = "≈20 m";
  else if (profundidadM <= 50) isobataAprox = "≈50 m";
  else if (profundidadM <= 100) isobataAprox = "≈100 m";

  return {
    profundidadM,
    etiqueta: `~${profundidadM} m (orientativo · ${km.toFixed(1)} km de orilla)`,
    isobataAprox,
  };
}

/** Rumbo inicial (grados 0–360) de A → B. */
export function rumboGrados(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lng2 - lng1);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  return ((θ * 180) / Math.PI + 360) % 360;
}

export function rumboCardinal(grados: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
  const i = Math.round(grados / 45) % 8;
  return dirs[i];
}

/**
 * ETA al puerto/rampa más cercano (o uno elegido).
 * velocidadKn por defecto 5 kn (kayak/barco lento).
 */
export function etaAPuerto(
  lat: number,
  lng: number,
  opts?: { rampa?: RampaEmbarcacion; velocidadKn?: number }
): {
  rampa: RampaEmbarcacion;
  km: number;
  rumbo: number;
  rumboTxt: string;
  minutos: number;
  etiqueta: string;
} | null {
  const hit = opts?.rampa
    ? { rampa: opts.rampa, km: distanciaKm(lat, lng, opts.rampa.lat, opts.rampa.lng) }
    : rampaMasCercana(lat, lng);
  if (!hit) return null;
  const kn = opts?.velocidadKn ?? 5;
  const nm = hit.km / 1.852;
  const horas = nm / Math.max(0.5, kn);
  const minutos = Math.round(horas * 60);
  const rumbo = rumboGrados(lat, lng, hit.rampa.lat, hit.rampa.lng);
  return {
    rampa: hit.rampa,
    km: hit.km,
    rumbo,
    rumboTxt: `${Math.round(rumbo)}° ${rumboCardinal(rumbo)}`,
    minutos,
    etiqueta: `${hit.rampa.nombre} · ${hit.km.toFixed(1)} km · rumbo ${Math.round(rumbo)}° · ETA ~${minutos} min @ ${kn} kn`,
  };
}

export async function listarWaypointsMarinos(): Promise<WaypointMarino[]> {
  try {
    const raw = await AsyncStorage.getItem(claveWaypoints());
    if (!raw) return [];
    const lista = JSON.parse(raw);
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

export async function guardarWaypointMarino(
  w: Omit<WaypointMarino, "id" | "creadoEn">
): Promise<WaypointMarino> {
  const lista = await listarWaypointsMarinos();
  const nuevo: WaypointMarino = {
    ...w,
    id: `wp_${Date.now().toString(36)}`,
    creadoEn: new Date().toISOString(),
  };
  lista.unshift(nuevo);
  await AsyncStorage.setItem(claveWaypoints(), JSON.stringify(lista.slice(0, 80)));
  return nuevo;
}

export async function eliminarWaypointMarino(id: string): Promise<void> {
  const lista = (await listarWaypointsMarinos()).filter((w) => w.id !== id);
  await AsyncStorage.setItem(claveWaypoints(), JSON.stringify(lista));
}
