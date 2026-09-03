export type NombreIcono =
  | "home"
  | "water"
  | "fish"
  | "construct"
  | "partly-sunny"
  | "bookmark"
  | "book";

/**
 * Color propio de cada pestaña (etiqueta + tint del orbe).
 * Valores oscurecidos para ≥4.5:1 sobre el vidrio claro de la barra.
 */
export const COLOR_TAB: Record<NombreIcono, string> = {
  home: "#164a36",
  water: "#1a6f8a",
  fish: "#246b3d",
  construct: "#9a4a0a",
  book: "#5a3d82",
  "partly-sunny": "#7a5c0d",
  bookmark: "#b42318",
};
