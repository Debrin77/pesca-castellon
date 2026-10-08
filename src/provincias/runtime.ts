import type { ProvinciaConfig, ProvinciaId } from "./types";
import { PROVINCIAS, provinciaPorId } from "./index";
import { provinciaConContenidoVivo } from "../services/contenidoVivoService";

let activaId: ProvinciaId = "castellon";

export function getProvinciaActiva(): ProvinciaConfig {
  return provinciaConContenidoVivo(activaId);
}

export function getProvinciaIdActiva(): ProvinciaId {
  return activaId;
}

export function setProvinciaActiva(id: ProvinciaId): ProvinciaConfig {
  activaId = id;
  return provinciaConContenidoVivo(id);
}

/** Invalida la provincia activa (selector). Evita dejar Castellón “fantasma”. */
export function clearProvinciaActiva(): void {
  activaId = "castellon";
}

/** @deprecated Preferir getProvinciaActiva(); se mantiene por compat. */
export function provinciaBundleActiva(): ProvinciaConfig {
  return PROVINCIAS[activaId] ?? provinciaPorId(activaId);
}
