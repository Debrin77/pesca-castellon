/**
 * Navegación a una pestaña con pantalla anidada (y params opcionales).
 * Evita marear al usuario: el punto ya elegido se reutiliza vía params / contexto.
 */
import { pedirAbrirConsultaEspecies } from "../services/especiesPendiente";

export function irATab(
  navigation: { navigate: (...args: any[]) => void; getParent?: () => any },
  tab: string,
  screen: string,
  params?: Record<string, unknown>
) {
  const dest = params ? { screen, params } : { screen };
  const parent = navigation.getParent?.();
  if (parent?.navigate) {
    parent.navigate(tab, dest);
  } else {
    navigation.navigate(tab, dest);
  }
}

/** Abre Especies con la ficha del punto ya consultado (no vuelve a pedir el mapa). */
export function irAEspeciesDelPunto(navigation: {
  navigate: (...args: any[]) => void;
  getParent?: () => any;
}) {
  pedirAbrirConsultaEspecies();
  irATab(navigation, "Especies", "EspeciesMain", { abrirConsulta: true });
}
