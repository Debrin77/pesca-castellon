import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { kvDelete, kvGet, kvSet } from "./secureKv";

const CLAVE_CONFIG = "@pesca_castellon/acceso_config";
const CLAVE_HASH = "@pesca_castellon/acceso_hash";

export interface AccesoConfig {
  bloqueoActivo: boolean;
  biometriaActiva: boolean;
  salt: string;
}

export interface CapacidadBiometria {
  disponible: boolean;
  enrolada: boolean;
  etiqueta: string;
  detalle: string;
}

const CONFIG_OFF: AccesoConfig = {
  bloqueoActivo: false,
  biometriaActiva: false,
  salt: "",
};

function nuevoSalt(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

async function hashear(contrasena: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `pesca-cs|${salt}|${contrasena}`
  );
}

export async function obtenerConfigAcceso(): Promise<AccesoConfig> {
  try {
    const raw = await AsyncStorage.getItem(CLAVE_CONFIG);
    if (!raw) return { ...CONFIG_OFF };
    const parsed = JSON.parse(raw) as AccesoConfig;
    return {
      bloqueoActivo: !!parsed.bloqueoActivo,
      biometriaActiva: !!parsed.biometriaActiva,
      salt: typeof parsed.salt === "string" ? parsed.salt : "",
    };
  } catch {
    return { ...CONFIG_OFF };
  }
}

async function guardarConfig(cfg: AccesoConfig): Promise<void> {
  await AsyncStorage.setItem(CLAVE_CONFIG, JSON.stringify(cfg));
}

export async function activarBloqueoConContrasena(contrasena: string): Promise<void> {
  const limpia = contrasena.trim();
  if (limpia.length < 4) {
    throw new Error("La contraseña debe tener al menos 4 caracteres.");
  }
  const salt = nuevoSalt();
  const hash = await hashear(limpia, salt);
  await kvSet(CLAVE_HASH, hash);
  await guardarConfig({
    bloqueoActivo: true,
    biometriaActiva: false,
    salt,
  });
}

export async function cambiarContrasena(actual: string, nueva: string): Promise<void> {
  const ok = await verificarContrasena(actual);
  if (!ok) throw new Error("La contraseña actual no es correcta.");
  const limpia = nueva.trim();
  if (limpia.length < 4) {
    throw new Error("La nueva contraseña debe tener al menos 4 caracteres.");
  }
  const cfg = await obtenerConfigAcceso();
  const salt = nuevoSalt();
  const hash = await hashear(limpia, salt);
  await kvSet(CLAVE_HASH, hash);
  await guardarConfig({ ...cfg, bloqueoActivo: true, salt });
}

export async function desactivarBloqueo(contrasena: string): Promise<void> {
  const ok = await verificarContrasena(contrasena);
  if (!ok) throw new Error("Contraseña incorrecta.");
  await kvDelete(CLAVE_HASH);
  await guardarConfig({ ...CONFIG_OFF });
}

export async function verificarContrasena(contrasena: string): Promise<boolean> {
  const cfg = await obtenerConfigAcceso();
  if (!cfg.bloqueoActivo || !cfg.salt) return false;
  const guardado = await kvGet(CLAVE_HASH);
  if (!guardado) return false;
  const candidato = await hashear(contrasena.trim(), cfg.salt);
  return candidato === guardado;
}

export async function setBiometriaActiva(activa: boolean): Promise<void> {
  const cfg = await obtenerConfigAcceso();
  if (!cfg.bloqueoActivo) {
    throw new Error("Activa primero una contraseña.");
  }
  if (activa) {
    const cap = await capacidadBiometria();
    if (!cap.disponible || !cap.enrolada) {
      throw new Error(cap.detalle || "La biometría no está disponible en este dispositivo.");
    }
  }
  await guardarConfig({ ...cfg, biometriaActiva: activa });
}

export async function capacidadBiometria(): Promise<CapacidadBiometria> {
  if (Platform.OS === "web") {
    return {
      disponible: false,
      enrolada: false,
      etiqueta: "Face ID / huella",
      detalle: "El reconocimiento facial o la huella solo están disponibles en la app instalada (iOS/Android), no en el navegador.",
    };
  }

  try {
    const LocalAuthentication = await import("expo-local-authentication");
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolada = compatible ? await LocalAuthentication.isEnrolledAsync() : false;
    const tipos = compatible
      ? await LocalAuthentication.supportedAuthenticationTypesAsync()
      : [];
    const facial = tipos.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
    const huella = tipos.includes(LocalAuthentication.AuthenticationType.FINGERPRINT);
    let etiqueta = "Biometría";
    if (facial && huella) etiqueta = "Face ID / huella";
    else if (facial) etiqueta = Platform.OS === "ios" ? "Face ID" : "Reconocimiento facial";
    else if (huella) etiqueta = Platform.OS === "ios" ? "Touch ID" : "Huella dactilar";

    let detalle = "";
    if (!compatible) detalle = "Este dispositivo no tiene sensor biométrico.";
    else if (!enrolada) detalle = "No hay Face ID / huella configurados en el sistema. Configúralos en Ajustes del teléfono.";

    return { disponible: compatible, enrolada, etiqueta, detalle };
  } catch {
    return {
      disponible: false,
      enrolada: false,
      etiqueta: "Biometría",
      detalle: "No se pudo comprobar la biometría en este dispositivo.",
    };
  }
}

export async function autenticarConBiometria(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    const LocalAuthentication = await import("expo-local-authentication");
    const cfg = await obtenerConfigAcceso();
    if (!cfg.bloqueoActivo || !cfg.biometriaActiva) return false;
    const cap = await capacidadBiometria();
    if (!cap.disponible || !cap.enrolada) return false;

    const resultado = await LocalAuthentication.authenticateAsync({
      promptMessage: "Desbloquear Pesca Castellón",
      cancelLabel: "Usar contraseña",
      disableDeviceFallback: true,
      fallbackLabel: "Contraseña",
    });
    return resultado.success;
  } catch {
    return false;
  }
}
