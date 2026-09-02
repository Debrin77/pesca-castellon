import data from "../data/sitiosComunidad.json";
import { todosLosTramos } from "./consultaPescaService";

export type SitioOrientativo = {
  nombre: string;
  especies: string;
  cuando: string;
  detalle: string;
};

const porTramo = data.porTramo as Record<string, SitioOrientativo[]>;

export const AVISO_SITIOS_COMUNIDAD = data.aviso;

export function sitiosDeTramo(tramoId: string | undefined | null): SitioOrientativo[] {
  if (!tramoId) return [];
  return porTramo[tramoId] ?? [];
}

/** Fichas de zona (Arenós, Palancia…) agrupan varios tramos del anexo. */
export function sitiosDeFicha(fichaId: string | undefined | null): { tramoNombre: string; sitios: SitioOrientativo[] }[] {
  if (!fichaId) return [];
  return todosLosTramos()
    .filter((t) => t.fichaId === fichaId)
    .map((t) => ({ tramoNombre: t.nombre, sitios: sitiosDeTramo(t.id) }))
    .filter((x) => x.sitios.length > 0);
}
