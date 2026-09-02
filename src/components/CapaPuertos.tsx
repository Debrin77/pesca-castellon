import React from "react";
import { Polygon } from "./map";
import { todosLosPuertos } from "../services/consultaCostaService";

export default function CapaPuertos() {
  return (
    <>
      {todosLosPuertos().map((p) => (
        <Polygon
          key={p.id}
          coordinates={p.anillo.map((a) => ({ latitude: a.lat, longitude: a.lng }))}
          strokeColor="#b42318"
          fillColor="#b42318"
          strokeWidth={2}
        />
      ))}
    </>
  );
}
