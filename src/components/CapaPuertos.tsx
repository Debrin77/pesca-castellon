import React from "react";
import { Polygon } from "./map";
import { SEMAFORO } from "../theme";
import { todosLosPuertos } from "../services/consultaCostaService";

/** Polígonos portuarios: siempre HOY NO (pesca desde tierra prohibida). */
export default function CapaPuertos() {
  const color = SEMAFORO.no;
  return (
    <>
      {todosLosPuertos().map((p) => (
        <Polygon
          key={p.id}
          coordinates={p.anillo.map((a) => ({ latitude: a.lat, longitude: a.lng }))}
          strokeColor={color}
          fillColor={color}
          strokeWidth={2}
        />
      ))}
    </>
  );
}
