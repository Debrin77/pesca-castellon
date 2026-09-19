/**
 * Anclas A/B sobre la foto real (coords 0–1 del JPEG completo).
 *
 * Criterio legal (Mediterráneo / España):
 * - Reg. (CE) 1967/2006 Anexo IV fig. 1 y RD 560/1995 art. 2:
 *   longitud total = punta del hocico → extremo de la aleta caudal.
 * - NO es longitud a la horquilla (salvo especies concretas tipo pez espada LJFL).
 *
 * Solo especies con foto de perfil usable. Si la foto no permite anclar bien,
 * no se añade aquí y la app muestra solo la cota técnica (sin overlay).
 *
 * Proyección en UI: object-fit "contain" (ver proyectarContain).
 */
export type PuntoFoto = { x: number; y: number };

export type AnclaMedicionFoto = {
  w: number;
  h: number;
  /** A = punta del hocico (boca cerrada). */
  a: PuntoFoto;
  /** B = extremo del lóbulo caudal más largo (longitud total). */
  b: PuntoFoto;
  /** `peso` = badge (pulpo); `linea` = cota A→B. */
  modo?: "linea" | "peso";
};

/**
 * Puntos calibrados sobre assets/especies/*.jpg (perfil lateral).
 * Revisados frente a la norma de longitud total.
 */
const ANCLAS: Record<string, AnclaMedicionFoto> = {
  // ——— Cabeza a la derecha ———
  lubina: { w: 747, h: 560, a: { x: 0.84, y: 0.52 }, b: { x: 0.05, y: 0.39 } },
  llobarro: { w: 747, h: 560, a: { x: 0.84, y: 0.52 }, b: { x: 0.05, y: 0.39 } },
  mojarra: { w: 900, h: 600, a: { x: 0.955, y: 0.5 }, b: { x: 0.12, y: 0.5 } },
  salmonete: { w: 900, h: 506, a: { x: 0.93, y: 0.48 }, b: { x: 0.11, y: 0.5 } },

  // ——— Cabeza a la izquierda ———
  dorada: { w: 640, h: 480, a: { x: 0.075, y: 0.5 }, b: { x: 0.985, y: 0.44 } },
  sargo: { w: 640, h: 480, a: { x: 0.22, y: 0.48 }, b: { x: 0.89, y: 0.5 } },
  llisa: { w: 640, h: 480, a: { x: 0.04, y: 0.47 }, b: { x: 0.96, y: 0.5 } },
  mugilidos: { w: 640, h: 480, a: { x: 0.04, y: 0.47 }, b: { x: 0.96, y: 0.5 } },
  jurel: { w: 900, h: 600, a: { x: 0.065, y: 0.48 }, b: { x: 0.97, y: 0.49 } },
  salema: { w: 900, h: 600, a: { x: 0.08, y: 0.5 }, b: { x: 0.94, y: 0.5 } },
  boga: { w: 1280, h: 585, a: { x: 0.012, y: 0.4 }, b: { x: 0.72, y: 0.4 } },
  mabra: { w: 900, h: 528, a: { x: 0.03, y: 0.48 }, b: { x: 0.97, y: 0.52 } },

  // Peso entero (RD 560 anexo II Mediterráneo: 1 kg)
  pulpo: {
    w: 900,
    h: 600,
    a: { x: 0.42, y: 0.42 },
    b: { x: 0.58, y: 0.55 },
    modo: "peso",
  },
};

export function anclaMedicionFoto(id?: string | null): AnclaMedicionFoto | null {
  if (!id) return null;
  return ANCLAS[id] ?? null;
}

export function hayAnclaMedicionFoto(id?: string | null): boolean {
  return !!(id && ANCLAS[id]);
}

/**
 * Proyecta un punto (0–1 del JPEG) al marco visible con object-fit: contain.
 * Letterboxing: la foto entera cabe; A/B coinciden con el ejemplar.
 */
export function proyectarContain(
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
    // Limita el ancho → bandas arriba/abajo
    scale = boxW / imgW;
    offsetX = 0;
    offsetY = (boxH - imgH * scale) / 2;
  } else {
    // Limita el alto → bandas a los lados
    scale = boxH / imgH;
    offsetX = (boxW - imgW * scale) / 2;
    offsetY = 0;
  }
  return {
    x: offsetX + punto.x * imgW * scale,
    y: offsetY + punto.y * imgH * scale,
  };
}

/** @deprecated Usar proyectarContain; se mantiene por compatibilidad de asserts. */
export function proyectarCover(
  punto: PuntoFoto,
  imgW: number,
  imgH: number,
  boxW: number,
  boxH: number
): { x: number; y: number } {
  return proyectarContain(punto, imgW, imgH, boxW, boxH);
}
