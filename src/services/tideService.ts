/**
 * Marea astronómica aproximada (armónico simple M2) para orientación.
 * En Castellón es micromareal: priorizar oleaje. Sevilla continental: no aplica costa.
 */
export interface MareaHora {
  hora: string;
  alturaM: number;
  tipo?: "pleamar" | "bajamar";
}

export interface ResumenMarea {
  puerto: string;
  rangoTipicoM: number;
  nota: string;
  serie: MareaHora[];
  proximaPleamar?: string;
  proximaBajamar?: string;
}

const PUERTOS: Record<string, { nombre: string; lat: number; lng: number; rangoM: number; nota: string }> = {
  castellon: {
    nombre: "Grao de Castellón (orientativo)",
    lat: 39.97,
    lng: 0.03,
    rangoM: 0.2,
    nota: "Micromareal: oscilación de pocos decímetros. El oleaje manda más que la marea.",
  },
  sevilla_costa_ref: {
    nombre: "Referencia Golfo de Cádiz (no es el río)",
    lat: 36.78,
    lng: -6.35,
    rangoM: 2.8,
    nota: "Sevilla es continental en esta app. Esta curva es solo referencia atlántica cercana, no el cauce del Guadalquivir.",
  },
};

/** Fase M2 ~12.42 h; anclada a luna nueva de referencia. */
function alturaEn(minutosDesdeEpoch: number, rangoM: number): number {
  const periodoMin = 12.4206 * 60;
  const fase = (minutosDesdeEpoch / periodoMin) * Math.PI * 2;
  return (rangoM / 2) * Math.sin(fase);
}

export function calcularMareaHoy(
  clavePuerto: keyof typeof PUERTOS = "castellon",
  fecha = new Date()
): ResumenMarea {
  const p = PUERTOS[clavePuerto] ?? PUERTOS.castellon;
  const inicio = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 0, 0, 0);
  const serie: MareaHora[] = [];
  let prev = alturaEn(inicio.getTime() / 60000, p.rangoM);
  let proximaPleamar: string | undefined;
  let proximaBajamar: string | undefined;
  const ahoraMin = fecha.getHours() * 60 + fecha.getMinutes();

  for (let m = 0; m <= 24 * 60; m += 30) {
    const t = new Date(inicio.getTime() + m * 60000);
    const h = alturaEn(t.getTime() / 60000, p.rangoM);
    const hora = `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
    let tipo: MareaHora["tipo"];
    if (m >= 30) {
      const prev2 = alturaEn((inicio.getTime() + (m - 60) * 60000) / 60000, p.rangoM);
      if (prev >= prev2 && prev >= h) {
        tipo = "pleamar";
        if (!proximaPleamar && m >= ahoraMin) proximaPleamar = hora;
      }
      if (prev <= prev2 && prev <= h) {
        tipo = "bajamar";
        if (!proximaBajamar && m >= ahoraMin) proximaBajamar = hora;
      }
    }
    serie.push({ hora, alturaM: Math.round(h * 1000) / 1000, tipo });
    prev = h;
  }

  return {
    puerto: p.nombre,
    rangoTipicoM: p.rangoM,
    nota: p.nota,
    serie: serie.filter((_, i) => i % 2 === 0),
    proximaPleamar,
    proximaBajamar,
  };
}

export function claveMareaProvincia(provinciaId: string, continentalOnly: boolean): keyof typeof PUERTOS | null {
  if (continentalOnly) return null;
  if (provinciaId === "castellon") return "castellon";
  return null;
}
