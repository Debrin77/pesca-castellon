/**
 * Auto-enriquece una captura con clima / índice / solunar del momento.
 */
import type { CondicionesCaptura } from "./storageService";
import { calcularIndicePesca } from "./fishingIndexService";
import { obtenerClimaActual } from "./weatherService";

export async function capturarCondicionesDelMomento(
  lat: number,
  lng: number
): Promise<CondicionesCaptura> {
  const base: CondicionesCaptura = { capturadoEn: new Date().toISOString() };
  try {
    const [clima, indices] = await Promise.all([
      obtenerClimaActual(lat, lng).catch(() => null),
      calcularIndicePesca(lat, lng, 1).catch(() => []),
    ]);
    const hoy = indices[0];
    if (hoy) {
      base.indice = hoy.puntuacion;
      base.categoriaIndice = hoy.categoria;
      base.faseLunar = hoy.faseLunar;
      base.tempAguaC = hoy.tempAguaC ?? null;
      base.presionHPa = hoy.presionMediaHPa;
      if (hoy.mejorFranjaInicio && hoy.mejorFranjaFin) {
        base.solunarNota = `Mejor franja ~ ${hoy.mejorFranjaInicio}–${hoy.mejorFranjaFin}`;
      }
    }
    if (clima) {
      base.tempAireC = clima.temperatura ?? null;
      base.vientoKmh = clima.velocidadVientoKmh ?? null;
    }
  } catch (err) {
    console.warn("condicionesCaptura:", err);
  }
  return base;
}
