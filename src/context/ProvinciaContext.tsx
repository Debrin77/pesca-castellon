import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LISTA_PROVINCIAS, provinciaPorId, esProvinciaId, type ProvinciaConfig, type ProvinciaId } from "../provincias";
import { clearProvinciaActiva, setProvinciaActiva } from "../provincias/runtime";

const CLAVE_PROVINCIA = "@pesca_app/provincia_activa";

interface ProvinciaContextValue {
  listo: boolean;
  provincia: ProvinciaConfig | null;
  provinciaId: ProvinciaId | null;
  provincias: ProvinciaConfig[];
  elegirProvincia: (id: ProvinciaId) => Promise<void>;
  cambiarProvincia: () => Promise<void>;
}

const ProvinciaContext = createContext<ProvinciaContextValue | null>(null);

export function ProvinciaProvider({ children }: { children: React.ReactNode }) {
  const [listo, setListo] = useState(false);
  const [provinciaId, setProvinciaId] = useState<ProvinciaId | null>(null);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(CLAVE_PROVINCIA);
        if (!vivo) return;
        if (esProvinciaId(raw)) {
          setProvinciaActiva(raw);
          setProvinciaId(raw);
          if (typeof document !== "undefined") {
            document.title = provinciaPorId(raw).nombreApp;
          }
        }
      } finally {
        if (vivo) setListo(true);
      }
    })();
    return () => {
      vivo = false;
    };
  }, []);

  const elegirProvincia = useCallback(async (id: ProvinciaId) => {
    setProvinciaActiva(id);
    setProvinciaId(id);
    await AsyncStorage.setItem(CLAVE_PROVINCIA, id);
    if (typeof document !== "undefined") {
      document.title = provinciaPorId(id).nombreApp;
    }
  }, []);

  const cambiarProvincia = useCallback(async () => {
    setProvinciaId(null);
    clearProvinciaActiva();
    await AsyncStorage.removeItem(CLAVE_PROVINCIA);
  }, []);

  const provincia = useMemo(
    () => (provinciaId ? provinciaPorId(provinciaId) : null),
    [provinciaId]
  );

  const value = useMemo<ProvinciaContextValue>(
    () => ({
      listo,
      provincia,
      provinciaId,
      provincias: LISTA_PROVINCIAS,
      elegirProvincia,
      cambiarProvincia,
    }),
    [listo, provincia, provinciaId, elegirProvincia, cambiarProvincia]
  );

  return <ProvinciaContext.Provider value={value}>{children}</ProvinciaContext.Provider>;
}

export function useProvincia(): ProvinciaContextValue {
  const ctx = useContext(ProvinciaContext);
  if (!ctx) throw new Error("useProvincia debe usarse dentro de ProvinciaProvider");
  return ctx;
}
