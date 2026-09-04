import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useProvincia } from "./ProvinciaContext";
import {
  borrarPuntoConsulta,
  guardarPuntoConsulta,
  leerPuntoConsulta,
  type FuentePuntoConsulta,
  type PuntoConsulta,
} from "../services/puntoConsultaService";

interface PuntoConsultaContextValue {
  listo: boolean;
  punto: PuntoConsulta | null;
  /** Guarda el punto consultado en el mapa (previsión/avisos locales lo usan). */
  fijarPunto: (args: {
    lat: number;
    lng: number;
    fuente?: FuentePuntoConsulta;
    etiqueta?: string;
  }) => Promise<void>;
  /** Vuelve a GPS / centro (borra el override del mapa). */
  limpiarPunto: () => Promise<void>;
}

const PuntoConsultaContext = createContext<PuntoConsultaContextValue | null>(null);

export function PuntoConsultaProvider({ children }: { children: React.ReactNode }) {
  const { provinciaId } = useProvincia();
  const [listo, setListo] = useState(false);
  const [punto, setPunto] = useState<PuntoConsulta | null>(null);

  useEffect(() => {
    let vivo = true;
    setListo(false);
    (async () => {
      if (!provinciaId) {
        if (vivo) {
          setPunto(null);
          setListo(true);
        }
        return;
      }
      const p = await leerPuntoConsulta(provinciaId);
      if (vivo) {
        setPunto(p);
        setListo(true);
      }
    })();
    return () => {
      vivo = false;
    };
  }, [provinciaId]);

  const fijarPunto = useCallback(
    async (args: { lat: number; lng: number; fuente?: FuentePuntoConsulta; etiqueta?: string }) => {
      if (!provinciaId) return;
      const full = await guardarPuntoConsulta({
        lat: args.lat,
        lng: args.lng,
        fuente: args.fuente ?? "mapa",
        etiqueta: args.etiqueta,
        provinciaId,
      });
      setPunto(full);
    },
    [provinciaId]
  );

  const limpiarPunto = useCallback(async () => {
    if (!provinciaId) return;
    await borrarPuntoConsulta(provinciaId);
    setPunto(null);
  }, [provinciaId]);

  const value = useMemo(
    () => ({ listo, punto, fijarPunto, limpiarPunto }),
    [listo, punto, fijarPunto, limpiarPunto]
  );

  return <PuntoConsultaContext.Provider value={value}>{children}</PuntoConsultaContext.Provider>;
}

export function usePuntoConsulta(): PuntoConsultaContextValue {
  const ctx = useContext(PuntoConsultaContext);
  if (!ctx) throw new Error("usePuntoConsulta debe usarse dentro de PuntoConsultaProvider");
  return ctx;
}
