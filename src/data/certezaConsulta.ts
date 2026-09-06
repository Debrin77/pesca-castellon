import type { ConsultaPesca } from "../services/consultaPescaService";

export type NivelCerteza = "oficial" | "aproximada" | "orientativo_costa";

export type CertezaConsulta = {
  nivel: NivelCerteza;
  /** Sello corto visible sin leer el párrafo. */
  sello: string;
  /** Qué geometría / fuente es. */
  etiqueta: string;
  /** Qué hacer / qué no asumir. */
  aviso: string;
  a11y: string;
};

/**
 * Nivel de certeza geométrica/legal del punto.
 * Independiente del semáforo HOY SÍ / HOY NO (ese es el veredicto).
 */
export function certezaDeConsulta(
  c: Pick<ConsultaPesca, "confianza" | "ambito" | "fuenteGeometria">,
  opts?: { provinciaId?: string }
): CertezaConsulta {
  const mar = c.ambito === "maritimo";
  if (mar) {
    return {
      nivel: "orientativo_costa",
      sello: "ORIENTATIVO",
      etiqueta: "Costa · mapa de consulta",
      aviso: "No es polígono ICV. Confirma carteles y vedados locales.",
      a11y:
        "Consulta de costa orientativa. No tiene la misma certeza que un polígono oficial ICV. Confirma carteles.",
    };
  }

  if (c.confianza === "oficial" && c.fuenteGeometria === "poligono_icv") {
    const esSevilla = opts?.provinciaId === "sevilla";
    return {
      nivel: "oficial",
      sello: "OFICIAL",
      etiqueta: esSevilla ? "Polígono DERA / Junta" : "Polígono ICV",
      aviso: "Geometría oficial embebida en la app.",
      a11y: esSevilla
        ? "Consulta sobre polígono oficial DERA de la Junta."
        : "Consulta sobre polígono oficial ICV.",
    };
  }

  return {
    nivel: "aproximada",
    sello: "APROXIMADO",
    etiqueta:
      c.fuenteGeometria === "radio_anexo"
        ? "Radio del anexo (aprox.)"
        : "Fuera de polígono oficial (aprox.)",
    aviso: "No es hit exacto de polígono. Mira señalización del tramo.",
    a11y: "Consulta aproximada, sin polígono oficial en este punto.",
  };
}
