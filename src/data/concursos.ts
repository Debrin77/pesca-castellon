import type { ProvinciaId } from "../provincias/types";

export interface ConcursoPesca {
  id: string;
  titulo: string;
  fecha: string; // yyyy-mm-dd
  fin?: string;
  lugar: string;
  modalidad: string;
  organizador: string;
  provinciaId: ProvinciaId | "todas";
  url?: string;
  notas?: string;
}

/**
 * Calendario orientativo (federación / clubes). Verificar siempre en la fuente.
 * Se amplía a mano; no es feed oficial en tiempo real.
 */
export const CONCURSOS: ConcursoPesca[] = [
  {
    id: "cs-2026-abrir-temporada",
    titulo: "Apertura salmonícola · jornadas locales",
    fecha: "2026-03-15",
    lugar: "Palancia / Mijares (tramos habilitados)",
    modalidad: "Mosca / spinning",
    organizador: "Clubes CV / FEPCV",
    provinciaId: "castellon",
    url: "https://www.fepcv.es/",
    notas: "Confirma tramo y permiso del día. Fecha orientativa al tercer domingo de marzo.",
  },
  {
    id: "cs-2026-bass-embalse",
    titulo: "Open bass embalses Castellón",
    fecha: "2026-05-10",
    fin: "2026-05-11",
    lugar: "Embalses provincia (según convocatoria)",
    modalidad: "Black bass · spinning",
    organizador: "Clubes provinciales",
    provinciaId: "castellon",
    url: "https://www.fepcv.es/",
  },
  {
    id: "cs-2026-costa-surf",
    titulo: "Concurso costa · surfcasting",
    fecha: "2026-06-21",
    lugar: "Costa de Castellón (playa a confirmar)",
    modalidad: "Orilla mar",
    organizador: "Clubes marítimos",
    provinciaId: "castellon",
    url: "https://www.fepcv.es/",
    notas: "Licencia marítima + normas del concurso. Declara capturas en PescaREC si el reglamento lo exige.",
  },
  {
    id: "se-2026-guadalquivir",
    titulo: "Jornada ciprínícola Guadalquivir",
    fecha: "2026-04-19",
    lugar: "Tramos libres Sevilla (según FAPD)",
    modalidad: "Feeder / boya",
    organizador: "FAPD / clubes",
    provinciaId: "sevilla",
    url: "https://www.fapd.es/",
  },
  {
    id: "se-2026-embalse-bass",
    titulo: "Open embalses Sevilla · bass",
    fecha: "2026-05-24",
    fin: "2026-05-25",
    lugar: "Cala / Minilla / según convocatoria",
    modalidad: "Black bass",
    organizador: "FAPD",
    provinciaId: "sevilla",
    url: "https://www.fapd.es/",
  },
  {
    id: "nac-2026-fepyc",
    titulo: "Calendario FEPyC (consulta nacional)",
    fecha: "2026-01-01",
    fin: "2026-12-31",
    lugar: "España",
    modalidad: "Varias",
    organizador: "FEPyC",
    provinciaId: "todas",
    url: "https://www.fepyc.es/",
    notas: "Portal federativo: concursos oficiales por especialidad.",
  },
];

export function concursosParaProvincia(provinciaId: ProvinciaId, desdeIso?: string): ConcursoPesca[] {
  const desde = desdeIso ?? new Date().toISOString().slice(0, 10);
  return CONCURSOS.filter(
    (c) => (c.provinciaId === provinciaId || c.provinciaId === "todas") && (c.fin ?? c.fecha) >= desde
  ).sort((a, b) => a.fecha.localeCompare(b.fecha));
}
