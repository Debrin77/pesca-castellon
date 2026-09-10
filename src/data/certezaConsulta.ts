import type { ConsultaPesca } from "../services/consultaPescaService";
import { esProvinciaAndalucia, esProvinciaCastillaLaMancha } from "../provincias/types";

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

  const esAndalucia = esProvinciaAndalucia(opts?.provinciaId);
  const esClm = esProvinciaCastillaLaMancha(opts?.provinciaId);

  if (c.confianza === "oficial" && c.fuenteGeometria === "poligono_icv") {
    return {
      nivel: "oficial",
      sello: "OFICIAL",
      etiqueta: esAndalucia ? "Polígono DERA / Junta" : "Polígono ICV",
      aviso: "Geometría oficial embebida en la app.",
      a11y: esAndalucia
        ? "Consulta sobre polígono oficial DERA de la Junta."
        : "Consulta sobre polígono oficial ICV.",
    };
  }

  if (c.fuenteGeometria === "poligono_icv" && esClm) {
    return {
      nivel: "aproximada",
      sello: "APROXIMADO",
      etiqueta: "Catálogo app · OSM / Orden CLM",
      aviso: "No es el visor oficial JCCM. Confirma cartel y Orden 20/2026.",
      a11y: "Consulta sobre geometría orientativa de la app para Castilla-La Mancha. Confirma el visor JCCM.",
    };
  }

  if (c.fuenteGeometria === "ninguna") {
    return {
      nivel: "aproximada",
      sello: "APROXIMADO",
      etiqueta: "Fuera del catálogo geométrico",
      aviso: esAndalucia
        ? "No es veda automática. Puede ser agua libre (art. 5.2): confirma que no es refugio y mira el cartel."
        : esClm
          ? "No es veda automática. Confirma visor JCCM, Orden de vedas y cartel."
          : "No es veda automática. Este tramo no está dibujado en el mapa: confirma cartel o DOGV.",
      a11y: esAndalucia
        ? "Punto fuera del catálogo DERA. No es veda automática; el artículo 5.2 puede aplicar. Confirma refugios y señalización."
        : esClm
          ? "Punto fuera del catálogo de la app. No es veda automática. Confirma visor JCCM y señalización."
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
