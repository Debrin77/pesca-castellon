/**
 * Términos de pesca / app con pista corta al tocar.
 * Amplía Consejos → Vocabulario; aquí van los de Inicio/Mapa/Previsión.
 */
export type TerminoGlosario = {
  id: string;
  etiqueta: string;
  resumen: string;
  detalle?: string;
};

export const GLOSARIO: Record<string, TerminoGlosario> = {
  solunar: {
    id: "solunar",
    etiqueta: "Solunar",
    resumen: "Calendario de ventanas «mayores» y «menores» según sol y luna.",
    detalle:
      "Es orientativo: ayuda a elegir franja, no garantiza picada. Combínalo con clima, caudal y normativa del tramo.",
  },
  sm: {
    id: "sm",
    etiqueta: "SM · sin muerte",
    resumen: "Pesca sin muerte: debes devolver el pez vivo al agua de inmediato.",
    detalle:
      "Obligatoria para trucha común y barbos autóctonos en muchos tramos. Anzuelo sin arponcillo, manos húmedas, poco tiempo fuera del agua.",
  },
  saih: {
    id: "saih",
    etiqueta: "SAIH",
    resumen: "Sistema Automático de Información Hidrológica (embalses y caudales).",
    detalle:
      "En fichas de embalse verás el % de llenado cuando la consulta funciona (CHJ / CHG según provincia).",
  },
  zpl: {
    id: "zpl",
    etiqueta: "ZPL",
    resumen: "Zona de pesca libre: licencia, sin permiso de coto.",
    detalle: "Sigue horario, especies y cebos. En el mapa suele ir en verde.",
  },
  zpc: {
    id: "zpc",
    etiqueta: "ZPC / coto",
    resumen: "Zona de pesca controlada: hace falta permiso del adjudicatario.",
    detalle: "El PTOP del coto fija cupos, días y técnicas. En el mapa: ámbar.",
  },
  vp: {
    id: "vp",
    etiqueta: "VP / vedado",
    resumen: "Tramo no pescable o reserva.",
    detalle: "Prohibido pescar. En el mapa: rojo.",
  },
  sin_tramo: {
    id: "sin_tramo",
    etiqueta: "Sin tramo / fuera de catálogo",
    resumen: "El punto no cae en polígono oficial ni en el radio de un tramo del catálogo.",
    detalle:
      "No es veda automática. En Sevilla el art. 5.2 puede permitir aguas libres no dibujadas. En Castellón las ZPL del anexo usan radio aproximado; un cauce no listado queda en duda. Confirma cartel y fuente oficial.",
  },
  art52: {
    id: "art52",
    etiqueta: "Art. 5.2 (Andalucía)",
    resumen: "Aguas libres: toda masa no delimitada como coto o refugio.",
    detalle:
      "DERA no cartografía todos los cauces libres. «Sin tramo» en Sevilla no equivale a prohibido: hace falta licencia, NIR, seguro RC y comprobar que no es refugio ni espacio restringido.",
  },
  ptop: {
    id: "ptop",
    etiqueta: "PTOP",
    resumen: "Plan técnico de ordenación piscícola del coto.",
    detalle: "Cartel y PTOP mandan si hay conflicto con lo que diga la app.",
  },
};

export function terminoGlosario(id: string): TerminoGlosario | null {
  return GLOSARIO[id] ?? null;
}
