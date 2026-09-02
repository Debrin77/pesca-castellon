import React from "react";
import { Circle } from "./map";
import { todosLosPuertos } from "../services/consultaCostaService";

/** Radios orientativos de aguas portuarias: no pescar desde tierra ahí. */
export default function CapaPuertos() {
  return (
    <>
      {todosLosPuertos().map((p) => (
        <Circle
          key={p.id}
          center={{ latitude: p.lat, longitude: p.lng }}
          radius={p.radioM}
          strokeColor="#b42318"
          fillColor="#b4231833"
        />
      ))}
    </>
  );
}
