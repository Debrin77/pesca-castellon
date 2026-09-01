/**
 * Cálculo de fase lunar mediante el ciclo sinódico (29.53058867 días),
 * usando como referencia una luna nueva conocida (6 enero 2000, 18:14 UTC).
 * No requiere ninguna API externa.
 */

const SINODICO_DIAS = 29.53058867;
const LUNA_NUEVA_REF = Date.UTC(2000, 0, 6, 18, 14, 0); // época de referencia

export interface FaseLunar {
  fraccion: number; // 0 = luna nueva, 0.5 = luna llena, 1 = luna nueva de nuevo
  nombre: string;
  icono: string;
  /** Cuanto más cerca de 0 (=coincide con nueva o llena), más favor le da la sabiduría popular/teoría solunar */
  distanciaANuevaOLlena: number;
}

export function calcularFaseLunar(fecha: Date): FaseLunar {
  const diasTranscurridos = (fecha.getTime() - LUNA_NUEVA_REF) / 86400000;
  let fraccion = (diasTranscurridos % SINODICO_DIAS) / SINODICO_DIAS;
  if (fraccion < 0) fraccion += 1;

  let nombre: string;
  let icono: string;
  if (fraccion < 0.03 || fraccion >= 0.97) {
    nombre = "Luna nueva";
    icono = "🌑";
  } else if (fraccion < 0.22) {
    nombre = "Luna creciente";
    icono = "🌒";
  } else if (fraccion < 0.28) {
    nombre = "Cuarto creciente";
    icono = "🌓";
  } else if (fraccion < 0.47) {
    nombre = "Gibosa creciente";
    icono = "🌔";
  } else if (fraccion < 0.53) {
    nombre = "Luna llena";
    icono = "🌕";
  } else if (fraccion < 0.72) {
    nombre = "Gibosa menguante";
    icono = "🌖";
  } else if (fraccion < 0.78) {
    nombre = "Cuarto menguante";
    icono = "🌗";
  } else {
    nombre = "Luna menguante";
    icono = "🌘";
  }

  // Distancia mínima a 0 (nueva), 0.5 (llena) o 1 (nueva siguiente)
  const distanciaANueva = Math.min(fraccion, 1 - fraccion);
  const distanciaALlena = Math.abs(fraccion - 0.5);
  const distanciaANuevaOLlena = Math.min(distanciaANueva, distanciaALlena);

  return { fraccion, nombre, icono, distanciaANuevaOLlena };
}
