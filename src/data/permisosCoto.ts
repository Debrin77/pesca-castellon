import type { ProvinciaId } from "../provincias/types";
import ptopCastellon from "./ptopCotos.json";

export interface InfoPermisoCoto {
  matricula?: string;
  nombre: string;
  comoObtener: string;
  urlTramite?: string;
  telefonoOficina?: string;
  avisoPtop: string;
}

const AVISO_PTOP_CS = (ptopCastellon as { avisoPtop: string; oficina: string }).avisoPtop;
const OFICINA_CS = (ptopCastellon as { oficina: string }).oficina;

/** Enlaces y vías para permiso de coto / pase diario (sin inventar cupos PTOP). */
export function infoPermisoCoto(
  provinciaId: ProvinciaId,
  matricula?: string | null,
  nombreTramo?: string
): InfoPermisoCoto {
  if (provinciaId === "sevilla") {
    return {
      matricula: matricula ?? undefined,
      nombre: nombreTramo ?? "Coto / tramo acotado Andalucía",
      comoObtener:
        "Permiso de coto o autorización del titular según Orden anual de veda Andalucía. Consulta la Junta / REDIAM y el cartel del tramo.",
      urlTramite: "https://www.juntadeandalucia.es/organismos/agriculturapescaaguaydesarrollorural.html",
      avisoPtop:
        "Los cupos y días del coto los fija el plan o la orden anual. Esta app no sustituye el permiso del día.",
    };
  }

  const cotos = (ptopCastellon as { cotos: Record<string, { nombre: string }> }).cotos;
  const meta = matricula ? cotos[matricula] : undefined;
  return {
    matricula: matricula ?? undefined,
    nombre: meta?.nombre ?? nombreTramo ?? "Coto (ZPC)",
    comoObtener: `Pide el permiso del día al titular del coto o en la oficina GVA. ${OFICINA_CS}`,
    urlTramite: "https://sede.gva.es/es/detall-tramit?id_proc=681",
    telefonoOficina: undefined,
    avisoPtop: AVISO_PTOP_CS,
  };
}

export const ENLACES_PERMISOS = {
  castellonLicencia: "https://sede.gva.es/es/detall-tramit?id_proc=681",
  castellonMaritima: "https://sede.gva.es/es/inicio/procedimientos?id_proc=17170",
  sevillaJunta: "https://www.juntadeandalucia.es/organismos/agriculturapescaaguaydesarrollorural.html",
  pescaRec: "https://www.mapa.gob.es/es/pesca/temas/pesca-maritima-de-recreo/pesca-rec/",
  pescaRecStoreAndroid: "https://play.google.com/store/apps/details?id=es.gob.map.pescarec",
  pescaRecStoreIos: "https://apps.apple.com/es/app/pescarec/id6752486687",
};
