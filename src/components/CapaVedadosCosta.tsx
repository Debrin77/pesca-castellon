import React from "react";
import { Polygon } from "./map";
import { todosLosVedadosCosta } from "../services/consultaCostaService";

export default function CapaVedadosCosta() {
  return (
    <>
      {todosLosVedadosCosta().map((z) => (
        <Polygon
          key={z.id}
          coordinates={z.anillo.map((a) => ({ latitude: a.lat, longitude: a.lng }))}
          strokeColor="#5b4aa8"
          fillColor="#5b4aa8"
          strokeWidth={2}
        />
      ))}
    </>
  );
}
