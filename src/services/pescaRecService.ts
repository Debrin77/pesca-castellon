import { Linking, Platform } from "react-native";
import { ENLACES_PERMISOS } from "../data/permisosCoto";

export function debeMostrarPescaRec(ambito?: "continental" | "maritimo", modalidad?: string): boolean {
  if (ambito === "maritimo") return true;
  if (modalidad === "embarcacion" || modalidad === "submarina" || modalidad === "kayak" || modalidad === "orilla_mar") {
    return true;
  }
  return false;
}

export const TEXTO_PESCA_REC =
  "Desde 2026, PescaREC (Ministerio) es la vía oficial para declaraciones y autorizaciones de pesca marítima recreativa estatal (especies de protección diferenciada, reservas, etc.).";

export async function abrirPescaRecInfo(): Promise<void> {
  await Linking.openURL(ENLACES_PERMISOS.pescaRec);
}

export async function abrirPescaRecTienda(): Promise<void> {
  const url =
    Platform.OS === "ios" ? ENLACES_PERMISOS.pescaRecStoreIos : ENLACES_PERMISOS.pescaRecStoreAndroid;
  try {
    await Linking.openURL(url);
  } catch {
    await abrirPescaRecInfo();
  }
}
