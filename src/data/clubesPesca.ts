import type { ProvinciaId } from "../provincias/types";

export interface ClubPesca {
  id: string;
  nombre: string;
  provinciaId: ProvinciaId;
  localidad?: string;
  /** Web del club o ficha federativa. */
  url?: string;
  notas?: string;
}

export interface EnlaceApuntarse {
  id: string;
  titulo: string;
  descripcion: string;
  url: string;
  provinciaId: ProvinciaId | "todas";
}

/**
 * Clubs y vías oficiales para federarse / inscribirse.
 * Inscripción a concursos oficiales: casi siempre a través del club.
 * Actualizado Sep 2026 (FPCV / FAPD Sevilla).
 */
export const ENLACES_APUNTARSE: EnlaceApuntarse[] = [
  {
    id: "cs-fpcv-licencias",
    titulo: "Licencias FPCV (club o independiente)",
    descripcion:
      "Tramita licencia federativa. Para competir oficiales necesitas club; independiente solo recreo.",
    url: "https://federacionpescacv.com/llicencies-federatives/",
    provinciaId: "castellon",
  },
  {
    id: "cs-fpcv-home",
    titulo: "Federación de Pesca CV (FPCV)",
    descripcion: "Contacto, clubes, tienda y pagos de inscripciones federadas.",
    url: "https://federacionpescacv.com/",
    provinciaId: "castellon",
  },
  {
    id: "cs-fpcv-calendario",
    titulo: "Convocatorias Castellón / CV 2026",
    descripcion: "Calendario vivo con enlaces a convocatoria y resultados.",
    url: "https://federacionpescacv.com/convocatorias-clasificaciones-2026/",
    provinciaId: "castellon",
  },
  {
    id: "se-fapd-delegacion",
    titulo: "Delegación FAPD Sevilla",
    descripcion: "Convocatorias provinciales, boletines y plazos de inscripción.",
    url: "https://sevilla.fapd.org/",
    provinciaId: "sevilla",
  },
  {
    id: "se-fapd-clubes",
    titulo: "Enlaces a clubes FAPD",
    descripcion: "Directorio de clubes para federarte e inscribirte en pruebas.",
    url: "https://sevilla.fapd.org/enlaces-clubes/",
    provinciaId: "sevilla",
  },
  {
    id: "se-fapd-calendario",
    titulo: "Calendario Andalucía 2026",
    descripcion: "Calendario oficial FAPD (PDF por meses y modalidades).",
    url: "https://fapd.org/calendario-de-competiciones-2026",
    provinciaId: "sevilla",
  },
  {
    id: "co-fapd-delegacion",
    titulo: "Delegación FAPD Córdoba",
    descripcion: "Convocatorias provinciales, boletines y plazos de inscripción.",
    url: "https://fapd.org/",
    provinciaId: "cordoba",
  },
  {
    id: "co-fapd-calendario",
    titulo: "Calendario Andalucía 2026",
    descripcion: "Calendario oficial FAPD (PDF por meses y modalidades).",
    url: "https://fapd.org/calendario-de-competiciones-2026",
    provinciaId: "cordoba",
  },
  {
    id: "cu-diana-licencia",
    titulo: "Licencia de pesca CLM (DIANA)",
    descripcion: "Tramita o renueva la licencia de pesca de Castilla-La Mancha.",
    url: "https://diana.castillalamancha.es/diana/aInicio",
    provinciaId: "cuenca",
  },
  {
    id: "cu-permisos-cotos",
    titulo: "Permisos cotos especiales JCCM",
    descripcion: "Venta en línea de permisos de cotos especiales de Castilla-La Mancha.",
    url: "https://ventaenlinea.castillalamancha.es/ventaenlinea/publico/tiendas/tiendasSOCO.jsf",
    provinciaId: "cuenca",
  },
  {
    id: "cu-caza-pesca-portal",
    titulo: "Portal Caza y Pesca CLM",
    descripcion: "Orden de vedas, visores, escenarios y descargas oficiales.",
    url: "https://cazaypesca.castillalamancha.es/pesca/ejercicio-pesca",
    provinciaId: "cuenca",
  },
  {
    id: "nac-fepyc",
    titulo: "FEPyC · calendario nacional",
    descripcion: "Campeonatos de España. Inscripción vía federación autonómica.",
    url: "https://www.fepyc.es/",
    provinciaId: "todas",
  },
];

/** Clubs de referencia por provincia (inscripción vía federación / club). */
export const CLUBES_PESCA: ClubPesca[] = [
  /* Castellón — contacto vía FPCV (listado oficial en federación) */
  {
    id: "cs-fpcv-delegacion",
    nombre: "Delegación FPCV · Castellón",
    provinciaId: "castellon",
    localidad: "Castellón",
    url: "https://federacionpescacv.com/",
    notas: "Pregunta por clubes federados de la provincia y cómo darte de alta.",
  },
  {
    id: "cs-via-licencias",
    nombre: "Alta en club / licencia FPCV",
    provinciaId: "castellon",
    localidad: "Online",
    url: "https://federacionpescacv.com/llicencies-federatives/",
    notas: "Portal de licencias: clubes e independientes.",
  },

  /* Sevilla — asambleístas / enlaces FAPD */
  {
    id: "se-san-juan",
    nombre: "C.D. Pesca San Juan",
    provinciaId: "sevilla",
    localidad: "Sevilla",
    url: "https://sevilla.fapd.org/enlaces-clubes/",
    notas: "Club activo en ligas provinciales (agua dulce, etc.).",
  },
  {
    id: "se-sanlucar",
    nombre: "C.D. Sanlúcar la Mayor",
    provinciaId: "sevilla",
    localidad: "Sanlúcar la Mayor",
    url: "https://sevilla.fapd.org/enlaces-clubes/",
  },
  {
    id: "se-san-rafael",
    nombre: "C.D. San Rafael",
    provinciaId: "sevilla",
    localidad: "Sevilla",
    url: "https://sevilla.fapd.org/enlaces-clubes/",
  },
  {
    id: "se-amigos-guadalquivir",
    nombre: "C.D. Sdad. Amigos del Guadalquivir",
    provinciaId: "sevilla",
    localidad: "Sevilla",
    url: "https://sevilla.fapd.org/enlaces-clubes/",
  },
  {
    id: "se-lunaticos",
    nombre: "C.D. Pesca Lunáticos",
    provinciaId: "sevilla",
    localidad: "Sevilla",
    url: "https://sevilla.fapd.org/enlaces-clubes/",
  },
  {
    id: "se-alcosa",
    nombre: "C.D. Pesca Alcosa",
    provinciaId: "sevilla",
    localidad: "Sevilla",
    url: "https://sevilla.fapd.org/enlaces-clubes/",
  },
  {
    id: "se-telefonica",
    nombre: "Club de Pesca Telefónica",
    provinciaId: "sevilla",
    localidad: "Sevilla",
    url: "https://sevilla.fapd.org/enlaces-clubes/",
  },
  {
    id: "se-castilblanco",
    nombre: "C.D. Pesca Castilblanco de los Arroyos",
    provinciaId: "sevilla",
    localidad: "Castilblanco de los Arroyos",
    url: "https://sevilla.fapd.org/enlaces-clubes/",
  },
  {
    id: "se-santa-ana",
    nombre: "Club Santa Ana",
    provinciaId: "sevilla",
    localidad: "Sevilla",
    url: "https://sevilla.fapd.org/",
    notas: "Activo en Mar-Costa Liga Clubs 2026.",
  },

  /* Córdoba — vía FAPD Andalucía */
  {
    id: "co-fapd-delegacion",
    nombre: "Delegación FAPD · Córdoba",
    provinciaId: "cordoba",
    localidad: "Córdoba",
    url: "https://fapd.org/",
    notas: "Pregunta por clubes federados de la provincia y cómo darte de alta.",
  },
  {
    id: "co-amigos-guadalquivir",
    nombre: "Clubes de pesca · Córdoba capital",
    provinciaId: "cordoba",
    localidad: "Córdoba",
    url: "https://fapd.org/",
    notas: "Inscripción a pruebas oficiales a través del club federado FAPD.",
  },
  {
    id: "co-iznajar-zona",
    nombre: "Clubes zona Iznájar / Genil",
    provinciaId: "cordoba",
    localidad: "Iznájar / Rute",
    url: "https://fapd.org/",
    notas: "Consulta la delegación provincial para el club más cercano.",
  },

  /* Cuenca — Castilla-La Mancha */
  {
    id: "cu-pescadores-conquenses",
    nombre: "Asoc. Provincial Pescadores Deportivos Conquenses",
    provinciaId: "cuenca",
    localidad: "Cuenca",
    url: "https://cazaypesca.castillalamancha.es/pesca/cursos-masas-agua/escenarios-pesca",
    notas: "Concesionaria del coto intensivo Puente Romano (CI-9).",
  },
  {
    id: "cu-san-rafael",
    nombre: "Grupo de Pesca San Rafael",
    provinciaId: "cuenca",
    localidad: "Cuenca",
    url: "https://cazaypesca.castillalamancha.es/pesca/cursos-masas-agua/escenarios-pesca",
    notas: "Coto intensivo El Chantre (CI-10).",
  },
  {
    id: "cu-caza-tiro",
    nombre: "Club Deportivo de Caza y Tiro de Cuenca",
    provinciaId: "cuenca",
    localidad: "Cuenca",
    url: "https://cazaypesca.castillalamancha.es/pesca/cursos-masas-agua/escenarios-pesca",
    notas: "Coto intensivo La Torre (CI-19).",
  },
];

export function enlacesApuntarsePara(provinciaId: ProvinciaId): EnlaceApuntarse[] {
  return ENLACES_APUNTARSE.filter((e) => e.provinciaId === provinciaId || e.provinciaId === "todas");
}

export function clubesParaProvincia(provinciaId: ProvinciaId): ClubPesca[] {
  return CLUBES_PESCA.filter((c) => c.provinciaId === provinciaId);
}
