/**
 * Colores e iconos para puntos guardados (estilo Fishing Points, catálogo corto).
 * Los glifos son símbolos tipográficos — sin emoji — para mapa nativo y web.
 */

export type ColorPuntoId =
  | "oro"
  | "bosque"
  | "agua"
  | "terracota"
  | "violeta"
  | "slate"
  | "arena"
  | "rojo";

export type IconoPuntoId =
  | "spot"
  | "orilla"
  | "embalse"
  | "rio"
  | "kayak"
  | "barco"
  | "roca"
  | "rampa"
  | "secreto"
  | "cebo"
  | "puente"
  | "arbol"
  | "pozo"
  | "corriente"
  | "muelle"
  | "faro";

export type ColorPunto = { id: ColorPuntoId; hex: string; label: string };
export type IconoPunto = { id: IconoPuntoId; glyph: string; label: string };

export const COLORES_PUNTO: ColorPunto[] = [
  { id: "oro", hex: "#c4921a", label: "Oro" },
  { id: "bosque", hex: "#164a36", label: "Bosque" },
  { id: "agua", hex: "#1a6f8a", label: "Agua" },
  { id: "terracota", hex: "#a84828", label: "Terracota" },
  { id: "violeta", hex: "#5b2d8e", label: "Violeta" },
  { id: "slate", hex: "#3d4f5c", label: "Pizarra" },
  { id: "arena", hex: "#8a6a3a", label: "Arena" },
  { id: "rojo", hex: "#b33a3a", label: "Rojo" },
];

export const ICONOS_PUNTO: IconoPunto[] = [
  { id: "spot", glyph: "●", label: "Spot" },
  { id: "orilla", glyph: "≈", label: "Orilla" },
  { id: "embalse", glyph: "◇", label: "Embalse" },
  { id: "rio", glyph: "∿", label: "Río" },
  { id: "kayak", glyph: "▴", label: "Kayak" },
  { id: "barco", glyph: "✚", label: "Barco" },
  { id: "roca", glyph: "▲", label: "Roca" },
  { id: "rampa", glyph: "▶", label: "Rampa" },
  { id: "secreto", glyph: "★", label: "Secreto" },
  { id: "cebo", glyph: "◉", label: "Cebo" },
  { id: "puente", glyph: "⊓", label: "Puente" },
  { id: "arbol", glyph: "♣", label: "Árbol" },
  { id: "pozo", glyph: "○", label: "Pozo" },
  { id: "corriente", glyph: "»", label: "Corriente" },
  { id: "muelle", glyph: "▤", label: "Muelle" },
  { id: "faro", glyph: "✦", label: "Faro" },
];

export const COLOR_PUNTO_DEFAULT: ColorPuntoId = "oro";
export const ICONO_PUNTO_DEFAULT: IconoPuntoId = "spot";

export function hexColorPunto(id?: string | null): string {
  const found = COLORES_PUNTO.find((c) => c.id === id);
  return found?.hex ?? COLORES_PUNTO[0].hex;
}

export function glyphIconoPunto(id?: string | null): string {
  const found = ICONOS_PUNTO.find((i) => i.id === id);
  return found?.glyph ?? ICONOS_PUNTO[0].glyph;
}

export function esColorPuntoId(v: unknown): v is ColorPuntoId {
  return typeof v === "string" && COLORES_PUNTO.some((c) => c.id === v);
}

export function esIconoPuntoId(v: unknown): v is IconoPuntoId {
  return typeof v === "string" && ICONOS_PUNTO.some((i) => i.id === v);
}
