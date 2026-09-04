/**
 * Montajes habituales por especie (principiantes).
 * Un montaje “de siempre” + alternativa corta; enlazado desde Especies / Aparejos / Consejos.
 */

export type PiezaMontaje = {
  /** Etiqueta corta en el esquema */
  etiqueta: string;
  /** Detalle (talla, gramos, regulación…) */
  detalle?: string;
  /** Forma visual en el esquema */
  tipo: "linea" | "emerillon" | "snap" | "boya" | "plomo" | "anzuelo" | "senuelo" | "cebo";
};

export type MontajeEspecie = {
  id: string;
  /** Id del consejo en SECCIONES_CONSEJOS (categoría montajes). */
  consejoId: string;
  /** Id del diagrama en DiagramaConsejo / consejosMedia. */
  diagramaId: string;
  titulo: string;
  resumen: string;
  ambito: "costa" | "rio" | "ambos";
  /** Especies a las que aplica (ids de species.json / especiesOrilla). */
  especieIds: string[];
  /** Orden de la línea: de la caña al final (arriba → abajo en el esquema). */
  piezas: PiezaMontaje[];
  /** Cómo regular boya / profundidad / recuperación. */
  regulacion: string[];
  /** Alternativa en una frase. */
  alternativa: string;
  pasos: string[];
};

/** Los 8 montajes estrella para novatos en Castellón (río + costa). */
export const MONTAJES_ESPECIE: MontajeEspecie[] = [
  {
    id: "lubina-spinning",
    consejoId: "montaje-lubina-spinning",
    diagramaId: "montaje-lubina-spinning",
    titulo: "Lubina · spinning de orilla",
    resumen: "Línea → emerillón + snap → vinilo o cucharilla. El montaje más usado en rompiente.",
    ambito: "costa",
    especieIds: ["lubina", "anjova", "palometon"],
    piezas: [
      { tipo: "linea", etiqueta: "Trenza 0.10–0.14", detalle: "o nylon 0.25–0.30" },
      { tipo: "linea", etiqueta: "Bajo flúoro 0.28–0.35", detalle: "0,8–1,5 m" },
      { tipo: "emerillon", etiqueta: "Emerillón + snap", detalle: "talla media" },
      { tipo: "senuelo", etiqueta: "Vinilo / jerk / cucharilla", detalle: "7–21 g según oleaje" },
    ],
    regulacion: [
      "Recupera irregular cerca de fondo; pausas de 1–2 s.",
      "Con mar de fondo sube gramos; con calma baja a 7–12 g.",
      "Alba y última luz: pases paralelos a la orilla.",
    ],
    alternativa: "Si hay mucha hierba: Texas (bala + offset + vinilo weedless) sin emerillón.",
    pasos: [
      "Ata el bajo de flúoro a la trenza (Albright o anilla micro).",
      "Al final del bajo: emerillón + snap (Palomar o Trilene).",
      "Engancha el señuelo al snap; cambia sin cortar.",
      "Empieza con pases a media agua y baja si no hay toques.",
    ],
  },
  {
    id: "dorada-fondo",
    consejoId: "montaje-dorada-fondo",
    diagramaId: "montaje-dorada-fondo",
    titulo: "Dorada · fondo / surfcasting",
    resumen: "Plomo pirámide deslizante + bajo + anzuelo con gusano. Clásico de playa.",
    ambito: "costa",
    especieIds: ["dorada", "herrera", "salmonete"],
    piezas: [
      { tipo: "linea", etiqueta: "Nylon 0.30–0.40", detalle: "o trenza + bajo" },
      { tipo: "plomo", etiqueta: "Pirámide / spike", detalle: "80–150 g según mar" },
      { tipo: "emerillon", etiqueta: "Tope + emerillón", detalle: "el plomo no aprieta el nudo" },
      { tipo: "linea", etiqueta: "Bajo 0.25–0.30", detalle: "40–80 cm" },
      { tipo: "anzuelo", etiqueta: "Anzuelo 1–2/0", detalle: "sin muerte si sueltas" },
      { tipo: "cebo", etiqueta: "Gusano / tita / marisco", detalle: "bien cubierto" },
    ],
    regulacion: [
      "El plomo debe aguantar sin rodar; si se mueve, sube gramos o usa spike.",
      "Bajo más largo (60–80 cm) en agua clara; más corto con mar revuelta.",
      "Clava con decisión al segundo tirón (dorada), no al primero tímido.",
    ],
    alternativa: "Con poca mar: spinning ligero con vinilo tipo gamba en rompiente.",
    pasos: [
      "Pasa la línea por el plomo (deslizante).",
      "Ata emerillón de tope; del otro ojo, el bajo.",
      "Anzuelo al bajo (Palomar); ceba sin tapar la punta del todo.",
      "Lanza más allá de la rompiente y espera; revisa cebo cada 10–15 min.",
    ],
  },
  {
    id: "sargo-roca",
    consejoId: "montaje-sargo-roca",
    diagramaId: "montaje-sargo-roca",
    titulo: "Sargo · roca / escollera",
    resumen: "Boya fina o fondo ligero con cangrejo/muergo. Orilla de piedra legal.",
    ambito: "costa",
    especieIds: ["sargo", "mojarra", "oblada", "salema"],
    piezas: [
      { tipo: "linea", etiqueta: "Nylon / flúoro 0.22–0.28" },
      { tipo: "boya", etiqueta: "Boya stick o bola", detalle: "1–3 g · sensible" },
      { tipo: "plomo", etiqueta: "Perdigones / oliva", detalle: "reparte bajo la boya" },
      { tipo: "anzuelo", etiqueta: "Anzuelo 8–2", detalle: "según cebo" },
      { tipo: "cebo", etiqueta: "Cangrejo / muergo / gusano" },
    ],
    regulacion: [
      "Profundidad: el cebo a 10–30 cm del fondo (roca) o a media agua si hay corriente.",
      "Desliza la boya en la línea y fija con tope de goma; mide con la caña.",
      "Si la boya se tumba: quita plomo. Si se hunde sola: añade un poco.",
    ],
    alternativa: "Sin boya: fondo ligero (20–40 g) pegado a la escollera, fuera de dársena.",
    pasos: [
      "Monta boya deslizante + tope a la profundidad deseada.",
      "Bajo con 2–3 perdigones y anzuelo pequeño.",
      "Ceba y deja que el oleaje mueva el cebo junto a la roca.",
      "No lances dentro del puerto ni en veda (p. ej. Irta).",
    ],
  },
  {
    id: "carpa-boya",
    consejoId: "montaje-carpa-boya",
    diagramaId: "montaje-carpa-boya",
    titulo: "Carpa · boya / zig",
    resumen: "Boya grande + plomo + anzuelo con maíz o boilies. Embalse tranquilo.",
    ambito: "rio",
    especieIds: ["carpa", "carpin", "tenca"],
    piezas: [
      { tipo: "linea", etiqueta: "Nylon 0.28–0.35" },
      { tipo: "boya", etiqueta: "Boya carpodromo / stick", detalle: "visible a distancia" },
      { tipo: "plomo", etiqueta: "Oliva / balines", detalle: "bajo la boya" },
      { tipo: "anzuelo", etiqueta: "Anzuelo 8–4", detalle: "sin arponcillo si sueltas" },
      { tipo: "cebo", etiqueta: "Maíz / boilie / pellet" },
    ],
    regulacion: [
      "Ceba a media agua o cerca del fondo según actividad (burbujas).",
      "La boya debe quedar vertical con ½–⅔ fuera; ajústala con plomo.",
      "Solo donde el cebado esté permitido (no tramos trucheros).",
    ],
    alternativa: "Feeder / method: jaula + bajo corto (ver montaje fondo en Aparejos).",
    pasos: [
      "Fija la profundidad con el tope de la boya (prueba midiendo).",
      "Equilibra plomos hasta que la boya quede a punta.",
      "Anzuelo con maíz o boilie; lanza suave a la zona cebada.",
      "Espera picadas lentas; no claves al primer meneo.",
    ],
  },
  {
    id: "bass-texas",
    consejoId: "montaje-bass-texas",
    diagramaId: "montaje-bass-texas",
    titulo: "Black bass · Texas (anti-hierba)",
    resumen: "Bala + anzuelo offset + vinilo. El montaje de embalse por excelencia.",
    ambito: "rio",
    especieIds: ["black_bass", "lucio"],
    piezas: [
      { tipo: "linea", etiqueta: "Trenza 0.10–0.14", detalle: "+ bajo flúoro" },
      { tipo: "plomo", etiqueta: "Bala 3–10 g", detalle: "punta hacia el anzuelo" },
      { tipo: "anzuelo", etiqueta: "Offset / worm", detalle: "1/0–3/0" },
      { tipo: "senuelo", etiqueta: "Vinilo weedless", detalle: "puntas ocultas" },
    ],
    regulacion: [
      "Bala ligera (3–5 g) en orilla limpia; 7–10 g entre cañas.",
      "Recupera tocando fondo: arrastre lento + pausas.",
      "Clava en seco al sentir peso (no al toque suave del vinilo en hierba).",
    ],
    alternativa: "Aguas abiertas: crank o spinnerbait con snap; sin montaje Texas.",
    pasos: [
      "Pasa la bala por la línea (cono hacia delante).",
      "Ata el offset (Palomar); ensarta el vinilo ocultando la punta.",
      "Opcional: cuenta entre bala y anzuelo (click).",
      "Lanza junto a estructura (árboles, punta, orilla sombreada).",
    ],
  },
  {
    id: "trucha-cucharilla",
    consejoId: "montaje-trucha-cucharilla",
    diagramaId: "montaje-trucha-cucharilla",
    titulo: "Trucha · cucharilla UL",
    resumen: "Emerillón + cucharilla n.º 0–2. Río y cabeceras legales.",
    ambito: "rio",
    especieIds: ["trucha_comun", "trucha_arcoiris", "barbo"],
    piezas: [
      { tipo: "linea", etiqueta: "Nylon 0.14–0.18", detalle: "UL" },
      { tipo: "emerillon", etiqueta: "Emerillón micro + snap", detalle: "anti-enredo" },
      { tipo: "senuelo", etiqueta: "Cucharilla n.º 0–2", detalle: "giratoria u ondulante" },
    ],
    regulacion: [
      "Recupera constante; acelera un poco en corriente.",
      "En tramo truchero: un anzuelo sin arponcillo (cambia el triple si hace falta).",
      "Una sola caña; respeta vedas y días hábiles del cartel.",
    ],
    alternativa: "Mosca ninfa / streamer en cotos de mosca (técnica del cartel).",
    pasos: [
      "Ata emerillón micro a la línea (Palomar).",
      "Engancha la cucharilla al snap.",
      "Lanza aguas arriba o al otro lado y recupera cruzando la corriente.",
      "Trucha común: sin muerte; suelta con manos húmedas.",
    ],
  },
  {
    id: "llisa-boya",
    consejoId: "montaje-llisa-boya",
    diagramaId: "montaje-llisa-boya",
    titulo: "Llisa / mabra · boya de orilla",
    resumen: "Boya ligera + pan / pasta en golas y playas (fuera de vedado).",
    ambito: "costa",
    especieIds: ["llisa", "mabra", "mugilidos"],
    piezas: [
      { tipo: "linea", etiqueta: "Nylon 0.20–0.25" },
      { tipo: "boya", etiqueta: "Boya ligera 1–4 g", detalle: "muy sensible" },
      { tipo: "plomo", etiqueta: "1–2 perdigones" },
      { tipo: "anzuelo", etiqueta: "Anzuelo 10–6", detalle: "fino" },
      { tipo: "cebo", etiqueta: "Pan / pasta / pequeño trozo de gusano" },
    ],
    regulacion: [
      "Ceba entre superficie y media agua: las llisas suelen picar arriba.",
      "Si la boya baila sin hundirse, espera a que baje del todo.",
      "No pesques en marjal vedado ni en golas prohibidas (cartel).",
    ],
    alternativa: "Fondo muy ligero en canal con corriente suave.",
    pasos: [
      "Monta boya deslizante y tope a 30–80 cm.",
      "Anzuelo fino con pan bien fijado.",
      "Lanza suave junto a estructura o desembocadura legal.",
      "Clava al hundirse la boya; no des tirones antes.",
    ],
  },
  {
    id: "sepia-eging",
    consejoId: "montaje-sepia-eging",
    diagramaId: "montaje-sepia-eging",
    titulo: "Sepia / calamar · eging de escollera",
    resumen: "Línea → snap → egí. Sin plomo extra: el señuelo ya lleva peso.",
    ambito: "costa",
    especieIds: ["sepia", "calamar"],
    piezas: [
      { tipo: "linea", etiqueta: "Trenza 0.08–0.12", detalle: "+ bajo flúoro" },
      { tipo: "snap", etiqueta: "Snap micro", detalle: "o emerillón fino" },
      { tipo: "senuelo", etiqueta: "Egí 2.0–3.5", detalle: "según profundidad" },
    ],
    regulacion: [
      "Deja caer al fondo, da 2–3 toques hacia arriba y deja caer de nuevo.",
      "Atardecer y primera noche legal (si la norma lo permite en tu tramo).",
      "Solo escollera / orilla legal; nunca desde muelle comercial vedado.",
    ],
    alternativa: "Calamar: mismo esquema con egí más brillante y recuperación un poco más rápida.",
    pasos: [
      "Ata el snap al bajo (Palomar).",
      "Engancha el egí; comprueba que las coronas giran libres.",
      "Lanza paralelo a la escollera y trabaja el fondo.",
      "Al picar: sube continuo sin golpes secos; usa salabardo si puedes.",
    ],
  },
];

export function montajePorConsejoId(consejoId: string): MontajeEspecie | undefined {
  return MONTAJES_ESPECIE.find((m) => m.consejoId === consejoId || m.id === consejoId);
}

export function montajePorDiagramaId(diagramaId: string): MontajeEspecie | undefined {
  return MONTAJES_ESPECIE.find((m) => m.diagramaId === diagramaId);
}

export function montajesParaEspecie(especieId: string): MontajeEspecie[] {
  return MONTAJES_ESPECIE.filter((m) => m.especieIds.includes(especieId));
}

export function consejoIdMontajeEspecie(especieId: string): string | undefined {
  return montajesParaEspecie(especieId)[0]?.consejoId;
}
