/**
 * Modo de pesca elegido por el usuario (global en la app).
 * Fija mapa, especies, aparejos y ritual de salida.
 */
export type ModoPescaGlobal = "rio" | "orilla" | "barco";

export type ProvinciaConModo = {
  id: string;
  continentalOnly?: boolean;
};

export function modosDisponibles(provincia: ProvinciaConModo): ModoPescaGlobal[] {
  if (provincia.continentalOnly) return ["rio"];
  if (provincia.id === "castellon") return ["rio", "orilla", "barco"];
  // Otras con costa futura: orilla sin barco hasta que haya catálogo.
  return ["rio", "orilla"];
}

export function etiquetaModo(modo: ModoPescaGlobal): string {
  if (modo === "orilla") return "Orilla";
  if (modo === "barco") return "Barco";
  return "Río";
}

export function etiquetaModoLarga(modo: ModoPescaGlobal): string {
  if (modo === "orilla") return "Costa / orilla";
  if (modo === "barco") return "Embarcación / kayak";
  return "Ríos y embalses";
}

export function subtituloModo(modo: ModoPescaGlobal): string {
  if (modo === "orilla") return "Desde tierra · licencia marítima";
  if (modo === "barco") return "Kayak o barco · no uses normas de orilla";
  return "Licencia continental · ríos y embalses";
}

/** Mapa: continental vs costa (barco también mira al mar). */
export function modoAMapaModo(modo: ModoPescaGlobal): "continental" | "costa" {
  return modo === "rio" ? "continental" : "costa";
}

/** Aparejos usa costa (no «orilla») como ámbito de catálogo. */
export function modoAAparejoAmbito(modo: ModoPescaGlobal): "rio" | "costa" | "barco" {
  if (modo === "orilla") return "costa";
  if (modo === "barco") return "barco";
  return "rio";
}

export function modoEsMar(modo: ModoPescaGlobal): boolean {
  return modo === "orilla" || modo === "barco";
}

export function modoAMedioSalida(modo: ModoPescaGlobal): "continental" | "maritimo" | "embarcacion" {
  if (modo === "orilla") return "maritimo";
  if (modo === "barco") return "embarcacion";
  return "continental";
}

export function modoPorDefecto(provincia: ProvinciaConModo): ModoPescaGlobal {
  return modosDisponibles(provincia)[0] ?? "rio";
}

export function esModoPescaGlobal(v: unknown): v is ModoPescaGlobal {
  return v === "rio" || v === "orilla" || v === "barco";
}
