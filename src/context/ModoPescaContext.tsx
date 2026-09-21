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
  /** Modo activo (fallback técnico si aún no hay elección explícita). */
  modo: ModoPescaGlobal;
  /**
   * True cuando el usuario ya eligió Río/Orilla/Barco, o la provincia
   * solo tiene una modalidad (p. ej. continentalOnly → río).
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
          setModoElegido(true);
          setListo(true);
        }
        return;
      }
      const opts = modosDisponibles(provincia);
      const unica = opts.length <= 1;
      try {
        const raw = await AsyncStorage.getItem(claveModo(provinciaId));
        if (esModoPescaGlobal(raw) && opts.includes(raw)) {
          if (vivo) {
            setModoState(raw);
            setModoElegido(true);
          }
        } else if (unica) {
          if (vivo) {
            setModoState(modoPorDefecto(provincia));
            setModoElegido(true);
          }
        } else {
          // Varias modalidades y aún no hay elección: no asumir río/orilla.
          if (vivo) {
            setModoState(modoPorDefecto(provincia));
            setModoElegido(false);
          }
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
