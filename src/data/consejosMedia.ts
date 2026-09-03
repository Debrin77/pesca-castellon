/**
 * Guías visuales empaquetadas en local (offline).
 * Fotos y diagramas de Wikimedia Commons (PD / CC0 / CC BY / CC BY-SA).
 * Ver assets/consejos/licencias/ATTRIBUTION.md
 *
 * Enfoque inspirado en apps como Knots 3D / Animated Knots by Grog /
 * Fishing Knots Real 3D: secuencia fotográfica o diagrama por pasos,
 * no solo un icono decorativo.
 */

import type { ImageSourcePropType } from "react-native";

/** Identificadores de esquemas / guías visuales para la escuela de bolsillo. */
export type IdDiagrama =
  | "nudo-palomar"
  | "nudo-clinch"
  | "nudo-uni"
  | "nudo-albright"
  | "nudo-loop"
  | "anzuelo-simple"
  | "anzuelo-triple"
  | "anzuelo-offset"
  | "anzuelo-circle"
  | "anzuelo-mosca"
  | "plomo-piramide"
  | "plomo-bala"
  | "plomo-oliva"
  | "plomo-gota"
  | "cucharilla-giratoria"
  | "cucharilla-ondulante"
  | "snap-clip"
  | "emerillon"
  | "mosqueton"
  | "conector-rapido"
  | "tabla-tallas"
  | "kit-principiante"
  | "montaje-spinning"
  | "montaje-fondo";

export type PasoMedia = {
  source: ImageSourcePropType;
  /** Pie de foto en español, explicativo para principiantes. */
  caption: string;
};

export type GuiaMedia = {
  /** secuencia = varias fotos; diagrama = esquema completo; id = foto de identificación */
  modo: "secuencia" | "diagrama" | "identificacion";
  pasos: PasoMedia[];
  /** Crédito breve bajo la guía */
  credito: string;
};

const N = {
  palomar1: require("../../assets/consejos/nudos/palomar-01.jpg"),
  palomar2: require("../../assets/consejos/nudos/palomar-02.jpg"),
  palomar3: require("../../assets/consejos/nudos/palomar-03.jpg"),
  palomar4: require("../../assets/consejos/nudos/palomar-04.jpg"),
  palomar5: require("../../assets/consejos/nudos/palomar-05.jpg"),
  palomar6: require("../../assets/consejos/nudos/palomar-06.jpg"),
  palomar7: require("../../assets/consejos/nudos/palomar-07.jpg"),
  clinchBasico: require("../../assets/consejos/nudos/clinch-basico.jpg"),
  clinchMejorado: require("../../assets/consejos/nudos/clinch-mejorado.jpg"),
  clinchResultado: require("../../assets/consejos/nudos/clinch-resultado.jpg"),
  uni: require("../../assets/consejos/nudos/uni-diagrama.jpg"),
  albrightDiag: require("../../assets/consejos/nudos/albright-diagrama.png"),
  albrightFoto: require("../../assets/consejos/nudos/albright-foto.jpg"),
  cirujano: require("../../assets/consejos/nudos/cirujano-lazo.png"),
};

const A = {
  emerillones: require("../../assets/consejos/aparejos/emerillones.jpg"),
  snaps: require("../../assets/consejos/aparejos/snaps-mosquetones.jpg"),
  cucharilla: require("../../assets/consejos/aparejos/cucharilla-giratoria.jpg"),
  spinner: require("../../assets/consejos/aparejos/cucharilla-spinner.jpg"),
  offset: require("../../assets/consejos/aparejos/anzuelo-offset.jpg"),
  circle: require("../../assets/consejos/aparejos/anzuelo-circle.jpg"),
  jVsCircle: require("../../assets/consejos/aparejos/j-vs-circle.jpg"),
  anzuelos: require("../../assets/consejos/aparejos/anzuelos-varios.jpg"),
  partes: require("../../assets/consejos/aparejos/anzuelo-partes.png"),
  plomos: require("../../assets/consejos/aparejos/plomos.jpg"),
  texas: require("../../assets/consejos/aparejos/montaje-texas.png"),
  blancos: require("../../assets/consejos/aparejos/anzuelos-blancos.jpg"),
};

/** Guías con foto real / diagrama libre. Si no hay entrada, se usa el esquema View. */
export const GUIAS_MEDIA: Partial<Record<IdDiagrama, GuiaMedia>> = {
  "nudo-palomar": {
    modo: "secuencia",
    credito: "Fotos © Der Barbar · CC BY 4.0 · Wikimedia Commons",
    pasos: [
      {
        source: N.palomar1,
        caption: "Dobla ~15 cm de línea y pasa el doble por el ojal del anzuelo (aquí, el anillo).",
      },
      {
        source: N.palomar2,
        caption: "Con el doble, haz un nudo simple flojo (un lazo sobre sí mismo).",
      },
      {
        source: N.palomar3,
        caption: "Abre bien el lazo: debe caber el anzuelo entero.",
      },
      {
        source: N.palomar4,
        caption: "Pasa el anzuelo completo por dentro del lazo.",
      },
      {
        source: N.palomar5,
        caption: "Tira despacio para que el lazo baje hacia el ojal.",
      },
      {
        source: N.palomar6,
        caption: "Moja el hilo (agua o saliva) y aprieta sin tirones secos.",
      },
      {
        source: N.palomar7,
        caption: "Listo: corta el sobrante a ~2 mm. Este es el nudo más fiable para empezar.",
      },
    ],
  },
  "nudo-clinch": {
    modo: "secuencia",
    credito: "Diagramas © Der Barbar · CC BY-SA 4.0 · foto StromBer · CC BY-SA 2.0",
    pasos: [
      {
        source: N.clinchBasico,
        caption:
          "Clinch básico: pasa por el ojal, da 5–7 vueltas alrededor de la línea y vuelve a pasar por el hueco junto al ojal.",
      },
      {
        source: N.clinchMejorado,
        caption:
          "Clinch mejorado: después del hueco, pasa también por el lazo grande (el que queda al tirar). Más seguro en nylon.",
      },
      {
        source: N.clinchResultado,
        caption: "Así queda apretado. Lubrica antes de cerrar. Evítalo en trenza fina: usa Palomar.",
      },
    ],
  },
  "nudo-uni": {
    modo: "diagrama",
    credito: "Diagrama © Snapper G · CC BY-SA 3.0 · Wikimedia Commons",
    pasos: [
      {
        source: N.uni,
        caption:
          "Uni / Grinner: pasa por el ojal, forma un círculo hacia atrás, da 5–6 vueltas dentro del círculo, tira de la punta y luego de la línea.",
      },
    ],
  },
  "nudo-albright": {
    modo: "secuencia",
    credito: "Diagrama PD LadyofHats/Dfred · foto CC BY-SA 2.0 · Wikimedia",
    pasos: [
      {
        source: N.albrightDiag,
        caption:
          "Sigue el esquema de arriba abajo: lazo de fluoro → introduce trenza → 10–12 vueltas → punta por el lazo → aprieta por etapas.",
      },
      {
        source: N.albrightFoto,
        caption: "Así se ve el empalme en la mano. Practica en seco en casa antes de usarlo en el agua.",
      },
    ],
  },
  "nudo-loop": {
    modo: "diagrama",
    credito: "Diagrama PD © LadyofHats · Wikimedia Commons",
    pasos: [
      {
        source: N.cirujano,
        caption:
          "Lazo de cirujano: dobla el extremo, haz un nudo simple pasando dos veces por el ojal y aprieta. Sirve para snap o mosca con lazo.",
      },
    ],
  },
  "anzuelo-simple": {
    modo: "identificacion",
    credito: "Foto PD · Wikimedia Commons",
    pasos: [
      {
        source: A.blancos,
        caption: "Anzuelo simple: un solo hierro. Elige talla según cebo; sin arponcillo en trucha / sin muerte.",
      },
      {
        source: A.partes,
        caption: "Partes: ojal (ojo), pala, vástago, curva, punta y arponcillo. Mide el hierro, no «a ojo».",
      },
    ],
  },
  "anzuelo-triple": {
    modo: "identificacion",
    credito: "Foto PD · Wikimedia Commons",
    pasos: [
      {
        source: A.anzuelos,
        caption: "Triples (varios hierros juntos): típicos en cucharillas. Sustituye por simple si devuelves el pez.",
      },
    ],
  },
  "anzuelo-offset": {
    modo: "identificacion",
    credito: "Foto © Mike Cline · CC BY-SA 3.0 · Wikimedia",
    pasos: [
      {
        source: A.offset,
        caption: "Offset / worm hook: pala desplazada para ocultar la punta en el vinilo (montaje texas antihierba).",
      },
      {
        source: A.texas,
        caption: "Montaje Texas: plomo bala + offset + vinilo. Ideal en embalses con hierba (Arenós, Sichar).",
      },
    ],
  },
  "anzuelo-circle": {
    modo: "identificacion",
    credito: "Fotos PD / CC BY-SA · Wikimedia Commons",
    pasos: [
      {
        source: A.circle,
        caption: "Circle hook: punta curvada hacia el vástago. Se clava solo al tensar; no hagas tirón clásico.",
      },
      {
        source: A.jVsCircle,
        caption: "Comparación: J-hook (izquierda) vs circle (derecha). El circle suele enganchar en la comisura.",
      },
    ],
  },
  "anzuelo-mosca": {
    modo: "identificacion",
    credito: "Foto © daniel jaeger · CC BY-SA 2.5 · Wikimedia",
    pasos: [
      {
        source: A.blancos,
        caption: "Hierro fino y pequeño para mosca seca/ninfa. En cotos de mosca: un solo anzuelo sin muerte.",
      },
    ],
  },
  "plomo-bala": {
    modo: "identificacion",
    credito: "Diagrama Texas © Zachary635 · CC BY 4.0 · plomos PD",
    pasos: [
      {
        source: A.texas,
        caption: "Plomo bala (bullet) delante del anzuelo offset: desliza por la hierba en montaje texas.",
      },
      {
        source: A.plomos,
        caption: "Formas de plomo: elige el más ligero que te permita lanzar y tocar fondo.",
      },
    ],
  },
  "plomo-piramide": {
    modo: "identificacion",
    credito: "Foto PD · Wikimedia Commons",
    pasos: [
      {
        source: A.plomos,
        caption: "Pirámide: base plana que se clava en arena. Surfcasting de orilla (80–150 g típicos).",
      },
    ],
  },
  "plomo-oliva": {
    modo: "identificacion",
    credito: "Foto PD · Wikimedia Commons",
    pasos: [
      {
        source: A.plomos,
        caption: "Oliva / cilindro deslizante: la línea pasa libre; el pez tira sin arrastrar todo el peso al instante.",
      },
    ],
  },
  "plomo-gota": {
    modo: "identificacion",
    credito: "Foto PD · Wikimedia Commons",
    pasos: [
      {
        source: A.plomos,
        caption: "Gota / drop shot: el peso va al final del bajo; el anzuelo queda arriba (finesse en embalse).",
      },
    ],
  },
  "cucharilla-giratoria": {
    modo: "identificacion",
    credito: "Foto © Danndorfer1914 · CC0 · Wikimedia Commons",
    pasos: [
      {
        source: A.cucharilla,
        caption: "Cucharilla giratoria: pala que gira + cuerpo + anzuelo. Pon emerillón delante para no torcer la línea.",
      },
    ],
  },
  "cucharilla-ondulante": {
    modo: "identificacion",
    credito: "Foto © Santeri Viinamäki · CC BY-SA 4.0 · Wikimedia",
    pasos: [
      {
        source: A.spinner,
        caption: "Cucharilla / spinner: chapa que balancea o gira. Plateada o cobriza para trucha en río.",
      },
    ],
  },
  "snap-clip": {
    modo: "identificacion",
    credito: "Foto © Raboe001 · CC BY-SA 2.5 · Wikimedia Commons",
    pasos: [
      {
        source: A.snaps,
        caption:
          "Snap / clip (los ganchitos de alambre): ábrelo, engancha el señuelo, cierra. Ata el nudo al snap, no al señuelo.",
      },
    ],
  },
  "emerillon": {
    modo: "identificacion",
    credito: "Foto © Raboe001 · CC BY-SA 2.5 · Wikimedia Commons",
    pasos: [
      {
        source: A.emerillones,
        caption: "Emerillón (swivel): el cilindrito que gira. Evita que la línea se enrede con cucharillas y fondo.",
      },
      {
        source: A.snaps,
        caption: "Combo habitual: emerillón + snap (o snap doble). Cambia de señuelo sin rehacer el nudo.",
      },
    ],
  },
  "mosqueton": {
    modo: "identificacion",
    credito: "Foto © Raboe001 · CC BY-SA 2.5 · Wikimedia Commons",
    pasos: [
      {
        source: A.snaps,
        caption: "Mosquetón / snap robusto: para lucio, jigs pesados o costa. En UL de trucha usa snap micro.",
      },
    ],
  },
  "conector-rapido": {
    modo: "identificacion",
    credito: "Foto © Raboe001 · CC BY-SA 2.5 · Wikimedia Commons",
    pasos: [
      {
        source: A.emerillones,
        caption: "Anilla micro / conector: une trenza y flúoro con dos Uni. Alternativa fácil al Albright.",
      },
    ],
  },
  /** Kit / montajes de aparejo (reutiliza fotos de identificación). */
  "kit-principiante": {
    modo: "secuencia",
    credito: "Fotos CC BY-SA / CC0 · Wikimedia Commons (uso local offline)",
    pasos: [
      {
        source: A.snaps,
        caption: "1) Lleva snaps y emerillones en una cajita plana. Son el atajo del principiante.",
      },
      {
        source: N.palomar7,
        caption: "2) Ata un solo nudo (Palomar) al snap — no al señuelo.",
      },
      {
        source: A.cucharilla,
        caption: "3) Abre el snap, engancha cucharilla o vinilo, cierra. Cambias de señuelo en 1 segundo.",
      },
      {
        source: A.plomos,
        caption: "4) Añade plomos y anzuelos de repuesto sin arponcillo. Menos es más.",
      },
    ],
  },
  "montaje-spinning": {
    modo: "secuencia",
    credito: "Fotos libres Wikimedia Commons · esquema Texas CC BY 4.0",
    pasos: [
      {
        source: A.emerillones,
        caption: "Orden: línea principal → (bajo de flúoro) → emerillón opcional → snap → señuelo.",
      },
      {
        source: A.texas,
        caption: "Con vinilo: montaje texas (plomo bala + offset). Con cucharilla: emerillón + snap.",
      },
      {
        source: A.cucharilla,
        caption: "Resultado: caña spinning + carrete 2500–3000 + señuelo listo para embalse.",
      },
    ],
  },
  "montaje-fondo": {
    modo: "secuencia",
    credito: "Fotos libres Wikimedia Commons",
    pasos: [
      {
        source: A.plomos,
        caption: "Fondo / feeder: plomo (oliva o cage) deslizante en la línea principal.",
      },
      {
        source: A.emerillones,
        caption: "Debajo: emerillón de tope + bajo de nailon + anzuelo a medida del cebo.",
      },
      {
        source: A.blancos,
        caption: "Solo donde cebar esté permitido (no trucheros). Revisa cupos y tallas.",
      },
    ],
  },
};
