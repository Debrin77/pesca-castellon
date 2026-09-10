import dataCastellon from "../data/sitiosComunidad.json";
import dataSevilla from "../provincias/sevilla/sitiosComunidad.json";
import dataCordoba from "../provincias/cordoba/sitiosComunidad.json";
import dataCuenca from "../provincias/cuenca/sitiosComunidad.json";
import { getProvinciaActiva } from "../provincias/runtime";
import { todosLosTramos } from "./consultaPescaService";

export type SitioOrientativo = {
  nombre: string;
  especies: string;
  cuando: string;
  detalle: string;
};

const porTramoCastellon = dataCastellon.porTramo as Record<string, SitioOrientativo[]>;
const porTramoSevilla = dataSevilla.porTramo as Record<string, SitioOrientativo[]>;
const porTramoCordoba = dataCordoba.porTramo as Record<string, SitioOrientativo[]>;
const porTramoCuenca = dataCuenca.porTramo as Record<string, SitioOrientativo[]>;

/** Aviso genérico (Castellón) — se mantiene para no romper imports. */
export const AVISO_SITIOS_COMUNIDAD = dataCastellon.aviso;

export function avisoSitiosComunidad(provinciaId?: string): string {
  const id = provinciaId ?? getProvinciaActiva().id;
  if (id === "sevilla") return dataSevilla.aviso;
  if (id === "cordoba") return dataCordoba.aviso;
  if (id === "cuenca") return dataCuenca.aviso;
  return dataCastellon.aviso;
}

function mapaPorProvincia(): Record<string, SitioOrientativo[]> {
  const id = getProvinciaActiva().id;
  if (id === "sevilla") return porTramoSevilla;
  if (id === "cordoba") return porTramoCordoba;
  if (id === "cuenca") return porTramoCuenca;
  return porTramoCastellon;
}

export function sitiosDeTramo(tramoId: string | undefined | null): SitioOrientativo[] {
  if (!tramoId) return [];
  // Prefijos inequívocos: no cruces entre provincias.
  if (tramoId.startsWith("sev-")) return porTramoSevilla[tramoId] ?? [];
  if (tramoId.startsWith("cor-")) return porTramoCordoba[tramoId] ?? [];
  if (tramoId.startsWith("cue-")) return porTramoCuenca[tramoId] ?? [];
  const local = mapaPorProvincia()[tramoId];
  if (local) return local;
  return porTramoCastellon[tramoId] ?? [];
}

/** Fichas de zona agrupan varios tramos del anexo / catálogo. */
export function sitiosDeFicha(fichaId: string | undefined | null): { tramoNombre: string; sitios: SitioOrientativo[] }[] {
  if (!fichaId) return [];
  return todosLosTramos()
    .filter((t) => t.fichaId === fichaId)
    .map((t) => ({ tramoNombre: t.nombre, sitios: sitiosDeTramo(t.id) }))
    .filter((x) => x.sitios.length > 0);
}
