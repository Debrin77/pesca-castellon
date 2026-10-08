/**
 * Prefetch SAIH (embalses + aforos) al arrancar Inicio,
 * para que «Ideas y sitios» pinte datos frescos sin esperar al panel.
 */
import { getProvinciaActiva } from "../provincias/runtime";
import { guardarCacheOffline } from "./offlineService";
import {
  esFuenteSaihReal,
  getResumenAforos,
  getResumenEmbalses,
  type FuenteSaih,
  type NivelAforo,
} from "./saihService";

export type SaihChipPrefetch = {
  etiqueta: string;
  zoneId: string;
  pct: number | null;
  fuente: FuenteSaih;
  fechaDato: string | null;
};

export type AforoChipPrefetch = {
  etiqueta: string;
  nombre: string;
  rio: string | null;
  caudalM3s: number | null;
  nivel: NivelAforo;
  fuente: FuenteSaih;
  fechaDato: string | null;
};

export async function prefetchSaihInicio(): Promise<{
  embalses: number;
  aforos: number;
}> {
  const provincia = getProvinciaActiva();
  let embalses = 0;
  let aforos = 0;

  const embalsesPanel = provincia.embalsesPanel ?? [];
  if (provincia.tieneSaih && embalsesPanel.length > 0) {
    try {
      const rows = await getResumenEmbalses(embalsesPanel);
      const panel: SaihChipPrefetch[] = rows
        .map((r) => {
          const meta =
            embalsesPanel.find((e) => e.nombre === r.nombre) ??
            embalsesPanel.find((e) => e.etiqueta === r.etiqueta);
          if (!meta) return null;
          return {
            etiqueta: r.etiqueta,
            zoneId: meta.zoneId,
            pct: r.estacion.porcentajeLleno,
            fuente: r.estacion.fuente,
            fechaDato: r.estacion.fechaDato,
          };
        })
        .filter((x): x is SaihChipPrefetch => x != null);
      if (panel.some((s) => esFuenteSaihReal(s.fuente))) {
        await guardarCacheOffline({ saih: panel });
        embalses = panel.length;
      }
    } catch (err) {
      console.warn("prefetch SAIH embalses:", err);
    }
  }

  const aforosMeta = provincia.aforosPanel ?? [];
  if (aforosMeta.length) {
    try {
      const rows = await getResumenAforos(aforosMeta);
      const panel: AforoChipPrefetch[] = rows.map((r) => ({
        etiqueta: r.etiqueta,
        nombre: r.nombre,
        rio: r.estacion.rio,
        caudalM3s: r.estacion.caudalM3s,
        nivel: r.estacion.nivel,
        fuente: r.estacion.fuente,
        fechaDato: r.estacion.fechaDato,
      }));
      if (panel.some((s) => esFuenteSaihReal(s.fuente))) {
        await guardarCacheOffline({ saihAforos: panel });
        aforos = panel.length;
      }
    } catch (err) {
      console.warn("prefetch SAIH aforos:", err);
    }
  }

  return { embalses, aforos };
}
