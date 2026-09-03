/**
 * Cielos tipo app Tiempo (iPhone): degradados según código WMO.
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
  chip: string;
  chipBorder: string;
  glass: string;
  label: string;
};

export function cieloDeCodigo(codigo: number): CieloMeteo {
  const tipo = tipoMeteoDeCodigo(codigo);
  switch (tipo) {
    case "sol":
      return {
        gradient: ["#1c6fd4", "#4aa3ef", "#9ad0f8"],
        chip: "rgba(255,255,255,0.22)",
        chipBorder: "rgba(255,255,255,0.4)",
        glass: "rgba(255,255,255,0.18)",
        label: "Despejado",
      };
    case "solNubes":
      return {
        gradient: ["#3a7fc4", "#6aabd8", "#b7d7ef"],
        chip: "rgba(255,255,255,0.22)",
        chipBorder: "rgba(255,255,255,0.38)",
        glass: "rgba(255,255,255,0.18)",
        label: "Intervalos",
      };
    case "nubes":
      return {
        gradient: ["#4A6F96", "#7A9BB8", "#B7CBDC"],
        chip: "rgba(255,255,255,0.22)",
        chipBorder: "rgba(255,255,255,0.38)",
        glass: "rgba(255,255,255,0.18)",
        label: "Nublado",
      };
    case "niebla":
      return {
        gradient: ["#7a8694", "#a3adb8", "#d2d7dc"],
        chip: "rgba(255,255,255,0.24)",
        chipBorder: "rgba(255,255,255,0.4)",
        glass: "rgba(255,255,255,0.2)",
        label: "Niebla",
      };
    case "lluvia":
      return {
        gradient: ["#2F4F6E", "#4A6F90", "#7A9BB4"],
        chip: "rgba(255,255,255,0.18)",
        chipBorder: "rgba(255,255,255,0.34)",
        glass: "rgba(255,255,255,0.15)",
        label: "Lluvia",
      };
    case "tormenta":
      return {
        gradient: ["#1A2233", "#2C3B55", "#465870"],
        chip: "rgba(255,255,255,0.14)",
        chipBorder: "rgba(255,255,255,0.3)",
        glass: "rgba(255,255,255,0.12)",
        label: "Tormenta",
      };
    case "nieve":
      return {
        gradient: ["#6a8198", "#95aaba", "#d0dbe4"],
        chip: "rgba(255,255,255,0.24)",
        chipBorder: "rgba(255,255,255,0.42)",
        glass: "rgba(255,255,255,0.2)",
        label: "Nieve",
      };
  }
}
