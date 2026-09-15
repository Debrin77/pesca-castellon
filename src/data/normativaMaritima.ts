/**
 * Pesca marítima recreativa en Castellón.
 * Orilla: Decreto 41/2013 (aguas interiores CV) + normas estatales.
 * Embarcación / kayak: marco estatal (RD 347/2011) + reservas (p. ej. Columbretes) + PescaREC.
 */
export const FUENTE_MARITIMA = {
  titulo: "Decreto 41/2013 (pesca marítima recreativa CV) + licencia GVA desde tierra",
  urlLicencia:
    "https://sede.gva.es/es/inicio/procedimientos?id_proc=17170",
};

export const FUENTE_EMBARCACION = {
  titulo: "Pesca marítima recreativa desde embarcación (RD 347/2011 + reservas estatales)",
  urlPescaRec:
    "https://www.mapa.gob.es/es/pesca/temas/pesca-maritima-de-recreo/pesca-rec/",
  urlColumbretes:
    "https://www.mapa.gob.es/es/pesca/temas/proteccion-recursos-pesqueros/reservas-marinas-de-interes-pesquero/rm-islas-columbretes/",
  /** Carta náutica comercial (Garmin). Complemento de navegación; no es oficial IHM. */
  urlNavionics:
    "https://www.garmin.com/es-ES/p/136701",
  /**
   * Instituto Hidrográfico de la Marina — cartografía oficial de consulta.
   * Portal IdeIHM en HTTPS (evita el aviso «No seguro» de Safari en iPhone
   * que provocaba el enlace antiguo del portal de la Armada).
   */
  urlIhm: "https://ideihm.covam.es/portal/",
};

/**
 * Qué app usar el día de la salida. Esta app decide pesca/legal/meteo;
 * Navionics (u otra carta) cubre navegar con batimetría y peligros.
 */
export const HERRAMIENTAS_COMPLEMENTARIAS_BARCO: {
  id: string;
  nombre: string;
  rol: string;
  paraQue: string;
  url?: string;
}[] = [
  {
    id: "esta-app",
    nombre: "Pesca Castellón (esta app)",
    rol: "Decidir si sales a pescar",
    paraQue:
      "¿Puedo? (norma, Columbretes, dársena) · ¿Pinta? (oleaje/viento) · checklist · aparejos · diario privado.",
  },
  {
    id: "navionics",
    nombre: "Navionics Boating (Garmin)",
    rol: "Navegar y leer el fondo",
    paraQue:
      "Cartas náuticas, batimetría HD, rutas y peligros. No sustituye el patrón ni la carta oficial IHM. De pago / suscripción.",
    url: "https://www.garmin.com/es-ES/p/136701",
  },
  {
    id: "pescarec",
    nombre: "PescaREC (MAPA)",
    rol: "Declarar capturas cuando toque",
    paraQue: "App oficial estatal. Esta app solo enlaza; no declara por ti.",
    url: "https://www.mapa.gob.es/es/pesca/temas/pesca-maritima-de-recreo/pesca-rec/",
  },
  {
    id: "ihm",
    nombre: "Carta IHM (consulta)",
    rol: "Cartografía oficial de referencia",
    paraQue:
      "Instituto Hidrográfico de la Marina (IdeIHM). Consulta en tierra; no uses capturas de pantalla como única carta a bordo.",
    url: FUENTE_EMBARCACION.urlIhm,
  },
];

export const REGLAS_ORILLA_MAR = [
  "Hace falta la licencia de pesca marítima recreativa desde tierra (no vale sola la continental).",
  "Prohibido a menos de 100 m de zonas con bañistas.",
  "Prohibido en aguas portuarias (dársena, fondeo y varada), salvo excepción del puerto.",
  "Prohibido en zonas acotadas o reservadas (Ley de Costas / espacios protegidos señalizados).",
  "No vender las capturas. Respeta tallas y vedas del BOE y de la UE.",
  "Tope habitual: 5 kg por licencia y día (puede no computar una pieza). Decreto 41/2013.",
  "Desde tierra: como máximo dos cañas por licencia (máx. 3 m entre ellas si son del mismo titular), o un aparejo a mano. Máximo seis anzuelos o dos poteras por pescador. Los cebos artificiales cuentan como anzuelo. Anzuelos no menores de 12 mm de largo y 5 mm de ancho. Sin nasas, redes ni artes profesionales.",
  "Horario caña desde tierra: Decreto 41/2013 y RD 347/2011 no fijan veda nocturna general (la prohibición ocaso→orto es de la modalidad submarina). Un bando municipal o el acceso a la playa sí pueden limitar.",
  "Embarcación y kayak tienen otro flujo legal en la app (modalidad Barco / Kayak): no uses el semáforo de orilla para zarpar.",
];

/** Checklist / reglas orientativas para zarpar a pescar (no sustituyen BOE ni el patrón). */
export const REGLAS_EMBARCACION_MAR = [
  "Licencia/autorización de pesca marítima recreativa desde embarcación o artefacto flotante según tu caso (estatal/CCAA). La de «desde tierra» no cubre barco.",
  "PescaREC: declara cuando la norma lo exija (especies/zonas). Esta app solo enlaza; no declara por ti.",
  "Prohibido pescar en dársena, canales de entrada y zonas de fondeo/varada salvo autorización del puerto.",
  "Reserva marina de las Islas Columbretes: no entres a pescar sin comprobar la cartografía y normas oficiales.",
  "Respeta distancias a bañistas, boyas de balizamiento y zonas de baño balizadas.",
  "No vender capturas. Tallas y cupos: RD 560/1995, RD 347/2011 y actualizaciones UE/BOE.",
  "Artes de recreo: sin redes ni artes profesionales. Poteras: máximo habitual dos en recreo.",
  "Meteo: oleaje, viento y rachas mandan más que la marea astronómica en Castellón (micromareal).",
  "Seguridad: chaleco, medios de comunicación, combustible de sobra y plan de regreso al puerto.",
];

export const CHECKLIST_EMBARCACION = [
  "Licencia de embarcación / kayak en regla (no solo «desde tierra»).",
  "PescaREC instalado o a mano para declarar si aplica.",
  "Chaleco salvavidas para todos a bordo.",
  "Móvil cargado / VHF si llevas; avisa a alguien de la hora de vuelta.",
  "Combustible o baterías de sobra + ancla ligera si el barco lo lleva.",
  "Revisa oleaje, viento y rachas en el punto (índice «Salgo en barco»).",
  "Puerto o rampa de salida elegido; no pesques en dársena.",
  "Columbretes y vedados marinos: fuera del polígono de pesca.",
  "Botiquín básico, agua y protección solar.",
  "Plan de regreso: ETA al puerto con margen de luz de día.",
];

/** Texto corto para avisos de franja solar en costa (caña desde tierra). */
export const HORARIO_LEGAL_ORILLA_MAR =
  "Caña desde tierra: sin veda nocturna general en Dec. 41/2013 / RD 347/2011. La prohibición de noche (ocaso→orto) aplica a la pesca submarina. Revisa bando municipal y acceso a playa.";

/**
 * Embarcación / kayak: no reutilizar el texto de «caña desde tierra».
 * Luz solar = seguridad y plan de regreso; no es el semáforo de orilla.
 */
export const HORARIO_LEGAL_EMBARCACION_MAR =
  "Embarcación / kayak: el RD 347/2011 no fija veda nocturna general de caña a bordo (la prohibición ocaso→orto es de la modalidad submarina). Prioriza luz de día por seguridad y ETA al puerto. Bandos del puerto, Columbretes y el patrón mandan.";

/** Submarina (no cubierta por la app, pero evita confusiones). */
export const HORARIO_SUBMARINA_CV =
  "Pesca submarina: prohibida de noche, desde el ocaso al orto (Dec. 41/2013 art. 13 / RD 347/2011).";

/** Cefalópodos autorizados en recreo (RD 347/2011 anexo I). Castellón ≠ veda recreativa del pulpo de Andalucía. */
export const NOTA_CEFALOPODOS_ORILLA =
  "Sepia (Sepia officinalis) y pulpo (Octopus spp.) sí están en el anexo I del RD 347/2011: se pueden pescar desde orilla con licencia marítima. Pulpo: 1 kg mínimo (RD 560/1995 anexo II Mediterráneo). Sepia: sin talla numérica estatal; no te lleves crías. Egi = potera (máximo dos). Nasas de pulpo, no. Irta a pie: no. Dársena: no.";

/** El Mediterráneo en Castellón es micromareal: no copies tablas atlánticas. */
export const NOTA_MAREAS_CASTELLON =
  "En la costa de Castellón la marea astronómica es de pocos decímetros. Lo que cambia la orilla es el oleaje y el viento, no una carta de marea tipo Cantábrico. La batimetría y la carta IHM son de consulta: no sirven para navegar.";
