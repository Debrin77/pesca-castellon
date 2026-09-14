import React from "react";
import { Polygon } from "./map";
import { PIN } from "../theme";
import { todosLosVedadosMarinos } from "../services/consultaEmbarcacionService";

/** Reserva marina Columbretes (y futuros vedados marinos). */
export default function CapaVedadosMarinos() {
  return (
    <>
      {todosLosVedadosMarinos().map((z) => (
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
