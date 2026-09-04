/**
 * Puente ligero entre Capturas ↔ Mapa cuando el usuario elige
 * "pulsar en el mapa" para un punto o una captura.
 * No persiste: solo vive mientras dura la navegación.
 */

export type MotivoUbicacionPendiente = "punto" | "captura";

export type UbicacionElegida = {
  lat: number;
  lng: number;
  etiqueta?: string;
};

type Estado = {
  motivo: MotivoUbicacionPendiente;
  resultado: UbicacionElegida | null;
  consumido: boolean;
};

let pendiente: Estado | null = null;

export function iniciarPickUbicacion(motivo: MotivoUbicacionPendiente): void {
  pendiente = { motivo, resultado: null, consumido: false };
}

export function hayPickUbicacion(motivo?: MotivoUbicacionPendiente): boolean {
  if (!pendiente || pendiente.consumido) return false;
  // Tras resolver, el mapa ya no está en modo elegir; Capturas consumirá el resultado.
  if (pendiente.resultado) return false;
  if (motivo && pendiente.motivo !== motivo) return false;
  return true;
}

export function motivoPickActivo(): MotivoUbicacionPendiente | null {
  if (!pendiente || pendiente.consumido || pendiente.resultado) return null;
  return pendiente.motivo;
}

export function resolverPickUbicacion(ubicacion: UbicacionElegida): void {
  if (!pendiente || pendiente.consumido) return;
  pendiente.resultado = ubicacion;
}

export function cancelarPickUbicacion(): void {
  pendiente = null;
}

/** Lee y limpia el resultado (una sola vez). */
export function consumirPickUbicacion(motivo: MotivoUbicacionPendiente): UbicacionElegida | null {
  if (!pendiente || pendiente.motivo !== motivo) return null;
  const r = pendiente.resultado;
  pendiente.consumido = true;
  pendiente = null;
  return r;
}
