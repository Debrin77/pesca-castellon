/**
 * Ventanas solunares horarias (teoría clásica de Knight/Knight).
 * Orientativo: no es predicción científica. Usa fase lunar local + tránsito aproximado.
 */
import { calcularFaseLunar } from "./moonService";

export interface VentanaSolunar {
  tipo: "mayor" | "menor";
  inicio: string; // HH:mm
  fin: string;
  etiqueta: string;
  puntuacion: number; // 0-100 relativa al día
}

export interface DiaSolunar {
  fecha: string;
  fase: string;
  iconoLuna: string;
  ventanas: VentanaSolunar[];
  mejorHoraInicio: string;
  mejorHoraFin: string;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function minutosAHora(m: number): string {
  const x = ((m % 1440) + 1440) % 1440;
  return `${pad(Math.floor(x / 60))}:${pad(x % 60)}`;
}

function ventana(tipo: "mayor" | "menor", centroMin: number, radioMin: number, etiqueta: string, puntuacion: number): VentanaSolunar {
  return {
    tipo,
    inicio: minutosAHora(centroMin - radioMin),
    fin: minutosAHora(centroMin + radioMin),
    etiqueta,
    puntuacion,
  };
}

/**
 * Tránsito lunar aproximado a partir de la fracción de fase (edad lunar).
 * El tránsito se desplaza ~50 min/día respecto al mediodía solar.
 */
export function calcularSolunarDia(fechaIso: string, lat = 40): DiaSolunar {
  const fecha = new Date(fechaIso + "T12:00:00");
  const fase = calcularFaseLunar(fecha);
  // Edad en días → desfase del tránsito respecto a 12:00
  const edadDias = fase.fraccion * 29.53058867;
  const desfaseMin = Math.round(edadDias * 50.47);
  const transit = 12 * 60 + desfaseMin;
  const antitransit = transit + 12 * 60;
  // Moonrise / moonset approx ±6 h del tránsito (simplificado; latitud afina poco)
  const ajusteLat = Math.round((Math.abs(lat) - 40) * 2);
  const moonrise = transit - 360 + ajusteLat;
  const moonset = transit + 360 + ajusteLat;

  const fuerza = Math.round(100 - fase.distanciaANuevaOLlena * 160);
  const base = Math.max(35, Math.min(98, fuerza));

  const ventanas = [
    ventana("mayor", moonrise, 60, "Periodo mayor (salida de luna)", base),
    ventana("mayor", moonset, 60, "Periodo mayor (puesta de luna)", base - 3),
    ventana("menor", transit, 45, "Periodo menor (luna en cénit)", Math.max(30, base - 18)),
    ventana("menor", antitransit, 45, "Periodo menor (luna en nadir)", Math.max(28, base - 22)),
  ].sort((a, b) => a.inicio.localeCompare(b.inicio));

  const mejor = ventanas.reduce((a, b) => (b.puntuacion > a.puntuacion ? b : a));

  return {
    fecha: fechaIso,
    fase: fase.nombre,
    iconoLuna: fase.icono,
    ventanas,
    mejorHoraInicio: mejor.inicio,
    mejorHoraFin: mejor.fin,
  };
}

export function calcularSolunarRango(fechaInicioIso: string, dias: number, lat = 40): DiaSolunar[] {
  const out: DiaSolunar[] = [];
  const base = new Date(fechaInicioIso + "T12:00:00");
  for (let i = 0; i < dias; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    out.push(calcularSolunarDia(d.toISOString().slice(0, 10), lat));
  }
  return out;
}
