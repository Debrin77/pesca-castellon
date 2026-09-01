/**
 * Datos hidrológicos en tiempo real del SAIH Júcar (Confederación
 * Hidrográfica del Júcar): https://saih.chj.es
 *
 * CÓMO FUNCIONA: la web del SAIH no publica una API JSON pública, así
 * que consultamos la página https://saih.chj.es/embalses (que lista
 * TODOS los embalses de la cuenca en una sola tabla) y extraemos con
 * expresiones regulares los datos del embalse que nos interesa,
 * buscando su nombre exacto (p.ej. "EMBALSE DE ARENÓS").
 *
 * LIMITACIONES HONESTAS:
 * - En la versión WEB (navegador), es muy probable que este fetch falle
 *   por política CORS del servidor de la CHJ (los sitios de la
 *   administración raras veces permiten peticiones cross-origin desde
 *   otras webs). En ese caso, caemos automáticamente a datos de
 *   ejemplo, claramente marcados como tal.
 * - En la app NATIVA (Expo Go / build), fetch no tiene esa restricción,
 *   así que debería funcionar. Aun así, si la CHJ cambia el formato de
 *   su web, el "parseo" con regex puede romperse — por eso todo va
 *   envuelto en try/catch con caída a datos de ejemplo.
 * - Los datos del SAIH son provisionales y pueden tener retrasos,
 *   según su propio aviso legal: https://saih.chj.es/disclaimer
 */

export interface EstacionHidrologica {
  id: string;
  nombre: string;
  volumenEmbalsadoHm3: number | null;
  volumenMaximoHm3: number | null;
  porcentajeLleno: number | null;
  caudalRecibido: number | null; // m3/s
  caudalSalida: number | null; // m3/s
  fechaDato: string | null;
  fuente: "saih_chj" | "simulado";
  urlFicha?: string;
}

function datosSimulados(id: string, nombre: string): EstacionHidrologica {
  const seed = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return {
    id,
    nombre,
    volumenEmbalsadoHm3: null,
    volumenMaximoHm3: null,
    porcentajeLleno: 30 + (seed % 50),
    caudalRecibido: Number(((seed % 10) + 0.5).toFixed(2)),
    caudalSalida: Number(((seed % 8) + 0.3).toFixed(2)),
    fechaDato: null,
    fuente: "simulado",
  };
}

let cachePagina: { texto: string; obtenidoEn: number } | null = null;
const CACHE_MS = 5 * 60 * 1000; // 5 minutos, para no golpear la web de la CHJ en cada pantalla

async function obtenerPaginaEmbalses(): Promise<string | null> {
  if (cachePagina && Date.now() - cachePagina.obtenidoEn < CACHE_MS) {
    return cachePagina.texto;
  }
  const res = await fetch("https://saih.chj.es/embalses");
  if (!res.ok) throw new Error(`SAIH respondió ${res.status}`);
  const texto = await res.text();
  cachePagina = { texto, obtenidoEn: Date.now() };
  return texto;
}

/**
 * Busca el bloque de un embalse por su nombre exacto (tal como aparece
 * en la tabla de saih.chj.es/embalses, p.ej. "EMBALSE DE ARENÓS") y
 * extrae sus valores numéricos con regex.
 */
function parsearEmbalse(html: string, nombreSAIH: string): Partial<EstacionHidrologica> | null {
  const idx = html.indexOf(nombreSAIH);
  if (idx === -1) return null;

  // Nos quedamos con un trozo de texto razonable justo después del nombre,
  // donde deberían estar sus cifras (evita colarnos en el siguiente embalse)
  const trozo = html.slice(idx, idx + 1500);

  const fecha = trozo.match(/(\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2})/);
  const volumen = trozo.match(/Volumen embalsado[^\d]*([\d.,]+)\s*hm3/i);
  const volumenMax = trozo.match(/Volumen NMN[^\d]*([\d.,]+)\s*hm3/i);
  const caudalRecibido = trozo.match(/Caudal recibido[^\d-]*([\d.,]+)\s*m3\/s/i);
  const caudalSalida = trozo.match(/Caudal total salida[^\d-]*([\d.,]+)\s*m3\/s/i);
  const porcentaje = trozo.match(/([\d.,]+)\s*%/);

  const num = (m: RegExpMatchArray | null) => (m ? parseFloat(m[1].replace(",", ".")) : null);

  return {
    fechaDato: fecha ? fecha[1] : null,
    volumenEmbalsadoHm3: num(volumen),
    volumenMaximoHm3: num(volumenMax),
    caudalRecibido: num(caudalRecibido),
    caudalSalida: num(caudalSalida),
    porcentajeLleno: num(porcentaje),
  };
}

export async function getEstadoHidrologico(
  nombreSAIH: string | null | undefined,
  fichaId?: number
): Promise<EstacionHidrologica | null> {
  if (!nombreSAIH) return null;

  try {
    const html = await obtenerPaginaEmbalses();
    if (!html) throw new Error("Sin respuesta");

    const datos = parsearEmbalse(html, nombreSAIH);
    if (!datos) throw new Error("No se encontró el embalse en la página");

    return {
      id: nombreSAIH,
      nombre: nombreSAIH,
      volumenEmbalsadoHm3: datos.volumenEmbalsadoHm3 ?? null,
      volumenMaximoHm3: datos.volumenMaximoHm3 ?? null,
      porcentajeLleno: datos.porcentajeLleno ?? null,
      caudalRecibido: datos.caudalRecibido ?? null,
      caudalSalida: datos.caudalSalida ?? null,
      fechaDato: datos.fechaDato ?? null,
      fuente: "saih_chj",
      urlFicha: fichaId ? `https://saih.chj.es/embalses/${fichaId}` : "https://saih.chj.es/embalses",
    };
  } catch (err) {
    console.warn("No se pudo consultar el SAIH real, usando datos de ejemplo:", err);
    return datosSimulados(nombreSAIH, nombreSAIH);
  }
}
