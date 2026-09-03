import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Almacén sensible: SecureStore en iOS/Android; AsyncStorage en web
 * (el navegador no tiene keychain nativo).
 */
export async function kvGet(clave: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return AsyncStorage.getItem(clave);
  }
  const SecureStore = await import("expo-secure-store");
  return SecureStore.getItemAsync(clave);
}

export async function kvSet(clave: string, valor: string): Promise<void> {
  if (Platform.OS === "web") {
    await AsyncStorage.setItem(clave, valor);
    return;
  }
  const SecureStore = await import("expo-secure-store");
  await SecureStore.setItemAsync(clave, valor);
}

export async function kvDelete(clave: string): Promise<void> {
  if (Platform.OS === "web") {
    await AsyncStorage.removeItem(clave);
    return;
  }
  const SecureStore = await import("expo-secure-store");
  await SecureStore.deleteItemAsync(clave);
}
