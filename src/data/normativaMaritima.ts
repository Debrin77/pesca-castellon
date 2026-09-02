/**
 * Pesca marítima recreativa DESDE TIERRA en Castellón.
 * Decreto 41/2013 (aguas interiores CV) + normas estatales en aguas exteriores.
 * No cubre embarcación ni submarina.
 */
export const FUENTE_MARITIMA = {
  titulo: "Decreto 41/2013 (pesca marítima recreativa CV) + licencia GVA desde tierra",
  urlLicencia:
    "https://sede.gva.es/es/inicio/procedimientos?id_proc=17170",
};

export const REGLAS_ORILLA_MAR = [
  "Hace falta la licencia de pesca marítima recreativa desde tierra (no vale sola la continental).",
  "Prohibido a menos de 100 m de zonas con bañistas.",
  "Prohibido en aguas portuarias (dársena, fondeo y varada), salvo excepción del puerto.",
  "Prohibido en zonas acotadas o reservadas (Ley de Costas / espacios protegidos señalizados).",
  "No vender las capturas. Respeta tallas y vedas del BOE y de la UE.",
  "Tope habitual: 5 kg por licencia y día (puede no computar una pieza). Decreto 41/2013.",
  "Desde tierra: como máximo dos cañas por licencia (máx. 3 m entre ellas si son del mismo titular), o un aparejo a mano. Máximo seis anzuelos o dos poteras por pescador. Los cebos artificiales cuentan como anzuelo. Anzuelos no menores de 12 mm de largo y 5 mm de ancho. Sin nasas, redes ni artes profesionales.",
  "Esta app no cubre pesca desde embarcación.",
];

/** Cefalópodos autorizados en recreo (RD 347/2011 anexo I). Castellón ≠ veda recreativa del pulpo de Andalucía. */
export const NOTA_CEFALOPODOS_ORILLA =
  "Sepia (Sepia officinalis) y pulpo (Octopus spp.) sí están en el anexo I del RD 347/2011: se pueden pescar desde orilla con licencia marítima. Pulpo: 1 kg mínimo (RD 560/1995 anexo II Mediterráneo). Sepia: sin talla numérica estatal; no te lleves crías. Egi = potera (máximo dos). Nasas de pulpo, no. Irta a pie: no. Dársena: no.";

/** El Mediterráneo en Castellón es micromareal: no copies tablas atlánticas. */
export const NOTA_MAREAS_CASTELLON =
  "En la costa de Castellón la marea astronómica es de pocos decímetros. Lo que cambia la orilla es el oleaje y el viento, no una carta de marea tipo Cantábrico. La batimetría y la carta IHM son de consulta: no sirven para navegar.";
