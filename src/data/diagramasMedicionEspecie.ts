/**
 * Diagramas de medición por especie (placas técnicas en español).
 * Cubre orilla, mar/embarcación y continental (todas las provincias).
 * Longitud total en cm (UE/RD 560); cefalópodos = manto; pulpo = kg; cangrejo = anchura.
 */
import type { ImageSourcePropType } from "react-native";

const POR_ID: Record<string, ImageSourcePropType> = {
  // Orilla / mar
  lubina: require("../../assets/medicion/especies/lubina.jpg"),
  dorada: require("../../assets/medicion/especies/dorada.jpg"),
  sargo: require("../../assets/medicion/especies/sargo.jpg"),
  mojarra: require("../../assets/medicion/especies/mojarra.jpg"),
  salema: require("../../assets/medicion/especies/salema.jpg"),
  llisa: require("../../assets/medicion/especies/llisa.jpg"),
  mabra: require("../../assets/medicion/especies/mabra.jpg"),
  jurel: require("../../assets/medicion/especies/jurel.jpg"),
  caballa: require("../../assets/medicion/especies/caballa.jpg"),
  salmonete: require("../../assets/medicion/especies/salmonete.jpg"),
  boga: require("../../assets/medicion/especies/boga.jpg"),
  pulpo: require("../../assets/medicion/especies/pulpo.jpg"),
  herrera: require("../../assets/medicion/especies/herrera.jpg"),
  oblada: require("../../assets/medicion/especies/oblada.jpg"),
  sepia: require("../../assets/medicion/especies/sepia.jpg"),
  calamar: require("../../assets/medicion/especies/calamar.jpg"),
  corvina: require("../../assets/medicion/especies/corvina.jpg"),
  palometon: require("../../assets/medicion/especies/palometon.jpg"),
  anjova: require("../../assets/medicion/especies/anjova.jpg"),
  espeton: require("../../assets/medicion/especies/espeton.jpg"),
  // Embarcación
  pagel: require("../../assets/medicion/especies/pagel.jpg"),
  denton: require("../../assets/medicion/especies/denton.jpg"),
  // Continental (río / embalse) — todas las provincias
  llobarro: require("../../assets/medicion/especies/llobarro.jpg"),
  mugilidos: require("../../assets/medicion/especies/mugilidos.jpg"),
  trucha_comun: require("../../assets/medicion/especies/trucha_comun.jpg"),
  trucha_arcoiris: require("../../assets/medicion/especies/trucha_arcoiris.jpg"),
  black_bass: require("../../assets/medicion/especies/black_bass.jpg"),
  lucio: require("../../assets/medicion/especies/lucio.jpg"),
  carpa: require("../../assets/medicion/especies/carpa.jpg"),
  carpin: require("../../assets/medicion/especies/carpin.jpg"),
  barbo: require("../../assets/medicion/especies/barbo.jpg"),
  barbo_gitano: require("../../assets/medicion/especies/barbo_gitano.jpg"),
  tenca: require("../../assets/medicion/especies/tenca.jpg"),
  siluro: require("../../assets/medicion/especies/siluro.jpg"),
  anguila: require("../../assets/medicion/especies/anguila.jpg"),
  alburno: require("../../assets/medicion/especies/alburno.jpg"),
  cacho: require("../../assets/medicion/especies/cacho.jpg"),
  cangrejo_americano: require("../../assets/medicion/especies/cangrejo_americano.jpg"),
  cangrejo_azul: require("../../assets/medicion/especies/cangrejo_azul.jpg"),
};

/** Alias cuando la morfología es equivalente. */
const ALIAS: Record<string, string> = {
  // bonito ~ caballa (scombridae) si se añade talla después
};

export function diagramaMedicionEspecie(especieId?: string | null): ImageSourcePropType | null {
  if (!especieId) return null;
  if (POR_ID[especieId]) return POR_ID[especieId];
  const alias = ALIAS[especieId];
  if (alias && POR_ID[alias]) return POR_ID[alias];
  return null;
}

export function hayDiagramaMedicionEspecie(especieId?: string | null): boolean {
  return diagramaMedicionEspecie(especieId) != null;
}

export function idsConDiagramaMedicion(): string[] {
  return Object.keys(POR_ID);
}
