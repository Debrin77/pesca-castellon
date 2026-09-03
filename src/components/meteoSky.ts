/**
 * Cielos tipo app Tiempo (iPhone).
 * Los degradados se mantienen vivos pero lo bastante oscuros
 * para texto blanco; el cristal oscuro garantiza lectura en cualquier cielo.
 */
export type TipoMeteo =
  | "sol"
  | "solNubes"
  | "nubes"
  | "lluvia"
  | "tormenta"
  | "niebla"
  | "nieve";

export function tipoMeteoDeCodigo(codigo: number): TipoMeteo {
  if (codigo === 0) return "sol";
  if (codigo === 1 || codigo === 2) return "solNubes";
  if (codigo === 3) return "nubes";
  if (codigo === 45 || codigo === 48) return "niebla";
  if ([71, 73, 75].includes(codigo)) return "nieve";
  if ([95, 96, 99, 82].includes(codigo)) return "tormenta";
  if ([51, 53, 55, 61, 63, 65, 80, 81].includes(codigo)) return "lluvia";
  return "nubes";
}

export type CieloMeteo = {
  gradient: readonly [string, string, string];
  /** Panel translúcido oscuro: texto blanco ≥4.5:1 encima. */
  glass: string;
  glassBorder: string;
  chip: string;
  chipOn: string;
  label: string;
};

const GLASS = "rgba(10, 24, 42, 0.62)";
const GLASS_BORDER = "rgba(255,255,255,0.28)";
const CHIP = "rgba(10, 24, 42, 0.45)";
const CHIP_ON = "rgba(10, 24, 42, 0.72)";

export function cieloDeCodigo(codigo: number): CieloMeteo {
  const tipo = tipoMeteoDeCodigo(codigo);
  switch (tipo) {
    case "sol":
      return {
        gradient: ["#0d5bb5", "#2f8de0", "#5eb0f0"],
        glass: GLASS,
        glassBorder: GLASS_BORDER,
        chip: CHIP,
        chipOn: CHIP_ON,
        label: "Despejado",
      };
    case "solNubes":
      return {
        gradient: ["#1f6ab0", "#4a96d0", "#7eb8e0"],
        glass: GLASS,
        glassBorder: GLASS_BORDER,
        chip: CHIP,
        chipOn: CHIP_ON,
        label: "Intervalos",
      };
    case "nubes":
      return {
        gradient: ["#3a5570", "#5a7594", "#7a96b0"],
        glass: GLASS,
        glassBorder: GLASS_BORDER,
        chip: CHIP,
        chipOn: CHIP_ON,
        label: "Nublado",
      };
    case "niebla":
      return {
        gradient: ["#4a5666", "#657282", "#8490a0"],
        glass: GLASS,
        glassBorder: GLASS_BORDER,
        chip: CHIP,
        chipOn: CHIP_ON,
        label: "Niebla",
      };
    case "lluvia":
      return {
        gradient: ["#243d58", "#3a5a78", "#5a7a96"],
        glass: GLASS,
        glassBorder: GLASS_BORDER,
        chip: CHIP,
        chipOn: CHIP_ON,
        label: "Lluvia",
      };
    case "tormenta":
      return {
        gradient: ["#141c2c", "#243248", "#3a4a62"],
        glass: GLASS,
        glassBorder: GLASS_BORDER,
        chip: CHIP,
        chipOn: CHIP_ON,
        label: "Tormenta",
      };
    case "nieve":
      return {
        gradient: ["#3d5368", "#5a738c", "#7a93aa"],
        glass: GLASS,
        glassBorder: GLASS_BORDER,
        chip: CHIP,
        chipOn: CHIP_ON,
        label: "Nieve",
      };
  }
}
