/**
 * Fotografías reales de especies (Wikimedia Commons, empaquetadas offline).
 * Ver assets/especies/ATTRIBUTION.md
 */
import type { ImageSourcePropType } from "react-native";

const FOTOS: Record<string, ImageSourcePropType> = {
  trucha_comun: require("../../assets/especies/trucha_comun.jpg"),
  trucha_arcoiris: require("../../assets/especies/trucha_arcoiris.jpg"),
  black_bass: require("../../assets/especies/black_bass.jpg"),
  lucio: require("../../assets/especies/lucio.jpg"),
  carpa: require("../../assets/especies/carpa.jpg"),
  barbo: require("../../assets/especies/barbo.jpg"),
  barbo_gitano: require("../../assets/especies/barbo_gitano.jpg"),
  siluro: require("../../assets/especies/siluro.jpg"),
  cangrejo_americano: require("../../assets/especies/cangrejo_americano.jpg"),
  cangrejo_azul: require("../../assets/especies/cangrejo_azul.jpg"),
  gambusia: require("../../assets/especies/gambusia.jpg"),
  anguila: require("../../assets/especies/anguila.jpg"),
  carpin: require("../../assets/especies/carpin.jpg"),
  tenca: require("../../assets/especies/tenca.jpg"),
  mugilidos: require("../../assets/especies/mugilidos.jpg"),
  llisa: require("../../assets/especies/llisa.jpg"),
  alburno: require("../../assets/especies/alburno.jpg"),
  boga: require("../../assets/especies/boga.jpg"),
  lubina: require("../../assets/especies/lubina.jpg"),
  dorada: require("../../assets/especies/dorada.jpg"),
  sargo: require("../../assets/especies/sargo.jpg"),
  mojarra: require("../../assets/especies/mojarra.jpg"),
  herrera: require("../../assets/especies/herrera.jpg"),
  oblada: require("../../assets/especies/oblada.jpg"),
  salema: require("../../assets/especies/salema.jpg"),
  mabra: require("../../assets/especies/mabra.jpg"),
  jurel: require("../../assets/especies/jurel.jpg"),
  caballa: require("../../assets/especies/caballa.jpg"),
  sepia: require("../../assets/especies/sepia.jpg"),
  calamar: require("../../assets/especies/calamar.jpg"),
  pulpo: require("../../assets/especies/pulpo.jpg"),
  salmonete: require("../../assets/especies/salmonete.jpg"),
  corvina: require("../../assets/especies/corvina.jpg"),
  palometon: require("../../assets/especies/palometon.jpg"),
  anjova: require("../../assets/especies/anjova.jpg"),
  espeton: require("../../assets/especies/espeton.jpg"),
  datil_mar: require("../../assets/especies/datil_mar.jpg"),
  nacra: require("../../assets/especies/nacra.jpg"),
  caballito: require("../../assets/especies/caballito.jpg"),
  tortuga: require("../../assets/especies/tortuga.jpg"),
  mero_pequeno: require("../../assets/especies/mero_pequeno.jpg"),
};

export function fotoEspecie(id?: string | null): ImageSourcePropType | null {
  if (!id) return null;
  return FOTOS[id] ?? null;
}

export function hayFotoEspecie(id?: string | null): boolean {
  return !!fotoEspecie(id);
}
