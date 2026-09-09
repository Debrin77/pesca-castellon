import { castellonConfig } from "./castellon/config";
import { sevillaConfig } from "./sevilla/config";
import { cordobaConfig } from "./cordoba/config";
import type { ProvinciaConfig, ProvinciaId } from "./types";
import { esProvinciaAndalucia } from "./types";

export type { ProvinciaConfig, ProvinciaId, RegionMapa } from "./types";
export { esProvinciaAndalucia } from "./types";

export const PROVINCIAS: Record<ProvinciaId, ProvinciaConfig> = {
  castellon: castellonConfig,
  sevilla: sevillaConfig,
  cordoba: cordobaConfig,
};

export const LISTA_PROVINCIAS: ProvinciaConfig[] = [
  castellonConfig,
  sevillaConfig,
  cordobaConfig,
];

export function provinciaPorId(id: ProvinciaId): ProvinciaConfig {
  return PROVINCIAS[id] ?? castellonConfig;
}

export function esProvinciaId(v: unknown): v is ProvinciaId {
  return v === "castellon" || v === "sevilla" || v === "cordoba";
}

/** @deprecated usar esProvinciaAndalucia */
export const esAndalucia = esProvinciaAndalucia;
