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
  "Esta app no cubre pesca desde embarcación.",
];

/** El Mediterráneo en Castellón es micromareal: no copies tablas atlánticas. */
export const NOTA_MAREAS_CASTELLON =
  "En la costa de Castellón la marea astronómica es de pocos decímetros. Lo que cambia la orilla es el oleaje y el viento, no una carta de marea tipo Cantábrico. La batimetría y la carta IHM son de consulta: no sirven para navegar.";
