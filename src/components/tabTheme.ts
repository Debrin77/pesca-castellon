export type NombreIcono =
  | "home"
  | "water"
  | "fish"
  | "construct"
  | "partly-sunny"
  | "bookmark"
  | "book";

/** Color propio de cada pestaña (se ve a todo color). */
export const COLOR_TAB: Record<NombreIcono, string> = {
  home: "#164a36",
  water: "#1a6f8a",
  fish: "#2f7d4a",
  construct: "#c45c12",
  book: "#6b4c9a",
  "partly-sunny": "#d4a017",
  bookmark: "#b42318",
};
