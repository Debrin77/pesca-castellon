import { castellonConfig } from "./castellon/config";
import { sevillaConfig } from "./sevilla/config";
import { cordobaConfig } from "./cordoba/config";
import { cuencaConfig } from "./cuenca/config";
import type { ProvinciaConfig, ProvinciaId } from "./types";
import { esProvinciaAndalucia, esProvinciaCastillaLaMancha } from "./types";

export type { ProvinciaConfig, ProvinciaId, RegionMapa } from "./types";
export { esProvinciaAndalucia, esProvinciaCastillaLaMancha } from "./types";

export const PROVINCIAS: Record<ProvinciaId, ProvinciaConfig> = {
  castellon: castellonConfig,
  sevilla: sevillaConfig,
  cordoba: cordobaConfig,
  cuenca: cuencaConfig,
};

export const LISTA_PROVINCIAS: ProvinciaConfig[] = [
  castellonConfig,
  sevillaConfig,
  cordobaConfig,
  cuencaConfig,
];

export function provinciaPorId(id: ProvinciaId): ProvinciaConfig {
  return PROVINCIAS[id] ?? castellonConfig;
}

export function esProvinciaId(v: unknown): v is ProvinciaId {
  return v === "castellon" || v === "sevilla" || v === "cordoba" || v === "cuenca";
}

/** @deprecated usar esProvinciaAndalucia */
export const esAndalucia = esProvinciaAndalucia;
