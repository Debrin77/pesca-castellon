import { calcularFaseLunar } from "./moonService";
import { calcularSolunarDia, DiaSolunar } from "./solunarService";

export type CategoriaPesca = "excelente" | "buena" | "regular" | "mala";

export interface FranjaIndice {
  inicio: string; // HH:mm
  fin: string;
  puntuacion: number; // 0–100 relativa
  etiqueta: string;
}

export interface IndicePescaDia {
  fecha: string; // ISO yyyy-mm-dd
  puntuacion: number; // 0-100
  categoria: CategoriaPesca;
  presionMediaHPa: number;
  tendenciaPresion: "bajando_fuerte" | "bajando" | "estable" | "subiendo" | "subiendo_fuerte";
  nubosidadPromedio: number; // %
  vientoMaxKmh: number;
  probabilidadLluvia: number;
  faseLunar: string;
  iconoLuna: string;
  desglose: string[]; // motivos, para mostrar "por qué" en la UI
  /** Media diaria del aire (°C). */
  tempMediaC?: number;
  /** Agua (°C): SST marina si la malla está cerca; si no, suelo como proxy. */
  tempAguaC?: number | null;
  fuenteTempAgua?: "mar" | "suelo" | null;
  mejorFranjaInicio?: string;
  mejorFranjaFin?: string;
  franjas?: FranjaIndice[];
}

/**
 * Reparto de puntos (máx. 100). Modelo enriquecido:
 * - Presión en descenso (máx. 22)
 * - Temperatura del aire en rango de actividad (máx. 16)
 * - Temperatura del agua / proxy (máx. 12)
 * - Nubosidad moderada-alta (máx. 14)
 * - Viento suave (máx. 14)
 * - Lluvia ligera (máx. 10)
 * - Fase lunar + fuerza solunar del día (máx. 12)
 *
 * Además calcula franjas horarias (meteo + ventanas solunar).
 *
 * IMPORTANTE: heurística orientativa, no predicción científica exacta.
 */

export function puntuarPresion(
  tendenciaHPa: number,
  media: number
): { puntos: number; motivo: string; tendencia: IndicePescaDia["tendenciaPresion"] } {
  if (tendenciaHPa <= -2) {
    return {
      puntos: 22,
      motivo: "Presión en descenso pronunciado: suele disparar la actividad antes de un cambio de tiempo",
      tendencia: "bajando_fuerte",
    };
  }
  if (tendenciaHPa <= -0.5) {
    return {
      puntos: 18,
      motivo: "Presión bajando suavemente: condición clásicamente favorable",
      tendencia: "bajando",
    };
  }
  if (tendenciaHPa < 0.5) {
    const enRangoIdeal = media >= 1010 && media <= 1025;
    return {
      puntos: enRangoIdeal ? 15 : 10,
      motivo: enRangoIdeal
        ? "Presión estable en un rango habitual"
        : "Presión estable, aunque algo fuera del rango más típico",
      tendencia: "estable",
    };
  }
  if (tendenciaHPa < 2) {
    return { puntos: 7, motivo: "Presión subiendo: puede frenar algo la actividad", tendencia: "subiendo" };
  }
  return {
    puntos: 3,
    motivo: "Presión en ascenso fuerte: suele ser la condición menos favorable",
    tendencia: "subiendo_fuerte",
  };
}

export function puntuarTemperaturaAire(mediaC: number): { puntos: number; motivo: string } {
  if (mediaC >= 14 && mediaC <= 24) {
    return {
      puntos: 16,
      motivo: `Temperatura del aire agradable (${Math.round(mediaC)}°): buen ritmo metabólico y de pesca`,
    };
  }
  if (mediaC >= 10 && mediaC < 14) {
    return { puntos: 12, motivo: `Aire fresco (${Math.round(mediaC)}°): correcto, mejor en horas centrales` };
  }
  if (mediaC > 24 && mediaC <= 29) {
    return { puntos: 11, motivo: `Aire cálido (${Math.round(mediaC)}°): prioriza orto, ocaso y sombra` };
  }
  if (mediaC >= 5 && mediaC < 10) {
    return { puntos: 7, motivo: `Aire frío (${Math.round(mediaC)}°): actividad más lenta` };
  }
  if (mediaC > 29 && mediaC <= 34) {
    return { puntos: 6, motivo: `Mucho calor (${Math.round(mediaC)}°): rinde menos al mediodía` };
  }
  return {
    puntos: 3,
    motivo: `Temperatura extrema (${Math.round(mediaC)}°): condiciones poco favorables`,
  };
}

export function puntuarTemperaturaAgua(
  tempC: number | null,
  fuente: IndicePescaDia["fuenteTempAgua"]
): { puntos: number; motivo: string } {
  if (tempC == null || !fuente) {
    return { puntos: 6, motivo: "Sin dato cercano de temperatura del agua: peso neutro" };
  }
  const etiqueta = fuente === "mar" ? "agua de mar" : "proxy superficial (suelo)";
  if (tempC >= 14 && tempC <= 22) {
    return {
      puntos: 12,
      motivo: `${etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1)} en rango óptimo (${Math.round(tempC)}°)`,
    };
  }
  if (tempC >= 11 && tempC < 14) {
    return { puntos: 9, motivo: `${etiqueta} fresca (${Math.round(tempC)}°): aceptable` };
  }
  if (tempC > 22 && tempC <= 26) {
    return { puntos: 8, motivo: `${etiqueta} cálida (${Math.round(tempC)}°): busca oxigenación y sombra` };
  }
  if (tempC >= 7 && tempC < 11) {
    return { puntos: 5, motivo: `${etiqueta} fría (${Math.round(tempC)}°): metabolismo bajo` };
  }
  if (tempC > 26 && tempC <= 30) {
    return { puntos: 4, motivo: `${etiqueta} muy cálida (${Math.round(tempC)}°)` };
  }
  return { puntos: 2, motivo: `${etiqueta} fuera de rango cómodo (${Math.round(tempC)}°)` };
}

export function puntuarNubosidad(pct: number): { puntos: number; motivo: string } {
  if (pct >= 40 && pct <= 85) {
    return { puntos: 14, motivo: "Cielo parcialmente nublado: los peces se acercan más a superficie y orillas" };
  }
  if (pct < 20) {
    return { puntos: 5, motivo: "Cielo muy despejado: suele ser más difícil, sobre todo en horas centrales" };
  }
  if (pct > 85) {
    return { puntos: 9, motivo: "Cielo muy cubierto (revisa que no haya tormenta prevista)" };
  }
  return { puntos: 11, motivo: "Nubosidad moderada" };
}

export function puntuarViento(kmh: number): { puntos: number; motivo: string } {
  if (kmh < 5) return { puntos: 7, motivo: "Viento en calma: sin el efecto oxigenante de una brisa suave" };
  if (kmh <= 15) return { puntos: 14, motivo: "Viento suave: agita la superficie y oxigena el agua, favorable" };
  if (kmh <= 25) return { puntos: 9, motivo: "Viento moderado" };
  return { puntos: 3, motivo: "Viento fuerte: tiende a dispersar los peces" };
}

export function puntuarLluvia(probabilidad: number): { puntos: number; motivo: string } {
  if (probabilidad >= 15 && probabilidad <= 55) {
    return { puntos: 10, motivo: "Probabilidad de lluvia ligera: reduce la visibilidad para el pez, favorable" };
  }
  if (probabilidad < 15) return { puntos: 7, motivo: "Sin lluvia relevante prevista" };
  return { puntos: 4, motivo: "Alta probabilidad de lluvia intensa/tormenta" };
}

export function puntuarLunaSolunar(
  distanciaANuevaOLlena: number,
  fuerzaSolunar: number
): { puntos: number; motivo: string } {
  const baseFase = distanciaANuevaOLlena <= 0.06 ? 8 : distanciaANuevaOLlena <= 0.15 ? 5 : 2;
  const extra = Math.round(Math.max(0, Math.min(4, ((fuerzaSolunar - 35) / 63) * 4)));
  const puntos = Math.min(12, baseFase + extra);
  if (distanciaANuevaOLlena <= 0.06) {
    return {
      puntos,
      motivo: "Luna nueva o llena + ventanas solunar fuertes (peso moderado; evidencia mixta)",
    };
  }
  if (distanciaANuevaOLlena <= 0.15) {
    return { puntos, motivo: "Cerca de luna nueva o llena; solunar aporta un plus menor" };
  }
  return { puntos, motivo: "Fase lunar intermedia: el solunar ayuda poco al índice del día" };
}

function categorizar(puntuacion: number): CategoriaPesca {
  if (puntuacion >= 75) return "excelente";
  if (puntuacion >= 55) return "buena";
  if (puntuacion >= 35) return "regular";
  return "mala";
}

function distanciaKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function media(valores: number[]): number | null {
  const ok = valores.filter((v) => typeof v === "number" && Number.isFinite(v));
  if (!ok.length) return null;
  return ok.reduce((s, v) => s + v, 0) / ok.length;
}

interface DiaAgregado {
  fecha: string;
  presionMedia: number;
  nubosidadMedia: number;
  tempMedia: number;
  sueloMedia: number | null;
}

function agregarPorDia(
  horas: string[],
  presiones: number[],
  nubes: number[],
  temps: number[],
  suelos: (number | null)[]
): Record<string, DiaAgregado> {
  const acumulado: Record<
    string,
    { sumaPresion: number; sumaNubes: number; sumaTemp: number; sumaSuelo: number; n: number; nSuelo: number }
  > = {};
  horas.forEach((h, i) => {
    const fecha = h.slice(0, 10);
    if (!acumulado[fecha]) {
      acumulado[fecha] = { sumaPresion: 0, sumaNubes: 0, sumaTemp: 0, sumaSuelo: 0, n: 0, nSuelo: 0 };
    }
    const a = acumulado[fecha];
    a.sumaPresion += presiones[i];
    a.sumaNubes += nubes[i];
    a.sumaTemp += temps[i];
    a.n += 1;
    const s = suelos[i];
    if (typeof s === "number" && Number.isFinite(s)) {
      a.sumaSuelo += s;
      a.nSuelo += 1;
    }
  });
  const resultado: Record<string, DiaAgregado> = {};
  for (const fecha in acumulado) {
    const a = acumulado[fecha];
    resultado[fecha] = {
      fecha,
      presionMedia: a.sumaPresion / a.n,
      nubosidadMedia: a.sumaNubes / a.n,
      tempMedia: a.sumaTemp / a.n,
      sueloMedia: a.nSuelo ? a.sumaSuelo / a.nSuelo : null,
    };
  }
  return resultado;
}

function horaAMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(":").map((x) => parseInt(x, 10));
  return h * 60 + (m || 0);
}

function minutosAHora(m: number): string {
  const x = ((m % 1440) + 1440) % 1440;
  const hh = Math.floor(x / 60);
  const mm = x % 60;
  return `${hh < 10 ? "0" : ""}${hh}:${mm < 10 ? "0" : ""}${mm}`;
}

function enVentanaSolunar(minDia: number, solunar: DiaSolunar): "mayor" | "menor" | null {
  for (const v of solunar.ventanas) {
    const ini = horaAMinutos(v.inicio);
    let fin = horaAMinutos(v.fin);
    if (fin < ini) fin += 1440;
    let t = minDia;
    if (t < ini) t += 1440;
    if (t >= ini && t <= fin) return v.tipo;
  }
  return null;
}

/** Puntuación horaria relativa (0–100) para ordenar franjas del día. */
export function puntuarHoraRelativa(opts: {
  tempC: number;
  nubes: number;
  viento: number;
  lluvia: number;
  tipoSolunar: "mayor" | "menor" | null;
  cercaOrtoOcaso: boolean;
}): number {
  let s = 40;
  const t = opts.tempC;
  if (t >= 14 && t <= 24) s += 18;
  else if (t >= 10 && t <= 28) s += 10;
  else s += 2;

  if (opts.nubes >= 40 && opts.nubes <= 85) s += 14;
  else if (opts.nubes < 20) s += 4;
  else s += 9;

  if (opts.viento >= 5 && opts.viento <= 15) s += 12;
  else if (opts.viento <= 25) s += 7;
  else s += 2;

  if (opts.lluvia >= 15 && opts.lluvia <= 55) s += 8;
  else if (opts.lluvia < 15) s += 5;
  else s += 1;

  if (opts.tipoSolunar === "mayor") s += 14;
  else if (opts.tipoSolunar === "menor") s += 8;

  if (opts.cercaOrtoOcaso) s += 6;

  return Math.max(5, Math.min(98, Math.round(s)));
}

function construirFranjas(opts: {
  fecha: string;
  horas: string[];
  temps: number[];
  nubes: number[];
  vientos: number[];
  lluvias: number[];
  lat: number;
  sunriseIso?: string | null;
  sunsetIso?: string | null;
}): { franjas: FranjaIndice[]; mejorInicio: string; mejorFin: string } {
  const solunar = calcularSolunarDia(opts.fecha, opts.lat);
  const sunriseMin = opts.sunriseIso ? horaAMinutos(opts.sunriseIso.slice(11, 16)) : 7 * 60;
  const sunsetMin = opts.sunsetIso ? horaAMinutos(opts.sunsetIso.slice(11, 16)) : 20 * 60;

  const porHora: { min: number; hora: string; score: number }[] = [];
  for (let i = 0; i < opts.horas.length; i++) {
    if (!opts.horas[i].startsWith(opts.fecha)) continue;
    const hora = opts.horas[i].slice(11, 16);
    const min = horaAMinutos(hora);
    const tipo = enVentanaSolunar(min, solunar);
    const cercaOrtoOcaso = Math.abs(min - sunriseMin) <= 90 || Math.abs(min - sunsetMin) <= 90;
    const score = puntuarHoraRelativa({
      tempC: opts.temps[i],
      nubes: opts.nubes[i],
      viento: opts.vientos[i],
      lluvia: opts.lluvias[i] ?? 0,
      tipoSolunar: tipo,
      cercaOrtoOcaso,
    });
    porHora.push({ min, hora, score });
  }

  if (!porHora.length) {
    return {
      franjas: [],
      mejorInicio: solunar.mejorHoraInicio,
      mejorFin: solunar.mejorHoraFin,
    };
  }

  let bestIdx = 0;
  let bestAvg = -1;
  for (let i = 0; i < porHora.length; i++) {
    const slice = porHora.slice(i, i + 3);
    if (slice.length < 2) continue;
    const avg = slice.reduce((s, x) => s + x.score, 0) / slice.length;
    if (avg > bestAvg) {
      bestAvg = avg;
      bestIdx = i;
    }
  }
  const bloque = porHora.slice(bestIdx, bestIdx + 3);
  const mejorInicio = bloque[0]?.hora ?? solunar.mejorHoraInicio;
  const ultimo = bloque[bloque.length - 1];
  const mejorFin = ultimo ? minutosAHora(ultimo.min + 60) : solunar.mejorHoraFin;

  const top = [...porHora].sort((a, b) => b.score - a.score).slice(0, 3);
  const franjas: FranjaIndice[] = top.map((h, idx) => {
    const tipo = enVentanaSolunar(h.min, solunar);
    const etiqueta =
      idx === 0
        ? tipo === "mayor"
          ? "Mejor franja (meteo + solunar mayor)"
          : tipo === "menor"
            ? "Mejor franja (meteo + solunar menor)"
            : "Mejor franja meteo"
        : tipo
          ? `Alternativa · solunar ${tipo}`
          : "Alternativa";
    return {
      inicio: h.hora,
      fin: minutosAHora(h.min + 60),
      puntuacion: h.score,
      etiqueta,
    };
  });

  return { franjas, mejorInicio, mejorFin };
}

async function fetchJson(url: string, signal?: AbortSignal): Promise<any | null> {
  try {
    const res = await fetch(url, signal ? { signal } : undefined);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

const TTL_INDICE_MS = 5 * 60 * 1000;
const memoIndice = new Map<string, { at: number; data: IndicePescaDia[] }>();

function claveIndice(lat: number, lng: number, dias: number): string {
  return `${lat.toFixed(2)},${lng.toFixed(2)}:${dias}`;
}

/** Distancia máx. (km) para aceptar SST de la malla marina de Open-Meteo. */
const MAX_KM_SST = 45;

export async function calcularIndicePesca(lat: number, lng: number, dias: number = 3): Promise<IndicePescaDia[]> {
  const clave = claveIndice(lat, lng, dias);
  const hit = memoIndice.get(clave);
  if (hit && Date.now() - hit.at < TTL_INDICE_MS) return hit.data;

  try {
    const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), 10_000) : null;
    const signal = ctrl?.signal;

    const forecastUrl =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&hourly=surface_pressure,cloudcover,temperature_2m,precipitation_probability,windspeed_10m,soil_temperature_0cm` +
      `&daily=windspeed_10m_max,precipitation_probability_max,temperature_2m_max,temperature_2m_min,sunrise,sunset` +
      `&past_days=1&forecast_days=${dias}&timezone=auto`;

    const marineUrl =
      `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}` +
      `&hourly=sea_surface_temperature&past_days=1&forecast_days=${dias}&timezone=auto`;

    const [forecast, marine] = await Promise.all([
      fetchJson(forecastUrl, signal),
      fetchJson(marineUrl, signal),
    ]);
    if (timer) clearTimeout(timer);
    if (!forecast?.hourly?.time || !forecast?.daily?.time) {
      throw new Error("Open-Meteo sin datos de previsión");
    }

    const h = forecast.hourly;
    const suelos: (number | null)[] = (h.soil_temperature_0cm ?? []).map((v: number | null) =>
      typeof v === "number" && Number.isFinite(v) ? v : null
    );
    const porDia = agregarPorDia(h.time, h.surface_pressure, h.cloudcover, h.temperature_2m, suelos);
    const fechasOrdenadas = Object.keys(porDia).sort();

    const sstPorDia: Record<string, number> = {};
    if (marine?.hourly?.time && marine?.hourly?.sea_surface_temperature) {
      const mLat = typeof marine.latitude === "number" ? marine.latitude : lat;
      const mLng = typeof marine.longitude === "number" ? marine.longitude : lng;
      if (distanciaKm(lat, lng, mLat, mLng) <= MAX_KM_SST) {
        const buckets: Record<string, number[]> = {};
        marine.hourly.time.forEach((iso: string, i: number) => {
          const v = marine.hourly.sea_surface_temperature[i];
          if (typeof v !== "number" || !Number.isFinite(v)) return;
          const fecha = iso.slice(0, 10);
          if (!buckets[fecha]) buckets[fecha] = [];
          buckets[fecha].push(v);
        });
        for (const fecha of Object.keys(buckets)) {
          const m = media(buckets[fecha]);
          if (m != null) sstPorDia[fecha] = m;
        }
      }
    }

    const resultado: IndicePescaDia[] = [];

    for (let i = 0; i < forecast.daily.time.length; i++) {
      const fecha: string = forecast.daily.time[i];
      const hoy = porDia[fecha];
      const idxEnOrdenadas = fechasOrdenadas.indexOf(fecha);
      const ayer = idxEnOrdenadas > 0 ? porDia[fechasOrdenadas[idxEnOrdenadas - 1]] : null;
      if (!hoy) continue;

      const tendenciaHPa = ayer ? hoy.presionMedia - ayer.presionMedia : 0;
      const viento = forecast.daily.windspeed_10m_max[i];
      const lluvia = forecast.daily.precipitation_probability_max?.[i] ?? 0;
      const luna = calcularFaseLunar(new Date(fecha + "T12:00:00"));
      const solunar = calcularSolunarDia(fecha, lat);
      const fuerzaSolunar = solunar.ventanas[0]?.puntuacion ?? 50;

      let fuenteTempAgua: IndicePescaDia["fuenteTempAgua"] = null;
      let tempAguaC: number | null = null;
      if (sstPorDia[fecha] != null) {
        tempAguaC = sstPorDia[fecha];
        fuenteTempAgua = "mar";
      } else if (hoy.sueloMedia != null) {
        tempAguaC = hoy.sueloMedia;
        fuenteTempAgua = "suelo";
      }

      const rPresion = puntuarPresion(tendenciaHPa, hoy.presionMedia);
      const rTempAire = puntuarTemperaturaAire(hoy.tempMedia);
      const rTempAgua = puntuarTemperaturaAgua(tempAguaC, fuenteTempAgua);
      const rNubes = puntuarNubosidad(hoy.nubosidadMedia);
      const rViento = puntuarViento(viento);
      const rLluvia = puntuarLluvia(lluvia);
      const rLuna = puntuarLunaSolunar(luna.distanciaANuevaOLlena, fuerzaSolunar);

      const puntuacion = Math.round(
        rPresion.puntos +
          rTempAire.puntos +
          rTempAgua.puntos +
          rNubes.puntos +
          rViento.puntos +
          rLluvia.puntos +
          rLuna.puntos
      );

      const { franjas, mejorInicio, mejorFin } = construirFranjas({
        fecha,
        horas: h.time,
        temps: h.temperature_2m,
        nubes: h.cloudcover,
        vientos: h.windspeed_10m,
        lluvias: h.precipitation_probability ?? [],
        lat,
        sunriseIso: forecast.daily.sunrise?.[i] ?? null,
        sunsetIso: forecast.daily.sunset?.[i] ?? null,
      });

      resultado.push({
        fecha,
        puntuacion,
        categoria: categorizar(puntuacion),
        presionMediaHPa: Math.round(hoy.presionMedia * 10) / 10,
        tendenciaPresion: rPresion.tendencia,
        nubosidadPromedio: Math.round(hoy.nubosidadMedia),
        vientoMaxKmh: Math.round(viento),
        probabilidadLluvia: lluvia,
        faseLunar: luna.nombre,
        iconoLuna: luna.icono,
        desglose: [
          rPresion.motivo,
          rTempAire.motivo,
          rTempAgua.motivo,
          rNubes.motivo,
          rViento.motivo,
          rLluvia.motivo,
          rLuna.motivo,
          mejorInicio && mejorFin
            ? `Mejor franja orientativa: ${mejorInicio}–${mejorFin}`
            : "Sin franja horaria disponible",
        ],
        tempMediaC: Math.round(hoy.tempMedia * 10) / 10,
        tempAguaC: tempAguaC != null ? Math.round(tempAguaC * 10) / 10 : null,
        fuenteTempAgua,
        mejorFranjaInicio: mejorInicio,
        mejorFranjaFin: mejorFin,
        franjas,
      });
    }

    memoIndice.set(clave, { at: Date.now(), data: resultado });
    return resultado;
  } catch (err) {
    console.warn("Error calculando índice de pesca:", err);
    return hit?.data ?? [];
  }
}

export const CATEGORIA_INFO: Record<
  CategoriaPesca,
  { icono: string; texto: string; color: string; fondo: string }
> = {
  excelente: { icono: "●", texto: "Excelente", color: "#0f5a26", fondo: "#d8f0e0" },
  buena: { icono: "●", texto: "Buena", color: "#6b4400", fondo: "#f6e7b8" },
  regular: { icono: "●", texto: "Regular", color: "#8a2e0e", fondo: "#fde8d4" },
  mala: { icono: "●", texto: "Mala", color: "#8a0f30", fondo: "#fad4d8" },
};
