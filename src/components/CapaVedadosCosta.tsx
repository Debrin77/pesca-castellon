import React from "react";
import { Polygon } from "./map";
import { PIN } from "../theme";
import { todosLosVedadosCosta } from "../services/consultaCostaService";

export default function CapaVedadosCosta() {
  return (
    <>
      {todosLosVedadosCosta().map((z) => (
        <Polygon
          key={z.id}
          coordinates={z.anillo.map((a) => ({ latitude: a.lat, longitude: a.lng }))}
          strokeColor={PIN.vedado}
          fillColor={PIN.vedado}
          strokeWidth={2}
        />
      ))}
    </>
  );
}
