import { Platform, Linking, Share } from "react-native";

/** Abre Google Maps / Apple Maps / geo: con el punto. */
export function urlMaps(lat: number, lng: number, etiqueta?: string): string {
  const q = etiqueta?.trim() ? encodeURIComponent(etiqueta.trim()) : `${lat},${lng}`;
  if (Platform.OS === "ios") {
    return `http://maps.apple.com/?ll=${lat},${lng}&q=${q}`;
  }
  if (Platform.OS === "android") {
    return `geo:${lat},${lng}?q=${lat},${lng}(${q})`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

/** Enlace https compartible (sirve también como «icono de enlace» en mensajería). */
export function urlMapsCompartible(lat: number, lng: number, etiqueta?: string): string {
  const q = etiqueta?.trim()
    ? `${lat},${lng} (${etiqueta.trim()})`
    : `${lat},${lng}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export async function abrirEnMaps(lat: number, lng: number, etiqueta?: string): Promise<void> {
  const url = urlMaps(lat, lng, etiqueta);
  try {
    await Linking.openURL(url);
  } catch {
    await Linking.openURL(urlMapsCompartible(lat, lng, etiqueta));
  }
}

/** Comparte la ubicación como enlace + coordenadas (sin cuenta en la nube). */
export async function compartirUbicacion(
  lat: number,
  lng: number,
  etiqueta?: string
): Promise<void> {
  const nombre = etiqueta?.trim() || "Punto de pesca";
  const link = urlMapsCompartible(lat, lng, nombre);
  const mensaje = `${nombre}\n${lat.toFixed(5)}, ${lng.toFixed(5)}\n${link}`;
  try {
    await Share.share(
      Platform.OS === "ios"
        ? { message: mensaje, url: link }
        : { message: mensaje, title: nombre }
    );
  } catch {
    // Usuario canceló o Share no disponible.
  }
}
