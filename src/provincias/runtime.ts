import type { ProvinciaConfig, ProvinciaId } from "./types";
import { PROVINCIAS, provinciaPorId } from "./index";

let activa: ProvinciaConfig = PROVINCIAS.castellon;

export function getProvinciaActiva(): ProvinciaConfig {
  return activa;
}

export function getProvinciaIdActiva(): ProvinciaId {
  return activa.id;
}

export function setProvinciaActiva(id: ProvinciaId): ProvinciaConfig {
  activa = provinciaPorId(id);
  return activa;
}
