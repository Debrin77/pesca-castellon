/**
 * Avisos de seguridad para pescadores en Castellón.
 *
 * Fuentes:
 * 1) MeteoAlarm / AEMET — feed Atom CAP oficial europeo alimentado por AEMET
 *    https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-spain
 *    Sin API key. En web usamos proxy si CORS bloquea.
 * 2) Open-Meteo Flood API — caudal previsto vs media en Mijares y Palancia
 *    (señal de crecida; no sustituye a CHJ / Protección Civil).
 *
 * Prioriza tormentas eléctricas, lluvia intensa y crecidas.
 */

import { Platform } from "react-native";

export type SeveridadAviso = "amarillo" | "naranja" | "rojo";
export type TipoAviso = "tormenta" | "lluvia" | "crecida" | "viento" | "costero" | "otro";

export interface AvisoSeguridad {
  id: string;
  tipo: TipoAviso;
  severidad: SeveridadAviso;
  titulo: string;
  detalle: string;
  zona: string;
  fuente: "aemet_meteoalarm" | "caudal_modelo" | "meteo_local";
  url?: string;
  desde?: string | null;
  hasta?: string | null;
}

const FEED_METEOALARM = "https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-spain";

const ZONAS_CASTELLON =
  /castell[oó]n|maestrat|penyagolosa|ports|plana|vinar[oò]s|benicarl|oropesa|burriana|moncofa/i;

const EVENTOS_INTERES: { re: RegExp; tipo: TipoAviso }[] = [
  { re: /thunder|tormenta|lightning|rayo/i, tipo: "tormenta" },
  { re: /rain|lluvia|precipit/i, tipo: "lluvia" },
  { re: /flood|crecida|inundac|water\s*level/i, tipo: "crecida" },
  { re: /wind|viento|gale/i, tipo: "viento" },
  { re: /coast|costero|oleaje|marine|sea/i, tipo: "costero" },
];

function parseSeveridad(raw: string): SeveridadAviso | null {
  const s = raw.toLowerCase();
  if (s.includes("extreme") || s.includes("rojo") || s === "red") return "rojo";
  if (s.includes("severe") || s.includes("naranja") || s === "orange") return "naranja";
  if (s.includes("moderate") || s.includes("amarillo") || s === "yellow" || s.includes("minor")) {
    return "amarillo";
  }
  return null;
}

function traducirEvento(event: string, tipo: TipoAviso): string {
  if (tipo === "tormenta") return "Tormenta eléctrica";
  if (tipo === "lluvia") return "Lluvia intensa / riesgo de crecida";
  if (tipo === "crecida") return "Crecida / inundación";
  if (tipo === "viento") return "Viento fuerte";
  if (tipo === "costero") return "Fenómeno costero / oleaje";
  return event || "Aviso meteorológico";
}

function consejo(tipo: TipoAviso, sev: SeveridadAviso): string {
  if (tipo === "tormenta") {
    return sev === "amarillo"
      ? "Si oyes truenos: recoge la caña (es un pararrayos) y aléjate del agua abierta."
      : "No pesques: riesgo alto de rayos. Busca refugio sólido lejos de árboles aislados y crestas.";
  }
  if (tipo === "lluvia" || tipo === "crecida") {
    return "Tras lluvias en cabecera el caudal puede subir en minutos. No cruces vados ni te acerques a orillas socavadas.";
  }
  if (tipo === "viento") return "Cuidado con ramas, sedal y oleaje en orilla. Mejor cambiar de puesto o día.";
  if (tipo === "costero") return "Evita espigones y orillas expuestas con mar de fondo o aviso costero.";
  return "Consulta el aviso oficial antes de salir a pescar.";
}

function extraerTag(bloque: string, tag: string): string {
  const re = new RegExp(`<(?:cap:)?${tag}[^>]*>([^<]*)</(?:cap:)?${tag}>`, "i");
  const m = bloque.match(re);
  return m ? m[1].trim() : "";
}

function clasificarEvento(event: string): TipoAviso | null {
  for (const e of EVENTOS_INTERES) {
    if (e.re.test(event)) return e.tipo;
  }
  return null;
}

async function fetchTexto(url: string): Promise<string> {
  const candidatos =
    Platform.OS === "web"
      ? [
          url,
          `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
          `https://corsproxy.io/?${encodeURIComponent(url)}`,
        ]
      : [url];

  let ultimo: unknown = null;
  for (const u of candidatos) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 14000);
      const res = await fetch(u, { signal: ctrl.signal });
      clearTimeout(t);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const txt = await res.text();
      if (txt && txt.includes("<entry")) return txt;
    } catch (err) {
      ultimo = err;
    }
  }
  throw ultimo ?? new Error("Sin feed de avisos");
}

function parsearMeteoAlarm(xml: string): AvisoSeguridad[] {
  const out: AvisoSeguridad[] = [];
  const vistos = new Set<string>();
  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/gi) ?? [];

  for (const entry of entries) {
    const zona = extraerTag(entry, "areaDesc");
    if (!ZONAS_CASTELLON.test(zona)) continue;

    const event = extraerTag(entry, "event");
    const tipo = clasificarEvento(event);
    if (!tipo) continue;

    const sev = parseSeveridad(extraerTag(entry, "severity"));
    if (!sev) continue;

    const status = extraerTag(entry, "status") || "Actual";
    if (/test|draft|exercise/i.test(status)) continue;

    const expires = extraerTag(entry, "expires");
    if (expires) {
      const fin = Date.parse(expires);
      if (!Number.isNaN(fin) && fin < Date.now()) continue;
    }

    const id = extraerTag(entry, "identifier") || `${zona}-${event}-${expires}`;
    if (vistos.has(id)) continue;
    vistos.add(id);

    const urlMatch = entry.match(/href="(https:\/\/feeds\.meteoalarm\.org\/api\/v1\/warnings[^"]+)"/i);
    const webMatch = entry.match(/href="(https:\/\/meteoalarm\.org\?[^"]+)"/i);

    out.push({
      id,
      tipo,
      severidad: sev,
      titulo: traducirEvento(event, tipo),
      detalle: consejo(tipo, sev),
      zona,
      fuente: "aemet_meteoalarm",
      url: webMatch?.[1] ?? urlMatch?.[1] ?? "https://www.aemet.es/es/eltiempo/prediccion/avisos",
      desde: extraerTag(entry, "onset") || extraerTag(entry, "effective") || null,
      hasta: expires || null,
    });
  }

  const orden: Record<SeveridadAviso, number> = { rojo: 0, naranja: 1, amarillo: 2 };
  out.sort((a, b) => orden[a.severidad] - orden[b.severidad]);
  return out;
}

export async function obtenerAvisosMeteoAlarmCastellon(): Promise<AvisoSeguridad[]> {
  try {
    const xml = await fetchTexto(FEED_METEOALARM);
    return parsearMeteoAlarm(xml);
  } catch (err) {
    console.warn("No se pudieron cargar avisos MeteoAlarm/AEMET:", err);
    return [];
  }
}

type PuntoRio = { id: string; nombre: string; lat: number; lng: number };

const RIOS_SEGUIMIENTO: PuntoRio[] = [
  { id: "mijares_arenos", nombre: "Mijares (cabecera / Arenós)", lat: 40.05, lng: -0.35 },
  { id: "mijares_sichar", nombre: "Mijares (Sichar / Onda)", lat: 39.98, lng: -0.25 },
  { id: "palancia_regajo", nombre: "Palancia (Regajo)", lat: 39.9, lng: -0.55 },
];

async function caudalPunto(p: PuntoRio): Promise<AvisoSeguridad | null> {
  try {
    const url =
      `https://flood-api.open-meteo.com/v1/flood?latitude=${p.lat}&longitude=${p.lng}` +
      `&daily=river_discharge,river_discharge_mean,river_discharge_median,river_discharge_p75` +
      `&forecast_days=3&past_days=1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const d = data.daily;
    if (!d?.river_discharge?.length) return null;

    const idx = Math.min(1, d.time.length - 1);
    const q = Number(d.river_discharge[idx]);
    const mean = Number(d.river_discharge_mean?.[idx] ?? 0);
    const p75 = Number(d.river_discharge_p75?.[idx] ?? mean);
    if (!Number.isFinite(q) || q <= 0) return null;

    const base = Math.max(mean, p75, 0.05);
    const ratio = q / base;
    if (ratio < 2.5 && q < Math.max(p75 * 1.8, 5)) return null;

    const severidad: SeveridadAviso = ratio >= 6 || q >= 40 ? "naranja" : "amarillo";
    return {
      id: `caudal-${p.id}-${d.time[idx]}`,
      tipo: "crecida",
      severidad,
      titulo: `Caudal elevado · ${p.nombre}`,
      detalle: `Modelo ~${q.toFixed(2)} m³/s (media ~${mean.toFixed(2)}). Puede indicar crecida. Confirma en SAIH CHJ antes de pescar en el cauce.`,
      zona: p.nombre,
      fuente: "caudal_modelo",
      url: "https://saih.chj.es",
      desde: d.time[idx],
      hasta: null,
    };
  } catch (err) {
    console.warn("Caudal modelo falló", p.id, err);
    return null;
  }
}

export async function obtenerAvisosCaudal(): Promise<AvisoSeguridad[]> {
  const resultados = await Promise.all(RIOS_SEGUIMIENTO.map(caudalPunto));
  return resultados.filter((x): x is AvisoSeguridad => !!x);
}

export async function obtenerAvisosSeguridadPesca(): Promise<AvisoSeguridad[]> {
  const [meteo, caudal] = await Promise.all([
    obtenerAvisosMeteoAlarmCastellon(),
    obtenerAvisosCaudal(),
  ]);
  const all = [...meteo, ...caudal];
  const seen = new Set<string>();
  const out: AvisoSeguridad[] = [];
  for (const a of all) {
    const key = `${a.tipo}|${a.zona}|${a.severidad}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(a);
  }
  const orden: Record<SeveridadAviso, number> = { rojo: 0, naranja: 1, amarillo: 2 };
  out.sort((a, b) => orden[a.severidad] - orden[b.severidad]);
  return out;
}

export function colorSeveridad(s: SeveridadAviso): string {
  if (s === "rojo") return "#b42318";
  if (s === "naranja") return "#c45c12";
  return "#c4921a";
}

export function etiquetaSeveridad(s: SeveridadAviso): string {
  if (s === "rojo") return "ROJO";
  if (s === "naranja") return "NARANJA";
  return "AMARILLO";
}

export function formatearCuando(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 16);
  return d.toLocaleString("es-ES", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
