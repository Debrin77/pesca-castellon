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
  /**
   * True solo tras elegir punto en esta sesión (mapa / GPS / zona / recomendación)
   * o al confirmar el guardado con «Usar último».
   * Un punto restaurado de AsyncStorage NO desbloquea el veredicto de Inicio.
   */
  puntoElegido: boolean;
  /** Guarda el punto consultado en el mapa (previsión/avisos locales lo usan). */
  fijarPunto: (args: {
    lat: number;
    lng: number;
    fuente?: FuentePuntoConsulta;
    etiqueta?: string;
    poblacion?: string;
  }) => Promise<void>;
  /** Confirma el punto ya guardado (sesión anterior) sin cambiar coords. */
  confirmarPuntoGuardado: () => void;
  /** Vuelve a GPS / centro (borra el override del mapa). */
  limpiarPunto: () => Promise<void>;
}

const PuntoConsultaContext = createContext<PuntoConsultaContextValue | null>(null);

export function PuntoConsultaProvider({ children }: { children: React.ReactNode }) {
  const { provinciaId } = useProvincia();
  const [listo, setListo] = useState(false);
  const [punto, setPunto] = useState<PuntoConsulta | null>(null);
  const [puntoElegido, setPuntoElegido] = useState(false);

  useEffect(() => {
    let vivo = true;
    setListo(false);
    setPuntoElegido(false);
    (async () => {
      if (!provinciaId) {
        if (vivo) {
          setPunto(null);
          setPuntoElegido(false);
          setListo(true);
        }
        return;
      }
      const p = await leerPuntoConsulta(provinciaId);
      if (vivo) {
        setPunto(p);
        // Restaurar coords para clima/previsión, pero no el veredicto legal.
        setPuntoElegido(false);
        setListo(true);
      }
    })();
    return () => {
      vivo = false;
    };
  }, [provinciaId]);

  const fijarPunto = useCallback(
    async (args: {
      lat: number;
      lng: number;
      fuente?: FuentePuntoConsulta;
      etiqueta?: string;
      poblacion?: string;
    }) => {
      if (!provinciaId) return;
      const full = await guardarPuntoConsulta({
        lat: args.lat,
        lng: args.lng,
        fuente: args.fuente ?? "mapa",
        etiqueta: args.etiqueta,
        poblacion: args.poblacion,
        provinciaId,
      });
      setPunto(full);
      setPuntoElegido(true);
    },
    [provinciaId]
  );

  const confirmarPuntoGuardado = useCallback(() => {
    if (!punto) return;
    if (punto.fuente === "centro") return;
    setPuntoElegido(true);
  }, [punto]);

  const limpiarPunto = useCallback(async () => {
    if (!provinciaId) return;
    await borrarPuntoConsulta(provinciaId);
    setPunto(null);
    setPuntoElegido(false);
  }, [provinciaId]);

  const value = useMemo(
    () => ({
      listo,
      punto,
      puntoElegido,
      fijarPunto,
      confirmarPuntoGuardado,
      limpiarPunto,
    }),
    [listo, punto, puntoElegido, fijarPunto, confirmarPuntoGuardado, limpiarPunto]
  );

  return <PuntoConsultaContext.Provider value={value}>{children}</PuntoConsultaContext.Provider>;
}

export function usePuntoConsulta(): PuntoConsultaContextValue {
  const ctx = useContext(PuntoConsultaContext);
  if (!ctx) throw new Error("usePuntoConsulta debe usarse dentro de PuntoConsultaProvider");
  return ctx;
}
