/**
 * Datos hidrológicos en tiempo real:
 * - SAIH Júcar (CHJ): https://saih.chj.es/embalses
 * - SAIH Guadalquivir (CHG): https://www.chguadalquivir.es/saih/
 *
 * Ninguna confederación publica API JSON estable: leemos HTML público.
 * En web, si CORS bloquea, usamos proxies de solo lectura.
 * Si falla la consulta, preferimos el último dato correcto persistido
 * (fuente «cache», con fecha) frente a un ejemplo simulado.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export type FuenteSaih = "saih_chj" | "saih_chg" | "cache" | "simulado";
export type RedSaih = "chj" | "chg";
export type NivelAforo = "ok" | "amarillo" | "naranja" | "rojo" | "fallo" | "sin_dato";

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

/** Estación de aforo fluvial (caudal en río). */
export interface EstacionAforo {
  id: string;
  nombre: string;
  rio: string | null;
  caudalM3s: number | null;
  umbralAmarillo: number | null;
  umbralNaranja: number | null;
  umbralRojo: number | null;
  fechaDato: string | null;
  estado: string | null;
  nivel: NivelAforo;
  fuente: FuenteSaih;
  urlFicha?: string;
}

const CLAVE_ULTIMO_EMBALSE = "@pesca_app/saih_ultimo_embalse_v1";
const CLAVE_ULTIMO_AFORO = "@pesca_app/saih_ultimo_aforo_v1";

type EmbalsePersistido = EstacionHidrologica & { guardadoEn: string };
type AforoPersistido = EstacionAforo & { guardadoEn: string };

function formatearGuardadoEn(iso: string): string {
  try {
    const t = new Date(iso);
    if (!Number.isFinite(t.getTime())) return iso;
    return t.toLocaleString("es-ES", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

/** Etiqueta corta de procedencia para chips/UI. */
export function etiquetaFuenteSaih(
  fuente: FuenteSaih | string | null | undefined,
  fechaDato?: string | null
): string {
  if (fuente === "saih_chj" || fuente === "saih_chg") return "en vivo";
  if (fuente === "cache") {
    return fechaDato ? `último · ${fechaDato}` : "último dato";
  }
  return "ejemplo / reintentar";
}

export function esFuenteSaihReal(fuente: FuenteSaih | string | null | undefined): boolean {
  return fuente === "saih_chj" || fuente === "saih_chg" || fuente === "cache";
}

async function leerMapaStorage<T>(clave: string): Promise<Record<string, T>> {
  try {
    const raw = await AsyncStorage.getItem(clave);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function guardarUltimoEmbalse(est: EstacionHidrologica): Promise<void> {
  if (est.fuente !== "saih_chj" && est.fuente !== "saih_chg") return;
  if (est.porcentajeLleno == null && est.volumenEmbalsadoHm3 == null && est.cotaM == null) return;
  try {
    const map = await leerMapaStorage<EmbalsePersistido>(CLAVE_ULTIMO_EMBALSE);
    map[est.id] = { ...est, guardadoEn: new Date().toISOString() };
    await AsyncStorage.setItem(CLAVE_ULTIMO_EMBALSE, JSON.stringify(map));
  } catch {
    /* almacenamiento opcional */
  }
}

async function leerUltimoEmbalse(
  id: string,
  urlFicha?: string
): Promise<EstacionHidrologica | null> {
  try {
    const map = await leerMapaStorage<EmbalsePersistido>(CLAVE_ULTIMO_EMBALSE);
    const prev = map[id];
    if (!prev) return null;
    if (prev.porcentajeLleno == null && prev.volumenEmbalsadoHm3 == null && prev.cotaM == null) {
      return null;
    }
    return {
      id: prev.id || id,
      nombre: prev.nombre || id,
      volumenEmbalsadoHm3: prev.volumenEmbalsadoHm3 ?? null,
      volumenMaximoHm3: prev.volumenMaximoHm3 ?? null,
      porcentajeLleno: prev.porcentajeLleno ?? null,
      caudalRecibido: prev.caudalRecibido ?? null,
      caudalSalida: prev.caudalSalida ?? null,
      cotaM: prev.cotaM ?? null,
      fechaDato: prev.fechaDato || (prev.guardadoEn ? formatearGuardadoEn(prev.guardadoEn) : null),
      fuente: "cache",
      urlFicha: prev.urlFicha ?? urlFicha,
    };
  } catch {
    return null;
  }
}

async function guardarUltimoAforo(est: EstacionAforo): Promise<void> {
  if (est.fuente !== "saih_chj" && est.fuente !== "saih_chg") return;
  if (est.caudalM3s == null && !est.estado) return;
  try {
    const map = await leerMapaStorage<AforoPersistido>(CLAVE_ULTIMO_AFORO);
    map[est.id] = { ...est, guardadoEn: new Date().toISOString() };
    await AsyncStorage.setItem(CLAVE_ULTIMO_AFORO, JSON.stringify(map));
  } catch {
    /* almacenamiento opcional */
  }
}

async function leerUltimoAforo(id: string, rio?: string): Promise<EstacionAforo | null> {
  try {
    const map = await leerMapaStorage<AforoPersistido>(CLAVE_ULTIMO_AFORO);
    const prev = map[id];
    if (!prev) return null;
    if (prev.caudalM3s == null && !prev.estado) return null;
    return {
      id: prev.id || id,
      nombre: prev.nombre || id,
      rio: prev.rio ?? rio ?? null,
      caudalM3s: prev.caudalM3s ?? null,
      umbralAmarillo: prev.umbralAmarillo ?? null,
      umbralNaranja: prev.umbralNaranja ?? null,
      umbralRojo: prev.umbralRojo ?? null,
      fechaDato: prev.fechaDato || (prev.guardadoEn ? formatearGuardadoEn(prev.guardadoEn) : null),
      estado: prev.estado ?? null,
      nivel: prev.nivel ?? "sin_dato",
      fuente: "cache",
      urlFicha: prev.urlFicha ?? SAIH_CHJ_AFOROS_URL,
    };
  } catch {
    return null;
  }
}

export interface ConsultaSaih {
  nombre: string;
  fichaId?: number;
  red?: RedSaih;
  urlPagina?: string;
}

const SAIH_CHJ_URL = "https://saih.chj.es/embalses";
const SAIH_CHJ_AFOROS_URL = "https://saih.chj.es/aforos";
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

function nivelDesdeUmbrales(
  caudal: number | null,
  ama: number | null,
  nar: number | null,
  rojo: number | null,
  estado: string | null
): NivelAforo {
  const est = (estado || "").toUpperCase();
  if (est.includes("FALLO") || est.includes("SIN DATO")) return "fallo";
  if (caudal == null) return "sin_dato";
  if (rojo != null && caudal >= rojo) return "rojo";
  if (nar != null && caudal >= nar) return "naranja";
  if (ama != null && caudal >= ama) return "amarillo";
  return "ok";
}

/**
 * Tabla saih.chj.es/aforos:
 * Punto | Variable | Último valor | Umbral amarillo/naranja/rojo | Fecha | Estado
 */
function parsearAforoChj(html: string, nombreAforo: string): Partial<EstacionAforo> | null {
  const objetivo = normalizarNombre(nombreAforo);
  const filas = html.match(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi) ?? [];
  let fallback: Partial<EstacionAforo> | null = null;

  for (const fila of filas) {
    const celdas = celdasDeFila(fila);
    if (celdas.length < 6) continue;
    const nombreFila = normalizarNombre(celdas[0] || "");
    if (!nombreFila || nombreFila === "PUNTO") continue;
    // Exacto primero; includes solo si el objetivo es suficientemente largo
    // (evita falsos positivos tipo "EA 5" dentro de otro código).
    const exacto = nombreFila === objetivo;
    const parcialMatch =
      !exacto &&
      objetivo.length >= 8 &&
      (nombreFila.includes(objetivo) || objetivo.includes(nombreFila));
    if (!exacto && !parcialMatch) continue;

    const caudalM3s = parseNum(celdas[2]);
    const umbralAmarillo = parseNum(celdas[3]);
    const umbralNaranja = parseNum(celdas[4]);
    const umbralRojo = parseNum(celdas[5]);
    const fechaDato = celdas[6] || null;
    const estado = celdas[7] || null;
    const rio = celdas[1] ? celdas[1].replace(/^CAUDAL\s+/i, "").trim() : null;

    const datos: Partial<EstacionAforo> = {
      rio,
      caudalM3s,
      umbralAmarillo,
      umbralNaranja,
      umbralRojo,
      fechaDato,
      estado,
      nivel: nivelDesdeUmbrales(caudalM3s, umbralAmarillo, umbralNaranja, umbralRojo, estado),
      urlFicha: SAIH_CHJ_AFOROS_URL,
    };
    if (exacto) return datos;
    if (!fallback) fallback = datos;
  }
  return fallback;
}

function aforoSimulado(nombre: string, rio?: string): EstacionAforo {
  const seed = nombre.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const caudalM3s = Number(((seed % 40) / 10).toFixed(2));
  return {
    id: nombre,
    nombre,
    rio: rio ?? null,
    caudalM3s,
    umbralAmarillo: 20,
    umbralNaranja: 50,
    umbralRojo: 100,
    fechaDato: null,
    estado: null,
    nivel: "ok",
    fuente: "simulado",
    urlFicha: SAIH_CHJ_AFOROS_URL,
  };
}

async function aforoOCacheOEjemplo(nombreAforo: string, rio?: string): Promise<EstacionAforo> {
  const cached = await leerUltimoAforo(nombreAforo, rio);
  if (cached) return cached;
  return aforoSimulado(nombreAforo, rio);
}

export async function getEstadoAforo(
  nombreAforo: string,
  rio?: string
): Promise<EstacionAforo | null> {
  if (!nombreAforo) return null;
  try {
    const html = await obtenerPagina(SAIH_CHJ_AFOROS_URL, "CAUDAL");
    const datos = parsearAforoChj(html, nombreAforo);
    if (!datos || (datos.caudalM3s == null && !datos.estado)) {
      throw new Error("No se encontró el aforo en SAIH CHJ");
    }
    const vivo: EstacionAforo = {
      id: nombreAforo,
      nombre: nombreAforo,
      rio: datos.rio ?? rio ?? null,
      caudalM3s: datos.caudalM3s ?? null,
      umbralAmarillo: datos.umbralAmarillo ?? null,
      umbralNaranja: datos.umbralNaranja ?? null,
      umbralRojo: datos.umbralRojo ?? null,
      fechaDato: datos.fechaDato ?? null,
      estado: datos.estado ?? null,
      nivel: datos.nivel ?? "sin_dato",
      fuente: "saih_chj",
      urlFicha: SAIH_CHJ_AFOROS_URL,
    };
    await guardarUltimoAforo(vivo);
    return vivo;
  } catch (err) {
    console.warn("No se pudo consultar aforo SAIH; último dato o ejemplo:", err);
    return aforoOCacheOEjemplo(nombreAforo, rio);
  }
}

/** Resumen de aforos fluviales para el panel de Inicio (CHJ). */
export async function getResumenAforos(
  estaciones: { nombre: string; etiqueta: string; rio?: string }[]
): Promise<{ etiqueta: string; nombre: string; estacion: EstacionAforo }[]> {
  if (!estaciones.length) return [];
  // Una sola descarga HTML para todos los aforos.
  let html: string | null = null;
  try {
    html = await obtenerPagina(SAIH_CHJ_AFOROS_URL, "CAUDAL");
  } catch (err) {
    console.warn("SAIH aforos no disponible:", err);
  }

  const out: { etiqueta: string; nombre: string; estacion: EstacionAforo }[] = [];
  for (const e of estaciones) {
    if (html) {
      const datos = parsearAforoChj(html, e.nombre);
      if (datos && (datos.caudalM3s != null || datos.estado)) {
        const vivo: EstacionAforo = {
          id: e.nombre,
          nombre: e.nombre,
          rio: datos.rio ?? e.rio ?? null,
          caudalM3s: datos.caudalM3s ?? null,
          umbralAmarillo: datos.umbralAmarillo ?? null,
          umbralNaranja: datos.umbralNaranja ?? null,
          umbralRojo: datos.umbralRojo ?? null,
          fechaDato: datos.fechaDato ?? null,
          estado: datos.estado ?? null,
          nivel: datos.nivel ?? "sin_dato",
          fuente: "saih_chj",
          urlFicha: SAIH_CHJ_AFOROS_URL,
        };
        await guardarUltimoAforo(vivo);
        out.push({
          etiqueta: e.etiqueta,
          nombre: e.nombre,
          estacion: vivo,
        });
        continue;
      }
    }
    out.push({
      etiqueta: e.etiqueta,
      nombre: e.nombre,
      estacion: await aforoOCacheOEjemplo(e.nombre, e.rio),
    });
  }
  return out;
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
          const vivo: EstacionHidrologica = {
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
          await guardarUltimoEmbalse(vivo);
          return vivo;
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

    const vivo: EstacionHidrologica = {
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
    await guardarUltimoEmbalse(vivo);
    return vivo;
  } catch (err) {
    console.warn("No se pudo consultar el SAIH real; último dato o ejemplo:", err);
    const cached = await leerUltimoEmbalse(nombreSAIH, urlFallback);
    if (cached) return cached;
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
