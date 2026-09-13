import React from "react";
import { Polygon } from "./map";
import { colorCapaIcv, poligonosIcv, CapaIcv } from "../services/geojsonHit";
import { colorMarcadorTramo, todosLosTramos } from "../services/consultaPescaService";

function anillosDe(geom: { type: string; coordinates: any }): { outer: { latitude: number; longitude: number }[]; holes: { latitude: number; longitude: number }[][] }[] {
  const toLatLng = (ring: number[][]) => ring.map((p) => ({ latitude: p[1], longitude: p[0] }));
  if (geom.type === "Polygon") {
    return [{ outer: toLatLng(geom.coordinates[0]), holes: geom.coordinates.slice(1).map(toLatLng) }];
  }
  return geom.coordinates.map((poly: number[][][]) => ({
    outer: toLatLng(poly[0]),
    holes: poly.slice(1).map(toLatLng),
  }));
}

/** Color del polígono: cotos/reservas por tipo; ZPL alineado con semáforo de hoy. */
function colorPoligono(capa: CapaIcv, tramoId?: string | null): string {
  if (capa !== "zpl") {
    return colorCapaIcv(capa);
  }
  if (tramoId) {
    const t = todosLosTramos().find((x) => x.id === tramoId);
    if (t) return colorMarcadorTramo(t);
  }
  return colorCapaIcv(capa);
}

interface Props {
  zpc?: boolean;
  reservas?: boolean;
  zpl?: boolean;
}

/** Polígonos oficiales (ICV Castellón o DERA Junta Sevilla). */
export default function CapaPoligonosIcv({ zpc = true, reservas = true, zpl = true }: Props) {
  return (
    <>
      {poligonosIcv()
        .filter((f) => {
          const capa = f.properties.capa;
          if (capa === "zpl") return zpl;
          if (capa === "zpc") return zpc;
          return reservas;
        })
        .flatMap((f) =>
          anillosDe(f.geometry).map((ring, i) => {
            const color = colorPoligono(
              f.properties.capa as CapaIcv,
              (f.properties as { tramoId?: string | null }).tramoId
            );
            const estrecho = !!(f.properties as { estrecho?: boolean }).estrecho;
            return (
              <Polygon
                key={`${f.properties.capa}-${f.properties.id}-${i}`}
                coordinates={ring.outer}
                holes={ring.holes}
                strokeColor={color}
                fillColor={color}
                strokeWidth={estrecho ? 5 : 2}
              />
            );
          })
        )}
    </>
  );
}
