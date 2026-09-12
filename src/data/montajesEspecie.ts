/**
 * Montajes habituales por especie (principiantes).
 * Un montaje “de siempre” + alternativa corta; enlazado desde Especies / Aparejos / Consejos.
 */

export type PiezaMontaje = {
  /** Etiqueta corta en el esquema */
  etiqueta: string;
  /** Detalle (talla, gramos, regulación…) */
  detalle?: string;
  /** Tipo de elemento → foto en EsquemaMontajeLinea (montajePiezasMedia) */
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

/** Montajes habituales para novatos (río + costa). Empezar por estos; ampliar con cuidado. */
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
    resumen: "Boya grande + plomo + anzuelo con maíz o boilie en el anzuelo. Embalse tranquilo.",
    ambito: "rio",
    especieIds: ["carpa", "carpin", "tenca"],
    piezas: [
      { tipo: "linea", etiqueta: "Nylon 0.28–0.35" },
      { tipo: "boya", etiqueta: "Boya carpodromo / stick", detalle: "visible a distancia" },
      { tipo: "plomo", etiqueta: "Oliva / balines", detalle: "bajo la boya" },
      { tipo: "anzuelo", etiqueta: "Anzuelo 8–4", detalle: "sin arponcillo si sueltas" },
      { tipo: "cebo", etiqueta: "Maíz / boilie / pellet", detalle: "en el anzuelo" },
    ],
    regulacion: [
      "El cebo va en el anzuelo (o hair). No cebes el agua donde esté prohibido.",
      "Andalucía art. 9.4: prohibido cebar (precebo/spod/method) salvo FAPD autorizada.",
      "La boya debe quedar vertical con ½–⅔ fuera; ajústala con plomo.",
      "Tramos trucheros: sin cebado ni cage.",
    ],
    alternativa:
      "Fondo con oliva deslizante + maíz/boilie en anzuelo (sin jaula method). En Andalucía no uses method/spod de cebado.",
    pasos: [
      "Fija la profundidad con el tope de la boya (prueba midiendo).",
      "Equilibra plomos hasta que la boya quede a punta.",
      "Anzuelo con maíz o boilie; lanza suave a la zona (sin cebar el vaso si la norma lo prohíbe).",
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
    especieIds: ["trucha_comun", "trucha_arcoiris"],
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
  {
    id: "jurel-cucharilla",
    consejoId: "montaje-jurel-cucharilla",
    diagramaId: "montaje-jurel-cucharilla",
    titulo: "Jurel / caballa · cucharilla de orilla",
    resumen: "Emerillón + cucharilla o metal jig ligero. Pases de cardumen cerca de espigones legales.",
    ambito: "costa",
    especieIds: ["jurel", "caballa"],
    piezas: [
      { tipo: "linea", etiqueta: "Trenza 0.08–0.12", detalle: "+ bajo flúoro 0.25–0.30" },
      { tipo: "emerillon", etiqueta: "Emerillón + snap", detalle: "anti-enredo" },
      { tipo: "senuelo", etiqueta: "Cucharilla / metal 7–21 g", detalle: "brillante o azul" },
    ],
    regulacion: [
      "Recupera constante y algo rápida; el jurel ataca el movimiento.",
      "Si ves saltos en superficie, acorta pases y usa metal más ligero.",
      "Fuera de dársena y de zona de baño; espigón solo si es legal.",
    ],
    alternativa: "Con agua fría: vinilo pequeño tipo pez a media agua, misma base de snap.",
    pasos: [
      "Ata el emerillón al bajo (Palomar).",
      "Engancha la cucharilla al snap.",
      "Lanza paralelo a la orilla o hacia el canal y recupera sin pausas largas.",
      "Cambia de color si en 10 minutos no hay toques.",
    ],
  },
  {
    id: "pulpo-fondo",
    consejoId: "montaje-pulpo-fondo",
    diagramaId: "montaje-pulpo-fondo",
    titulo: "Pulpo · fondo de roca (caña o mano)",
    resumen: "Plomo + bajo corto + anzuelo con cebo o jig de pulpo. Solo orilla legal.",
    ambito: "costa",
    especieIds: ["pulpo"],
    piezas: [
      { tipo: "linea", etiqueta: "Nylon / trenza 0.25–0.35" },
      { tipo: "plomo", etiqueta: "Oliva / pirámide 40–80 g", detalle: "según corriente" },
      { tipo: "linea", etiqueta: "Bajo corto 30–50 cm", detalle: "resistente a roca" },
      { tipo: "anzuelo", etiqueta: "Anzuelo / jig pulpo", detalle: "cebo bien fijado" },
      { tipo: "cebo", etiqueta: "Sardina / cangrejo / jig", detalle: "cerca de grietas" },
    ],
    regulacion: [
      "Trabaja el fondo: toques suaves; el pulpo «pesa» al enganchar.",
      "Devuelve el que no llegue a 1 kg (talla mínima RD 560/1995 anexo II Mediterráneo). Cupo orientativo 5 kg/día (Decreto 41/2013).",
      "Nunca nasas ni gancho profesional; Irta: pesca a pie vedada.",
    ],
    alternativa: "Jig de pulpo sin cebo natural, mismo esquema de plomo + bajo.",
    pasos: [
      "Monta plomo y bajo corto con nudo firme.",
      "Ceba o engacha el jig; lanza junto a escollera legal.",
      "Deja reposar y da tirones cortos cada 20–30 s.",
      "Al clavar, mantén tensión constante hasta la orilla.",
    ],
  },
  {
    id: "barbo-feeder",
    consejoId: "montaje-barbo-feeder",
    diagramaId: "montaje-barbo-feeder",
    titulo: "Barbo · feeder / fondo de río",
    resumen: "Plomo deslizante o cage + bajo + anzuelo. Solo donde cebar esté permitido.",
    ambito: "rio",
    especieIds: ["barbo", "barbo_gitano"],
    piezas: [
      { tipo: "linea", etiqueta: "Nylon 0.22–0.28" },
      { tipo: "plomo", etiqueta: "Oliva / cage 20–50 g", detalle: "deslizante · cage solo si cebar es legal" },
      { tipo: "emerillon", etiqueta: "Tope + emerillón" },
      { tipo: "linea", etiqueta: "Bajo 0.18–0.22", detalle: "40–70 cm" },
      { tipo: "anzuelo", etiqueta: "Anzuelo 10–6", detalle: "sin arponcillo si sueltas" },
      { tipo: "cebo", etiqueta: "Lombriz / maíz / pellet", detalle: "en el anzuelo" },
    ],
    regulacion: [
      "Ajusta el plomo para que aguante la corriente sin rodar.",
      "Andalucía (barbo gitano): captura y suelta; art. 9.4 sin cebar — usa oliva, no cage de cebado.",
      "Barbo autóctono CV/CLM: sin muerte donde lo marque el cartel.",
      "Tramos trucheros: sin cage ni cebado.",
    ],
    alternativa: "Spinning ligero con cucharilla pequeña en pozas (ver trucha UL).",
    pasos: [
      "Pasa la línea por el plomo deslizante (oliva; cage solo si la norma permite cebar).",
      "Ata emerillón de tope y el bajo con anzuelo.",
      "Cebo en el anzuelo; lanza a la vena o al final de una poza.",
      "Espera picadas en serie; no claves al primer toque.",
    ],
  },
  {
    id: "siluro-spinning",
    consejoId: "montaje-siluro-spinning",
    diagramaId: "montaje-siluro-spinning",
    titulo: "Siluro · spinning / fondo pesado",
    resumen:
      "Solo donde el siluro sea pescable como objetivo. En Andalucía y CLM no prepares este montaje: no es objeto de pesca.",
    ambito: "rio",
    especieIds: ["siluro"],
    piezas: [
      { tipo: "linea", etiqueta: "Trenza 0.20–0.35", detalle: "o nylon muy fuerte" },
      { tipo: "linea", etiqueta: "Bajo acero / flúor grueso", detalle: "80–120 cm" },
      { tipo: "emerillon", etiqueta: "Emerillón + snap XXL" },
      { tipo: "senuelo", etiqueta: "Vinilo / shad 15–25 cm", detalle: "sin pez vivo" },
    ],
    regulacion: [
      "Andalucía / CLM: siluro no es objeto de pesca — no uses este esquema como objetivo.",
      "Castellón/CV: invasora; prohibido transportar vivo o muerto; notifica a agentes.",
      "Prohibido pez vivo como cebo con carácter general.",
      "Caña y carrete de potencia: no improvises con UL.",
    ],
    alternativa:
      "En Andalucía/CLM: no hay alternativa legal de pesca dirigida. Captura fortuita → sacrificio / no devolver.",
    pasos: [
      "Comprueba primero si en tu provincia el siluro es objeto de pesca (en AN/CLM no lo es).",
      "Si aplica (p. ej. CV): monta bajo reforzado al final de la trenza.",
      "Snap grande + señuelo pesado (nunca pez vivo).",
      "Lanza a profundidad; clava con decisión. No transportes el ejemplar donde esté prohibido.",
    ],
  },
];

export function montajePorConsejoId(consejoId: string): MontajeEspecie | undefined {
  return MONTAJES_ESPECIE.find((m) => m.consejoId === consejoId || m.id === consejoId);
}

export function montajePorDiagramaId(diagramaId: string): MontajeEspecie | undefined {
  return MONTAJES_ESPECIE.find((m) => m.diagramaId === diagramaId);
}

/** Provincias donde el siluro no es objeto de pesca dirigida. */
const SILURO_NO_OBJETO = new Set(["sevilla", "cordoba", "cuenca"]);

export function montajesParaEspecie(
  especieId: string,
  opts?: { provinciaId?: string | null; soloContinental?: boolean }
): MontajeEspecie[] {
  let list = MONTAJES_ESPECIE.filter((m) => m.especieIds.includes(especieId));
  if (opts?.soloContinental) {
    list = list.filter((m) => m.ambito !== "costa");
  }
  if (opts?.provinciaId && SILURO_NO_OBJETO.has(opts.provinciaId) && especieId === "siluro") {
    list = [];
  }
  return list;
}

export function consejoIdMontajeEspecie(
  especieId: string,
  opts?: { provinciaId?: string | null; soloContinental?: boolean }
): string | undefined {
  return montajesParaEspecie(especieId, opts)[0]?.consejoId;
}

/** Lista de montajes visibles en Consejos según provincia. */
export function montajesParaProvincia(opts: {
  provinciaId?: string | null;
  soloContinental?: boolean;
}): MontajeEspecie[] {
  let list = [...MONTAJES_ESPECIE];
  if (opts.soloContinental) {
    list = list.filter((m) => m.ambito !== "costa");
  }
  if (opts.provinciaId && SILURO_NO_OBJETO.has(opts.provinciaId)) {
    list = list.filter((m) => m.id !== "siluro-spinning");
  }
  return list;
}
