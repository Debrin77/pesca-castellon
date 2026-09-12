/**
 * Guía de compra / aparejo por especie: anzuelo, arponcillo, cebador, plomo según cebo.
 * Orientativo para principiantes; la norma oficial (cartel / DOGV / BOJA / DOCM) manda.
 */

export type ProvinciaId = "castellon" | "sevilla" | "cordoba" | "cuenca" | "*";

export type ArponcilloEstado =
  | "obligatorio_sin"
  | "recomendado_sin"
  | "opcional"
  | "no_aplica";

export type SeveridadRestriccion = "obligatorio" | "aviso" | "orientativo";

export type PlomoPorCebo = {
  /** Qué va en el anzuelo o señuelo */
  enAnzuelo: string;
  /** Gramos recomendados (o “no hace falta”) */
  plomoG: string;
  nota?: string;
};

export type CebadorRec = {
  recomendado: boolean;
  /** cage, method, open-end, spod… */
  tipos: string;
  nota: string;
};

export type RestriccionAparejo = {
  provincias: ProvinciaId[];
  texto: string;
  severidad: SeveridadRestriccion;
  /** Si se indica, solo mostrar en ese ámbito (río/costa). */
  soloAmbito?: "rio" | "costa";
};

export type RecomendacionAparejo = {
  especieId: string;
  ambito: "rio" | "costa" | "ambos";
  /** Resumen en una línea para la cabecera de la tabla */
  resumenCompra: string;
  anzueloTipo: string;
  anzueloTalla: string;
  arponcillo: ArponcilloEstado;
  arponcilloNota: string;
  cebador: CebadorRec;
  plomos: PlomoPorCebo[];
  /** Checklist corta de tienda */
  compraRapida: string[];
  restricciones: RestriccionAparejo[];
};

const SIN_ARPON_TRUCHERO: RestriccionAparejo = {
  provincias: ["castellon", "cuenca"],
  texto:
    "Tramos trucheros / salmonícolas: un anzuelo sin arponcillo. En C. Valenciana además solo mosca o cucharilla y prohibido cebar.",
  severidad: "obligatorio",
};

const NO_CEBAR_TRUCHERO: RestriccionAparejo = {
  provincias: ["castellon", "cuenca", "sevilla", "cordoba"],
  texto: "No uses cebador ni cebado en aguas trucheras. Revisa el cartel del tramo.",
  severidad: "obligatorio",
};

const CUENCA_PORN_PATOS: RestriccionAparejo = {
  provincias: ["cuenca"],
  texto:
    "PORN Serranía de Cuenca: prohibidos patos, barquitos cebadores y objetos flotantes adaptados al cuerpo. Solo cebado vegetal donde esté autorizado.",
  severidad: "obligatorio",
};

const CUENCA_TRUCHERA: RestriccionAparejo = {
  provincias: ["cuenca"],
  texto:
    "CLM (Orden 20/2026): en aguas trucheras, anzuelos sin arponcillo; cebado solo en excepciones (embalses no trucheros / art. 7).",
  severidad: "obligatorio",
};

const ANDALUCIA_SEGURO: RestriccionAparejo = {
  provincias: ["sevilla", "cordoba"],
  texto: "Andalucía: lleva licencia continental + justificante del seguro de RC obligatorio.",
  severidad: "aviso",
};

const ANDALUCIA_NO_CEBAR: RestriccionAparejo = {
  provincias: ["sevilla", "cordoba"],
  texto:
    "Andalucía art. 9.4: prohibido cebar (precebo/spod/method) y usar pez como cebo, salvo FAPD autorizada. El cebo va en el anzuelo.",
  severidad: "obligatorio",
};

const ANDALUCIA_SILURO_NO_OBJETO: RestriccionAparejo = {
  provincias: ["sevilla", "cordoba"],
  texto:
    "Andalucía: el siluro no es objeto de pesca. No prepares un equipo específico; captura fortuita → sacrificio y no devolver.",
  severidad: "obligatorio",
};

const COSTA_CS: RestriccionAparejo = {
  provincias: ["castellon"],
  soloAmbito: "costa",
  texto:
    "Costa Castellón (Decreto 41/2013): máx. 2 cañas desde tierra, 100 m de bañistas, fuera de dársena/puerto. Irta: pesca a pie vedada. La caña desde orilla no tiene veda nocturna general (sí la submarina).",
  severidad: "obligatorio",
};

const INVASORA: RestriccionAparejo = {
  provincias: ["*"],
  texto: "Especie invasora (RD 630/2013): no devolver viva. Sacrifica según protocolo local.",
  severidad: "obligatorio",
};

/** Catálogo principal: continental + costa + extras provinciales habituales. */
export const RECOMENDACIONES_APAREJO: RecomendacionAparejo[] = [
  // —— Continental ——
  {
    especieId: "trucha_comun",
    ambito: "rio",
    resumenCompra: "UL + cucharilla/mosca; sin arponcillo; sin cebador.",
    anzueloTipo: "Simple (mosca o cucharilla con un solo hierro)",
    anzueloTalla: "Mosca #12–#18 · cucharilla n.º 0–1 (cambia el triple por simple)",
    arponcillo: "obligatorio_sin",
    arponcilloNota: "Obligatorio sin arponcillo en tramo truchero / pesca sin muerte.",
    cebador: {
      recomendado: false,
      tipos: "—",
      nota: "Prohibido cebar en tramos trucheros. No compres cage ni method para esta pesca.",
    },
    plomos: [
      { enAnzuelo: "Cucharilla / mosca", plomoG: "No hace falta", nota: "El señuelo ya lleva peso" },
      { enAnzuelo: "Ninfa con perdigón (solo si legal)", plomoG: "0,2–0,8 g", nota: "Microplomo en el bajo, no jaula" },
    ],
    compraRapida: [
      "Caña UL 2,10–2,70 m",
      "Nylon 0,14–0,18",
      "Emerillón micro + snap",
      "Cucharillas n.º 0–1 o moscas",
      "Anzuelos simples sin arponcillo de repuesto",
    ],
    restricciones: [SIN_ARPON_TRUCHERO, NO_CEBAR_TRUCHERO, CUENCA_TRUCHERA, ANDALUCIA_SEGURO],
  },
  {
    especieId: "trucha_arcoiris",
    ambito: "rio",
    resumenCompra: "Igual que común en truchero; sin arpón.",
    anzueloTipo: "Simple en cucharilla o mosca",
    anzueloTalla: "Cucharilla n.º 1–2 · mosca #10–#14",
    arponcillo: "obligatorio_sin",
    arponcilloNota: "Sin arponcillo en tramos salmonícolas.",
    cebador: { recomendado: false, tipos: "—", nota: "No cebar en truchero." },
    plomos: [{ enAnzuelo: "Cucharilla / streamer", plomoG: "No hace falta" }],
    compraRapida: ["Spinning ligero 1000–2000", "Nylon 0,16–0,20", "Cucharillas n.º 1–2", "Anzuelos sin arponcillo"],
    restricciones: [SIN_ARPON_TRUCHERO, NO_CEBAR_TRUCHERO, CUENCA_TRUCHERA],
  },
  {
    especieId: "black_bass",
    ambito: "rio",
    resumenCompra: "Offset + vinilo; plomo bala; sin cebador.",
    anzueloTipo: "Offset / worm (Texas) o drop-shot",
    anzueloTalla: "1/0–3/0 (Texas) · #1–#2/0 drop-shot",
    arponcillo: "opcional",
    arponcilloNota: "Con arponcillo es habitual (invasora, no se devuelve). Sin arpón si practicas sin muerte voluntaria.",
    cebador: {
      recomendado: false,
      tipos: "—",
      nota: "Se pesca a señuelo. El cebador no aporta y en muchos vasos no aplica.",
    },
    plomos: [
      { enAnzuelo: "Vinilo 3–4\" (Texas orilla)", plomoG: "3–7 g bala" },
      { enAnzuelo: "Vinilo entre cañas / viento", plomoG: "7–14 g bala" },
      { enAnzuelo: "Drop shot finesse", plomoG: "3–10 g gota", nota: "Peso al final; anzuelo arriba" },
      { enAnzuelo: "Jig football", plomoG: "7–14 g (3/8–1/2 oz)" },
    ],
    compraRapida: [
      "Caña casting MH o spinning ML",
      "Trenza fina + flúoro",
      "Anzuelos offset 1/0–3/0",
      "Plomos bala 3–14 g",
      "Vinilos creature / stick",
    ],
    restricciones: [INVASORA, ANDALUCIA_SEGURO],
  },
  {
    especieId: "lucio",
    ambito: "rio",
    resumenCompra: "Anzuelo fuerte + bajo anticorte; plomo según señuelo.",
    anzueloTipo: "Triple o simple reforzado (según norma del tramo)",
    anzueloTalla: "2/0–5/0 en softbait · triples del señuelo de fábrica",
    arponcillo: "opcional",
    arponcilloNota: "Invasora: arponcillo habitual. Si el cartel exige sin arpón, limpia o cambia el hierro.",
    cebador: { recomendado: false, tipos: "—", nota: "Spinning / jerk / swimbait; no cebador." },
    plomos: [
      { enAnzuelo: "Jerkbait / crank", plomoG: "No hace falta", nota: "El señuelo hunde solo" },
      { enAnzuelo: "Swimbait 12–18 cm", plomoG: "10–30 g cabeza", nota: "O señuelo lastrado" },
      { enAnzuelo: "Cuchara ondulante grande", plomoG: "15–40 g" },
    ],
    compraRapida: ["Caña heavy 20–60 g", "Trenza 0,18–0,25", "Bajo acero o flúoro grueso", "Snaps XXL", "Swimbaits / jerks"],
    restricciones: [INVASORA, ANDALUCIA_SEGURO],
  },
  {
    especieId: "carpa",
    ambito: "rio",
    resumenCompra: "Anzuelo 8–4; cebo en anzuelo. En Andalucía no cebar (art. 9.4).",
    anzueloTipo: "Simple carpero (wide gape / curve)",
    anzueloTalla: "#8–#4 (boilie 15–20 mm → #6–#4; maíz → #8–#6)",
    arponcillo: "recomendado_sin",
    arponcilloNota: "Sin arponcillo si sueltas (catch & release). Con arpón solo si vas a retener donde sea legal.",
    cebador: {
      recomendado: false,
      tipos: "— en Andalucía · Method / flat o cage solo donde el cebado esté permitido",
      nota: "Andalucía art. 9.4: no cebar (salvo FAPD). En otras CCAA, solo donde el cebado esté permitido (no trucheros).",
    },
    plomos: [
      { enAnzuelo: "Maíz / pellet pequeño", plomoG: "20–40 g", nota: "Oliva deslizante; cebo en anzuelo" },
      { enAnzuelo: "Boilie 15–20 mm", plomoG: "40–80 g", nota: "Inline / lead clip según distancia" },
      { enAnzuelo: "Boya / zig", plomoG: "Balines 1–4 g", nota: "Solo para equilibrar la boya" },
    ],
    compraRapida: [
      "Caña carp / feeder 3,3–3,9 m",
      "Nylon 0,28–0,35",
      "Anzuelos #8–#4 sin arponcillo",
      "Oliva 20–60 g",
      "Maíz / masa / boilies (en anzuelo)",
    ],
    restricciones: [NO_CEBAR_TRUCHERO, ANDALUCIA_NO_CEBAR, CUENCA_PORN_PATOS, CUENCA_TRUCHERA, ANDALUCIA_SEGURO],
  }
  {
    especieId: "carpin",
    ambito: "rio",
    resumenCompra: "Anzuelo fino #10–#6; coup/feeder fino; cebo en anzuelo.",
    anzueloTipo: "Simple fino (carpín / coup)",
    anzueloTalla: "#10–#6",
    arponcillo: "recomendado_sin",
    arponcilloNota: "Sin arponcillo recomendado (boca delicada y sueltas frecuentes).",
    cebador: {
      recomendado: false,
      tipos: "— en Andalucía · cage fino solo si el cebado es legal",
      nota: "Andalucía: sin cebado (art. 9.4). En Serranía de Cuenca: sin patos/barquitos.",
    },
    plomos: [
      { enAnzuelo: "Maíz / pan / masa", plomoG: "10–25 g", nota: "Oliva" },
      { enAnzuelo: "Asticot / lombriz pequeña", plomoG: "8–20 g" },
    ],
    compraRapida: ["Coup/feeder 3,6 m", "Nylon 0,16–0,22", "Anzuelos #10–#6", "Oliva 10–25 g", "Cebo vegetal"],
    restricciones: [NO_CEBAR_TRUCHERO, ANDALUCIA_NO_CEBAR, CUENCA_PORN_PATOS, ANDALUCIA_SEGURO],
  }
  {
    especieId: "tenca",
    ambito: "rio",
    resumenCompra: "Anzuelo #10–#6; fondo suave; cebador vegetal.",
    anzueloTipo: "Simple fino",
    anzueloTalla: "#10–#6",
    arponcillo: "recomendado_sin",
    arponcilloNota: "Sin arponcillo si sueltas; boca carnosa.",
    cebador: {
      recomendado: true,
      tipos: "Cage abierto · groundbait vegetal",
      nota: "Cebo vegetal (lombriz/masa/maíz). Confirma si el vaso permite cebar.",
    },
    plomos: [
      { enAnzuelo: "Lombriz / masa", plomoG: "10–30 g" },
      { enAnzuelo: "Maíz", plomoG: "15–35 g" },
    ],
    compraRapida: ["Caña ligera 3,3–3,6 m", "Nylon 0,18–0,24", "Anzuelos #10–#6", "Oliva 15–30 g", "Masa / maíz"],
    restricciones: [NO_CEBAR_TRUCHERO, CUENCA_PORN_PATOS, ANDALUCIA_SEGURO],
  },
  {
    especieId: "barbo",
    ambito: "rio",
    resumenCompra: "Feeder/cage en corriente; anzuelo #10–#6.",
    anzueloTipo: "Simple resistente (barbo / river)",
    anzueloTalla: "#10–#6 (lombriz) · #8–#4 (pellet grande)",
    arponcillo: "recomendado_sin",
    arponcilloNota: "Sin arponcillo donde el barbo sea sin muerte (muchos tramos CV/CLM). Con arpón solo si retención legal.",
    cebador: {
      recomendado: true,
      tipos: "Cage / open-end · bullet feeder en corriente",
      nota: "El cage debe aguantar la vena sin rodar. No en tramos trucheros.",
    },
    plomos: [
      { enAnzuelo: "Lombriz / maíz", plomoG: "20–40 g", nota: "Corriente suave" },
      { enAnzuelo: "Lombriz en vena fuerte", plomoG: "40–70 g", nota: "Cage pesado o grip" },
      { enAnzuelo: "Pellet / boilie pequeño", plomoG: "30–60 g" },
      { enAnzuelo: "Spinning (cucharilla)", plomoG: "No hace falta" },
    ],
    compraRapida: [
      "River/feeder 3,60–3,90 m",
      "Nylon 0,22–0,28 + bajo 0,18–0,22",
      "Anzuelos #10–#6 sin arponcillo",
      "Cage 30–60 g",
      "Lombriz, maíz, pellet",
    ],
    restricciones: [NO_CEBAR_TRUCHERO, CUENCA_TRUCHERA, ANDALUCIA_SEGURO],
  },
  {
    especieId: "barbo_gitano",
    ambito: "rio",
    resumenCompra: "Feeder/fondo en remansos; anzuelo #10–#6; cebo en anzuelo (Andalucía sin cebar).",
    anzueloTipo: "Simple river",
    anzueloTalla: "#10–#6",
    arponcillo: "recomendado_sin",
    arponcilloNota: "Sin arponcillo recomendado (suelta / cupos locales).",
    cebador: {
      recomendado: false,
      tipos: "— en Andalucía",
      nota: "Andalucía art. 9.4: no cebar. Remansos y colas; confirma señalización municipal.",
    },
    plomos: [
      { enAnzuelo: "Lombriz / maíz", plomoG: "20–50 g" },
      { enAnzuelo: "Corriente tras pilares", plomoG: "40–70 g" },
    ],
    compraRapida: ["Feeder 3,6–3,9 m", "Nylon 0,22–0,28", "Oliva 30–60 g", "Anzuelos #10–#6"],
    restricciones: [ANDALUCIA_SEGURO, ANDALUCIA_NO_CEBAR, NO_CEBAR_TRUCHERO],
  }
  {
    especieId: "siluro",
    ambito: "rio",
    resumenCompra: "En Andalucía/CLM no es objetivo de pesca. Captura fortuita → sacrificio.",
    anzueloTipo: "No prepares montaje específico de siluro donde no sea objeto de pesca",
    anzueloTalla: "—",
    arponcillo: "opcional",
    arponcilloNota: "Si entra de forma fortuita: sacrificio según norma local. No uses pez como cebo.",
    cebador: {
      recomendado: false,
      tipos: "—",
      nota: "Andalucía: siluro no es objeto de pesca + art. 9.4 sin pez-cebo. CLM: pesca prohibida como objetivo.",
    },
    plomos: [],
    compraRapida: ["No comprar equipo «anti-siluro» donde esté prohibido como objeto"],
    restricciones: [INVASORA, ANDALUCIA_SEGURO, ANDALUCIA_NO_CEBAR, ANDALUCIA_SILURO_NO_OBJETO],
  }
  {
    especieId: "anguila",
    ambito: "rio",
    resumenCompra: "No es objetivo recreativo legal en CV (pesca recreativa prohibida).",
    anzueloTipo: "No aplica",
    anzueloTalla: "—",
    arponcillo: "recomendado_sin",
    arponcilloNota:
      "En la Comunitat Valenciana la pesca recreativa de anguila está prohibida (Res. 30/10/2020 / Res. 16/09/2024).",
    cebador: { recomendado: false, tipos: "—", nota: "No prepares montaje de retención de anguila en CV." },
    plomos: [],
    compraRapida: ["No comprar material específico de anguila para CV recreativa"],
    restricciones: [
      {
        provincias: ["castellon"],
        texto: "Anguila: pesca recreativa prohibida en CV. No retengas.",
        severidad: "prohibido",
      },
      {
        provincias: ["*"],
        texto: "Anguila: especie sensible/amenazada; en CV recreativa prohibida. En otras provincias confirma veda antes de cualquier retención.",
        severidad: "aviso",
      },
      ANDALUCIA_SEGURO,
    ],
  },
  {
    especieId: "mugilidos",
    ambito: "ambos",
    resumenCompra: "Anzuelo fino #10–#6; boya; sin cebador marino típico.",
    anzueloTipo: "Simple fino",
    anzueloTalla: "#10–#6",
    arponcillo: "recomendado_sin",
    arponcilloNota: "Sin arponcillo facilita la suelta de ejemplares pequeños.",
    cebador: {
      recomendado: false,
      tipos: "Cebado ligero de pan solo si está permitido en el tramo",
      nota: "En costa: pan/pasta en anzuelo. No uses cage de río en playa.",
    },
    plomos: [
      { enAnzuelo: "Pan / pasta (boya)", plomoG: "1–3 g perdigones" },
      { enAnzuelo: "Fondo ligero", plomoG: "10–30 g" },
    ],
    compraRapida: ["Spinning 2,4 m o surf ligero", "Nylon 0,20–0,28", "Anzuelos #10–#6", "Boya 1–4 g"],
    restricciones: [ANDALUCIA_SEGURO],
  },
  {
    especieId: "boga",
    ambito: "rio",
    resumenCompra: "Coup/feeder fino; anzuelo #14–#10.",
    anzueloTipo: "Simple micro",
    anzueloTalla: "#14–#10",
    arponcillo: "recomendado_sin",
    arponcilloNota: "Boca pequeña: sin arponcillo y hierro fino.",
    cebador: {
      recomendado: true,
      tipos: "Cage micro · groundbait fino",
      nota: "Cebado vegetal ligero donde esté permitido.",
    },
    plomos: [
      { enAnzuelo: "Asticot / maíz pequeño / pan", plomoG: "5–20 g" },
    ],
    compraRapida: ["Coup/feeder fino", "Nylon 0,12–0,18", "Anzuelos #14–#10", "Cage 10–25 g"],
    restricciones: [NO_CEBAR_TRUCHERO, CUENCA_PORN_PATOS, ANDALUCIA_SEGURO],
  },
  {
    especieId: "boga",
    ambito: "costa",
    resumenCompra: "Rockfishing fino; anzuelo #10–#6; sin cebador.",
    anzueloTipo: "Simple fino de orilla",
    anzueloTalla: "#10–#6",
    arponcillo: "recomendado_sin",
    arponcilloNota: "Sin arpón recomendado (Boops de cardumen).",
    cebador: { recomendado: false, tipos: "—", nota: "Pan/gusano en anzuelo; fuera de puerto." },
    plomos: [
      { enAnzuelo: "Pan / gusano (boya)", plomoG: "1–3 g" },
      { enAnzuelo: "Jig pequeño", plomoG: "3–8 g" },
    ],
    compraRapida: ["Rockfishing UL-L", "Fluoro 0,16–0,22", "Anzuelos #10–#6", "Boya ligera"],
    restricciones: [COSTA_CS],
  },
  {
    especieId: "cacho",
    ambito: "rio",
    resumenCompra: "UL río; anzuelo #14–#10; sin cebador truchero.",
    anzueloTipo: "Simple fino o cucharilla micro",
    anzueloTalla: "#14–#10 · cucharilla n.º 0",
    arponcillo: "obligatorio_sin",
    arponcilloNota: "En aguas trucheras CLM: sin arponcillo.",
    cebador: { recomendado: false, tipos: "—", nota: "En truchero no cebar; fuera, cebado vegetal mínimo." },
    plomos: [
      { enAnzuelo: "Cucharilla / mosca", plomoG: "No hace falta" },
      { enAnzuelo: "Cebo vegetal (si legal)", plomoG: "5–15 g" },
    ],
    compraRapida: ["UL 2,1 m", "Nylon 0,12–0,16", "Anzuelos sin arponcillo #14–#10"],
    restricciones: [SIN_ARPON_TRUCHERO, NO_CEBAR_TRUCHERO, CUENCA_TRUCHERA],
  },
  {
    especieId: "alburno",
    ambito: "rio",
    resumenCompra: "Anzuelo micro; coup; plomo mínimo.",
    anzueloTipo: "Simple micro",
    anzueloTalla: "#18–#14",
    arponcillo: "recomendado_sin",
    arponcilloNota: "Hierro fino sin arponcillo.",
    cebador: {
      recomendado: true,
      tipos: "Cage micro / cebado fino superficial",
      nota: "Invasora en muchos listados: no devolver si la norma lo exige.",
    },
    plomos: [{ enAnzuelo: "Asticot / pan", plomoG: "2–10 g" }],
    compraRapida: ["Coup ligero", "Nylon 0,10–0,14", "Anzuelos #18–#14"],
    restricciones: [ANDALUCIA_SEGURO],
  },
  {
    especieId: "percasol",
    ambito: "rio",
    resumenCompra: "UL + vinilo micro; sin cebador.",
    anzueloTipo: "Simple / jighead micro",
    anzueloTalla: "#8–#4 · jig 1–3 g",
    arponcillo: "opcional",
    arponcilloNota: "Invasora: no devolver. Arponcillo opcional.",
    cebador: { recomendado: false, tipos: "—", nota: "Señuelo pequeño cerca de orilla." },
    plomos: [{ enAnzuelo: "Vinilo micro", plomoG: "1–5 g" }],
    compraRapida: ["UL", "Trenza fina", "Jigheads 1–3 g", "Vinilos 2–3\""],
    restricciones: [INVASORA],
  },
  {
    especieId: "cangrejo_americano",
    ambito: "rio",
    resumenCompra: "No es pesca deportiva típica; retén si capturas.",
    anzueloTipo: "No aplica (trampas solo si autorizadas)",
    anzueloTalla: "—",
    arponcillo: "no_aplica",
    arponcilloNota: "Invasora: no devolver. No uses nasas ilegales.",
    cebador: { recomendado: false, tipos: "—", nota: "No compres aparejo específico ilegal." },
    plomos: [{ enAnzuelo: "Captura incidental", plomoG: "—" }],
    compraRapida: ["Guantes", "Contenedor para sacrificio legal"],
    restricciones: [INVASORA],
  },
  {
    especieId: "gambusia",
    ambito: "rio",
    resumenCompra: "No objetivo; invasora.",
    anzueloTipo: "—",
    anzueloTalla: "—",
    arponcillo: "no_aplica",
    arponcilloNota: "No devolver si la capturas.",
    cebador: { recomendado: false, tipos: "—", nota: "—" },
    plomos: [{ enAnzuelo: "—", plomoG: "—" }],
    compraRapida: ["No requiere compra específica"],
    restricciones: [INVASORA],
  },

  // —— Costa ——
  {
    especieId: "lubina",
    ambito: "costa",
    resumenCompra: "Spinning: snap + señuelo; fondo: anzuelo 1–2/0.",
    anzueloTipo: "Del señuelo (simple/treble) o J/circle a fondo",
    anzueloTalla: "Spinning según minnow · fondo #1–#2/0",
    arponcillo: "recomendado_sin",
    arponcilloNota: "Sin arponcillo si sueltas subtalladas; con arpón si retienes legales.",
    cebador: {
      recomendado: false,
      tipos: "—",
      nota: "En orilla mediterránea no uses cage de río. Spinning o running a fondo.",
    },
    plomos: [
      { enAnzuelo: "Minnow / vinilo shad", plomoG: "7–21 g", nota: "Peso del propio señuelo" },
      { enAnzuelo: "Gusano a fondo", plomoG: "60–120 g pirámide", nota: "Según oleaje" },
    ],
    compraRapida: ["Spinning 2,4–2,7 m MH", "Trenza + flúoro", "Snaps", "Minnows 9–14 cm", "Pirámide 80–120 g"],
    restricciones: [COSTA_CS],
  },
  {
    especieId: "dorada",
    ambito: "costa",
    resumenCompra: "Surfcasting: pirámide + anzuelo 1–2/0 + gusano.",
    anzueloTipo: "Simple o circle de mar",
    anzueloTalla: "#1–#2/0 (gusano) · #2–#1 (tita/muergo)",
    arponcillo: "recomendado_sin",
    arponcilloNota: "Sin arponcillo facilita liberar por debajo de talla (20 cm tenedor–cola).",
    cebador: {
      recomendado: false,
      tipos: "—",
      nota: "No cebador de río. El cebo va en el anzuelo; opcional cebado mínimo solo si la norma local lo permite (raro en playa CS).",
    },
    plomos: [
      { enAnzuelo: "Gusano americano/coreano", plomoG: "80–150 g pirámide/spike" },
      { enAnzuelo: "Tita / muergo / cañaílla", plomoG: "80–120 g", nota: "Mar calmada: baja a 60–80 g" },
      { enAnzuelo: "Mar de fondo / corriente", plomoG: "120–180 g spike" },
    ],
    compraRapida: [
      "Surf 4,20–4,50 m",
      "Carrete 6500–8000",
      "Pirámides 80/100/120/150 g",
      "Anzuelos #1–2/0",
      "Gusano + tita",
    ],
    restricciones: [COSTA_CS],
  },
  {
    especieId: "sargo",
    ambito: "costa",
    resumenCompra: "Anzuelo #8–#2; boya o fondo ligero en roca.",
    anzueloTipo: "Simple fino de roca",
    anzueloTalla: "#8–#2 según cebo",
    arponcillo: "recomendado_sin",
    arponcilloNota: "Sin arpón ayuda con tallas justas (Diplodus 15 cm).",
    cebador: { recomendado: false, tipos: "—", nota: "Cebo natural en anzuelo junto a piedra." },
    plomos: [
      { enAnzuelo: "Cangrejo / muergo (boya)", plomoG: "1–3 g repartidos" },
      { enAnzuelo: "Fondo escollera", plomoG: "20–40 g" },
      { enAnzuelo: "Jig cabeza", plomoG: "5–10 g" },
    ],
    compraRapida: ["Rockfishing 2,1–2,4 m", "Fluoro 0,22–0,28", "Anzuelos #8–#2", "Boya 1–3 g", "Cangrejo/muergo"],
    restricciones: [COSTA_CS],
  },
  {
    especieId: "mojarra",
    ambito: "costa",
    resumenCompra: "UL roca; anzuelo #10–#6.",
    anzueloTipo: "Simple micro",
    anzueloTalla: "#10–#6",
    arponcillo: "recomendado_sin",
    arponcilloNota: "Muchas no llegan a talla: sin arpón y mide 15 cm.",
    cebador: { recomendado: false, tipos: "—", nota: "Trozo de gusano o pan." },
    plomos: [
      { enAnzuelo: "Gusano / pan", plomoG: "3–15 g" },
      { enAnzuelo: "Jig", plomoG: "3–7 g" },
    ],
    compraRapida: ["UL rockfishing", "Fluoro 0,16–0,20", "Anzuelos #10–#6"],
    restricciones: [COSTA_CS],
  },
  {
    especieId: "herrera",
    ambito: "costa",
    resumenCompra: "Surf ligero; anzuelo #2–#1; pirámide 80–120 g.",
    anzueloTipo: "Simple de mar",
    anzueloTalla: "#2–#1",
    arponcillo: "recomendado_sin",
    arponcilloNota: "Sin arpón recomendado; evita alevines.",
    cebador: { recomendado: false, tipos: "—", nota: "Gusano/tita en anzuelo." },
    plomos: [
      { enAnzuelo: "Gusano / tita", plomoG: "80–120 g pirámide" },
      { enAnzuelo: "Calma chicha", plomoG: "60–80 g" },
    ],
    compraRapida: ["Surf 4,2 m o spinning", "Pirámide 80–120 g", "Anzuelos #2–#1", "Gusano"],
    restricciones: [COSTA_CS],
  },
  {
    especieId: "oblada",
    ambito: "costa",
    resumenCompra: "Anzuelo #10–#6; pan/masa; plomo mínimo.",
    anzueloTipo: "Simple fino",
    anzueloTalla: "#10–#6",
    arponcillo: "recomendado_sin",
    arponcilloNota: "Sin arpón: cardumen y tallas variables.",
    cebador: { recomendado: false, tipos: "—", nota: "Pan en anzuelo; fuera de puerto." },
    plomos: [
      { enAnzuelo: "Pan / masa", plomoG: "2–10 g" },
      { enAnzuelo: "Jig pequeño", plomoG: "3–7 g" },
    ],
    compraRapida: ["Spinning ligero", "Fluoro 0,18–0,22", "Anzuelos #10–#6", "Pan"],
    restricciones: [COSTA_CS],
  },
  {
    especieId: "salema",
    ambito: "costa",
    resumenCompra: "Anzuelo #8–#4; alga/pan en roca.",
    anzueloTipo: "Simple",
    anzueloTalla: "#8–#4",
    arponcillo: "recomendado_sin",
    arponcilloNota: "Talla 15 cm; sin arpón ayuda a soltar.",
    cebador: { recomendado: false, tipos: "—", nota: "Alga o pan; no cage." },
    plomos: [
      { enAnzuelo: "Alga / pan / gusano", plomoG: "5–20 g" },
      { enAnzuelo: "Jig", plomoG: "5 g" },
    ],
    compraRapida: ["Rockfishing 2,1 m", "Fluoro 0,20–0,25", "Anzuelos #8–#4"],
    restricciones: [COSTA_CS],
  },
  {
    especieId: "llisa",
    ambito: "costa",
    resumenCompra: "Boya + anzuelo #10–#6 + pan.",
    anzueloTipo: "Simple fino",
    anzueloTalla: "#10–#6",
    arponcillo: "recomendado_sin",
    arponcilloNota: "Sin arpón; mide 16 cm.",
    cebador: {
      recomendado: false,
      tipos: "Cebado de pan solo si el tramo lo permite",
      nota: "No marjal vedado ni gola del Millars.",
    },
    plomos: [
      { enAnzuelo: "Pan / pasta (boya)", plomoG: "1–2 perdigones" },
      { enAnzuelo: "Fondo canal", plomoG: "10–30 g" },
    ],
    compraRapida: ["Spinning 2,4 m", "Boya 1–4 g", "Anzuelos #10–#6", "Pan"],
    restricciones: [COSTA_CS],
  },
  {
    especieId: "mabra",
    ambito: "costa",
    resumenCompra: "Como llisa; activa al anochecer (sin veda nocturna general de caña).",
    anzueloTipo: "Simple fino",
    anzueloTalla: "#10–#6",
    arponcillo: "recomendado_sin",
    arponcilloNota: "Sin arpón recomendado.",
    cebador: { recomendado: false, tipos: "—", nota: "Activa al anochecer: la caña desde tierra no tiene veda nocturna general, pero revisa bando municipal y acceso a playa." },
    plomos: [
      { enAnzuelo: "Gusano / masa / tita", plomoG: "40–100 g según lance" },
    ],
    compraRapida: ["Surf o spinning", "Anzuelos #10–#6", "Gusano/masa"],
    restricciones: [COSTA_CS],
  },
  {
    especieId: "jurel",
    ambito: "costa",
    resumenCompra: "Cucharilla/metal 7–21 g; sin cebador.",
    anzueloTipo: "Del señuelo (simple preferible)",
    anzueloTalla: "Según cucharilla · jig 7–15 g",
    arponcillo: "recomendado_sin",
    arponcilloNota: "Sin arpón si sueltas; talla 12 cm.",
    cebador: { recomendado: false, tipos: "—", nota: "Spinning de cardumen." },
    plomos: [
      { enAnzuelo: "Cucharilla / metal", plomoG: "7–21 g" },
      { enAnzuelo: "Vinilo pequeño", plomoG: "5–12 g cabeza" },
    ],
    compraRapida: ["Spinning L-ML", "Trenza 0,10", "Cucharillas 7–12 g", "Emerillón"],
    restricciones: [COSTA_CS],
  },
  {
    especieId: "caballa",
    ambito: "costa",
    resumenCompra: "Metal/minnow 10–25 g; sin cebador.",
    anzueloTipo: "Del señuelo",
    anzueloTalla: "Minnow 10 cm · jig 15–25 g",
    arponcillo: "recomendado_sin",
    arponcilloNota: "Talla 18 cm; sin arpón para subtalladas.",
    cebador: { recomendado: false, tipos: "—", nota: "Pases desde espigón de playa legal." },
    plomos: [{ enAnzuelo: "Minnow / jig / pluma", plomoG: "10–25 g" }],
    compraRapida: ["Spinning MH", "Trenza 0,12–0,16", "Minnows hundidos", "Jigs 15–25 g"],
    restricciones: [COSTA_CS],
  },
  {
    especieId: "sepia",
    ambito: "costa",
    resumenCompra: "Egí 2.5–3.5; máx. 2 poteras; sin plomo extra.",
    anzueloTipo: "Egí / potera (no anzuelo clásico)",
    anzueloTalla: "Egí 2.5–3.5 · si anzuelo natural: mín. 12×5 mm (Decreto 41/2013)",
    arponcillo: "no_aplica",
    arponcilloNota: "La potera no lleva arponcillo de anzuelo; respeta tamaño mínimo legal del anzuelo si usas cebo.",
    cebador: { recomendado: false, tipos: "—", nota: "No nasas. Solo eging o anzuelo legal." },
    plomos: [{ enAnzuelo: "Egí", plomoG: "No hace falta", nota: "El egí ya está lastrado" }],
    compraRapida: ["Caña eging o spinning MH", "PE 0,6–0,8 + flúoro", "Hasta 2 egís", "Salabardo"],
    restricciones: [
      COSTA_CS,
      {
        provincias: ["castellon"],
        texto: "Máximo 2 poteras/egi por pescador. Prohibidas nasas y redes.",
        severidad: "obligatorio",
      },
    ],
  },
  {
    especieId: "calamar",
    ambito: "costa",
    resumenCompra: "Como sepia; egí algo más brillante/rápido.",
    anzueloTipo: "Egí",
    anzueloTalla: "Egí 2.5–3.5",
    arponcillo: "no_aplica",
    arponcilloNota: "Misma lógica que sepia.",
    cebador: { recomendado: false, tipos: "—", nota: "Eging de escollera legal." },
    plomos: [{ enAnzuelo: "Egí", plomoG: "No hace falta" }],
    compraRapida: ["Equipo eging", "Egís 2.5–3.5", "Máx. 2 poteras"],
    restricciones: [COSTA_CS],
  },
  {
    especieId: "pulpo",
    ambito: "costa",
    resumenCompra: "Anzuelo legal ≥12×5 mm; plomo 40–80 g.",
    anzueloTipo: "Simple fuerte o jig de pulpo",
    anzueloTalla: "Anzuelo no menor de 12 mm × 5 mm (si usas anzuelo)",
    arponcillo: "opcional",
    arponcilloNota: "Tamaño mínimo del anzuelo manda más que el arpón.",
    cebador: { recomendado: false, tipos: "—", nota: "Prohibido nasas/fisgas profesionales." },
    plomos: [
      { enAnzuelo: "Cangrejo / sardina / jig", plomoG: "40–80 g", nota: "Según corriente en roca" },
    ],
    compraRapida: ["Rockfishing robusto", "Nylon 0,30–0,40", "Plomo 40–80 g", "Anzuelo legal / jig pulpo"],
    restricciones: [
      COSTA_CS,
      {
        provincias: ["castellon"],
        texto: "Cupo orientativo 5 kg/día; no te lleves crías. Un aparejo a mano permitido; nunca nasas.",
        severidad: "aviso",
      },
    ],
  },
  {
    especieId: "salmonete",
    ambito: "costa",
    resumenCompra: "Fondo fino; anzuelo #8–#4; plomo 40–80 g.",
    anzueloTipo: "Simple fino",
    anzueloTalla: "#8–#4",
    arponcillo: "recomendado_sin",
    arponcilloNota: "Sin arpón recomendado.",
    cebador: { recomendado: false, tipos: "—", nota: "Gusano en arena." },
    plomos: [{ enAnzuelo: "Gusano", plomoG: "40–80 g" }],
    compraRapida: ["Surf ligero / spinning", "Anzuelos #8–#4", "Gusano", "Pirámide 60–80 g"],
    restricciones: [COSTA_CS],
  },
  {
    especieId: "corvina",
    ambito: "costa",
    resumenCompra: "Anzuelo 2/0–5/0; plomo según cebo grande.",
    anzueloTipo: "Circle / J fuerte",
    anzueloTalla: "2/0–5/0",
    arponcillo: "opcional",
    arponcilloNota: "Con arpón si retienes; sin arpón si sueltas.",
    cebador: { recomendado: false, tipos: "—", nota: "Cebo de pescado/calamar en anzuelo." },
    plomos: [
      { enAnzuelo: "Filete / calamar", plomoG: "80–150 g" },
      { enAnzuelo: "Vinilo grande", plomoG: "20–40 g cabeza" },
    ],
    compraRapida: ["Surf o spinning MH", "Trenza + bajo fuerte", "Anzuelos 2/0–5/0", "Pirámide 100–150 g"],
    restricciones: [COSTA_CS],
  },
  {
    especieId: "palometon",
    ambito: "costa",
    resumenCompra: "Como lubina heavy; señuelo 15–30 g.",
    anzueloTipo: "Del señuelo reforzado",
    anzueloTalla: "Según minnow/jig grande",
    arponcillo: "opcional",
    arponcilloNota: "Hierro fuerte; limpia arpón si sueltas.",
    cebador: { recomendado: false, tipos: "—", nota: "Spinning de orilla." },
    plomos: [{ enAnzuelo: "Minnow / metal", plomoG: "15–40 g" }],
    compraRapida: ["Spinning MH-H", "Trenza 0,16–0,20", "Señuelos grandes", "Snaps fuertes"],
    restricciones: [COSTA_CS],
  },
  {
    especieId: "anjova",
    ambito: "costa",
    resumenCompra: "Spinning potente; metal 20–40 g.",
    anzueloTipo: "Del señuelo",
    anzueloTalla: "Metal / popper grande",
    arponcillo: "opcional",
    arponcilloNota: "Equipo robusto; suelta con cuidado.",
    cebador: { recomendado: false, tipos: "—", nota: "Sin cebador." },
    plomos: [{ enAnzuelo: "Metal / stickbait", plomoG: "20–40 g" }],
    compraRapida: ["Spinning H", "Trenza gruesa", "Metales 20–40 g"],
    restricciones: [COSTA_CS],
  },
  {
    especieId: "espeton",
    ambito: "costa",
    resumenCompra: "Spinning; minnow hundido; sin cebador.",
    anzueloTipo: "Del señuelo",
    anzueloTalla: "Minnow 10–14 cm",
    arponcillo: "recomendado_sin",
    arponcilloNota: "Sin arpón si sueltas.",
    cebador: { recomendado: false, tipos: "—", nota: "Pases de cardumen." },
    plomos: [{ enAnzuelo: "Minnow / jig", plomoG: "10–25 g" }],
    compraRapida: ["Spinning MH", "Minnows hundidos", "Trenza fina"],
    restricciones: [COSTA_CS],
  },
  {
    especieId: "cangrejo_azul",
    ambito: "costa",
    resumenCompra: "Invasora: retén; no aparejo especial ilegal.",
    anzueloTipo: "Captura incidental / métodos autorizados",
    anzueloTalla: "—",
    arponcillo: "no_aplica",
    arponcilloNota: "No devolver (invasora).",
    cebador: { recomendado: false, tipos: "—", nota: "—" },
    plomos: [{ enAnzuelo: "—", plomoG: "—" }],
    compraRapida: ["Guantes resistentes", "Contenedor"],
    restricciones: [INVASORA, COSTA_CS],
  },
];

export function recomendacionAparejo(
  especieId: string,
  ambito?: "rio" | "costa"
): RecomendacionAparejo | undefined {
  const matches = RECOMENDACIONES_APAREJO.filter((r) => r.especieId === especieId);
  if (matches.length === 0) return undefined;
  if (ambito) {
    const exact = matches.find((r) => r.ambito === ambito);
    if (exact) return exact;
    const ambos = matches.find((r) => r.ambito === "ambos");
    if (ambos) return ambos;
  }
  return matches[0];
}

export function etiquetaArponcillo(estado: ArponcilloEstado): string {
  switch (estado) {
    case "obligatorio_sin":
      return "Sin arponcillo (obligatorio)";
    case "recomendado_sin":
      return "Sin arponcillo (recomendado)";
    case "opcional":
      return "Con o sin arponcillo";
    case "no_aplica":
      return "No aplica";
  }
}

export function restriccionesParaProvincia(
  rec: RecomendacionAparejo,
  provinciaId: string,
  ambito?: "rio" | "costa"
): RestriccionAparejo[] {
  return rec.restricciones.filter((r) => {
    if (!(r.provincias.includes("*") || r.provincias.includes(provinciaId as ProvinciaId))) {
      return false;
    }
    if (r.soloAmbito && ambito && r.soloAmbito !== ambito) return false;
    return true;
  });
}
