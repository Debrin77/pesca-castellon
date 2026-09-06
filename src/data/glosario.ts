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
