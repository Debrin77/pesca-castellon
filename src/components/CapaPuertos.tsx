import React from "react";
import { Polygon } from "./map";
import { PIN } from "../theme";
import { todosLosPuertos } from "../services/consultaCostaService";

export default function CapaPuertos() {
  return (
    <>
      {todosLosPuertos().map((p) => (
        <Polygon
          key={p.id}
          coordinates={p.anillo.map((a) => ({ latitude: a.lat, longitude: a.lng }))}
          strokeColor={PIN.puerto}
          fillColor={PIN.puerto}
          strokeWidth={2}
        />
      ))}
    </>
  );
}
