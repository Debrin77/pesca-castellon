import React from "react";
import { Polygon } from "./map";
import { SEMAFORO } from "../theme";
import { todosLosPuertos } from "../services/consultaCostaService";

/** Polígonos portuarios: siempre HOY NO (orilla, kayak y barco: prohibido, no es coto). */
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
