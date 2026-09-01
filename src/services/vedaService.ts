/**
 * Lógica de periodos hábiles (vedas) por especie.
 *
 * Datos de partida basados en la Orden 30/2016 de la Conselleria de
 * Agricultura, Medio Ambiente, Cambio Climático y Desarrollo Rural y sus
 * modificaciones posteriores. HAY QUE VERIFICAR cada temporada porque la
 * Generalitat publica resoluciones anuales que ajustan fechas exactas.
 *
 * Fuente oficial a consultar y mantener actualizada:
 * https://mediambient.gva.es/es/web/medio-natural/caca-i-pesca
 */

export interface PeriodoHabil {
  especieId: string;
  inicio: { mes: number; dia: number };
  fin: { mes: number; dia: number };
  todoElAnio?: boolean;
  notas?: string;
}

export const PERIODOS_HABILES: PeriodoHabil[] = [
  {
    especieId: "trucha_comun",
    inicio: { mes: 3, dia: 15 }, // aprox. tercer domingo de marzo, revisar cada año
    fin: { mes: 8, dia: 31 },
    notas: "Fecha de inicio variable (tercer domingo de marzo). Confirmar en la orden anual.",
  },
  {
    especieId: "trucha_arcoiris",
    inicio: { mes: 3, dia: 15 },
    fin: { mes: 8, dia: 31 },
    notas: "Sin cupo ni talla mínima. Solo mosca o cucharilla, un anzuelo sin arponcillo.",
  },
  {
    especieId: "black_bass",
    inicio: { mes: 1, dia: 1 },
    fin: { mes: 12, dia: 31 },
    todoElAnio: true,
    notas: "Especie invasora: en la mayoría de embalses no hay veda ni cupo.",
  },
  {
    especieId: "lucio",
    inicio: { mes: 1, dia: 1 },
    fin: { mes: 12, dia: 31 },
    todoElAnio: true,
    notas: "Especie invasora, captura fomentada durante todo el año.",
  },
  {
    especieId: "carpa",
    inicio: { mes: 1, dia: 1 },
    fin: { mes: 12, dia: 31 },
    todoElAnio: true,
  },
  {
    especieId: "barbo",
    inicio: { mes: 1, dia: 1 },
    fin: { mes: 12, dia: 31 },
    todoElAnio: true,
    notas: "Revisar tallas mínimas y cupos, pueden variar por coto.",
  },
  {
    especieId: "siluro",
    inicio: { mes: 1, dia: 1 },
    fin: { mes: 12, dia: 31 },
    todoElAnio: true,
    notas: "Sin veda, pero con normativa propia: prohibida su tenencia/transporte (vivo o muerto) y notificación obligatoria a agentes medioambientales.",
  },
];

export function estaEnVeda(especieId: string, fecha: Date = new Date()): boolean {
  const periodo = PERIODOS_HABILES.find((p) => p.especieId === especieId);
  if (!periodo) return false; // sin dato = no bloqueamos, pero habría que avisar
  if (periodo.todoElAnio) return false;

  const mes = fecha.getMonth() + 1;
  const dia = fecha.getDate();
  const enRango =
    (mes > periodo.inicio.mes || (mes === periodo.inicio.mes && dia >= periodo.inicio.dia)) &&
    (mes < periodo.fin.mes || (mes === periodo.fin.mes && dia <= periodo.fin.dia));

  return !enRango;
}
