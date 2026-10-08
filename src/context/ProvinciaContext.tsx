import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LISTA_PROVINCIAS, esProvinciaId, type ProvinciaConfig, type ProvinciaId } from "../provincias";
import { clearProvinciaActiva, setProvinciaActiva } from "../provincias/runtime";
import {
  hidratarContenidoVivo,
  provinciaConContenidoVivo,
  suscribirContenidoVivo,
} from "../services/contenidoVivoService";

const CLAVE_PROVINCIA = "@pesca_app/provincia_activa";

interface ProvinciaContextValue {
  listo: boolean;
  provincia: ProvinciaConfig | null;
  provinciaId: ProvinciaId | null;
  provincias: ProvinciaConfig[];
  /** True si la provincia se restauró del almacenamiento al arrancar (sesión que continúa). */
  restauradaAlArrancar: boolean;
  /** True si el selector se muestra porque el usuario quiere cambiar, no por primer uso. */
  selectorEsCambio: boolean;
  /** Revisión del pack OTA (cambia al sincronizar normativa/especies/zonas). */
  contenidoRev: number;
  elegirProvincia: (id: ProvinciaId) => Promise<void>;
  cambiarProvincia: () => Promise<void>;
}

const ProvinciaContext = createContext<ProvinciaContextValue | null>(null);

export function ProvinciaProvider({ children }: { children: React.ReactNode }) {
  const [listo, setListo] = useState(false);
  const [provinciaId, setProvinciaId] = useState<ProvinciaId | null>(null);
  const [restauradaAlArrancar, setRestauradaAlArrancar] = useState(false);
  const [selectorEsCambio, setSelectorEsCambio] = useState(false);
  const [contenidoRev, setContenidoRev] = useState(0);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        await hidratarContenidoVivo();
        const raw = await AsyncStorage.getItem(CLAVE_PROVINCIA);
        if (!vivo) return;
        if (esProvinciaId(raw)) {
          setProvinciaActiva(raw);
          setProvinciaId(raw);
          setRestauradaAlArrancar(true);
          setSelectorEsCambio(false);
        }
      } finally {
        if (vivo) setListo(true);
      }
    })();
    return () => {
      vivo = false;
    };
  }, []);

  useEffect(() => {
    return suscribirContenidoVivo(() => setContenidoRev((n) => n + 1));
  }, []);

  const elegirProvincia = useCallback(async (id: ProvinciaId) => {
    setProvinciaActiva(id);
    setProvinciaId(id);
    setRestauradaAlArrancar(false);
    setSelectorEsCambio(false);
    await AsyncStorage.setItem(CLAVE_PROVINCIA, id);
  }, []);

  const cambiarProvincia = useCallback(async () => {
    setProvinciaId(null);
    clearProvinciaActiva();
    setRestauradaAlArrancar(false);
    setSelectorEsCambio(true);
    await AsyncStorage.removeItem(CLAVE_PROVINCIA);
  }, []);

  const provincia = useMemo(
    () => (provinciaId ? provinciaConContenidoVivo(provinciaId) : null),
    [provinciaId, contenidoRev]
  );

  const value = useMemo<ProvinciaContextValue>(
    () => ({
      listo,
      provincia,
      provinciaId,
      provincias: LISTA_PROVINCIAS,
      restauradaAlArrancar,
      selectorEsCambio,
      contenidoRev,
      elegirProvincia,
      cambiarProvincia,
    }),
    [
      listo,
      provincia,
      provinciaId,
      restauradaAlArrancar,
      selectorEsCambio,
      contenidoRev,
      elegirProvincia,
      cambiarProvincia,
    ]
  );

  return <ProvinciaContext.Provider value={value}>{children}</ProvinciaContext.Provider>;
}

export function useProvincia(): ProvinciaContextValue {
  const ctx = useContext(ProvinciaContext);
  if (!ctx) throw new Error("useProvincia debe usarse dentro de ProvinciaProvider");
  return ctx;
}
