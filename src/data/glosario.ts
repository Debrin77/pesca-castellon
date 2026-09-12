/**
 * Términos de pesca / app con pista corta al tocar.
 * Amplía Consejos → Vocabulario; aquí van los de Inicio/Mapa/Previsión
 * y los técnicos (spinning, Texas, popper…) que salen en Aparejos.
 */

import type { IdDiagrama } from "./consejosMedia";

export type TerminoGlosario = {
  id: string;
  etiqueta: string;
  resumen: string;
  detalle?: string;
  /** Id del consejo en Vocabulario (ficha completa con foto). */
  consejoId?: string;
  /** Guía fotográfica asociada. */
  diagramaId?: IdDiagrama;
  /** Alias para detectar el término en textos de aparejo / técnica. */
  aliases?: string[];
};

export const GLOSARIO: Record<string, TerminoGlosario> = {
  solunar: {
    id: "solunar",
    etiqueta: "Solunar",
    resumen: "Calendario de ventanas «mayores» y «menores» según sol y luna.",
    detalle:
      "Es orientativo: ayuda a elegir franja, no garantiza picada. Combínalo con clima, caudal y normativa del tramo.",
    consejoId: "voc-solunar",
  },
  sm: {
    id: "sm",
    etiqueta: "SM · sin muerte",
    resumen: "Pesca sin muerte: debes devolver el pez vivo al agua de inmediato.",
    detalle:
      "Obligatoria para trucha común y barbos autóctonos en muchos tramos. Anzuelo sin arponcillo, manos húmedas, poco tiempo fuera del agua.",
    consejoId: "voc-sm",
  },
  saih: {
    id: "saih",
    etiqueta: "SAIH",
    resumen: "Sistema Automático de Información Hidrológica (embalses y caudales).",
    detalle:
      "En fichas de embalse verás el % de llenado cuando la consulta funciona (CHJ / CHG según provincia).",
    consejoId: "voc-saih",
  },
  zpl: {
    id: "zpl",
    etiqueta: "ZPL",
    resumen: "Zona de pesca libre: licencia, sin permiso de coto.",
    detalle: "Sigue horario, especies y cebos. En el mapa suele ir en verde.",
    consejoId: "voc-zpl",
  },
  zpc: {
    id: "zpc",
    etiqueta: "ZPC / coto",
    resumen: "Zona de pesca controlada: hace falta permiso del adjudicatario.",
    detalle: "El PTOP del coto fija cupos, días y técnicas. En el mapa: ámbar.",
    consejoId: "voc-zpc",
  },
  vp: {
    id: "vp",
    etiqueta: "VP / vedado",
    resumen: "Tramo no pescable o reserva.",
    detalle: "Prohibido pescar. En el mapa: rojo.",
    consejoId: "voc-vp",
  },
  sin_tramo: {
    id: "sin_tramo",
    etiqueta: "Sin tramo / fuera de catálogo",
    resumen: "El punto no cae en polígono oficial ni en el radio de un tramo del catálogo.",
    detalle:
      "No es veda automática. En Sevilla el art. 5.2 puede permitir aguas libres no dibujadas. En Castellón las ZPL del anexo usan radio aproximado; un cauce no listado queda en duda. Confirma cartel y fuente oficial.",
    consejoId: "voc-sin-tramo",
  },
  art52: {
    id: "art52",
    etiqueta: "Art. 5.2 (Andalucía)",
    resumen: "Aguas libres: toda masa no delimitada como coto o refugio.",
    detalle:
      "DERA no cartografía todos los cauces libres. «Sin tramo» en Sevilla no equivale a prohibido: hace falta licencia, NIR, seguro RC y comprobar que no es refugio ni espacio restringido.",
    consejoId: "voc-art52",
  },
  ptop: {
    id: "ptop",
    etiqueta: "PTOP",
    resumen: "Plan técnico de ordenación piscícola del coto.",
    detalle: "Cartel y PTOP mandan si hay conflicto con lo que diga la app.",
    consejoId: "voc-ptop",
  },

  spinning: {
    id: "spinning",
    etiqueta: "Spinning",
    resumen: "Caña + carrete frontal + señuelo: lanzas y recuperas.",
    detalle: "El señuelo «nada» al recuperar. Emerillón + snap facilitan el cambio.",
    consejoId: "voc-spinning",
    diagramaId: "voc-spinning",
    aliases: ["spinning", "spin"],
  },
  surfcasting: {
    id: "surfcasting",
    etiqueta: "Surfcasting",
    resumen: "Pesca desde playa o rompiente, a menudo con lance largo.",
    detalle: "Plomo pirámide en arena; fuera de puertos y bandas de baño.",
    consejoId: "voc-surfcasting",
    diagramaId: "voc-surfcasting",
    aliases: ["surfcasting", "surf casting", "surf"],
  },
  texas: {
    id: "texas",
    etiqueta: "Texas",
    resumen: "Montaje: plomo bala + offset + vinilo weedless.",
    detalle: "Punta del anzuelo embutida en el softbait. Ideal hierba de embalse.",
    consejoId: "voc-texas",
    diagramaId: "voc-texas",
    aliases: ["texas", "texas rig"],
  },
  dropshot: {
    id: "dropshot",
    etiqueta: "Drop shot",
    resumen: "Peso al final; anzuelo 30–60 cm arriba.",
    detalle: "Presentación fina sobre el fondo. Típico 5–10 g en orilla.",
    consejoId: "voc-dropshot",
    diagramaId: "voc-dropshot",
    aliases: ["drop shot", "dropshot", "drop-shot"],
  },
  carolina: {
    id: "carolina",
    etiqueta: "Carolina",
    resumen: "Plomo deslizante + bajo largo + vinilo.",
    detalle: "El cebo queda separado del peso; barrido lento de fondo.",
    consejoId: "voc-carolina",
    diagramaId: "voc-carolina",
    aliases: ["carolina", "carolina rig"],
  },
  football_jig: {
    id: "football_jig",
    etiqueta: "Football jig",
    resumen: "Jig de cabeza redondeada/ovalada para cascajo.",
    detalle: "Se arrastra por el fondo; suele llevar trailer de vinilo.",
    consejoId: "voc-football-jig",
    diagramaId: "voc-football-jig",
    aliases: ["football jig", "football", "jig football"],
  },
  popper: {
    id: "popper",
    etiqueta: "Popper",
    resumen: "Señuelo de superficie que «escupe» al tirar.",
    detalle: "Boca cóncava: ruido y salpicadura. Alba y poca luz.",
    consejoId: "voc-popper",
    diagramaId: "voc-popper",
    aliases: ["popper", "poppers"],
  },
  stickbait: {
    id: "stickbait",
    etiqueta: "Stickbait",
    resumen: "Cuerpo largo de superficie; zig-zag a tirones.",
    detalle: "También pencil bait / walk the dog. Más sutil que un popper.",
    consejoId: "voc-stickbait",
    diagramaId: "voc-stickbait",
    aliases: ["stickbait", "stick bait", "pencil", "pencilbait"],
  },
  spinnerbait: {
    id: "spinnerbait",
    etiqueta: "Spinnerbait",
    resumen: "Brazo en V con pala(s) + falda o vinilo.",
    detalle: "No es una cucharilla. Pasa bien entre hierba.",
    consejoId: "voc-spinnerbait",
    diagramaId: "voc-spinnerbait",
    aliases: ["spinnerbait", "spinner bait"],
  },
  jerkbait: {
    id: "jerkbait",
    etiqueta: "Jerkbait",
    resumen: "Señuelo duro alargado; tirones + pausas.",
    detalle: "Imita pez herido. También minnow / wobbler.",
    consejoId: "voc-jerkbait",
    diagramaId: "voc-jerkbait",
    aliases: ["jerkbait", "jerk bait", "minnow", "wobbler"],
  },
  crankbait: {
    id: "crankbait",
    etiqueta: "Crankbait",
    resumen: "Señuelo duro con pala: bucea y vibra al recuperar.",
    detalle: "Recuperación continua. Pala larga = más profundidad.",
    consejoId: "voc-crankbait",
    diagramaId: "voc-crankbait",
    aliases: ["crankbait", "crank", "crankbaits"],
  },
  eging: {
    id: "eging",
    etiqueta: "Eging",
    resumen: "Sepia/calamar con egí (jig de tela y pinchos).",
    detalle: "Pausas y subidas cortas. Respeta vedas y tallas.",
    consejoId: "voc-eging",
    diagramaId: "voc-eging",
    aliases: ["eging", "egi", "egí"],
  },
  feeder: {
    id: "feeder",
    etiqueta: "Feeder",
    resumen: "Cebador o plomo deslizante cerca del fondo.",
    detalle: "Cebas el punto. Solo donde cebar esté permitido.",
    consejoId: "voc-feeder",
    diagramaId: "voc-feeder",
    aliases: ["feeder", "fondo", "feeder fishing"],
  },
  rockfishing: {
    id: "rockfishing",
    etiqueta: "Rockfishing",
    resumen: "Spinning ligero en roca o escollera.",
    detalle: "Jigs y vinilos pequeños. Cuidado con enganches.",
    consejoId: "voc-rockfishing",
    diagramaId: "voc-rockfishing",
    aliases: ["rockfishing", "rock fishing"],
  },
  jighead: {
    id: "jighead",
    etiqueta: "Jighead",
    resumen: "Cabeza plomada: plomo + anzuelo para vinilos.",
    detalle: "Ensartas el softbait; saltitos o arrastre.",
    consejoId: "voc-jighead",
    diagramaId: "voc-jighead",
    aliases: ["jighead", "jig head", "cabeza plomada", "jig"],
  },
  topwater: {
    id: "topwater",
    etiqueta: "Topwater",
    resumen: "Señuelos que trabajan en superficie.",
    detalle: "Poppers, stickbaits, walkers. Ataques al alba/atardecer.",
    consejoId: "voc-topwater",
    diagramaId: "voc-topwater",
    aliases: ["topwater", "top water", "superficie"],
  },
};

export function terminoGlosario(id: string): TerminoGlosario | null {
  return GLOSARIO[id] ?? null;
}

/** Detecta términos del glosario mencionados en un texto libre (aparejo, técnica…). */
export function terminosEnTexto(...textos: (string | undefined | null)[]): TerminoGlosario[] {
  const blob = textos.filter(Boolean).join(" \n ").toLowerCase();
  if (!blob.trim()) return [];
  const out: TerminoGlosario[] = [];
  const seen = new Set<string>();
  for (const t of Object.values(GLOSARIO)) {
    const keys = [t.etiqueta, ...(t.aliases ?? [])].map((s) => s.toLowerCase());
    const hit = keys.some((k) => k.length >= 3 && blob.includes(k));
    if (hit && !seen.has(t.id)) {
      seen.add(t.id);
      out.push(t);
    }
  }
  // Técnicos con foto primero
  out.sort((a, b) => Number(!!b.diagramaId) - Number(!!a.diagramaId));
  return out;
}
