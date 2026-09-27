/**
 * Modo de pesca elegido por el usuario (global en la app).
 * Fija mapa, especies, aparejos y ritual de salida.
 *
 * Continental: Río (orilla) · Embalse (orilla) · Kayak
 * Costa: Orilla · Kayak (desde kayak) · Barco (desde barco)
 */
export type ModoPescaGlobal =
  | "rio"
  | "embalse"
  | "orilla"
  | "barco"
  | "kayak"
  | "kayak_mar";

export type ProvinciaConModo = {
  id: string;
  continentalOnly?: boolean;
};

export type GrupoModoPesca = "continental" | "costa";

export function modosDisponibles(provincia: ProvinciaConModo): ModoPescaGlobal[] {
  if (provincia.continentalOnly) return ["rio", "embalse", "kayak"];
  if (provincia.id === "castellon") {
    return ["rio", "embalse", "orilla", "kayak", "kayak_mar", "barco"];
  }
  // Otras con costa futura: orilla sin barco/kayak mar hasta que haya catálogo.
  return ["rio", "embalse", "orilla"];
}

export function grupoModo(modo: ModoPescaGlobal): GrupoModoPesca {
  if (modo === "orilla" || modo === "barco" || modo === "kayak_mar") return "costa";
  return "continental";
}

export function modosDelGrupo(
  disponibles: ModoPescaGlobal[],
  grupo: GrupoModoPesca
): ModoPescaGlobal[] {
  return disponibles.filter((m) => grupoModo(m) === grupo);
}

export function esModoKayak(modo: ModoPescaGlobal): boolean {
  return modo === "kayak" || modo === "kayak_mar";
}

export function esModoEmbarcado(modo: ModoPescaGlobal): boolean {
  return modo === "barco" || modo === "kayak_mar";
}

export function etiquetaModo(modo: ModoPescaGlobal): string {
  if (modo === "embalse") return "Embalse";
  if (modo === "orilla") return "Orilla";
  if (modo === "barco") return "Barco";
  if (modo === "kayak") return "Kayak";
  if (modo === "kayak_mar") return "Kayak";
  return "Río";
}

export function etiquetaModoLarga(modo: ModoPescaGlobal): string {
  if (modo === "embalse") return "Embalse · desde orilla";
  if (modo === "orilla") return "Costa · desde orilla";
  if (modo === "barco") return "Mar · desde barco";
  if (modo === "kayak") return "Kayak · ríos y embalses";
  if (modo === "kayak_mar") return "Mar · desde kayak";
  return "Río · desde orilla";
}

export function subtituloModo(modo: ModoPescaGlobal): string {
  if (modo === "embalse") return "Orilla del vaso · licencia continental";
  if (modo === "orilla") return "Desde tierra · licencia marítima";
  if (modo === "barco") return "Embarcación matriculada · licencia desde embarcación";
  if (modo === "kayak") {
    return "Remo en embalse/río · DR de navegación + licencia continental";
  }
  if (modo === "kayak_mar") {
    return "Artefacto flotante · licencia marítima desde tierra (no la de barco)";
  }
  return "Caña desde orilla · licencia continental";
}

/** Texto corto bajo el chip (selector agrupado). */
export function pistaModo(modo: ModoPescaGlobal): string {
  if (modo === "embalse") return "Desde orilla";
  if (modo === "orilla") return "Desde tierra";
  if (modo === "barco") return "Desde barco";
  if (modo === "kayak") return "¡A remar!";
  if (modo === "kayak_mar") return "Desde kayak";
  return "Desde orilla";
}

/** Kicker de sección en el selector. */
export function etiquetaGrupoModo(grupo: GrupoModoPesca): string {
  return grupo === "costa" ? "Costa / mar" : "Continental";
}

/** Mapa: continental vs costa. */
export function modoAMapaModo(modo: ModoPescaGlobal): "continental" | "costa" {
  return grupoModo(modo) === "continental" ? "continental" : "costa";
}

/** Aparejos usa costa (no «orilla») como ámbito de catálogo. */
export function modoAAparejoAmbito(modo: ModoPescaGlobal): "rio" | "costa" | "barco" {
  if (modo === "orilla") return "costa";
  if (modo === "barco" || modo === "kayak_mar") return "barco";
  // Kayak continental y orilla de río/embalse → catálogo de río.
  return "rio";
}

export function modoEsMar(modo: ModoPescaGlobal): boolean {
  return grupoModo(modo) === "costa";
}

export function modoAMedioSalida(
  modo: ModoPescaGlobal
): "continental" | "maritimo" | "embarcacion" {
  if (modo === "orilla") return "maritimo";
  if (modo === "barco") return "embarcacion";
  if (modo === "kayak_mar") return "embarcacion";
  return "continental";
}

/**
 * ¿El tipo de zona encaja con el modo continental?
 * Kayak: prioriza embalses (donde hay ficha de navegación), admite río.
 */
export function zonaEncajaModoContinental(
  modo: ModoPescaGlobal,
  tipo?: string | null,
  zoneId?: string | null
): boolean {
  const esEmbalse =
    tipo === "embalse" ||
    (!!zoneId && zoneId.startsWith("embalse")) ||
    (!!tipo && tipo.includes("embalse"));
  const esRio =
    !!tipo &&
    (tipo.startsWith("rio") || tipo === "mixto" || tipo === "mixto_libre" || tipo.includes("rio"));

  if (modo === "embalse") return esEmbalse || (!esRio && !tipo);
  if (modo === "rio") return !esEmbalse;
  if (modo === "kayak") return true; // embalse y río; ranking prioriza embalse
  return true;
}

/** Bonus de ranking: kayak continental favorece embalses con remo. */
export function boostModoZona(
  modo: ModoPescaGlobal,
  tipo?: string | null,
  zoneId?: string | null
): number {
  const esEmbalse =
    tipo === "embalse" || (!!zoneId && zoneId.startsWith("embalse"));
  if (modo === "kayak") return esEmbalse ? 8 : 2;
  if (modo === "embalse") return esEmbalse ? 6 : 0;
  if (modo === "rio") return esEmbalse ? 0 : 4;
  return 0;
}

export function modoPorDefecto(provincia: ProvinciaConModo): ModoPescaGlobal {
  return modosDisponibles(provincia)[0] ?? "rio";
}

/** Texto de ayuda cuando aún no hay modalidad elegida. */
export function textoPedirModo(disponibles: ModoPescaGlobal[]): string {
  const noms = disponibles.map((m) => {
    if (m === "kayak_mar") return "kayak en mar";
    if (m === "kayak") return "kayak";
    return etiquetaModo(m).toLowerCase();
  });
  // Deduplicar «kayak» si salen continental + mar en la frase.
  const uniq: string[] = [];
  for (const n of noms) {
    if (!uniq.includes(n)) uniq.push(n);
  }
  if (uniq.length <= 1) return "Elige cómo vas a pescar";
  if (uniq.length === 2) return `Elige ${uniq[0]} o ${uniq[1]}`;
  return `Elige ${uniq.slice(0, -1).join(", ")} o ${uniq[uniq.length - 1]}`;
}

export function esModoPescaGlobal(v: unknown): v is ModoPescaGlobal {
  return (
    v === "rio" ||
    v === "embalse" ||
    v === "orilla" ||
    v === "barco" ||
    v === "kayak" ||
    v === "kayak_mar"
  );
}
