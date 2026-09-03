import { castellonConfig } from "./castellon/config";
import { sevillaConfig } from "./sevilla/config";
import type { ProvinciaConfig, ProvinciaId } from "./types";

export type { ProvinciaConfig, ProvinciaId, RegionMapa } from "./types";

export const PROVINCIAS: Record<ProvinciaId, ProvinciaConfig> = {
  castellon: castellonConfig,
  sevilla: sevillaConfig,
};

export const LISTA_PROVINCIAS: ProvinciaConfig[] = [castellonConfig, sevillaConfig];

export function provinciaPorId(id: ProvinciaId): ProvinciaConfig {
  return PROVINCIAS[id] ?? castellonConfig;
}

export function esProvinciaId(v: unknown): v is ProvinciaId {
  return v === "castellon" || v === "sevilla";
}
