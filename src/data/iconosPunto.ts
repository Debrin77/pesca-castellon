/**
 * Colores e iconos para puntos guardados (estilo Fishing Points).
 * Catálogo amplio: 10 colores · 40+ iconos.
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
  | "rojo"
  | "lima"
  | "cian";

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
  | "faro"
  | "playa"
  | "canal"
  | "presa"
  | "isla"
  | "bahia"
  | "delta"
  | "cascada"
  | "laguna"
  | "remolino"
  | "piedra"
  | "caña"
  | "red"
  | "anzuelo"
  | "campamento"
  | "parking"
  | "acceso"
  | "mirador"
  | "sombra"
  | "noche"
  | "amanecer"
  | "corriente2"
  | "fondo"
  | "tablas"
  | "boya"
  | "fondeo"
  | "estrecho";

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
  { id: "lima", hex: "#5a8a1a", label: "Lima" },
  { id: "cian", hex: "#0e7a7a", label: "Cian" },
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
  { id: "playa", glyph: "∽", label: "Playa" },
  { id: "canal", glyph: "⫽", label: "Canal" },
  { id: "presa", glyph: "▬", label: "Presa" },
  { id: "isla", glyph: "◈", label: "Isla" },
  { id: "bahia", glyph: "︵", label: "Bahía" },
  { id: "delta", glyph: "▽", label: "Delta" },
  { id: "cascada", glyph: "⋮", label: "Cascada" },
  { id: "laguna", glyph: "◎", label: "Laguna" },
  { id: "remolino", glyph: "◍", label: "Remolino" },
  { id: "piedra", glyph: "◆", label: "Piedra" },
  { id: "caña", glyph: "┊", label: "Caña" },
  { id: "red", glyph: "▦", label: "Red" },
  { id: "anzuelo", glyph: " Neg", label: "Anzuelo" },
  { id: "campamento", glyph: "⌂", label: "Campamento" },
  { id: "parking", glyph: "P", label: "Parking" },
  { id: "acceso", glyph: "⇢", label: "Acceso" },
  { id: "mirador", glyph: "△", label: "Mirador" },
  { id: "sombra", glyph: "∩", label: "Sombra" },
  { id: "noche", glyph: "☽", label: "Noche" },
  { id: "amanecer", glyph: "☼", label: "Amanecer" },
  { id: "corriente2", glyph: "≫", label: "Rápidos" },
  { id: "fondo", glyph: "≡", label: "Fondo" },
  { id: "tablas", glyph: "▭", label: "Tablas" },
  { id: "boya", glyph: "⊙", label: "Boya" },
  { id: "fondeo", glyph: "⊥", label: "Fondeo" },
  { id: "estrecho", glyph: "⇔", label: "Estrecho" },
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

export function etiquetaColorPunto(id?: string | null): string {
  return COLORES_PUNTO.find((c) => c.id === id)?.label ?? "Sin color";
}

export function etiquetaIconoPunto(id?: string | null): string {
  return ICONOS_PUNTO.find((i) => i.id === id)?.label ?? "Spot";
}
