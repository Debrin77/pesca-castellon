import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const CLAVE_CACHE = "@pesca_castellon/cache_offline_v1";
const CLAVE_ONBOARDING = "@pesca_castellon/onboarding_visto";

export interface CacheOffline {
  actualizadoEn: string;
  clima?: any;
  indiceHoy?: any;
  saih?: any;
  avisos?: any;
  ubicacion?: { lat: number; lng: number };
}

export async function hayConexion(): Promise<boolean> {
  try {
    if (Platform.OS === "web" && typeof navigator !== "undefined") {
      return navigator.onLine !== false;
    }
    const Network = await import("expo-network");
    const estado = await Network.getNetworkStateAsync();
    return !!(estado.isConnected && estado.isInternetReachable !== false);
  } catch {
    return true;
  }
}

export async function leerCacheOffline(): Promise<CacheOffline | null> {
  try {
    const raw = await AsyncStorage.getItem(CLAVE_CACHE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function guardarCacheOffline(parcial: Partial<CacheOffline>): Promise<void> {
  const prev = (await leerCacheOffline()) ?? { actualizadoEn: new Date().toISOString() };
  const next: CacheOffline = {
    ...prev,
    ...parcial,
    actualizadoEn: new Date().toISOString(),
  };
  await AsyncStorage.setItem(CLAVE_CACHE, JSON.stringify(next));
}

export async function onboardingVisto(): Promise<boolean> {
  return (await AsyncStorage.getItem(CLAVE_ONBOARDING)) === "1";
}

export async function marcarOnboardingVisto(): Promise<void> {
  await AsyncStorage.setItem(CLAVE_ONBOARDING, "1");
}

/** Datos locales siempre disponibles sin red (normativa, zonas, especies van en el bundle). */
export function mensajeOfflineCorto(online: boolean, cache: CacheOffline | null): string | null {
  if (online) return null;
  if (cache?.actualizadoEn) {
    const t = new Date(cache.actualizadoEn);
    return `Sin red · mostrando última lectura (${t.toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })})`;
  }
  return "Sin red · mapa y normativa locales disponibles; clima/SAIH se actualizarán al reconectar";
}
