import { Platform } from "react-native";
import * as Location from "expo-location";

export async function solicitarPermisoUbicacion(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === "granted") return true;
  } catch {
    /* en web el diálogo lo lanza getCurrentPosition */
  }
  if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.geolocation) {
    return true;
  }
  return false;
}

export type CancelarSuscripcion = () => void;

function desdeNavegador(): Promise<{ lat: number; lng: number } | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return Promise.resolve(null);
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 8000 }
    );
  });
}

export async function obtenerUbicacionActual(): Promise<{ lat: number; lng: number } | null> {
  try {
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return { lat: loc.coords.latitude, lng: loc.coords.longitude };
  } catch {
    return desdeNavegador();
  }
}

export async function suscribirseUbicacion(
  onUpdate: (lat: number, lng: number, precisionM: number | null) => void
): Promise<CancelarSuscripcion> {
  try {
    const sub = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
        distanceInterval: 20,
      },
      (loc) => {
        onUpdate(loc.coords.latitude, loc.coords.longitude, loc.coords.accuracy ?? null);
      }
    );
    return () => sub.remove();
  } catch {
    if (typeof navigator === "undefined" || !navigator.geolocation) return () => undefined;
    const id = navigator.geolocation.watchPosition(
      (p) => onUpdate(p.coords.latitude, p.coords.longitude, p.coords.accuracy ?? null),
      () => undefined,
      { enableHighAccuracy: true, maximumAge: 8000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }
}
