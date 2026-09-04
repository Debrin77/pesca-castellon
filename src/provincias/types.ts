import type { Aprovechamiento } from "../data/normativa2026";

export type ProvinciaId = "castellon" | "sevilla";

export interface RegionMapa {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface EmbalsePanelMeta {
  /** Nombre tal como aparece en el SAIH (CHJ: "EMBALSE DE ARENÓS"; CHG: "E64 Cala"). */
  nombre: string;
  etiqueta: string;
  zoneId: string;
  /** Ficha numérica SAIH Júcar (solo CHJ). */
  fichaId?: number;
  /** Red hidrológica. Por defecto "chj" (Castellón). Sevilla usa "chg". */
  red?: "chj" | "chg";
  /** Página concreta del SAIH CHG (EmbalSE / EmbalCO). */
  urlPagina?: string;
}

export interface FuenteNormativaProvincia {
  titulo: string;
  vigenciaNota: string;
  urlOrden: string;
  urlLicencia: string;
}

/** Requisitos de licencia que cambian por comunidad / provincia. */
export interface RequisitosLicencia {
  /** Resumen corto para pantalla Licencias y banner. */
  resumen: string;
  /** Andalucía exige RC del pescador; GVA/Castellón no. */
  seguroObligatorio: boolean;
  /** Texto del requisito de seguro (u orden explícita de que no aplica). */
  seguroNota: string;
  /** Lista de requisitos distintivos (NIR, permisos de coto, etc.). */
  requisitos: string[];
}

export interface TramoProvincia {
  id: string;
  codigo: string;
  nombre: string;
  rio: string;
  lat: number;
  lng: number;
  radioKm: number;
  vocacion: string;
  regimen: string;
  aprovechamiento: Aprovechamiento;
  notaAnexo?: string | null;
  matriculaCoto?: string;
  fichaId?: string | null;
  especies: string[];
  cuenca?: string;
  municipios?: string[];
}

export interface ProvinciaConfig {
  id: ProvinciaId;
  nombre: string;
  /** Título corto en cabeceras ("Pesca Castellón"). */
  nombreApp: string;
  /** Solo ríos/embalses: sin capa costa ni oleaje. */
  continentalOnly: boolean;
  regionMapa: RegionMapa;
  /** Centro aproximado al cambiar a modo costa (solo si !continentalOnly). */
  regionCosta?: { latitude: number; longitude: number; zoom: number };
  cuencas: string[];
  tramos: TramoProvincia[];
  zones: any[];
  /** Catálogo de especies visibles en esta provincia. */
  species: any[];
  tieneIcv: boolean;
  tieneSaih: boolean;
  embalsesPanel: EmbalsePanelMeta[];
  fuenteNormativa: FuenteNormativaProvincia;
  checklistAntesDePescar: string[];
  etiquetaLicenciaContinental: string;
  requisitosLicencia: RequisitosLicencia;
  /** Texto breve bajo el semáforo / consultas. */
  notaConsultaAprox: string;
  oleaje?: { lat: number; lng: number; etiqueta: string };
}
