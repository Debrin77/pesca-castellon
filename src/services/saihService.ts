/**
 * Datos hidrológicos en tiempo real del SAIH Júcar:
 * https://saih.chj.es/embalses
 *
 * La CHJ no publica API JSON: leemos la tabla HTML pública y extraemos
 * la fila del embalse. En web intentamos fetch directo y, si CORS bloquea,
 * un proxy de solo lectura. Si todo falla, devolvemos datos simulados
 * claramente marcados.
 */
import { Platform } from "react-native";

export interface EstacionHidrologica {
  id: string;
  nombre: string;
  volumenEmbalsadoHm3: number | null;
  volumenMaximoHm3: number | null;
  porcentajeLleno: number | null;
  caudalRecibido: number | null;
  caudalSalida: number | null;
  cotaM: number | null;
  fechaDato: string | null;
  fuente: "saih_chj" | "simulado";
  urlFicha?: string;
}

const SAIH_URL = "https://saih.chj.es/embalses";
const CACHE_MS = 5 * 60 * 1000;

let cachePagina: { texto: string; obtenidoEn: number } | null = null;

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
    cotaM: null,
    fechaDato: null,
    fuente: "simulado",
  };
}

function parseNum(raw: string | undefined | null): number | null {
  if (!raw) return null;
  const n = parseFloat(raw.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function normalizarNombre(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Extrae celdas de texto de una fila <tr>…</tr>. */
function celdasDeFila(filaHtml: string): string[] {
  const celdas: string[] = [];
  const re = /<td\b[^>]*>([\s\S]*?)<\/td>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(filaHtml))) {
    const bruto = m[1]
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    celdas.push(bruto);
  }
  return celdas;
}

/**
 * Formato actual (2026) de saih.chj.es/embalses:
 * Embalse | Vol. embalsado | Fecha | Vol. NMN | Cota | Cota aliviadero |
 * Caudal recibido | Caudal salida | % | Enlaces
 */
function parsearEmbalse(html: string, nombreSAIH: string): Partial<EstacionHidrologica> | null {
  const objetivo = normalizarNombre(nombreSAIH);
  const nucleo = objetivo.replace(/^EMBALSE DE /, "");
  const filas = html.match(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi) ?? [];

  for (const fila of filas) {
    const celdas = celdasDeFila(fila);
    if (celdas.length < 8) continue;
    const nombreFila = normalizarNombre(celdas[0] || "");
    if (!nombreFila.startsWith("EMBALSE")) continue;
    if (nombreFila !== objetivo && !nombreFila.includes(nucleo)) continue;

    const pctMatch = fila.match(/aria-valuenow="([\d.]+)"/i) || celdas[8]?.match(/([\d.,]+)\s*%/);
    const fichaMatch = fila.match(/href="\/embalses\/(\d+)"/);

    return {
      fechaDato: celdas[2] || null,
      volumenEmbalsadoHm3: parseNum(celdas[1]),
      volumenMaximoHm3: parseNum(celdas[3]),
      cotaM: parseNum(celdas[4]),
      caudalRecibido: parseNum(celdas[6]),
      caudalSalida: parseNum(celdas[7]),
      porcentajeLleno: pctMatch ? parseNum(pctMatch[1]) : parseNum((celdas[8] || "").replace("%", "")),
      urlFicha: fichaMatch ? `https://saih.chj.es/embalses/${fichaMatch[1]}` : undefined,
    };
  }

  // Fallback al parser antiguo por etiquetas (por si CHJ vuelve a ese HTML)
  const idx = html.indexOf(nombreSAIH);
  if (idx === -1) return null;
  const trozo = html.slice(idx, idx + 2000);
  const fecha = trozo.match(/(\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2})/);
  const volumen = trozo.match(/Volumen embalsado[^\d]*([\d.,]+)\s*hm3/i);
  const volumenMax = trozo.match(/Volumen NMN[^\d]*([\d.,]+)\s*hm3/i);
  const caudalRecibido = trozo.match(/Caudal recibido[^\d-]*([\d.,]+)\s*m3\/s/i);
  const caudalSalida = trozo.match(/Caudal total salida[^\d-]*([\d.,]+)\s*m3\/s/i);
  const porcentaje = trozo.match(/([\d.,]+)\s*%/);
  return {
    fechaDato: fecha ? fecha[1] : null,
    volumenEmbalsadoHm3: parseNum(volumen?.[1]),
    volumenMaximoHm3: parseNum(volumenMax?.[1]),
    caudalRecibido: parseNum(caudalRecibido?.[1]),
    caudalSalida: parseNum(caudalSalida?.[1]),
    porcentajeLleno: parseNum(porcentaje?.[1]),
    cotaM: null,
  };
}

async function fetchConTimeout(url: string, ms = 12000): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { Accept: "text/html,application/xhtml+xml" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

async function obtenerPaginaEmbalses(): Promise<string> {
  if (cachePagina && Date.now() - cachePagina.obtenidoEn < CACHE_MS) {
    return cachePagina.texto;
  }

  const candidatos: string[] = [SAIH_URL];
  if (Platform.OS === "web") {
    candidatos.push(
      `https://api.allorigins.win/raw?url=${encodeURIComponent(SAIH_URL)}`,
      `https://corsproxy.io/?${encodeURIComponent(SAIH_URL)}`
    );
  }

  let ultimoError: unknown = null;
  for (const url of candidatos) {
    try {
      const texto = await fetchConTimeout(url);
      if (texto && texto.includes("EMBALSE")) {
        cachePagina = { texto, obtenidoEn: Date.now() };
        return texto;
      }
    } catch (err) {
      ultimoError = err;
    }
  }
  throw ultimoError ?? new Error("Sin respuesta del SAIH");
}

export async function getEstadoHidrologico(
  nombreSAIH: string | null | undefined,
  fichaId?: number
): Promise<EstacionHidrologica | null> {
  if (!nombreSAIH) return null;

  try {
    const html = await obtenerPaginaEmbalses();
    const datos = parsearEmbalse(html, nombreSAIH);
    if (!datos || (datos.porcentajeLleno == null && datos.volumenEmbalsadoHm3 == null)) {
      throw new Error("No se encontró el embalse en la página");
    }

    return {
      id: nombreSAIH,
      nombre: nombreSAIH,
      volumenEmbalsadoHm3: datos.volumenEmbalsadoHm3 ?? null,
      volumenMaximoHm3: datos.volumenMaximoHm3 ?? null,
      porcentajeLleno: datos.porcentajeLleno ?? null,
      caudalRecibido: datos.caudalRecibido ?? null,
      caudalSalida: datos.caudalSalida ?? null,
      cotaM: datos.cotaM ?? null,
      fechaDato: datos.fechaDato ?? null,
      fuente: "saih_chj",
      urlFicha:
        datos.urlFicha ??
        (fichaId ? `https://saih.chj.es/embalses/${fichaId}` : SAIH_URL),
    };
  } catch (err) {
    console.warn("No se pudo consultar el SAIH real, usando datos de ejemplo:", err);
    const sim = datosSimulados(nombreSAIH, nombreSAIH);
    sim.urlFicha = fichaId ? `https://saih.chj.es/embalses/${fichaId}` : SAIH_URL;
    return sim;
  }
}

/** Resumen de varios embalses de Castellón para el panel de Inicio. */
export async function getResumenEmbalsesCastellon(
  estaciones: { nombre: string; fichaId?: number; etiqueta: string }[]
): Promise<{ etiqueta: string; nombre: string; estacion: EstacionHidrologica }[]> {
  const out: { etiqueta: string; nombre: string; estacion: EstacionHidrologica }[] = [];
  for (const e of estaciones) {
    const est = await getEstadoHidrologico(e.nombre, e.fichaId);
    if (est) out.push({ etiqueta: e.etiqueta, nombre: e.nombre, estacion: est });
  }
  return out;
}
