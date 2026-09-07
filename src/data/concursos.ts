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
  /** Enlace a convocatoria / calendario / inscripción oficial. */
  url?: string;
  notas?: string;
  /** Etiqueta del botón (por defecto «Ver convocatoria»). */
  cta?: string;
  /** true = portal vivo (calendario/inscripción), no un evento puntual. */
  portal?: boolean;
}

/**
 * Calendario 2026 (FPCV / FAPD Sevilla / FEPyC) + portales vivos para apuntarse.
 * Fuentes oficiales; verificar siempre en la web del organizador.
 * Actualizado Sep 2026.
 */
export const CONCURSOS: ConcursoPesca[] = [
  /* ——— Portales vivos (siempre visibles en temporada) ——— */
  {
    id: "cs-portal-calendario",
    titulo: "Calendario oficial FPCV 2026 · convocatorias",
    fecha: "2026-01-01",
    fin: "2026-12-31",
    lugar: "Comunitat Valenciana",
    modalidad: "Todas",
    organizador: "FPCV",
    provinciaId: "castellon",
    url: "https://federacionpescacv.com/convocatorias-clasificaciones-2026/",
    notas: "Convocatorias y clasificaciones en tiempo real. Inscripción vía club federado.",
    cta: "Abrir calendario FPCV",
    portal: true,
  },
  {
    id: "cs-portal-licencias",
    titulo: "Apuntarse · licencia federativa / clubes FPCV",
    fecha: "2026-01-01",
    fin: "2026-12-31",
    lugar: "Castellón · delegación FPCV",
    modalidad: "Licencia + club",
    organizador: "FPCV",
    provinciaId: "castellon",
    url: "https://federacionpescacv.com/llicencies-federatives/",
    notas:
      "Para competir: licencia vía club federado. Independiente = recreo (sin oficiales).",
    cta: "Licencias y clubes",
    portal: true,
  },
  {
    id: "se-portal-calendario",
    titulo: "Calendario FAPD 2026 · Andalucía",
    fecha: "2026-01-01",
    fin: "2026-12-31",
    lugar: "Andalucía",
    modalidad: "Todas",
    organizador: "FAPD",
    provinciaId: "sevilla",
    url: "https://fapd.org/calendario-de-competiciones-2026",
    notas: "PDF calendario por meses/modalidades. Inscripción solo a través del club.",
    cta: "Abrir calendario FAPD",
    portal: true,
  },
  {
    id: "se-portal-delegacion",
    titulo: "Delegación Sevilla · convocatorias e inscripción",
    fecha: "2026-01-01",
    fin: "2026-12-31",
    lugar: "Sevilla",
    modalidad: "Provinciales / clubes",
    organizador: "FAPD Sevilla",
    provinciaId: "sevilla",
    url: "https://sevilla.fapd.org/",
    notas: "Boletines, bases y plazos en cada convocatoria. Apúntate por tu club.",
    cta: "Abrir Sevilla FAPD",
    portal: true,
  },
  {
    id: "se-portal-clubes",
    titulo: "Clubes de pesca · enlaces FAPD Sevilla",
    fecha: "2026-01-01",
    fin: "2026-12-31",
    lugar: "Sevilla y Andalucía",
    modalidad: "Clubes",
    organizador: "FAPD",
    provinciaId: "sevilla",
    url: "https://sevilla.fapd.org/enlaces-clubes/",
    notas: "Lista de clubes para federarte e inscribirte en concursos.",
    cta: "Ver clubes",
    portal: true,
  },
  {
    id: "nac-portal-fepyc",
    titulo: "Calendario nacional FEPyC",
    fecha: "2026-01-01",
    fin: "2026-12-31",
    lugar: "España",
    modalidad: "Nacionales",
    organizador: "FEPyC",
    provinciaId: "todas",
    url: "https://www.fepyc.es/",
    notas: "Campeonatos de España. Inscripción vía federación autonómica / club.",
    cta: "Abrir FEPyC",
    portal: true,
  },

  /* ——— Castellón · FPCV 2026 (oficiales en provincia) ——— */
  {
    id: "cs-2026-02-07-peniscola-duos",
    titulo: "Autonómico Mar-Costa Dúos",
    fecha: "2026-02-07",
    lugar: "Playa Norte de Peñíscola",
    modalidad: "Mar-costa · dúos",
    organizador: "FPCV",
    provinciaId: "castellon",
    url: "https://federacionpescacv.com/convocatorias-clasificaciones-2026/",
    notas: "Convocatoria y resultados en el calendario FPCV.",
  },
  {
    id: "cs-2026-03-15-almenara",
    titulo: "Provincial Castellón · agua dulce cebador",
    fecha: "2026-03-15",
    lugar: "ZPC Almenara",
    modalidad: "Agua dulce · cebador",
    organizador: "FPCV · provincial Castellón",
    provinciaId: "castellon",
    url: "https://federacionpescacv.com/convocatorias-clasificaciones-2026/",
    notas: "Inscripción a través de club federado.",
  },
  {
    id: "cs-2026-04-25-pinar",
    titulo: "Provincial Castellón · Mar-Costa Clubes",
    fecha: "2026-04-25",
    lugar: "Playa del Pinar (Castellón)",
    modalidad: "Mar-costa · clubes",
    organizador: "FPCV · provincial Castellón",
    provinciaId: "castellon",
    url: "https://federacionpescacv.com/convocatorias-clasificaciones-2026/",
  },
  {
    id: "cs-2026-05-24-inland",
    titulo: "Autonómico Inland Casting · Aeroclub",
    fecha: "2026-05-24",
    lugar: "Aeroclub de Castellón",
    modalidad: "Inland casting",
    organizador: "FPCV",
    provinciaId: "castellon",
    url: "https://federacionpescacv.com/convocatorias-clasificaciones-2026/",
  },
  {
    id: "cs-2026-06-20-corcheo-puerto",
    titulo: "Autonómico Corcheo-Mar Clubes Absoluta",
    fecha: "2026-06-20",
    lugar: "Puerto de Castellón",
    modalidad: "Corcheo mar · clubes",
    organizador: "FPCV",
    provinciaId: "castellon",
    url: "https://federacionpescacv.com/convocatorias-clasificaciones-2026/",
  },
  {
    id: "cs-2026-09-05-kayak-arenos",
    titulo: "Autonómico Kayak Depredadores · Arenós",
    fecha: "2026-09-05",
    lugar: "Embalse de Arenós",
    modalidad: "Kayak · depredadores",
    organizador: "FPCV",
    provinciaId: "castellon",
    url: "https://federacionpescacv.com/convocatorias-clasificaciones-2026/",
  },

  /* ——— Sevilla · FAPD 2026 ——— */
  {
    id: "se-2026-03-22-juventud-damas",
    titulo: "Provincial · agua dulce juventud y damas",
    fecha: "2026-03-22",
    lugar: "La Barqueta (Sevilla)",
    modalidad: "Agua dulce · U-15/U-20/U-25 · damas",
    organizador: "FAPD Sevilla",
    provinciaId: "sevilla",
    url: "https://sevilla.fapd.org/campeonato-provincial-de-pesca-en-agua-dulce-juventud-y-damas",
    notas: "Boletín de inscripción en la convocatoria. Solo vía club. Plazo tip. 16 mar.",
    cta: "Ver convocatoria",
  },
  {
    id: "se-2026-05-16-mar-costa",
    titulo: "Provincial Mar-Costa masculino",
    fecha: "2026-05-16",
    fin: "2026-05-17",
    lugar: "Playa del Hoyo",
    modalidad: "Mar-costa",
    organizador: "FAPD Sevilla",
    provinciaId: "sevilla",
    url: "https://sevilla.fapd.org/campeonato-provincial-de-pesca-mar-costa-masculino-2026",
    notas: "Inscripción solo a través del club. Plazo tip. 13 may.",
    cta: "Ver convocatoria",
  },
  {
    id: "se-2026-06-13-liga-clubs-mar",
    titulo: "Provincial Mar-Costa Liga Clubs",
    fecha: "2026-06-13",
    fin: "2026-06-14",
    lugar: "Playa de Santa Margarita (La Línea)",
    modalidad: "Mar-costa · liga clubs",
    organizador: "FAPD Sevilla",
    provinciaId: "sevilla",
    url: "https://sevilla.fapd.org/campeonato-provincial-de-pesca-mar-costa-liga-clubs-de-sevilla-1",
    notas: "Boletín vía club. Plazo tip. 7 jun.",
    cta: "Ver convocatoria",
  },
  {
    id: "se-2026-09-05-agua-dulce-clubs",
    titulo: "Provincial Agua Dulce Liga Clubs (aplazado)",
    fecha: "2026-09-05",
    fin: "2026-09-06",
    lugar: "Sevilla (según convocatoria)",
    modalidad: "Agua dulce · liga clubs",
    organizador: "FAPD Sevilla",
    provinciaId: "sevilla",
    url: "https://sevilla.fapd.org/",
    notas: "Aplazado desde julio; confirma sede y boletín en Sevilla FAPD.",
    cta: "Confirmar en Sevilla FAPD",
  },
  {
    id: "se-2026-09-06-corcheo-mar",
    titulo: "Provincial Corcheo Mar absoluta",
    fecha: "2026-09-06",
    lugar: "Sevilla (según convocatoria)",
    modalidad: "Corcheo mar",
    organizador: "FAPD Sevilla",
    provinciaId: "sevilla",
    url: "https://sevilla.fapd.org/",
    notas: "Consulta bases e inscripción en la delegación.",
    cta: "Abrir Sevilla FAPD",
  },
  {
    id: "se-2026-09-19-andaluz-agua-dulce",
    titulo: "Campeonato de Andalucía · agua dulce masculino",
    fecha: "2026-09-19",
    fin: "2026-09-20",
    lugar: "Embalse de La Barqueta (Sevilla)",
    modalidad: "Agua dulce · andaluz",
    organizador: "FAPD",
    provinciaId: "sevilla",
    url: "https://fapd.org/xxxix-campeonato-de-andalucia-de-pesca-en-agua-dulce",
    notas:
      "Inscripción por boletín + acta del selectivo, vía delegación/club. Plazo tip. 2 sep.",
    cta: "Ver convocatoria + boletín",
  },
];

export function concursosParaProvincia(provinciaId: ProvinciaId, desdeIso?: string): ConcursoPesca[] {
  const desde = desdeIso ?? new Date().toISOString().slice(0, 10);
  return CONCURSOS.filter(
    (c) => (c.provinciaId === provinciaId || c.provinciaId === "todas") && (c.fin ?? c.fecha) >= desde
  ).sort((a, b) => {
    // Portales primero, luego por fecha
    if (!!a.portal !== !!b.portal) return a.portal ? -1 : 1;
    return a.fecha.localeCompare(b.fecha);
  });
}

export function enlacesInscripcion(provinciaId: ProvinciaId): ConcursoPesca[] {
  return concursosParaProvincia(provinciaId).filter((c) => c.portal);
}
