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
  modo: ModoPescaGlobal;
  disponibles: ModoPescaGlobal[];
  setModo: (modo: ModoPescaGlobal) => Promise<void>;
}

const ModoPescaContext = createContext<ModoPescaContextValue | null>(null);

export function ModoPescaProvider({ children }: { children: React.ReactNode }) {
  const { provincia, provinciaId } = useProvincia();
  const [listo, setListo] = useState(false);
  const [modo, setModoState] = useState<ModoPescaGlobal>("rio");

  const disponibles = useMemo(
    () => (provincia ? modosDisponibles(provincia) : (["rio"] as ModoPescaGlobal[])),
    [provincia]
  );

  useEffect(() => {
    let vivo = true;
    setListo(false);
    (async () => {
      if (!provinciaId || !provincia) {
        if (vivo) {
          setModoState("rio");
          setListo(true);
        }
        return;
      }
      const opts = modosDisponibles(provincia);
      try {
        const raw = await AsyncStorage.getItem(claveModo(provinciaId));
        const elegido =
          esModoPescaGlobal(raw) && opts.includes(raw) ? raw : modoPorDefecto(provincia);
        if (vivo) setModoState(elegido);
      } catch {
        if (vivo) setModoState(modoPorDefecto(provincia));
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
      await AsyncStorage.setItem(claveModo(provinciaId), ok);
    },
    [provinciaId, provincia]
  );

  const value = useMemo(
    () => ({ listo, modo, disponibles, setModo }),
    [listo, modo, disponibles, setModo]
  );

  return <ModoPescaContext.Provider value={value}>{children}</ModoPescaContext.Provider>;
}

export function useModoPesca(): ModoPescaContextValue {
  const ctx = useContext(ModoPescaContext);
  if (!ctx) throw new Error("useModoPesca debe usarse dentro de ModoPescaProvider");
  return ctx;
}
