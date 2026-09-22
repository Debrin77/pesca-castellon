import type { HabitatSitio } from "../data/habitat";
import habitatCastellon from "../data/habitatCastellon.json";
import habitatSevilla from "../provincias/sevilla/habitatZonas.json";
import habitatCordoba from "../provincias/cordoba/habitatZonas.json";
import habitatCuenca from "../provincias/cuenca/habitatZonas.json";
import { getProvinciaIdActiva } from "../provincias/runtime";
import type { ProvinciaId } from "../provincias/types";

type Overlay = Record<string, HabitatSitio | string | undefined>;

function asHabitat(raw: unknown): HabitatSitio | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as HabitatSitio;
  if (!Array.isArray(o.tags) || typeof o.nota !== "string") return null;
  return {
    tags: o.tags,
    profundidad: o.profundidad,
    nota: o.nota,
    fuente: o.fuente,
  };
}

const OVERLAY_ZONAS: Record<ProvinciaId, Overlay> = {
  sevilla: habitatSevilla as Overlay,
  cordoba: habitatCordoba as Overlay,
  cuenca: habitatCuenca as Overlay,
  castellon: (habitatCastellon as { zonas: Overlay }).zonas,
};

const OVERLAY_PLAYAS: Record<string, HabitatSitio> = (
  habitatCastellon as { playas: Record<string, HabitatSitio> }
).playas;

/** Hábitat fino de una zona/ficha de provincia (si está enriquecida). */
export function habitatDeZona(
  zoneId: string,
  provinciaId?: ProvinciaId
): HabitatSitio | null {
  const id = provinciaId ?? getProvinciaIdActiva();
  const overlay = OVERLAY_ZONAS[id];
  if (!overlay) return null;
  return asHabitat(overlay[zoneId]);
}

/** Hábitat de playa/espigón (Castellón costa). */
export function habitatDePlaya(playaId: string): HabitatSitio | null {
  return asHabitat(OVERLAY_PLAYAS[playaId]) ?? null;
}

/** Resolución genérica por id de candidato (zona:/tramo:/playa:…). */
export function habitatDeCandidatoId(candidatoId: string): HabitatSitio | null {
  if (candidatoId.startsWith("zona:")) {
    return habitatDeZona(candidatoId.slice("zona:".length));
  }
  if (candidatoId.startsWith("playa:")) {
    return habitatDePlaya(candidatoId.slice("playa:".length));
  }
  if (candidatoId.startsWith("tramo:")) {
    // Algunos tramos comparten id con ficha; probar overlay zona.
    return habitatDeZona(candidatoId.slice("tramo:".length));
  }
  return habitatDeZona(candidatoId);
}
