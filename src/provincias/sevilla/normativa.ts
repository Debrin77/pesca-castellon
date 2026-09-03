/**
 * Marco normativo oficial de pesca continental en Andalucía (Sevilla).
 *
 * Fuente: Orden de 13 de enero de 2023 (BOJA nº 15 de 24/01/2023),
 * por la que se fijan y regulan las vedas, periodos hábiles y condiciones
 * del ejercicio de la pesca continental recreativa y deportiva.
 *
 * Cartografía: DERA 08_10_CotosPesca (IECA / Junta, CC BY 4.0) y visor
 * de pesca continental de la Consejería.
 *
 * No sustituye el BOJA, resoluciones posteriores ni la señalización del tramo.
 */

export const FUENTE_NORMATIVA_ANDALUCIA = {
  titulo: "Orden 13/01/2023 · vedas y pesca continental Andalucía (BOJA nº 15)",
  vigenciaNota:
    "Vigente salvo resolución posterior de la Junta. Confirma BOJA y el visor de pesca continental. Cartografía DERA 08_10_CotosPesca (IECA).",
  urlLicencia: "https://www.juntadeandalucia.es/servicios/sede/tramites/detalle/6671.html",
  urlNormativa: "https://www.juntadeandalucia.es/boja/2023/15/1",
  urlVisor: "https://www.juntadeandalucia.es/medioambiente/portal/web/caza-y-pesca/visor-pesca-continental",
  urlVedas:
    "https://www.juntadeandalucia.es/medioambiente/portal/web/caza-y-pesca/pesca-continental/vedas-periodos-habiles",
};

export type AprovechamientoAndalucia = "ZPL" | "ZPC" | "VP";

export const MAPA_APROVECHAMIENTO_ANDALUCIA: Record<
  AprovechamientoAndalucia,
  { nombreAndalucia: string; etiquetaUi: string }
> = {
  ZPL: { nombreAndalucia: "Aguas libres (art. 5.2)", etiquetaUi: "Zona libre (ZPL)" },
  ZPC: { nombreAndalucia: "Coto de pesca (Anexos I, II y V.4)", etiquetaUi: "Coto (ZPC)" },
  VP: { nombreAndalucia: "Refugio de pesca (Anexo IV)", etiquetaUi: "Refugio / vedado (VP)" },
};

/** Art. 7.2.b: barbo captura y suelta, 1 julio – 25 febrero. */
export function periodoBarboAbierto(fecha: Date = new Date()): boolean {
  const m = fecha.getMonth() + 1;
  const d = fecha.getDate();
  if (m === 3 || m === 4 || m === 5 || m === 6) return false;
  if (m === 2 && d > 25) return false;
  return true;
}

/** Art. 7.2.a: boga captura y suelta, 1 mayo – 31 enero. */
export function periodoBogaAbierto(fecha: Date = new Date()): boolean {
  const m = fecha.getMonth() + 1;
  return m !== 2 && m !== 3 && m !== 4;
}

export function etiquetaTemporadaCiprinicola(): string {
  return "Aguas libres: exóticas todo el año. Barbo (captura y suelta) 1 jul–25 feb. Boga (captura y suelta) 1 may–31 ene. Art. 7 Orden 13/01/2023.";
}

export function textoVigenciaNormativaAndalucia(): string {
  return `${FUENTE_NORMATIVA_ANDALUCIA.titulo}. ${FUENTE_NORMATIVA_ANDALUCIA.vigenciaNota}`;
}

export const HORARIO_ORIENTATIVO_ANDALUCIA =
  "Art. 4: de una hora antes del orto a una hora después del ocaso, salvo competiciones oficiales FAPD que requieran horario nocturno.";

export const REGLAS_GENERALES_ANDALUCIA = [
  "Licencia de pesca continental de Andalucía (Junta) obligatoria.",
  "Aguas libres (art. 5.2): toda masa no delimitada como coto o refugio. En Sevilla no hay cotos de ciprínidos en el Anexo V.4.",
  "Refugios (Anexo IV): pesca prohibida con carácter permanente. Cartografía DERA.",
  "Art. 6: no pescar a menos de 200 m de presas, escalas y pasos de peces.",
  "Barbo y boga: solo captura y suelta (art. 7.2). Periodos: barbo 1 jul–25 feb; boga 1 may–31 ene.",
  "Tenca y cacho: pesca prohibida (art. 2.2).",
  "Anguila: no es especie objeto de pesca (Decreto 209/2020).",
  "Exóticas (carpa, bass, lucio, carpín): todo el año, sin talla ni cupo. Bass/lucio/carpa solo en áreas de la Resolución 19/12/2019; fuera de ellas, sacrificio inmediato (art. 8).",
  "Alburno, siluro y otras invasoras no listadas en art. 2: no son objeto de pesca; si se capturan, no devolver.",
  "Cangrejo rojo: solo controladores autorizados (Orden 3/08/2016, marismas del Guadalquivir).",
  "Una caña en aguas trucheras; dos cañas en el resto, máximo 10 m entre ellas (art. 9).",
];

export const CHECKLIST_ANTES_DE_PESCAR_ANDALUCIA = [
  "Licencia de pesca continental de Andalucía en vigor.",
  "Comprobar que el punto no cae en un refugio de pesca (Anexo IV / polígono DERA).",
  "200 m de presas, escalas y pasos de peces: no pescar.",
  "Si pescas barbo o boga: periodo hábil y captura y suelta.",
  "Invasoras: no traslocar; sacrificio si la norma lo exige (RD 630/2013 y art. 8).",
  "Horario: 1 h antes del orto – 1 h después del ocaso.",
  "Llevar DNI/NIE y la licencia (digital o física).",
];
