/**
 * Datos hidrológicos en tiempo real:
 * - SAIH Júcar (CHJ): https://saih.chj.es/embalses
 * - SAIH Guadalquivir (CHG): https://www.chguadalquivir.es/saih/
 *
 * Ninguna confederación publica API JSON estable: leemos HTML público.
 * En web, si CORS bloquea, usamos proxies de solo lectura.
 * Si todo falla, devolvemos datos simulados claramente marcados.
 */
import { Platform } from "react-native";

export type FuenteSaih = "saih_chj" | "saih_chg" | "simulado";
export type RedSaih = "chj" | "chg";

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
  fuente: FuenteSaih;
  urlFicha?: string;
}

export interface ConsultaSaih {
  nombre: string;
  fichaId?: number;
  red?: RedSaih;
  urlPagina?: string;
}

const SAIH_CHJ_URL = "https://saih.chj.es/embalses";
const SAIH_CHG_SE_URL = "https://www.chguadalquivir.es/saih/EmbalSE.aspx";
const SAIH_CHG_CO_URL = "https://www.chguadalquivir.es/saih/EmbalCO.aspx";
const CACHE_MS = 5 * 60 * 1000;

const cachePaginas = new Map<string, { texto: string; obtenidoEn: number }>();

function datosSimulados(id: string, nombre: string, red: RedSaih, urlFicha?: string): EstacionHidrologica {
  const seed = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return {
    id,
    nombre,
    volumenEmbalsadoHm3: null,
    volumenMaximoHm3: null,
    porcentajeLleno: 30 + (seed % 50),
    caudalRecibido: null,
    caudalSalida: Number(((seed % 8) + 0.3).toFixed(2)),
    cotaM: null,
    fechaDato: null,
    fuente: "simulado",
    urlFicha: urlFicha ?? (red === "chg" ? SAIH_CHG_SE_URL : SAIH_CHJ_URL),
  };
}

/** CHJ: "12,34" o "12.34". */
function parseNum(raw: string | undefined | null): number | null {
  if (!raw) return null;
  const n = parseFloat(raw.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/** CHG: "42,288" (coma decimal) o "1.234,56". */
function parseNumEs(raw: string | undefined | null): number | null {
  if (!raw) return null;
  const s = raw.replace(/\s/g, "").replace(/[^\d.,-]/g, "");
  if (!s) return null;
  let n: number;
  if (s.includes(",") && s.includes(".")) {
    n = Number(s.replace(/\./g, "").replace(",", "."));
  } else if (s.includes(",")) {
    n = Number(s.replace(",", "."));
  } else {
    n = Number(s);
  }
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
function parsearEmbalseChj(html: string, nombreSAIH: string): Partial<EstacionHidrologica> | null {
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

/**
 * SAIH Guadalquivir (EmbalSE / EmbalCO): tablas con
 * Capacidad / Nivel / Volumen / % / Caudal tras el título "E64 Cala".
 * Importante: no leer Capacidad de la ficha siguiente (las tablas cortas
 * de Volumen/Caudal quedan justo antes del bloque detallado del siguiente embalse).
 */
function parsearEmbalseChg(html: string, nombreSAIH: string): Partial<EstacionHidrologica> | null {
  const objetivo = normalizarNombre(nombreSAIH);
  const codigoMatch = objetivo.match(/^E(\d{2})\b/);
  const codigo = codigoMatch ? `E${codigoMatch[1]}` : null;
  const sinCodigo = objetivo.replace(/^E\d{2}\s+/, "");

  const sinScripts = html.replace(/<script[\s\S]*?<\/script>/gi, " ");
  const texto = sinScripts
    .replace(/<[^>]+>/g, "\n")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&aacute;/gi, "á")
    .replace(/&eacute;/gi, "é")
    .replace(/&iacute;/gi, "í")
    .replace(/&oacute;/gi, "ó")
    .replace(/&uacute;/gi, "ú")
    .replace(/&ntilde;/gi, "ñ");

  const lines = texto
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const fechaMatch = html.match(/Actualizados:\s*([^<\n]+)/i);
  const fechaDato = fechaMatch ? fechaMatch[1].trim() : null;

  const esTituloEmbalse = (lineNorm: string): boolean => /^E\d{2}\b/.test(lineNorm);

  const coincideObjetivo = (lineNorm: string): boolean => {
    if (lineNorm === objetivo) return true;
    if (codigo && lineNorm === `${codigo} ${sinCodigo}`) return true;
    if (codigo && lineNorm.startsWith(`${codigo} `)) {
      const resto = lineNorm.slice(codigo.length + 1);
      return resto === sinCodigo || (sinCodigo.length > 3 && resto.startsWith(sinCodigo.split(" ")[0]));
    }
    return false;
  };

  for (let i = 0; i < lines.length; i++) {
    const lineNorm = normalizarNombre(lines[i]);
    if (!coincideObjetivo(lineNorm)) continue;

    // Ventana exclusiva hasta el siguiente embalse E## (distinto)
    const window: string[] = [];
    for (let j = i + 1; j < lines.length && window.length < 24; j++) {
      const n = normalizarNombre(lines[j]);
      if (esTituloEmbalse(n) && !coincideObjetivo(n)) break;
      // Saltar repetición del mismo título
      if (coincideObjetivo(n)) continue;
      window.push(lines[j]);
    }

    const tieneCapacidad = window.some((w) => /^Capacidad$/i.test(w));
    if (!tieneCapacidad) continue;

    const valorTras = (etiqueta: string): string | null => {
      const idx = window.findIndex((w) => normalizarNombre(w) === normalizarNombre(etiqueta));
      if (idx < 0 || idx + 1 >= window.length) return null;
      return window[idx + 1];
    };

    const capacidad = valorTras("Capacidad");
    const nivel = valorTras("Nivel");
    const volumen = valorTras("Volumen");
    const caudal = valorTras("Caudal");
    const pctIdx = window.findIndex((w) => w === "%" || /^%\s/.test(w));
    const pctRaw = pctIdx >= 0 && pctIdx + 1 < window.length ? window[pctIdx + 1] : null;

    const volumenEmbalsadoHm3 = parseNumEs(volumen);
    const volumenMaximoHm3 = parseNumEs(capacidad);
    const porcentajeLleno = parseNumEs(pctRaw);
    const cotaM = parseNumEs(nivel);
    const caudalSalida = parseNumEs(caudal);

    if (volumenEmbalsadoHm3 == null && porcentajeLleno == null) continue;

    return {
      fechaDato,
      volumenEmbalsadoHm3,
      volumenMaximoHm3,
      cotaM,
      caudalRecibido: null,
      caudalSalida,
      porcentajeLleno:
        porcentajeLleno ??
        (volumenEmbalsadoHm3 != null && volumenMaximoHm3
          ? (100 * volumenEmbalsadoHm3) / volumenMaximoHm3
          : null),
    };
  }

  return null;
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

async function obtenerPagina(url: string, debeContener: string): Promise<string> {
  const cached = cachePaginas.get(url);
  if (cached && Date.now() - cached.obtenidoEn < CACHE_MS) {
    return cached.texto;
  }

  const candidatos: string[] = [url];
  if (Platform.OS === "web") {
    candidatos.push(
      `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      `https://corsproxy.io/?${encodeURIComponent(url)}`
    );
  }

  let ultimoError: unknown = null;
  for (const candidato of candidatos) {
    try {
      const texto = await fetchConTimeout(candidato);
      if (texto && texto.toUpperCase().includes(debeContener.toUpperCase())) {
        cachePaginas.set(url, { texto, obtenidoEn: Date.now() });
        return texto;
      }
    } catch (err) {
      ultimoError = err;
    }
  }
  throw ultimoError ?? new Error(`Sin respuesta de ${url}`);
}

function urlsChgPara(nombre: string, urlPagina?: string): string[] {
  if (urlPagina) return [urlPagina];
  const n = normalizarNombre(nombre);
  // José Torán y Retortillo están en la página de zona Córdoba del SAIH CHG
  if (n.includes("TORAN") || n.includes("RETORTILLO") || n.startsWith("E54") || n.startsWith("E39")) {
    return [SAIH_CHG_CO_URL, SAIH_CHG_SE_URL];
  }
  return [SAIH_CHG_SE_URL, SAIH_CHG_CO_URL];
}

export async function getEstadoHidrologico(
  nombreSAIH: string | null | undefined,
  fichaId?: number,
  red: RedSaih = "chj",
  urlPagina?: string
): Promise<EstacionHidrologica | null> {
  if (!nombreSAIH) return null;

  const urlFallback =
    urlPagina ??
    (red === "chg"
      ? urlsChgPara(nombreSAIH)[0]
      : fichaId
        ? `https://saih.chj.es/embalses/${fichaId}`
        : SAIH_CHJ_URL);

  try {
    if (red === "chg") {
      let ultimoError: unknown = null;
      for (const url of urlsChgPara(nombreSAIH, urlPagina)) {
        try {
          const html = await obtenerPagina(url, "Capacidad");
          const datos = parsearEmbalseChg(html, nombreSAIH);
          if (!datos || (datos.porcentajeLleno == null && datos.volumenEmbalsadoHm3 == null)) {
            throw new Error("No se encontró el embalse en SAIH CHG");
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
            fuente: "saih_chg",
            urlFicha: url,
          };
        } catch (err) {
          ultimoError = err;
        }
      }
      throw ultimoError ?? new Error("Sin respuesta SAIH CHG");
    }

    const html = await obtenerPagina(SAIH_CHJ_URL, "EMBALSE");
    const datos = parsearEmbalseChj(html, nombreSAIH);
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
        (fichaId ? `https://saih.chj.es/embalses/${fichaId}` : SAIH_CHJ_URL),
    };
  } catch (err) {
    console.warn("No se pudo consultar el SAIH real, usando datos de ejemplo:", err);
    return datosSimulados(nombreSAIH, nombreSAIH, red, urlFallback);
  }
}

/** Resumen de embalses para el panel de Inicio (CHJ o CHG según cada fila). */
export async function getResumenEmbalses(
  estaciones: { nombre: string; fichaId?: number; etiqueta: string; red?: RedSaih; urlPagina?: string }[]
): Promise<{ etiqueta: string; nombre: string; estacion: EstacionHidrologica }[]> {
  const out: { etiqueta: string; nombre: string; estacion: EstacionHidrologica }[] = [];
  for (const e of estaciones) {
    const est = await getEstadoHidrologico(e.nombre, e.fichaId, e.red ?? "chj", e.urlPagina);
    if (est) out.push({ etiqueta: e.etiqueta, nombre: e.nombre, estacion: est });
  }
  return out;
}

/** @deprecated Usar getResumenEmbalses */
export async function getResumenEmbalsesCastellon(
  estaciones: { nombre: string; fichaId?: number; etiqueta: string; red?: RedSaih; urlPagina?: string }[]
): Promise<{ etiqueta: string; nombre: string; estacion: EstacionHidrologica }[]> {
  return getResumenEmbalses(estaciones);
}
