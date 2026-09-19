/**
 * Anclas A/B sobre la foto real de cada especie (coords 0–1 del JPEG completo).
 * Se proyectan al marco visible con resizeMode "cover".
 */
export type PuntoFoto = { x: number; y: number };

export type AnclaMedicionFoto = {
  /** Anchura natural del JPEG. */
  w: number;
  /** Altura natural del JPEG. */
  h: number;
  /** Extremo A (hocico / inicio). */
  a: PuntoFoto;
  /** Extremo B (cola / fin / báscula). */
  b: PuntoFoto;
  /**
   * `linea` = cota A→B sobre el animal.
   * `peso` = badge centrado (pulpo u otros por kg); a/b marcan zona del ejemplar.
   */
  modo?: "linea" | "peso";
};

/**
 * Puntos calibrados a ojo sobre assets/especies/*.jpg.
 * Solo especies con talla/peso mínimo y foto de perfil usable.
 */
const ANCLAS: Record<string, AnclaMedicionFoto> = {
  // Cabeza a la derecha, cola a la izquierda
  lubina: { w: 747, h: 560, a: { x: 0.9, y: 0.54 }, b: { x: 0.1, y: 0.42 } },
  llobarro: { w: 747, h: 560, a: { x: 0.9, y: 0.54 }, b: { x: 0.1, y: 0.42 } },
  caballa: { w: 880, h: 671, a: { x: 0.88, y: 0.52 }, b: { x: 0.14, y: 0.48 } },

  // Cabeza a la izquierda, cola a la derecha
  dorada: { w: 640, h: 480, a: { x: 0.1, y: 0.5 }, b: { x: 0.82, y: 0.48 } }, // B = horquilla
  sargo: { w: 640, h: 480, a: { x: 0.12, y: 0.48 }, b: { x: 0.9, y: 0.5 } },
  mojarra: { w: 900, h: 600, a: { x: 0.12, y: 0.5 }, b: { x: 0.9, y: 0.48 } },
  llisa: { w: 640, h: 480, a: { x: 0.1, y: 0.48 }, b: { x: 0.9, y: 0.5 } },
  mugilidos: { w: 640, h: 480, a: { x: 0.1, y: 0.48 }, b: { x: 0.9, y: 0.5 } },
  jurel: { w: 900, h: 600, a: { x: 0.1, y: 0.48 }, b: { x: 0.9, y: 0.5 } },
  salema: { w: 900, h: 600, a: { x: 0.1, y: 0.5 }, b: { x: 0.9, y: 0.5 } },
  salmonete: { w: 640, h: 480, a: { x: 0.12, y: 0.5 }, b: { x: 0.9, y: 0.5 } },
  boga: { w: 1280, h: 585, a: { x: 0.08, y: 0.5 }, b: { x: 0.92, y: 0.5 } },
  mabra: { w: 900, h: 528, a: { x: 0.1, y: 0.48 }, b: { x: 0.9, y: 0.5 } },

  // Peso entero (sin cota de longitud)
  pulpo: {
    w: 900,
    h: 600,
    a: { x: 0.42, y: 0.42 },
    b: { x: 0.58, y: 0.55 },
    modo: "peso",
  },
};

/** Defaults por patrón cuando no hay ancla específica (perfil genérico cabeza→cola). */
const DEFAULT_PEZ_IZQ: AnclaMedicionFoto = {
  w: 640,
  h: 480,
  a: { x: 0.1, y: 0.5 },
  b: { x: 0.9, y: 0.5 },
};

export function anclaMedicionFoto(
  id?: string | null,
  patron?: string | null
): AnclaMedicionFoto | null {
  if (!id) return null;
  if (ANCLAS[id]) return ANCLAS[id];
  if (patron === "pulpo_peso") return null; // sin foto calibrada: no forzar overlay
  if (patron === "pez_total" || patron === "pez_horquilla" || patron === "anguila") {
    return DEFAULT_PEZ_IZQ;
  }
  return null;
}

export function hayAnclaMedicionFoto(id?: string | null): boolean {
  return !!(id && ANCLAS[id]);
}

/**
 * Proyecta un punto (0–1 del JPEG) al marco visible con object-fit: cover.
 */
export function proyectarCover(
  punto: PuntoFoto,
  imgW: number,
  imgH: number,
  boxW: number,
  boxH: number
): { x: number; y: number } {
  if (boxW <= 0 || boxH <= 0 || imgW <= 0 || imgH <= 0) {
    return { x: punto.x * boxW, y: punto.y * boxH };
  }
  const imgAspect = imgW / imgH;
  const boxAspect = boxW / boxH;
  let scale: number;
  let offsetX: number;
  let offsetY: number;
  if (imgAspect > boxAspect) {
    // Más ancha: recorta laterales
    scale = boxH / imgH;
    offsetX = (boxW - imgW * scale) / 2;
    offsetY = 0;
  } else {
    // Más alta: recorta arriba/abajo
    scale = boxW / imgW;
    offsetX = 0;
    offsetY = (boxH - imgH * scale) / 2;
  }
  return {
    x: offsetX + punto.x * imgW * scale,
    y: offsetY + punto.y * imgH * scale,
  };
}
