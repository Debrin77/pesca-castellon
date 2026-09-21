import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useProvincia } from "./ProvinciaContext";
import {
  esModoPescaGlobal,
  modoPorDefecto,
  modosDisponibles,
  type ModoPescaGlobal,
} from "../data/modoPesca";

const claveModo = (provinciaId: string) => `@pesca_app/${provinciaId}/modo_pesca`;

interface ModoPescaContextValue {
  listo: boolean;
  /** Modo activo (fallback técnico si aún no hay elección en esta sesión). */
  modo: ModoPescaGlobal;
  /**
   * True solo tras pulsar Río/Orilla/Barco en esta sesión, o si la provincia
   * tiene una sola modalidad (continentalOnly → río).
   * No se restaura desde almacenamiento: al abrir la app hay que elegir de nuevo.
   */
  modoElegido: boolean;
  disponibles: ModoPescaGlobal[];
  setModo: (modo: ModoPescaGlobal) => Promise<void>;
}

const ModoPescaContext = createContext<ModoPescaContextValue | null>(null);

export function ModoPescaProvider({ children }: { children: React.ReactNode }) {
  const { provincia, provinciaId } = useProvincia();
  const [listo, setListo] = useState(false);
  const [modo, setModoState] = useState<ModoPescaGlobal>("rio");
  const [modoElegido, setModoElegido] = useState(false);

  const disponibles = useMemo(
    () => (provincia ? modosDisponibles(provincia) : (["rio"] as ModoPescaGlobal[])),
    [provincia]
  );

  useEffect(() => {
    let vivo = true;
    setListo(false);
    setModoElegido(false);
    (async () => {
      if (!provinciaId || !provincia) {
        if (vivo) {
          setModoState("rio");
          // Sin provincia aún (selector): no hay UI de punto/pulso de Inicio.
          setModoElegido(false);
          setListo(true);
        }
        return;
      }
      const opts = modosDisponibles(provincia);
      const unica = opts.length <= 1;
      try {
        const raw = await AsyncStorage.getItem(claveModo(provinciaId));
        const recordado =
          esModoPescaGlobal(raw) && opts.includes(raw) ? raw : modoPorDefecto(provincia);
        if (vivo) {
          setModoState(recordado);
          // Varias modalidades: exigir pulsación en esta sesión (no basta el valor guardado).
          setModoElegido(unica);
        }
      } catch {
        if (vivo) {
          setModoState(modoPorDefecto(provincia));
          setModoElegido(unica);
        }
      } finally {
        if (vivo) setListo(true);
      }
    })();
    return () => {
      vivo = false;
    };
  }, [provinciaId, provincia]);

  const setModo = useCallback(
    async (siguiente: ModoPescaGlobal) => {
      if (!provinciaId || !provincia) return;
      const opts = modosDisponibles(provincia);
      const ok = opts.includes(siguiente) ? siguiente : modoPorDefecto(provincia);
      setModoState(ok);
      setModoElegido(true);
      await AsyncStorage.setItem(claveModo(provinciaId), ok);
    },
    [provinciaId, provincia]
  );

  const value = useMemo(
    () => ({ listo, modo, modoElegido, disponibles, setModo }),
    [listo, modo, modoElegido, disponibles, setModo]
  );

  return <ModoPescaContext.Provider value={value}>{children}</ModoPescaContext.Provider>;
}

export function useModoPesca(): ModoPescaContextValue {
  const ctx = useContext(ModoPescaContext);
  if (!ctx) throw new Error("useModoPesca debe usarse dentro de ModoPescaProvider");
  return ctx;
}
