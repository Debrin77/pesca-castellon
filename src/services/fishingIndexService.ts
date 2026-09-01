import { calcularFaseLunar } from "./moonService";

export type CategoriaPesca = "excelente" | "buena" | "regular" | "mala";

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
}

/**
 * Reparto de puntos (máx. 100), basado en lo que coinciden en señalar
 * webs especializadas de pesca y la sabiduría popular:
 * - Presión atmosférica en descenso: favorece la alimentación (máx. 30)
 * - Nubosidad moderada-alta frente a sol pleno (máx. 20)
 * - Viento suave que oxigena/agita el agua, sin ser excesivo (máx. 20)
 * - Lluvia ligera (reduce visibilidad para el pez) frente a nada o tormenta (máx. 15)
 * - Fase lunar cercana a nueva o llena, por la teoría solunar (máx. 15)
 *
 * IMPORTANTE: esto es un modelo heurístico inspirado en fuentes divulgativas,
 * no una predicción científica exacta. Sirve como orientación, no como garantía.
 */

function puntuarPresion(tendenciaHPa: number, media: number): { puntos: number; motivo: string; tendencia: IndicePescaDia["tendenciaPresion"] } {
  if (tendenciaHPa <= -2) {
    return { puntos: 30, motivo: "Presión en descenso pronunciado: suele disparar la actividad antes de un cambio de tiempo", tendencia: "bajando_fuerte" };
  }
  if (tendenciaHPa <= -0.5) {
    return { puntos: 25, motivo: "Presión bajando suavemente: condición clásicamente favorable", tendencia: "bajando" };
  }
  if (tendenciaHPa < 0.5) {
    const enRangoIdeal = media >= 1010 && media <= 1025;
    return {
      puntos: enRangoIdeal ? 20 : 14,
      motivo: enRangoIdeal ? "Presión estable en un rango habitual" : "Presión estable, aunque algo fuera del rango más típico",
      tendencia: "estable",
    };
  }
  if (tendenciaHPa < 2) {
    return { puntos: 10, motivo: "Presión subiendo: puede frenar algo la actividad", tendencia: "subiendo" };
  }
  return { puntos: 4, motivo: "Presión en ascenso fuerte: suele ser la condición menos favorable", tendencia: "subiendo_fuerte" };
}

function puntuarNubosidad(pct: number): { puntos: number; motivo: string } {
  if (pct >= 40 && pct <= 85) {
    return { puntos: 20, motivo: "Cielo parcialmente nublado: los peces se acercan más a superficie y orillas" };
  }
  if (pct < 20) {
    return { puntos: 8, motivo: "Cielo muy despejado: suele ser más difícil, sobre todo en horas centrales" };
  }
  if (pct > 85) {
    return { puntos: 13, motivo: "Cielo muy cubierto (revisa que no haya tormenta prevista)" };
  }
  return { puntos: 15, motivo: "Nubosidad moderada" };
}

function puntuarViento(kmh: number): { puntos: number; motivo: string } {
  if (kmh < 5) return { puntos: 10, motivo: "Viento en calma: sin el efecto oxigenante de una brisa suave" };
  if (kmh <= 15) return { puntos: 20, motivo: "Viento suave: agita la superficie y oxigena el agua, favorable" };
  if (kmh <= 25) return { puntos: 12, motivo: "Viento moderado" };
  return { puntos: 4, motivo: "Viento fuerte: tiende a dispersar los peces" };
}

function puntuarLluvia(probabilidad: number): { puntos: number; motivo: string } {
  if (probabilidad >= 15 && probabilidad <= 55) {
    return { puntos: 15, motivo: "Probabilidad de lluvia ligera: reduce la visibilidad para el pez, favorable" };
  }
  if (probabilidad < 15) return { puntos: 10, motivo: "Sin lluvia relevante prevista" };
  return { puntos: 6, motivo: "Alta probabilidad de lluvia intensa/tormenta" };
}

function puntuarLuna(distanciaANuevaOLlena: number): { puntos: number; motivo: string } {
  if (distanciaANuevaOLlena <= 0.06) {
    return { puntos: 15, motivo: "Luna nueva o llena: mayor actividad según la teoría solunar" };
  }
  if (distanciaANuevaOLlena <= 0.15) {
    return { puntos: 8, motivo: "Cerca de luna nueva o llena" };
  }
  return { puntos: 3, motivo: "Fase lunar intermedia, con menor influencia esperada" };
}

function categorizar(puntuacion: number): CategoriaPesca {
  if (puntuacion >= 75) return "excelente";
  if (puntuacion >= 55) return "buena";
  if (puntuacion >= 35) return "regular";
  return "mala";
}

interface DiaAgregado {
  fecha: string;
  presionMedia: number;
  nubosidadMedia: number;
}

function agregarPorDia(horas: string[], presiones: number[], nubes: number[]): Record<string, DiaAgregado> {
  const acumulado: Record<string, { sumaPresion: number; sumaNubes: number; n: number }> = {};
  horas.forEach((h, i) => {
    const fecha = h.slice(0, 10);
    if (!acumulado[fecha]) acumulado[fecha] = { sumaPresion: 0, sumaNubes: 0, n: 0 };
    acumulado[fecha].sumaPresion += presiones[i];
    acumulado[fecha].sumaNubes += nubes[i];
    acumulado[fecha].n += 1;
  });
  const resultado: Record<string, DiaAgregado> = {};
  for (const fecha in acumulado) {
    const a = acumulado[fecha];
    resultado[fecha] = { fecha, presionMedia: a.sumaPresion / a.n, nubosidadMedia: a.sumaNubes / a.n };
  }
  return resultado;
}

export async function calcularIndicePesca(lat: number, lng: number, dias: number = 3): Promise<IndicePescaDia[]> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&hourly=surface_pressure,cloudcover&daily=windspeed_10m_max,precipitation_probability_max` +
      `&past_days=1&forecast_days=${dias}&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Open-Meteo respondió ${res.status}`);
    const data = await res.json();

    const porDia = agregarPorDia(data.hourly.time, data.hourly.surface_pressure, data.hourly.cloudcover);
    const fechasOrdenadas = Object.keys(porDia).sort();

    const resultado: IndicePescaDia[] = [];

    for (let i = 0; i < data.daily.time.length; i++) {
      const fecha: string = data.daily.time[i];
      const hoy = porDia[fecha];
      const idxEnOrdenadas = fechasOrdenadas.indexOf(fecha);
      const ayer = idxEnOrdenadas > 0 ? porDia[fechasOrdenadas[idxEnOrdenadas - 1]] : null;
      if (!hoy) continue;

      const tendenciaHPa = ayer ? hoy.presionMedia - ayer.presionMedia : 0;
      const viento = data.daily.windspeed_10m_max[i];
      const lluvia = data.daily.precipitation_probability_max?.[i] ?? 0;
      const luna = calcularFaseLunar(new Date(fecha + "T12:00:00"));

      const rPresion = puntuarPresion(tendenciaHPa, hoy.presionMedia);
      const rNubes = puntuarNubosidad(hoy.nubosidadMedia);
      const rViento = puntuarViento(viento);
      const rLluvia = puntuarLluvia(lluvia);
      const rLuna = puntuarLuna(luna.distanciaANuevaOLlena);

      const puntuacion = Math.round(rPresion.puntos + rNubes.puntos + rViento.puntos + rLluvia.puntos + rLuna.puntos);

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
        desglose: [rPresion.motivo, rNubes.motivo, rViento.motivo, rLluvia.motivo, rLuna.motivo],
      });
    }

    return resultado;
  } catch (err) {
    console.warn("Error calculando índice de pesca:", err);
    return [];
  }
}

export const CATEGORIA_INFO: Record<CategoriaPesca, { icono: string; texto: string; color: string }> = {
  excelente: { icono: "🟢", texto: "Excelente", color: "#2e7d32" },
  buena: { icono: "🟡", texto: "Buena", color: "#f9a825" },
  regular: { icono: "🟠", texto: "Regular", color: "#ef6c00" },
  mala: { icono: "🔴", texto: "Mala", color: "#c62828" },
};
