/**
 * Documentación que debe pedir el pescador para kayak:
 * - Embalse: navegación (organismo de cuenca) + pesca (licencia CCAA).
 * - Mar (solo Castellón en esta app): kayak ≠ barco matriculado.
 *
 * Orientativo. Confirma CHJ/CHG/CHT, GVA/Junta/JCCM y PescaREC.
 */

export type DocumentacionKayakProvincia = {
  provinciaId: "castellon" | "sevilla" | "cordoba" | "cuenca";
  /** Navegación + pesca en embalses del catálogo. */
  embalse: {
    organismoTipico: string;
    resumen: string;
    /** Qué trámites / papeles pedir para NAVEGAR. */
    navegacion: string[];
    /** Qué trámites / papeles pedir para PESCAR desde el kayak. */
    pesca: string[];
  };
  /**
   * Mar: solo Castellón tiene modalidad barco/kayak en la app.
   * null = provincia continental-only (no hay flujo marítimo aquí).
   */
  mar: {
    resumen: string;
    kayak: string[];
    barcoMatriculado: string[];
  } | null;
};

export const DOCUMENTACION_KAYAK_POR_PROVINCIA: DocumentacionKayakProvincia[] = [
  {
    provinciaId: "castellon",
    embalse: {
      organismoTipico: "CHJ (Confederación Hidrográfica del Júcar)",
      resumen:
        "En embalse: la CHJ autoriza la navegación (declaración responsable); la GVA exige la licencia continental para pescar. No se sustituyen.",
      navegacion: [
        "Declaración responsable (DR) de navegación ante la CHJ si tu kayak tiene eslora ≥ 2,5 m (o ≥ 1,5 m en masas con mejillón cebra). Por debajo se equipara a flotador de baño (solo donde el baño esté permitido).",
        "Formulario DR + hoja informativa vigentes en chj.es (trámites de navegación).",
        "En masas con mejillón cebra: compromiso de confinamiento / protocolo de limpieza según anexo CHJ.",
        "Si el embalse es de otro concesionario: notificación previa al explotador (la CHJ puede denegar sin ella).",
        "Seguro RC de la embarcación: la CHJ lo exige sobre todo a motor/vela > 4 m; kayak a remo habitual — confirma la hoja HI vigente.",
      ],
      pesca: [
        "Licencia de pesca continental GVA (vigente) encima + DNI/NIE.",
        "Si el tramo es coto (ZPC): permiso del coto del día además de la licencia.",
        "No se exige seguro RC del pescador en la Comunitat Valenciana.",
      ],
    },
    mar: {
      resumen:
        "En mar de Castellón el kayak NO se tramita como «embarcación» de recreo: es artefacto flotante. El barco matriculado sí pide licencia y papeles de embarcación.",
      kayak: [
        "Licencia de pesca marítima recreativa DESDE TIERRA (GVA). El kayak / artefacto flotante usa esta licencia, no la de «desde embarcación».",
        "PescaREC (Ministerio): registra/declara la jornada cuando la norma lo exija (pesca marítima recreativa desde 2026).",
        "Chaleco y plan de regreso; no pesques en dársena, fondeo ni Columbretes sin norma que lo permita.",
        "No hace falta matrícula de buque ni licencia de embarcación para el kayak como artefacto flotante.",
      ],
      barcoMatriculado: [
        "Licencia de pesca marítima recreativa DESDE EMBARCACIÓN (GVA) — distinta de la de «desde tierra».",
        "Documentación de la embarcación: asiento / permiso de navegación / certificado según lista del Registro Oficial de Buques.",
        "Titulación náutica del patrón cuando la eslora/potencia lo exija.",
        "PescaREC para declaraciones / autorizaciones estatales que apliquen.",
        "La licencia «desde tierra» sola NO cubre la pesca desde barco matriculado.",
      ],
    },
  },
  {
    provinciaId: "sevilla",
    embalse: {
      organismoTipico: "CHG (Confederación Hidrográfica del Guadalquivir)",
      resumen:
        "En embalse: la CHG marca si puedes navegar (tabla Plan Hidrológico / IDE); la Junta exige licencia continental + NIR + seguro RC para pescar. Algunos vasos de abastecimiento no autorizan navegación recreativa.",
      navegacion: [
        "Comprobar en IDE / tabla CHG si el embalse admite navegación recreativa (remo/pala/kayak).",
        "Si está autorizado: declaración responsable de navegación ante la CHG (antelación según hoja informativa vigente).",
        "Canon de ocupación / navegación cuando proceda.",
        "En masas con EEI (mejillón cebra): protocolo de desinfección; si hay confinamiento, no sacar el kayak sin lavado autorizado.",
      ],
      pesca: [
        "Licencia continental Junta de Andalucía vigente.",
        "Nº de Identificación de Pescador (NIR) del Registro Andaluz.",
        "Seguro obligatorio de responsabilidad civil del pescador (justificante encima).",
        "Si hay coto o plan específico: permiso/cartel del titular. Refugios Anexo IV: no se pesca.",
      ],
    },
    mar: null,
  },
  {
    provinciaId: "cordoba",
    embalse: {
      organismoTipico: "CHG (Confederación Hidrográfica del Guadalquivir)",
      resumen:
        "Misma lógica que Sevilla: CHG = navegación; Junta = pesca (licencia + NIR + seguro RC). Iznájar y Breña suelen ir condicionados por EEI/confinamiento.",
      navegacion: [
        "Consultar IDE / tabla CHG del vaso (Iznájar, Breña, Navallana, Puente Nuevo, etc.).",
        "Declaración responsable CHG si la navegación está autorizada o condicionada.",
        "Desinfección / confinamiento cuando el embalse figure con mejillón cebra u otra EEI.",
        "Puente Nuevo: además umbrales de volumen/calidad citados por la CHG — no asumas el permiso si no se cumplen.",
      ],
      pesca: [
        "Licencia continental Junta de Andalucía + NIR.",
        "Seguro obligatorio de RC del pescador.",
        "En Iznájar: además régimen Anexo V.2 (horario orto→ocaso, límites de aparejo) — no cambia la documentación de navegación CHG.",
      ],
    },
    mar: null,
  },
  {
    provinciaId: "cuenca",
    embalse: {
      organismoTipico: "CHJ (Júcar: Alarcón, Contreras, La Toba…) o CHT (Tajo: Buendía, Bolarque)",
      resumen:
        "La navegación la marca la confederación del vaso (CHJ o CHT). La pesca exige licencia CLM (+ permiso de coto si aplica). La licencia JCCM no sustituye la DR de navegación.",
      navegacion: [
        "Embalses CHJ (p. ej. Alarcón, Contreras, La Toba): DR de navegación CHJ con las mismas reglas de eslora/mejillón cebra que en Castellón.",
        "La Toba / vasos de otro concesionario: notificación previa al explotador además de la DR.",
        "Embalses CHT (Buendía, Bolarque): declaración responsable de navegación ante la CHT (sede MITECO/CHT).",
        "Buendía/Bolarque: confinamiento anti-mejillón cebra (resoluciones/BOE vigentes) — desinfección al cambiar de masa.",
        "Documentación y seguro de la embarcación según instrucciones CHT/CHJ de la hoja informativa.",
      ],
      pesca: [
        "Licencia de pesca de Castilla-La Mancha (DIANA / Delegación) vigente + DNI/NIE.",
        "En cotos especiales o intensivos: permiso del día (venta en línea JCCM / concesionario).",
        "No se exige seguro RC del pescador con carácter general en CLM.",
      ],
    },
    mar: null,
  },
];

export function documentacionKayakDeProvincia(
  provinciaId: string | null | undefined
): DocumentacionKayakProvincia | null {
  if (!provinciaId) return null;
  return DOCUMENTACION_KAYAK_POR_PROVINCIA.find((p) => p.provinciaId === provinciaId) ?? null;
}
