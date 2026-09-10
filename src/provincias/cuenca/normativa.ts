/**
 * Marco normativo oficial de pesca fluvial en Castilla-La Mancha (Cuenca).
 *
 * Fuentes:
 * - Ley 1/1992, de 7 de mayo, de Pesca Fluvial (CLM).
 * - Decreto 91/1994 (Reglamento de desarrollo).
 * - Orden 20/2026, de 4 de febrero, de Vedas de Pesca de 2026 (DOCM 12/02/2026).
 *
 * Cartografía embebida: catálogo orientativo (OSM + anexos de la Orden).
 * No sustituye el visor JCCM, el DOCM ni la señalización del tramo.
 */

export const FUENTE_NORMATIVA_CLM = {
  titulo: "Orden 20/2026 · Vedas de pesca Castilla-La Mancha (DOCM 12/02/2026)",
  vigenciaNota:
    "Vigente para la temporada 2026 salvo resolución posterior. Confirma DOCM, visor de pesca JCCM y cartel del tramo. Ley 1/1992 de Pesca Fluvial.",
  urlLicencia: "https://diana.castillalamancha.es/diana/aInicio",
  urlNormativa: "https://cazaypesca.castillalamancha.es/pesca/ejercicio-pesca",
  urlVisor: "https://cazaypesca.castillalamancha.es/visores",
  urlVedas: "https://cazaypesca.castillalamancha.es/pesca/ejercicio-pesca",
  urlPermisosCoto: "https://ventaenlinea.castillalamancha.es/ventaenlinea/publico/tiendas/tiendasSOCO.jsf",
};

export type AprovechamientoClm = "ZPL" | "ZPC" | "VP";

export const MAPA_APROVECHAMIENTO_CLM: Record<
  AprovechamientoClm,
  { nombreClm: string; etiquetaUi: string }
> = {
  ZPL: { nombreClm: "Aguas libres", etiquetaUi: "Zona libre (ZPL)" },
  ZPC: { nombreClm: "Coto (especial / intensivo)", etiquetaUi: "Coto (ZPC)" },
  VP: { nombreClm: "Vedado / refugio de pesca", etiquetaUi: "Vedado / refugio (VP)" },
};

/** Aguas trucheras · baja montaña (Orden 20/2026 art. 2): 1 abr – 30 sep. */
export function periodoTruchaBajaMontana(fecha: Date = new Date()): boolean {
  const m = fecha.getMonth() + 1;
  const d = fecha.getDate();
  if (m > 4 && m < 9) return true;
  if (m === 4 && d >= 1) return true;
  if (m === 9 && d <= 30) return true;
  return false;
}

/** Aguas trucheras · alta montaña: 1 may – 15 oct. */
export function periodoTruchaAltaMontana(fecha: Date = new Date()): boolean {
  const m = fecha.getMonth() + 1;
  const d = fecha.getDate();
  if (m > 5 && m < 10) return true;
  if (m === 5 && d >= 1) return true;
  if (m === 10 && d <= 15) return true;
  return false;
}

/** Ventana genérica de trucha en Cuenca (baja montaña por defecto). */
export function periodoTruchaCuencaAbierto(fecha: Date = new Date()): boolean {
  return periodoTruchaBajaMontana(fecha);
}

export function etiquetaTemporadaTruchaCuenca(anio: number = new Date().getFullYear()): string {
  return `Trucheras CLM ${anio}: baja montaña 1 abr–30 sep; alta montaña 1 may–15 oct (art. 2 Orden 20/2026). Solo sin muerte.`;
}

export function textoVigenciaNormativaClm(): string {
  return `${FUENTE_NORMATIVA_CLM.titulo}. ${FUENTE_NORMATIVA_CLM.vigenciaNota}`;
}

/** Ley 1/1992: 1 h antes del orto – 1 h después del ocaso (salvo cangrejos / concursos nocturnos). */
export const HORARIO_LEGAL_CLM =
  "Ley 1/1992: de una hora antes de la salida del sol a una hora después de su puesta, salvo excepciones (cangrejos / concursos autorizados).";

export function avisosPorNotaAnexoClm(nota: string | null | undefined): string[] {
  switch (nota) {
    case "TRUCHERA":
      return [
        "Aguas trucheras (Plan de Gestión / Orden 20/2026): trucha solo sin muerte; anzuelos sin arponcillo.",
        "Fuera del periodo hábil queda prohibida la pesca de todas las especies salvo tramos de régimen especial de ciprínidos señalizados.",
      ];
    case "REFUGIO":
    case "VEDADO":
      return ["Vedado o refugio de pesca: pesca (y baño en refugios) prohibidos."];
    case "ART_PRESAS":
      return [
        "Art. 4.e Orden 20/2026: no pescar en escalas/pasos de peces ni a menos de 50 m (trucheras) / 10 m (resto) de su entrada o salida.",
      ];
    default:
      return [];
  }
}

/**
 * Embalses de Cuenca donde la Orden permite retención de barbos (cupo 6/día):
 * Contreras, Alarcón y Buendía (presa → puente nuevo Alcocer).
 */
export const EMBALSES_BARBO_CON_CUPO_CUENCA = new Set([
  "embalse_de_contreras",
  "embalse_de_alarcon",
  "embalse_de_buendia",
]);

export const REGLAS_GENERALES_CLM = [
  "Licencia de pesca de Castilla-La Mancha (JCCM / plataforma DIANA) obligatoria en ríos y embalses.",
  "No se exige seguro de RC del pescador para tramitar la licencia CLM (a diferencia de Andalucía).",
  "Cotos especiales e intensivos: además de la licencia, permiso del día (venta en línea JCCM / concesionario).",
  "Horario (Ley 1/1992): 1 h antes del orto – 1 h después del ocaso, salvo excepciones.",
  "Trucha común, madrija, cacho del Mediterráneo y bordallo del Tajo: solo pesca sin muerte en todo tipo de aguas.",
  "Anguila: pesca prohibida (temporada 2026 / normativa UE).",
  "Cuenca · barbos: solo sin muerte en todas las aguas, excepto Contreras, Alarcón y Buendía (presa→puente Alcocer), con cupo máx. 6 barbos/pescador/día.",
  "Aguas trucheras: periodos hábiles art. 2; anzuelos sin arponcillo; cebos según Plan de Gestión de la Trucha.",
  "Invasoras (Anexo I): sacrificio inmediato fuera de áreas Anexo III; no devolver ni traslocar (RD 630/2013).",
  "Siluro, cangrejo señal y otras del Anexo I con pesca prohibida: no son objeto de pesca.",
  "Prohibido cebado salvo embalses no trucheros (vegetal / asticot) y excepciones art. 7 provinciales.",
  "Prohibido pez vivo como cebo; en Alarcón hay restricciones extra de cebos y señuelos (art. 7.C.4.4).",
  "Escalas y pasos de peces: 50 m en trucheras / 10 m en el resto (art. 4.e).",
  "Limpia, seca y desinfecta material al cambiar de masa (mejillón cebra y otras alóctonas).",
];

export const CHECKLIST_ANTES_DE_PESCAR_CLM = [
  "Licencia de pesca de Castilla-La Mancha en vigor (DIANA / Delegación).",
  "Si es coto especial o intensivo: permiso del día además de la licencia.",
  "Comprobar que el punto no es vedado ni refugio (visor JCCM / cartel).",
  "Barbos en Cuenca: sin muerte salvo Contreras, Alarcón o Buendía (cupo 6).",
  "Trucha: solo sin muerte; confirma periodo hábil si es agua truchera.",
  "Invasoras: sacrificio si la norma lo exige; no traslocar (RD 630/2013).",
  "Horario: 1 h antes del orto – 1 h después del ocaso.",
  "Llevar DNI/NIE y licencia (y permiso de coto si aplica).",
  "Desinfectar y secar material al cambiar de masa de agua.",
];
