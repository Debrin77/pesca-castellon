import * as Location from "expo-location";

export async function solicitarPermisoUbicacion(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === "granted";
}

export type CancelarSuscripcion = () => void;

/**
 * Se suscribe a las actualizaciones de posición del usuario mientras la
 * pantalla esté abierta (foreground). Devuelve una función para cancelar
 * la suscripción cuando el componente se desmonte.
 */
export async function suscribirseUbicacion(
  onUpdate: (lat: number, lng: number, precisionM: number | null) => void
): Promise<CancelarSuscripcion> {
  const sub = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: 4000,
      distanceInterval: 15,
    },
    (loc) => {
      onUpdate(loc.coords.latitude, loc.coords.longitude, loc.coords.accuracy ?? null);
    }
  );
  return () => sub.remove();
}

export async function obtenerUbicacionActual(): Promise<{ lat: number; lng: number } | null> {
  try {
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    return { lat: loc.coords.latitude, lng: loc.coords.longitude };
  } catch {
    return null;
  }
}
