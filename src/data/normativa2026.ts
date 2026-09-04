/**
 * Marco legal usado por la app (temporada 2026).
 *
 * Fuentes:
 * - Orden 30/2016 (periodos hábiles y normas generales).
 * - Resolución 16/09/2024 (DOGV 9961, 21/10/2024): anexos I y II de tramos y ZPC.
 * - Decreto 190/2025 de ordenación sostenible (categorías ZPC / ZPL / vedado).
 * - RD 630/2013 (especies exóticas invasoras).
 *
 * No sustituye el DOGV ni la señalización del tramo. Los planes técnicos de
 * cada coto (PTOP) pueden añadir cupos o días propios.
 */
export const FUENTE_NORMATIVA = {
  titulo: "Orden 30/2016 + Resolución 16/09/2024 (DOGV 9961)",
  vigenciaNota: "Anexos de tramos y cotos actualizados a 21/10/2024; dataset ICV revisado en 2026.",
  urlOrden: "https://dogv.gva.es/es/resultat-dogv?signatura=2024%2F10842%2Fcon",
  urlLicencia: "https://sede.gva.es/es/detall-tramit?id_proc=681",
};

export type Aprovechamiento = "ZPL" | "ZPC" | "VP" | "ZRTC";

export function tercerDomingoDeMarzo(anio: number): Date {
  const d = new Date(anio, 2, 1);
  const offset = (7 - d.getDay()) % 7;
  const primerDomingo = 1 + offset;
  return new Date(anio, 2, primerDomingo + 14);
}

export function temporadaTruchaAbierta(fecha: Date = new Date()): boolean {
  const inicio = tercerDomingoDeMarzo(fecha.getFullYear());
  const fin = new Date(fecha.getFullYear(), 7, 31, 23, 59, 59);
  return fecha >= inicio && fecha <= fin;
}

export function etiquetaTemporadaTrucha(anio: number = new Date().getFullYear()): string {
  const ini = tercerDomingoDeMarzo(anio);
  const d = ini.getDate();
  return `del ${d} de marzo al 31 de agosto de ${anio} (tercer domingo de marzo)`;
}

/** Días hábiles extra de notas 1 y 2 del anexo I (Mijares salmonícola). 0=dom … 6=sáb */
export function diaHabilMijares(nota: "ZPL1" | "ZPL2" | null, fecha: Date = new Date()): boolean {
  const dow = fecha.getDay();
  if (nota === "ZPL1") return [0, 2, 4, 6].includes(dow); // mar, jue, sáb, dom
  if (nota === "ZPL2") return [2, 4].includes(dow); // mar, jue
  return true;
}

/** Horario legal de pesca continental en la Comunitat Valenciana (Orden 30/2016). */
export const HORARIO_LEGAL_PESCA =
  "Legal: se pesca de 1 hora antes del amanecer a 1 hora después del anochecer. De noche está prohibido, salvo molinà de anguila expresamente autorizada.";

export const REGLAS_GENERALES = [
  "Licencia de pesca continental de la GVA obligatoria en todos los tramos.",
  "Horario: de 1 h antes del orto a 1 h después del ocaso. Pesca nocturna prohibida salvo molinà de anguila autorizada.",
  "Una sola caña y sin abandono en tramos trucheros. Prohibido cebar el agua en tramos trucheros.",
  "Trucha común y barbos autóctonos: pesca sin muerte (devolución inmediata).",
  "Invasoras (bass, lucio, siluro, gambusia, cangrejo rojo, etc.): no devolver al agua; prohibida tenencia/transporte de siluro vivo o muerto — avisar a agentes medioambientales.",
  "Cebos prohibidos con carácter general: peces vivos, cangrejos, huevas, anfibios. Lombriz y asticot solo en aguas no trucheras.",
];

export const TALLAS_OFICIALES: Record<string, string> = {
  trucha_comun: "Sin muerte (sin talla de retención)",
  barbo: "Sin muerte (todas las especies de barbo autóctono)",
  carpin: "8 cm",
  tenca: "25 cm",
  anguila: "25 cm · cupo 4 ud o 1 kg/día en aguas libres",
  black_bass: "Invasora: captura fomentada, no devolver",
  lucio: "Invasora: captura fomentada, no devolver",
  siluro: "Invasora: no devolver, no transportar, notificar",
  carpa: "Sin talla mínima específica en la Orden (no está en la tabla de 2.2)",
  mugilidos: "25 cm en río (Orden 30/2016). En mar: 16 cm (RD 560)",
  trucha_arcoiris: "Sin cupo ni talla; retención y sacrificio si se pesca fuera de tramo truchero",
};

/** Recordatorio de temporada para banners de la app. */
export function textoVigenciaNormativa(): string {
  return `${FUENTE_NORMATIVA.titulo}. ${FUENTE_NORMATIVA.vigenciaNota}`;
}

export const CHECKLIST_ANTES_DE_PESCAR = [
  "Licencia GVA en vigor (continental y/o marítima según el agua).",
  "No hace falta seguro de RC de pescador en Castellón (sí en Andalucía).",
  "Si es ZPC: permiso del coto / PTOP del día.",
  "Comprobar veda de trucha y días hábiles del tramo (anexo Mijares).",
  "Revisar cebos permitidos (nada de pez vivo / huevas / cangrejo).",
  "Horario legal: 1 h antes del orto → 1 h después del ocaso.",
  "Invasoras: no devolver; siluro no se transporta — avisar a agentes.",
];
