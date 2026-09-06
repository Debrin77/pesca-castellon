import { Platform, Linking } from "react-native";

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

export async function abrirEnMaps(lat: number, lng: number, etiqueta?: string): Promise<void> {
  const url = urlMaps(lat, lng, etiqueta);
  try {
    await Linking.openURL(url);
  } catch {
    await Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
  }
}
