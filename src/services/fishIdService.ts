/**
 * Identificación asistida de especie a partir de rasgos + foto opcional.
 * No es un modelo de IA en dispositivo: ranking por rasgos del catálogo local.
 */

export type FormaCuerpo = "alargado" | "comprimido" | "cilindrico" | "plano" | "anguiliforme";
export type AmbitoId = "rio" | "embalse" | "mar" | "ambos";
export type TamanoAprox = "muy_pequeno" | "pequeno" | "medio" | "grande" | "muy_grande";

export interface RasgosId {
  ambito: AmbitoId;
  forma: FormaCuerpo;
  tieneRayas?: boolean;
  bocaGrande?: boolean;
  escamasGrandes?: boolean;
  colorDominante?: "plateado" | "verde" | "marron" | "oscuro" | "rojizo" | "dorado" | "variable";
  tamano: TamanoAprox;
}

export interface CandidatoId {
  especieId: string;
  nombre: string;
  puntuacion: number;
  motivos: string[];
}

/** Rasgos de referencia por id de especie (catálogo app). */
const RASGOS: Record<
  string,
  Partial<RasgosId> & { keywords: string[] }
> = {
  trucha_comun: { ambito: "rio", forma: "alargado", colorDominante: "marron", tamano: "medio", keywords: ["puntos", "adiposa"] },
  trucha_arcoiris: { ambito: "rio", forma: "alargado", colorDominante: "plateado", tamano: "medio", keywords: ["banda", "iris"] },
  black_bass: { ambito: "embalse", forma: "comprimido", bocaGrande: true, colorDominante: "verde", tamano: "medio", keywords: ["bass", "boca"] },
  lucio: { ambito: "embalse", forma: "alargado", bocaGrande: true, colorDominante: "verde", tamano: "grande", keywords: ["pico de pato"] },
  carpa: { ambito: "embalse", forma: "comprimido", escamasGrandes: true, colorDominante: "dorado", tamano: "grande", keywords: ["barbillas"] },
  carpin: { ambito: "embalse", forma: "comprimido", escamasGrandes: true, colorDominante: "plateado", tamano: "pequeno", keywords: ["carpín"] },
  tenca: { ambito: "embalse", forma: "comprimido", colorDominante: "verde", tamano: "medio", keywords: ["mucosa", "ojo rojo"] },
  barbo: { ambito: "rio", forma: "cilindrico", colorDominante: "marron", tamano: "medio", keywords: ["barbillas", "hocico"] },
  siluro: { ambito: "embalse", forma: "anguiliforme", bocaGrande: true, colorDominante: "oscuro", tamano: "muy_grande", keywords: ["bigotes", "plano"] },
  anguila: { ambito: "ambos", forma: "anguiliforme", colorDominante: "oscuro", tamano: "medio", keywords: ["serpiente"] },
  gambusia: { ambito: "embalse", forma: "comprimido", colorDominante: "plateado", tamano: "muy_pequeno", keywords: ["mosquito"] },
  mugilidos: { ambito: "mar", forma: "cilindrico", colorDominante: "plateado", tamano: "medio", keywords: ["lisa", "mugil"] },
  lubina: { ambito: "mar", forma: "alargado", colorDominante: "plateado", tamano: "medio", keywords: ["róbalo", "lineas"] },
  dorada: { ambito: "mar", forma: "comprimido", colorDominante: "plateado", tamano: "medio", keywords: ["punto negro", "oro"] },
  sepia: { ambito: "mar", forma: "plano", colorDominante: "variable", tamano: "medio", keywords: ["cefalópodo"] },
  pulpo: { ambito: "mar", forma: "plano", colorDominante: "variable", tamano: "medio", keywords: ["tentáculos"] },
};

function scoreAmbito(want: AmbitoId, have?: AmbitoId): number {
  if (!have) return 0;
  if (have === want || have === "ambos" || want === "ambos") return 25;
  if ((have === "rio" || have === "embalse") && (want === "rio" || want === "embalse")) return 12;
  return -15;
}

export function identificarPorRasgos(
  rasgos: RasgosId,
  catalogo: { id: string; nombre: string }[]
): CandidatoId[] {
  const out: CandidatoId[] = [];
  for (const sp of catalogo) {
    const r = RASGOS[sp.id];
    if (!r) continue;
    let puntos = 0;
    const motivos: string[] = [];
    const a = scoreAmbito(rasgos.ambito, r.ambito as AmbitoId);
    puntos += a;
    if (a > 0) motivos.push("hábitat compatible");
    if (r.forma === rasgos.forma) {
      puntos += 30;
      motivos.push("forma");
    }
    if (rasgos.bocaGrande && r.bocaGrande) {
      puntos += 15;
      motivos.push("boca grande");
    }
    if (rasgos.escamasGrandes && r.escamasGrandes) {
      puntos += 10;
      motivos.push("escamas");
    }
    if (rasgos.colorDominante && r.colorDominante === rasgos.colorDominante) {
      puntos += 15;
      motivos.push("color");
    }
    if (r.tamano === rasgos.tamano) {
      puntos += 12;
      motivos.push("tamaño");
    }
    if (puntos > 20) {
      out.push({ especieId: sp.id, nombre: sp.nombre, puntuacion: puntos, motivos });
    }
  }
  return out.sort((a, b) => b.puntuacion - a.puntuacion).slice(0, 5);
}
