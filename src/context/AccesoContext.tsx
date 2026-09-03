import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState, AppStateStatus } from "react-native";
import {
  AccesoConfig,
  autenticarConBiometria,
  capacidadBiometria,
  CapacidadBiometria,
  obtenerConfigAcceso,
  verificarContrasena,
} from "../services/accesoService";

interface AccesoContextValue {
  listo: boolean;
  config: AccesoConfig;
  bloqueado: boolean;
  biometria: CapacidadBiometria;
  refrescar: () => Promise<void>;
  desbloquearConContrasena: (contrasena: string) => Promise<boolean>;
  desbloquearConBiometria: () => Promise<boolean>;
  marcarDesbloqueado: () => void;
}

const AccesoContext = createContext<AccesoContextValue | null>(null);

const SEGUNDOS_REBLOQUEO = 20;

export function AccesoProvider({ children }: { children: React.ReactNode }) {
  const [listo, setListo] = useState(false);
  const [config, setConfig] = useState<AccesoConfig>({
    bloqueoActivo: false,
    biometriaActiva: false,
    salt: "",
  });
  const [bloqueado, setBloqueado] = useState(false);
  const [biometria, setBiometria] = useState<CapacidadBiometria>({
    disponible: false,
    enrolada: false,
    etiqueta: "Biometría",
    detalle: "",
  });
  const backgroundAt = useRef<number | null>(null);
  const primeraCarga = useRef(true);

  const refrescar = useCallback(async () => {
    const cfg = await obtenerConfigAcceso();
    const bio = await capacidadBiometria();
    setConfig(cfg);
    setBiometria(bio);
    if (primeraCarga.current) {
      primeraCarga.current = false;
      setBloqueado(cfg.bloqueoActivo);
    } else if (!cfg.bloqueoActivo) {
      setBloqueado(false);
    }
    setListo(true);
  }, []);

  useEffect(() => {
    refrescar();
  }, [refrescar]);

  useEffect(() => {
    const onChange = (estado: AppStateStatus) => {
      if (estado === "background" || estado === "inactive") {
        backgroundAt.current = Date.now();
        return;
      }
      if (estado === "active" && config.bloqueoActivo) {
        const desde = backgroundAt.current;
        backgroundAt.current = null;
        if (desde != null && Date.now() - desde >= SEGUNDOS_REBLOQUEO * 1000) {
          setBloqueado(true);
        }
      }
    };
    const sub = AppState.addEventListener("change", onChange);
    return () => sub.remove();
  }, [config.bloqueoActivo]);

  const desbloquearConContrasena = useCallback(async (contrasena: string) => {
    const ok = await verificarContrasena(contrasena);
    if (ok) setBloqueado(false);
    return ok;
  }, []);

  const desbloquearConBiometria = useCallback(async () => {
    const ok = await autenticarConBiometria();
    if (ok) setBloqueado(false);
    return ok;
  }, []);

  const marcarDesbloqueado = useCallback(() => setBloqueado(false), []);

  const value = useMemo(
    () => ({
      listo,
      config,
      bloqueado: listo && bloqueado && config.bloqueoActivo,
      biometria,
      refrescar,
      desbloquearConContrasena,
      desbloquearConBiometria,
      marcarDesbloqueado,
    }),
    [
      listo,
      config,
      bloqueado,
      biometria,
      refrescar,
      desbloquearConContrasena,
      desbloquearConBiometria,
      marcarDesbloqueado,
    ]
  );

  return <AccesoContext.Provider value={value}>{children}</AccesoContext.Provider>;
}

export function useAcceso(): AccesoContextValue {
  const ctx = useContext(AccesoContext);
  if (!ctx) throw new Error("useAcceso debe usarse dentro de AccesoProvider");
  return ctx;
}
