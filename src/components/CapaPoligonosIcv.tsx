import React from "react";
import { Polygon } from "./map";
import { colorCapaIcv, poligonosIcv, CapaIcv } from "../services/geojsonHit";

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

interface Props {
  zpc?: boolean;
  reservas?: boolean;
}

/** Polígonos oficiales ICV. QGIS puede regenerarlos con scripts/build_icv_geojson.mjs. */
export default function CapaPoligonosIcv({ zpc = true, reservas = true }: Props) {
  return (
    <>
      {poligonosIcv()
        .filter((f) => (f.properties.capa === "zpc" ? zpc : reservas))
        .flatMap((f) =>
          anillosDe(f.geometry).map((ring, i) => {
            const color = colorCapaIcv(f.properties.capa as CapaIcv);
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
