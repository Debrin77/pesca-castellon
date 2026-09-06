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

  if (c.fuenteGeometria === "ninguna") {
    const esSevilla = opts?.provinciaId === "sevilla";
    return {
      nivel: "aproximada",
      sello: "APROXIMADO",
      etiqueta: "Fuera del catálogo geométrico",
      aviso: esSevilla
        ? "No es veda automática. Art. 5.2: confirma que no es refugio ni espacio restringido."
        : "No es veda automática. Sin polígono ICV ni radio del anexo: confirma cartel o DOGV.",
      a11y: esSevilla
        ? "Punto fuera del catálogo DERA. No es veda automática; el artículo 5.2 puede aplicar. Confirma refugios y señalización."
        : "Punto fuera del catálogo ICV y del anexo. No es veda automática. Confirma señalización.",
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
