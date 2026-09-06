/**
 * Foto real por elemento del montaje (línea → cebo/señuelo).
 * Reutiliza assets de consejos/aparejos (Wikimedia, ver ATTRIBUTION.md).
 */

import type { ImageSourcePropType } from "react-native";
import type { PiezaMontaje } from "./montajesEspecie";

const F = {
  linea: require("../../assets/consejos/aparejos/linea-nylon.jpg"),
  emerillon: require("../../assets/consejos/aparejos/emerillones.jpg"),
  snap: require("../../assets/consejos/aparejos/snaps-mosquetones.jpg"),
  boya: require("../../assets/consejos/aparejos/boyas.jpg"),
  boyaStick: require("../../assets/consejos/aparejos/boyas-stick.jpg"),
  plomoPiramide: require("../../assets/consejos/aparejos/plomos.jpg"),
  plomoVarios: require("../../assets/consejos/aparejos/plomos-varios.jpg"),
  plomoCilindro: require("../../assets/consejos/aparejos/plomo-cilindro.jpg"),
  texas: require("../../assets/consejos/aparejos/montaje-texas.jpg"),
  anzuelo: require("../../assets/consejos/aparejos/anzuelos-blancos.jpg"),
  anzueloVarios: require("../../assets/consejos/aparejos/anzuelos-varios.jpg"),
  offset: require("../../assets/consejos/aparejos/anzuelo-offset.jpg"),
  cucharilla: require("../../assets/consejos/aparejos/cucharilla-giratoria.jpg"),
  ondulante: require("../../assets/consejos/aparejos/cucharilla-ondulante.jpg"),
  vinilos: require("../../assets/consejos/aparejos/vinilos-varios.jpg"),
  shad: require("../../assets/consejos/aparejos/vinilos-peces.jpg"),
  egi: require("../../assets/consejos/aparejos/egi-jigs.jpg"),
  ceboGusano: require("../../assets/consejos/aparejos/cebo-gusano.jpg"),
  ceboMaiz: require("../../assets/consejos/aparejos/cebo-maiz.jpg"),
};

function textoPieza(p: PiezaMontaje): string {
  return `${p.etiqueta} ${p.detalle ?? ""}`.toLowerCase();
}

/**
 * Elige la foto más representativa según tipo + etiqueta del elemento.
 * Misma explicación de texto; solo cambia el gráfico por foto real.
 */
export function fotoDePiezaMontaje(pieza: PiezaMontaje): ImageSourcePropType {
  const t = textoPieza(pieza);

  switch (pieza.tipo) {
    case "linea":
      return F.linea;
    case "emerillon":
      return F.emerillon;
    case "snap":
      return F.snap;
    case "boya":
      if (t.includes("stick") || t.includes("ligera") || t.includes("sensible")) return F.boyaStick;
      return F.boya;
    case "plomo":
      if (t.includes("bala") || t.includes("bullet") || t.includes("texas")) return F.texas;
      if (t.includes("pirámide") || t.includes("piramide") || t.includes("spike")) return F.plomoPiramide;
      if (t.includes("oliva") || t.includes("cilindro") || t.includes("cage") || t.includes("deslizante")) {
        return F.plomoCilindro;
      }
      if (t.includes("perdig") || t.includes("balin") || t.includes("balín")) return F.plomoVarios;
      return F.plomoVarios;
    case "anzuelo":
      if (t.includes("offset") || t.includes("worm")) return F.offset;
      if (t.includes("jig") || t.includes("pulpo")) return F.anzueloVarios;
      return F.anzuelo;
    case "senuelo":
      if (t.includes("egí") || t.includes("egi") || t.includes("calamar") || t.includes("sepia")) return F.egi;
      if (t.includes("ondulante") || t.includes("spoon") || t.includes("blinker")) return F.ondulante;
      if (t.includes("cucharilla") || t.includes("spinner") || t.includes("metal")) return F.cucharilla;
      if (t.includes("shad") || t.includes("15–25") || t.includes("15-25")) return F.shad;
      if (t.includes("vinilo") || t.includes("jerk") || t.includes("weedless") || t.includes("texas")) {
        return F.vinilos;
      }
      return F.vinilos;
    case "cebo":
      if (t.includes("maíz") || t.includes("maiz") || t.includes("boilie") || t.includes("pellet") || t.includes("pan")) {
        return F.ceboMaiz;
      }
      return F.ceboGusano;
    default:
      return F.linea;
  }
}

/** Crédito breve bajo el esquema (fotos empaquetadas). */
export const CREDITO_FOTOS_MONTAJE =
  "Fotos Wikimedia Commons (PD / CC BY / CC BY-SA) · uso local offline";
