/**
 * Índice «Salgo en barco» (0–100): oleaje + viento + rachas en el punto.
 * Distinto del Pulso de orilla: aquí manda la seguridad de salida.
 */
import { obtenerClimaActual } from "./weatherService";

export type CategoriaBarco = "favorable" | "aceptable" | "dudoso" | "no_salir";

export interface IndiceBarco {
  puntuacion: number;
  categoria: CategoriaBarco;
  oleajeM: number | null;
  periodoS: number | null;
  vientoKmh: number | null;
  rachasKmh: number | null;
  desglose: string[];
  umbralVientoKmh: number;
  umbralOleajeM: number;
  /** true si el índice recomienda no zarpar */
  alertaSalida: boolean;
}

const UMBRAL_VIENTO = 33; // ~18 kn
const UMBRAL_OLEAJE = 1.2;

function categorizar(p: number): CategoriaBarco {
  if (p >= 75) return "favorable";
  if (p >= 55) return "aceptable";
  if (p >= 35) return "dudoso";
  return "no_salir";
}

export const CATEGORIA_BARCO_INFO: Record<
  CategoriaBarco,
  { texto: string; color: string; fondo: string }
> = {
  favorable: { texto: "Favorable", color: "#0f5a26", fondo: "#d8f0e0" },
  aceptable: { texto: "Aceptable", color: "#6b4400", fondo: "#f6e7b8" },
  dudoso: { texto: "Dudoso", color: "#8a2e0e", fondo: "#fde8d4" },
  no_salir: { texto: "No salir", color: "#8a0f30", fondo: "#fad4d8" },
};

function puntuarOleaje(m: number | null): { puntos: number; motivo: string } {
  if (m == null) return { puntos: 12, motivo: "Sin dato de oleaje: peso neutro" };
  if (m < 0.4) return { puntos: 32, motivo: `Oleaje flojo (${m.toFixed(1)} m): buena ventana` };
  if (m < 0.8) return { puntos: 26, motivo: `Oleaje moderado (${m.toFixed(1)} m): vigilable` };
  if (m < 1.2) return { puntos: 14, motivo: `Oleaje vivo (${m.toFixed(1)} m): solo si tienes experiencia` };
  return { puntos: 4, motivo: `Oleaje alto (${m.toFixed(1)} m): no recomendable zarpar` };
}

function puntuarViento(kmh: number | null): { puntos: number; motivo: string } {
  if (kmh == null) return { puntos: 10, motivo: "Sin dato de viento: peso neutro" };
  if (kmh < 12) return { puntos: 28, motivo: `Viento flojo (${Math.round(kmh)} km/h)` };
  if (kmh < 22) return { puntos: 22, motivo: `Brisa (${Math.round(kmh)} km/h): aceptable` };
  if (kmh < 33) return { puntos: 12, motivo: `Viento fresco (${Math.round(kmh)} km/h)` };
  return { puntos: 3, motivo: `Viento fuerte (${Math.round(kmh)} km/h): no zarpar` };
}

function puntuarRachas(kmh: number | null): { puntos: number; motivo: string } {
  if (kmh == null) return { puntos: 8, motivo: "Sin rachas en la previsión" };
  if (kmh < 25) return { puntos: 16, motivo: `Rachas contenidas (${Math.round(kmh)} km/h)` };
  if (kmh < 40) return { puntos: 9, motivo: `Rachas notables (${Math.round(kmh)} km/h)` };
  return { puntos: 2, motivo: `Rachas fuertes (${Math.round(kmh)} km/h)` };
}

function puntuarPeriodo(s: number | null, oleajeM: number | null): { puntos: number; motivo: string } {
  if (s == null || oleajeM == null) return { puntos: 8, motivo: "Sin periodo de ola" };
  // Periodo corto + altura baja = chop; periodo largo + altura = mar de fondo
  if (oleajeM < 0.5) return { puntos: 12, motivo: `Periodo ${s.toFixed(0)} s con poca altura` };
  if (s >= 7 && oleajeM >= 0.8) {
    return { puntos: 4, motivo: `Mar de fondo (periodo ${s.toFixed(0)} s): incomodo en barco pequeño` };
  }
  return { puntos: 10, motivo: `Periodo ${s.toFixed(0)} s` };
}

export async function obtenerMeteoMarina(
  lat: number,
  lng: number
): Promise<{
  oleajeM: number | null;
  periodoS: number | null;
  vientoKmh: number | null;
  rachasKmh: number | null;
}> {
  let oleajeM: number | null = null;
  let periodoS: number | null = null;
  let vientoKmh: number | null = null;
  let rachasKmh: number | null = null;

  try {
    const url =
      `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}` +
      `&current=wave_height,wave_period&timezone=auto`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const c = data.current ?? {};
      if (typeof c.wave_height === "number") oleajeM = c.wave_height;
      if (typeof c.wave_period === "number") periodoS = c.wave_period;
    }
  } catch (err) {
    console.warn("Meteo marina (oleaje):", err);
  }

  try {
    const clima = await obtenerClimaActual(lat, lng);
    if (clima) {
      if (typeof clima.velocidadVientoKmh === "number") vientoKmh = clima.velocidadVientoKmh;
      if (typeof clima.rafagaKmh === "number") rachasKmh = clima.rafagaKmh;
    }
  } catch (err) {
    console.warn("Meteo marina (viento):", err);
  }

  return { oleajeM, periodoS, vientoKmh, rachasKmh };
}

export async function calcularIndiceBarco(lat: number, lng: number): Promise<IndiceBarco> {
  const m = await obtenerMeteoMarina(lat, lng);
  const o = puntuarOleaje(m.oleajeM);
  const v = puntuarViento(m.vientoKmh);
  const r = puntuarRachas(m.rachasKmh);
  const p = puntuarPeriodo(m.periodoS, m.oleajeM);
  const puntuacion = Math.max(0, Math.min(100, Math.round(o.puntos + v.puntos + r.puntos + p.puntos)));
  const categoria = categorizar(puntuacion);
  const alertaSalida =
    categoria === "no_salir" ||
    (m.oleajeM != null && m.oleajeM >= UMBRAL_OLEAJE) ||
    (m.vientoKmh != null && m.vientoKmh >= UMBRAL_VIENTO) ||
    (m.rachasKmh != null && m.rachasKmh >= 45);

  return {
    puntuacion,
    categoria,
    oleajeM: m.oleajeM,
    periodoS: m.periodoS,
    vientoKmh: m.vientoKmh,
    rachasKmh: m.rachasKmh,
    desglose: [o.motivo, v.motivo, r.motivo, p.motivo],
    umbralVientoKmh: UMBRAL_VIENTO,
    umbralOleajeM: UMBRAL_OLEAJE,
    alertaSalida,
  };
}
