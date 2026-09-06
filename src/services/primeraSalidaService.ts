import AsyncStorage from "@react-native-async-storage/async-storage";

const K = {
  wizardHecho: "@pesca/primera_salida_hecha",
  licenciaOk: "@pesca/licencia_marcada_ok",
  gpsSheet: "@pesca/gps_sheet_visto",
  checklist: "@pesca/checklist_ticks",
} as const;

export async function primeraSalidaHecha(): Promise<boolean> {
  return (await AsyncStorage.getItem(K.wizardHecho)) === "1";
}

export async function marcarPrimeraSalidaHecha(): Promise<void> {
  await AsyncStorage.setItem(K.wizardHecho, "1");
}

/** El usuario confirma que ya tiene licencia (aunque no la haya guardado en el móvil). */
export async function licenciaMarcadaOk(): Promise<boolean> {
  return (await AsyncStorage.getItem(K.licenciaOk)) === "1";
}

export async function marcarLicenciaOk(valor = true): Promise<void> {
  if (valor) await AsyncStorage.setItem(K.licenciaOk, "1");
  else await AsyncStorage.removeItem(K.licenciaOk);
}

export async function gpsSheetVisto(): Promise<boolean> {
  return (await AsyncStorage.getItem(K.gpsSheet)) === "1";
}

export async function marcarGpsSheetVisto(): Promise<void> {
  await AsyncStorage.setItem(K.gpsSheet, "1");
}

export async function leerChecklistTicks(provinciaId: string): Promise<Record<string, boolean>> {
  try {
    const raw = await AsyncStorage.getItem(`${K.checklist}:${provinciaId}`);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export async function guardarChecklistTicks(
  provinciaId: string,
  ticks: Record<string, boolean>
): Promise<void> {
  await AsyncStorage.setItem(`${K.checklist}:${provinciaId}`, JSON.stringify(ticks));
}
