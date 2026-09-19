/**
 * Diagramas de medición por especie (placas técnicas en español).
 * Longitud total en cm (UE/RD 560); pulpo en kg.
 */
import type { ImageSourcePropType } from "react-native";

const POR_ID: Record<string, ImageSourcePropType> = {
  lubina: require("../../assets/medicion/especies/lubina.jpg"),
  llobarro: require("../../assets/medicion/especies/llobarro.jpg"),
  dorada: require("../../assets/medicion/especies/dorada.jpg"),
  sargo: require("../../assets/medicion/especies/sargo.jpg"),
  mojarra: require("../../assets/medicion/especies/mojarra.jpg"),
  salema: require("../../assets/medicion/especies/salema.jpg"),
  llisa: require("../../assets/medicion/especies/llisa.jpg"),
  mabra: require("../../assets/medicion/especies/mabra.jpg"),
  mugilidos: require("../../assets/medicion/especies/mugilidos.jpg"),
  jurel: require("../../assets/medicion/especies/jurel.jpg"),
  caballa: require("../../assets/medicion/especies/caballa.jpg"),
  salmonete: require("../../assets/medicion/especies/salmonete.jpg"),
  boga: require("../../assets/medicion/especies/boga.jpg"),
  pulpo: require("../../assets/medicion/especies/pulpo.jpg"),
};

/** Alias por forma cuando no hay placa propia. */
const ALIAS: Record<string, string> = {
  // mugílidos → llisa
  // ya tienen archivo propio
};

export function diagramaMedicionEspecie(especieId?: string | null): ImageSourcePropType | null {
  if (!especieId) return null;
  if (POR_ID[especieId]) return POR_ID[especieId];
  const alias = ALIAS[especieId];
  if (alias && POR_ID[alias]) return POR_ID[alias];
  return null;
}

export function idsConDiagramaMedicion(): string[] {
  return Object.keys(POR_ID);
}
