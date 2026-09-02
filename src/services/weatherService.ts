/**
 * Servicio de climatología usando Open-Meteo (https://open-meteo.com),
 * una API pública gratuita que no requiere clave de API.
 */

export interface ClimaActual {
  temperatura: number;
  sensacionTermica: number;
  velocidadVientoKmh: number;
  codigoTiempo: number;
  esDeDia: boolean;
}

export interface PrevisionDia {
  fecha: string; // ISO yyyy-mm-dd
  codigoTiempo: number;
  tempMax: number;
  tempMin: number;
  probabilidadLluvia: number | null;
  vientoMaxKmh: number | null;
}

/** Traduce el código WMO de Open-Meteo a icono + texto en español. */
export function descripcionTiempo(codigo: number): { icono: string; texto: string } {
  const mapa: Record<number, { icono: string; texto: string }> = {
    0: { icono: "☀️", texto: "Cielo despejado" },
    1: { icono: "🌤️", texto: "Mayormente despejado" },
    2: { icono: "⛅", texto: "Parcialmente nublado" },
    3: { icono: "☁️", texto: "Nublado" },
    45: { icono: "🌫️", texto: "Niebla" },
    48: { icono: "🌫️", texto: "Niebla helada" },
    51: { icono: "🌦️", texto: "Llovizna ligera" },
    53: { icono: "🌦️", texto: "Llovizna" },
    55: { icono: "🌧️", texto: "Llovizna intensa" },
    61: { icono: "🌧️", texto: "Lluvia ligera" },
    63: { icono: "🌧️", texto: "Lluvia" },
    65: { icono: "🌧️", texto: "Lluvia intensa" },
    71: { icono: "🌨️", texto: "Nieve ligera" },
    73: { icono: "🌨️", texto: "Nieve" },
    75: { icono: "❄️", texto: "Nieve intensa" },
    80: { icono: "🌦️", texto: "Chubascos ligeros" },
    81: { icono: "🌧️", texto: "Chubascos" },
    82: { icono: "⛈️", texto: "Chubascos fuertes" },
    95: { icono: "⛈️", texto: "Tormenta" },
    96: { icono: "⛈️", texto: "Tormenta con granizo" },
    99: { icono: "⛈️", texto: "Tormenta fuerte con granizo" },
  };
  return mapa[codigo] ?? { icono: "🌡️", texto: "Sin datos" };
}

export async function obtenerClimaActual(lat: number, lng: number): Promise<ClimaActual | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Open-Meteo respondió ${res.status}`);
    const data = await res.json();
    const cw = data.current_weather;
    return {
      temperatura: cw.temperature,
      sensacionTermica: cw.temperature, // open-meteo current_weather no da sensación térmica aparte
      velocidadVientoKmh: cw.windspeed,
      codigoTiempo: cw.weathercode,
      esDeDia: cw.is_day === 1,
    };
  } catch (err) {
    console.warn("Error obteniendo clima actual:", err);
    return null;
  }
}

export interface AlertaMeteo {
  nivel: "aviso" | "peligro";
  icono: string;
  texto: string;
}

/**
 * Detecta condiciones meteorológicas destacables a partir de los datos
 * ya disponibles (viento, código de tiempo, probabilidad de lluvia,
 * temperaturas). Umbrales orientativos, no son avisos oficiales de AEMET.
 */
export function detectarAlertas(datos: {
  codigoTiempo?: number;
  vientoMaxKmh?: number | null;
  probabilidadLluvia?: number | null;
  tempMax?: number;
  tempMin?: number;
}): AlertaMeteo[] {
  const alertas: AlertaMeteo[] = [];

  if (datos.vientoMaxKmh !== undefined && datos.vientoMaxKmh !== null) {
    if (datos.vientoMaxKmh > 50) {
      alertas.push({ nivel: "peligro", icono: "🌬️", texto: `Viento muy fuerte (${Math.round(datos.vientoMaxKmh)} km/h)` });
    } else if (datos.vientoMaxKmh > 35) {
      alertas.push({ nivel: "aviso", icono: "🌬️", texto: `Viento fuerte (${Math.round(datos.vientoMaxKmh)} km/h)` });
    }
  }

  if (datos.codigoTiempo !== undefined && [95, 96, 99].includes(datos.codigoTiempo)) {
    alertas.push({ nivel: "peligro", icono: "⛈️", texto: "Tormenta prevista" });
  }

  if (datos.probabilidadLluvia !== undefined && datos.probabilidadLluvia !== null && datos.probabilidadLluvia > 80) {
    alertas.push({ nivel: "aviso", icono: "🌧️", texto: "Alta probabilidad de lluvia intensa" });
  }

  if (datos.tempMax !== undefined && datos.tempMax > 38) {
    alertas.push({ nivel: "aviso", icono: "🌡️", texto: `Calor extremo (${Math.round(datos.tempMax)}°C)` });
  }

  if (datos.tempMin !== undefined && datos.tempMin < 0) {
    alertas.push({ nivel: "aviso", icono: "❄️", texto: "Riesgo de heladas" });
  }

  return alertas;
}

export interface PrevisionHora {
  fecha: string;
  hora: string;
  codigoTiempo: number;
  temperatura: number;
  probabilidadLluvia: number | null;
}

export async function obtenerHorario(lat: number, lng: number, dias: number = 7): Promise<PrevisionHora[]> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&hourly=temperature_2m,weathercode,precipitation_probability` +
      `&timezone=auto&forecast_days=${dias}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Open-Meteo respondió ${res.status}`);
    const data = await res.json();
    const h = data.hourly;
    return h.time.map((iso: string, i: number) => ({
      fecha: iso.slice(0, 10),
      hora: iso.slice(11, 16),
      codigoTiempo: h.weathercode[i],
      temperatura: h.temperature_2m[i],
      probabilidadLluvia: h.precipitation_probability?.[i] ?? null,
    }));
  } catch (err) {
    console.warn("Error obteniendo horario:", err);
    return [];
  }
}

export async function obtenerPrevision(lat: number, lng: number, dias: number = 7): Promise<PrevisionDia[]> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,windspeed_10m_max` +
      `&timezone=auto&forecast_days=${dias}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Open-Meteo respondió ${res.status}`);
    const data = await res.json();
    const daily = data.daily;
    const resultado: PrevisionDia[] = daily.time.map((fecha: string, i: number) => ({
      fecha,
      codigoTiempo: daily.weathercode[i],
      tempMax: daily.temperature_2m_max[i],
      tempMin: daily.temperature_2m_min[i],
      probabilidadLluvia: daily.precipitation_probability_max?.[i] ?? null,
      vientoMaxKmh: daily.windspeed_10m_max?.[i] ?? null,
    }));
    return resultado;
  } catch (err) {
    console.warn("Error obteniendo previsión:", err);
    return [];
  }
}
