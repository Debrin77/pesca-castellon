/** Pedido de abrir la ficha de especies del punto ya elegido (evita carreras de params entre tabs). */
let abrirConsultaPendiente = false;

export function pedirAbrirConsultaEspecies() {
  abrirConsultaPendiente = true;
}

export function consumirAbrirConsultaEspecies(): boolean {
  const v = abrirConsultaPendiente;
  abrirConsultaPendiente = false;
  return v;
}
