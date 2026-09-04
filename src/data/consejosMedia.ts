/**
 * Guías visuales empaquetadas en local (offline).
 * Solo fotografías reales de Wikimedia Commons (PD / CC0 / CC BY / CC BY-SA).
 * Ver assets/consejos/licencias/ATTRIBUTION.md
 *
 * Enfoque tipo Knots 3D / Animated Knots: secuencia fotográfica por pasos
 * o foto de identificación — sin croquis ni diagramas esquemáticos.
 */

import type { ImageSourcePropType } from "react-native";

/** Identificadores de esquemas / guías visuales para la escuela de bolsillo. */
export type IdDiagrama =
  | "nudo-palomar"
  | "nudo-clinch"
  | "nudo-trilene"
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
  | "montaje-fondo"
  | "vinilo-soft"
  | "montaje-lubina-spinning"
  | "montaje-dorada-fondo"
  | "montaje-sargo-roca"
  | "montaje-carpa-boya"
  | "montaje-bass-texas"
  | "montaje-trucha-cucharilla"
  | "montaje-llisa-boya"
  | "montaje-sepia-eging";

export type PasoMedia = {
  source: ImageSourcePropType;
  /** Pie de foto en español, alineado con lo que se ve en la imagen. */
  caption: string;
};

export type GuiaMedia = {
  /** secuencia = varias fotos; identificacion = foto de material */
  modo: "secuencia" | "identificacion";
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
  trilene1: require("../../assets/consejos/nudos/trilene-01.jpg"),
  trilene2: require("../../assets/consejos/nudos/trilene-02.jpg"),
  trilene3: require("../../assets/consejos/nudos/trilene-03.jpg"),
  trilene4: require("../../assets/consejos/nudos/trilene-04.jpg"),
  trilene5: require("../../assets/consejos/nudos/trilene-05.jpg"),
  albright1: require("../../assets/consejos/nudos/albright-01.jpg"),
  albright2: require("../../assets/consejos/nudos/albright-02.jpg"),
  albright3: require("../../assets/consejos/nudos/albright-03.jpg"),
  albright4: require("../../assets/consejos/nudos/albright-04.jpg"),
  lazoSuelto: require("../../assets/consejos/nudos/lazo-pescador-suelto.jpg"),
  lazoCerrado: require("../../assets/consejos/nudos/lazo-pescador-cerrado.jpg"),
};

const A = {
  emerillones: require("../../assets/consejos/aparejos/emerillones.jpg"),
  snaps: require("../../assets/consejos/aparejos/snaps-mosquetones.jpg"),
  cucharilla: require("../../assets/consejos/aparejos/cucharilla-giratoria.jpg"),
  spinnerMontado: require("../../assets/consejos/aparejos/cucharilla-spinner.jpg"),
  ondulante: require("../../assets/consejos/aparejos/cucharilla-ondulante.jpg"),
  ondulante2: require("../../assets/consejos/aparejos/cucharilla-ondulante-2.jpg"),
  offset: require("../../assets/consejos/aparejos/anzuelo-offset.jpg"),
  circle: require("../../assets/consejos/aparejos/anzuelo-circle.jpg"),
  jVsCircle: require("../../assets/consejos/aparejos/j-vs-circle.jpg"),
  anzuelos: require("../../assets/consejos/aparejos/anzuelos-varios.jpg"),
  blancos: require("../../assets/consejos/aparejos/anzuelos-blancos.jpg"),
  plomoPiramide: require("../../assets/consejos/aparejos/plomos.jpg"),
  plomosVarios: require("../../assets/consejos/aparejos/plomos-varios.jpg"),
  plomoCilindro: require("../../assets/consejos/aparejos/plomo-cilindro.jpg"),
  texas: require("../../assets/consejos/aparejos/montaje-texas.jpg"),
  texasDetalle: require("../../assets/consejos/aparejos/montaje-texas-detalle.jpg"),
  vinilos: require("../../assets/consejos/aparejos/vinilos-varios.jpg"),
  twister: require("../../assets/consejos/aparejos/vinilos-twister.jpg"),
  gummifish: require("../../assets/consejos/aparejos/vinilos-peces.jpg"),
};

/** Guías fotográficas. Si no hay entrada, se usa el esquema View de respaldo. */
export const GUIAS_MEDIA: Partial<Record<IdDiagrama, GuiaMedia>> = {
  "nudo-palomar": {
    modo: "secuencia",
    credito: "Fotos © Der Barbar · CC BY 4.0 · Wikimedia Commons",
    pasos: [
      {
        source: N.palomar1,
        caption:
          "Paso 1 — Dobla unos 15 cm de línea (bucle) y pasa el doble por el ojal del anzuelo o anilla.",
      },
      {
        source: N.palomar2,
        caption: "Paso 2 — Con el doble, forma un nudo simple flojo (un lazo sobre sí mismo), sin apretar.",
      },
      {
        source: N.palomar3,
        caption: "Paso 3 — Abre bien el lazo grande: debe caber el anzuelo completo.",
      },
      {
        source: N.palomar4,
        caption: "Paso 4 — Pasa el anzuelo entero por dentro del lazo.",
      },
      {
        source: N.palomar5,
        caption: "Paso 5 — Tira despacio para que el lazo descienda hasta el ojal.",
      },
      {
        source: N.palomar6,
        caption: "Paso 6 — Moja el hilo (agua o saliva) y aprieta sin tirones secos: evita quemar el nylon.",
      },
      {
        source: N.palomar7,
        caption:
          "Paso 7 — Nudo asentado. Corta el sobrante a ~2 mm. Conserva casi toda la resistencia del hilo.",
      },
    ],
  },
  "nudo-clinch": {
    modo: "secuencia",
    credito: "Fotos © Der Barbar · CC BY-SA 4.0 · resultado © StromBer · CC BY-SA 2.0",
    pasos: [
      {
        source: N.clinchBasico,
        caption:
          "Clinch básico — Pasa por el ojal, da 5–7 vueltas alrededor de la línea madre y vuelve a pasar por el hueco junto al ojal.",
      },
      {
        source: N.clinchMejorado,
        caption:
          "Clinch mejorado — Tras el hueco junto al ojal, pasa también por el lazo grande que queda al tirar. Más seguro en monofilamento.",
      },
      {
        source: N.clinchResultado,
        caption:
          "Resultado — Nudo asentado y lubricado. Evítalo en trenza fina (resbala): ahí usa Palomar o Trilene.",
      },
    ],
  },
  "nudo-trilene": {
    modo: "secuencia",
    credito: "Fotos © Der Barbar · CC BY 4.0 · Wikimedia Commons",
    pasos: [
      {
        source: N.trilene1,
        caption:
          "Paso 1 — Pasa la punta por el ojal (o anilla) y vuelve a pasarla: quedas con dos hilos por el ojal.",
      },
      {
        source: N.trilene2,
        caption: "Paso 2 — Con la punta, da 5–6 vueltas alrededor de la línea madre, alejándote del ojal.",
      },
      {
        source: N.trilene3,
        caption:
          "Paso 3 — Vuelve a pasar la punta por el doble lazo que queda junto al ojal (la «ventana» de las dos pasadas).",
      },
      {
        source: N.trilene4,
        caption: "Paso 4 — Moja y aprieta tirando a la vez de la línea madre y del anzuelo: las vueltas se asientan.",
      },
      {
        source: N.trilene5,
        caption:
          "Paso 5 — Nudo cerrado. Recorta el sobrante corto. Excelente en nylon y fluorocarbono para anzuelo o emerillón.",
      },
    ],
  },
  "nudo-albright": {
    modo: "secuencia",
    credito: "Fotos © StromBer · CC BY-SA 2.0 · Wikimedia Commons",
    pasos: [
      {
        source: N.albright1,
        caption:
          "Paso 1 — Haz un lazo con el hilo grueso (fluoro/bajo). Introduce el fino (trenza) por el lazo.",
      },
      {
        source: N.albright2,
        caption:
          "Paso 2 — Da 10–12 vueltas apretadas del fino sobre ambas ramas del lazo, avanzando hacia el cierre del lazo.",
      },
      {
        source: N.albright3,
        caption:
          "Paso 3 — Pasa la punta del fino otra vez por el lazo (por el mismo lado por el que entró) y aprieta por etapas.",
      },
      {
        source: N.albright4,
        caption:
          "Paso 4 — Empalme asentado. Corta sobrantes. Une trenza con fluorocarbono sin anillas; practica en seco en casa.",
      },
    ],
  },
  "nudo-loop": {
    modo: "secuencia",
    credito: "Fotos © David J. Fred · CC BY-SA 2.5 · Wikimedia Commons (ABOK #1017)",
    pasos: [
      {
        source: N.lazoSuelto,
        caption:
          "Lazo del pescador (suelto) — Forma un ojal fijo al final de la línea. Ideal para snap, mosca con lazo o conectar bajos.",
      },
      {
        source: N.lazoCerrado,
        caption:
          "Lazo asentado — Ajusta el tamaño del ojal antes de apretar; un lazo demasiado grande enreda. Moja y cierra con firmeza.",
      },
    ],
  },
  "anzuelo-simple": {
    modo: "identificacion",
    credito: "Fotos © daniel jaeger · CC BY-SA 2.5 · PD · Wikimedia Commons",
    pasos: [
      {
        source: A.blancos,
        caption:
          "Anzuelo simple — Un solo hierro. Elige talla según el cebo; sin arponcillo en tramos trucheros / pesca sin muerte.",
      },
      {
        source: A.anzuelos,
        caption:
          "Variedad de hierros — Compara curvas y grosores. El ojal (ojo) es donde atas el nudo; la punta debe estar afilada.",
      },
    ],
  },
  "anzuelo-triple": {
    modo: "identificacion",
    credito: "Foto PD · Wikimedia Commons",
    pasos: [
      {
        source: A.anzuelos,
        caption:
          "Anzuelo triple — Tres puntas soldadas; típico en cucharillas. Engancha más, daña más: sustituye por simple si devuelves.",
      },
    ],
  },
  "anzuelo-offset": {
    modo: "identificacion",
    credito: "Fotos © Mike Cline · CC BY-SA 3.0 · BRDSWRD · CC BY-SA 4.0 · Wikimedia",
    pasos: [
      {
        source: A.offset,
        caption:
          "Offset / worm hook — Pala desplazada para ocultar la punta en el vinilo (montaje weedless / antihierba).",
      },
      {
        source: A.texas,
        caption:
          "En uso (Texas) — Plomo bala + offset + softbait con la punta embebida. Ideal en hierba de embalse (Arenós, Sichar).",
      },
    ],
  },
  "anzuelo-circle": {
    modo: "identificacion",
    credito: "Fotos PD / CC BY-SA · Wikimedia Commons",
    pasos: [
      {
        source: A.circle,
        caption:
          "Circle hook — Punta curvada hacia el vástago. Se clava solo al tensar; no hagas el tirón clásico de clavado.",
      },
      {
        source: A.jVsCircle,
        caption:
          "J-hook (izq.) vs circle (der.) — El circle suele enganchar en la comisura y facilita la devolución.",
      },
    ],
  },
  "anzuelo-mosca": {
    modo: "identificacion",
    credito: "Foto © daniel jaeger · CC BY-SA 2.5 · Wikimedia",
    pasos: [
      {
        source: A.blancos,
        caption:
          "Hierro de mosca — Fino y pequeño para seca/ninfa. En cotos de mosca: un solo anzuelo sin arponcillo.",
      },
    ],
  },
  "plomo-bala": {
    modo: "identificacion",
    credito: "Fotos © BRDSWRD · CC BY-SA 4.0 · Danndorfer1914 · CC0 · Wikimedia",
    pasos: [
      {
        source: A.texas,
        caption:
          "Plomo bala (bullet) — Cónico, delante del anzuelo offset. Desliza por la hierba en montaje Texas.",
      },
      {
        source: A.texasDetalle,
        caption:
          "Detalle de montaje — Línea → bala → (cuentas opcionales) → nudo al ojal → vinilo. Empieza con 3–7 g en orilla.",
      },
    ],
  },
  "plomo-piramide": {
    modo: "identificacion",
    credito: "Foto PD · Wikimedia Commons",
    pasos: [
      {
        source: A.plomoPiramide,
        caption:
          "Plomo pirámide — Base plana que se clava en arena. Surfcasting de orilla (típico 80–150 g). El snap facilita el cambio.",
      },
    ],
  },
  "plomo-oliva": {
    modo: "identificacion",
    credito: "Fotos © Junyu-K · CC BY-SA 4.0 · R. Henrik Nilsson · CC BY 4.0 · Wikimedia",
    pasos: [
      {
        source: A.plomosVarios,
        caption:
          "Plomos de fondo — Formas redondeadas/cilíndricas para running: la línea pasa libre y el pez no arrastra todo el peso al picar.",
      },
      {
        source: A.plomoCilindro,
        caption:
          "Cilindro / oliva — Se ensarta en la línea principal; debajo, emerillón de tope + bajo + anzuelo.",
      },
    ],
  },
  "plomo-gota": {
    modo: "identificacion",
    credito: "Fotos © Junyu-K · CC BY-SA 4.0 · Wikimedia Commons",
    pasos: [
      {
        source: A.plomosVarios,
        caption:
          "Drop shot — El peso va al final del bajo; el anzuelo queda 30–60 cm arriba. Elige el más ligero que toque fondo (5–10 g).",
      },
    ],
  },
  "cucharilla-giratoria": {
    modo: "identificacion",
    credito: "Fotos © Danndorfer1914 · CC0 · Santeri Viinamäki · CC BY-SA 4.0 · Wikimedia",
    pasos: [
      {
        source: A.cucharilla,
        caption:
          "Cucharilla giratoria (spinner) — Pala que gira + cuerpo + anzuelo. Pon emerillón delante para no torcer la línea.",
      },
      {
        source: A.spinnerMontado,
        caption:
          "Montada en caña — Línea → nudo → emerillón/snap → spinner. N.º 0–1 trucha; n.º 2–4 embalse o costa ligera.",
      },
    ],
  },
  "cucharilla-ondulante": {
    modo: "identificacion",
    credito: "Fotos © Danndorfer1914 · CC0 · Wikimedia Commons",
    pasos: [
      {
        source: A.ondulante,
        caption:
          "Cucharilla ondulante (spoon / blinker) — Chapa metálica que vaivea sin girar como un spinner. Plateada, cobriza o dorada.",
      },
      {
        source: A.ondulante2,
        caption:
          "Anverso y reverso — Una cara suele ir pulida y la otra pintada. Recupera constante; para un segundo si sientes toque.",
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
          "Snap / clip — Ganchito de alambre: ábrelo, engancha el señuelo, cierra. Ata el nudo al snap, no al señuelo.",
      },
    ],
  },
  "emerillon": {
    modo: "identificacion",
    credito: "Foto © Raboe001 · CC BY-SA 2.5 · Wikimedia Commons",
    pasos: [
      {
        source: A.emerillones,
        caption:
          "Emerillón (swivel) — Cilindrito que gira. Evita que la línea se enrede con cucharillas giratorias y montajes de fondo.",
      },
      {
        source: A.snaps,
        caption: "Combo habitual — Emerillón + snap. Cambias de señuelo sin rehacer el nudo.",
      },
    ],
  },
  "mosqueton": {
    modo: "identificacion",
    credito: "Foto © Raboe001 · CC BY-SA 2.5 · Wikimedia Commons",
    pasos: [
      {
        source: A.snaps,
        caption:
          "Mosquetón / snap robusto — Para lucio, jigs pesados o costa. En UL de trucha usa snap micro.",
      },
    ],
  },
  "conector-rapido": {
    modo: "identificacion",
    credito: "Foto © Raboe001 · CC BY-SA 2.5 · Wikimedia Commons",
    pasos: [
      {
        source: A.emerillones,
        caption:
          "Anilla micro / conector — Une trenza y flúoro con dos nudos (Trilene o Uni a cada lado). Alternativa fácil al Albright.",
      },
    ],
  },
  "vinilo-soft": {
    modo: "identificacion",
    credito: "Fotos © Danndorfer1914 · CC0 · Wikimedia Commons",
    pasos: [
      {
        source: A.vinilos,
        caption:
          "Softbaits / vinilos — Twisters, shads y creaturas. Colores naturales con agua clara; chartreuse/blanco con turbia.",
      },
      {
        source: A.twister,
        caption: "Twister — Cola rizada que vibra en la recogida. Clásico con cabezas plomadas o Texas.",
      },
      {
        source: A.gummifish,
        caption: "Shads / peces de goma — Perfil de pez pasto. 7–12 cm para bass en embalse.",
      },
    ],
  },
  "kit-principiante": {
    modo: "secuencia",
    credito: "Fotos CC BY-SA / CC0 · Wikimedia Commons (uso local offline)",
    pasos: [
      {
        source: A.snaps,
        caption: "1) Snaps y emerillones en una cajita plana: el atajo del principiante.",
      },
      {
        source: N.palomar7,
        caption: "2) Ata un solo nudo (Palomar o Trilene) al snap — no al señuelo.",
      },
      {
        source: A.cucharilla,
        caption: "3) Abre el snap, engancha cucharilla o vinilo, cierra. Cambias en un segundo.",
      },
      {
        source: A.plomosVarios,
        caption: "4) Plomos y anzuelos de repuesto sin arponcillo. Menos es más.",
      },
    ],
  },
  "montaje-spinning": {
    modo: "secuencia",
    credito: "Fotos libres Wikimedia Commons",
    pasos: [
      {
        source: A.emerillones,
        caption: "Orden — Línea principal → (bajo de flúoro) → emerillón opcional → snap → señuelo.",
      },
      {
        source: A.texas,
        caption: "Con vinilo — Montaje Texas (bala + offset + softbait weedless). Con cucharilla: emerillón + snap.",
      },
      {
        source: A.spinnerMontado,
        caption: "Resultado — Caña spinning + carrete 2500–3000 + señuelo listo para embalse.",
      },
    ],
  },
  "montaje-fondo": {
    modo: "secuencia",
    credito: "Fotos libres Wikimedia Commons",
    pasos: [
      {
        source: A.plomoCilindro,
        caption: "Fondo / feeder — Plomo deslizante (oliva o cilindro) en la línea principal.",
      },
      {
        source: A.emerillones,
        caption: "Debajo — Emerillón de tope + bajo de nailon + anzuelo a medida del cebo.",
      },
      {
        source: A.blancos,
        caption: "Solo donde cebar esté permitido (no trucheros). Revisa cupos y tallas.",
      },
    ],
  },
};
