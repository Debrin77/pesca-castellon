import tramos from "../data/tramosOficiales.json";
import ptopCotos from "../data/ptopCotos.json";
import {
  Aprovechamiento,
  diaHabilMijares,
  etiquetaTemporadaTrucha,
  temporadaTruchaAbierta,
} from "../data/normativa2026";
import { distanciaKm } from "./geoService";
import {
  buscarPoligonoIcv,
  matriculasConPoligono,
  PoligonoIcv,
  tramosConPoligono,
} from "./geojsonHit";

export interface TramoOficial {
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
}

export type VeredictoPesca =
  | "libre"
  | "coto"
  | "vedado"
  | "reserva_trucha"
  | "fuera_catalogo";

export interface ConsultaPesca {
  veredicto: VeredictoPesca;
  titulo: string;
  color: string;
  tramo: TramoOficial | null;
  distanciaKm: number | null;
  dentroDelRadio: boolean;
  sePuedePescarHoy: boolean;
  restriccionesHoy: string[];
  permisos: string[];
  fuenteGeometria: "poligono_icv" | "radio_anexo" | "ninguna";
  confianza: "oficial" | "aproximada";
  ambito?: "continental" | "maritimo";
}

const COLORES: Record<VeredictoPesca, string> = {
  libre: "#2f7d4a",
  coto: "#c45c12",
  vedado: "#b42318",
  reserva_trucha: "#5b4aa8",
  fuera_catalogo: "#4d5d54",
};

function notaDias(nota: string | null | undefined): "ZPL1" | "ZPL2" | null {
  if (nota === "ZPL1" || nota === "ZPL2") return nota;
  return null;
}

export function colorAprovechamiento(a: Aprovechamiento): string {
  if (a === "ZPL") return COLORES.libre;
  if (a === "ZPC") return COLORES.coto;
  if (a === "ZRTC") return COLORES.reserva_trucha;
  return COLORES.vedado;
}

export function etiquetaAprovechamiento(a: Aprovechamiento): string {
  if (a === "ZPL") return "Zona libre (ZPL)";
  if (a === "ZPC") return "Coto / zona controlada (ZPC)";
  if (a === "ZRTC") return "Reserva de trucha común";
  return "Vedado de pesca";
}

function tramoDesdePoligono(p: PoligonoIcv): TramoOficial {
  const existente = p.tramoId ? (tramos as TramoOficial[]).find((t) => t.id === p.tramoId) : undefined;
  if (existente) return existente;
  const ap: Aprovechamiento = p.capa === "zpc" ? "ZPC" : p.capa === "zrtc" ? "ZRTC" : "VP";
  return {
    id: `icv-${p.capa}-${p.id}`,
    codigo: p.matricula ?? p.id,
    nombre: p.nombre,
    rio: p.masa ?? "",
    lat: 0,
    lng: 0,
    radioKm: 0,
    vocacion: p.vocacion ?? "",
    regimen: ap === "ZPC" ? "Recreo" : "No pescable",
    aprovechamiento: ap,
    matriculaCoto: p.matricula ?? undefined,
    fichaId: null,
    especies: p.capa === "zra" ? ["anguila"] : p.capa === "zrtc" ? ["trucha_comun"] : [],
  };
}

export function tramoUsaRadioAnexo(t: TramoOficial): boolean {
  if (tramosConPoligono().has(t.id)) return false;
  if (t.matriculaCoto && matriculasConPoligono().has(t.matriculaCoto)) return false;
  return true;
}

export function buscarTramoCercano(lat: number, lng: number): { tramo: TramoOficial; distanciaKm: number; dentro: boolean } | null {
  let mejor: TramoOficial | null = null;
  let mejorD = Infinity;
  for (const t of tramos as TramoOficial[]) {
    if (!tramoUsaRadioAnexo(t)) continue;
    const d = distanciaKm(lat, lng, t.lat, t.lng);
    if (d < mejorD) {
      mejorD = d;
      mejor = t;
    }
  }
  if (!mejor) return null;
  return { tramo: mejor, distanciaKm: mejorD, dentro: mejorD <= mejor.radioKm };
}

function evaluarTramo(
  t: TramoOficial,
  distancia: number,
  fuenteGeometria: ConsultaPesca["fuenteGeometria"],
  fecha: Date
): ConsultaPesca {
  const confianza: ConsultaPesca["confianza"] = fuenteGeometria === "poligono_icv" ? "oficial" : "aproximada";
  const salmonicola = /salmon/i.test(t.vocacion);
  const truchaOk = temporadaTruchaAbierta(fecha);
  const nota = notaDias(t.notaAnexo);
  const diaOk = diaHabilMijares(nota, fecha);
  const dow = fecha.toLocaleDateString("es-ES", { weekday: "long" });

  const restricciones: string[] = [];
  const permisos: string[] = ["Licencia de pesca continental GVA."];
  if (fuenteGeometria === "poligono_icv") {
    permisos.push("Límite según polígono oficial ICV (no un círculo alrededor del centroide).");
  } else {
    restricciones.push(
      "Este tramo ZPL/VP aún no tiene polígono ICV: usamos el radio del anexo I alrededor del centroide. En la orilla exacta puede haber un error de decenas de metros."
    );
  }

  const base = {
    tramo: t,
    distanciaKm: distancia,
    dentroDelRadio: true,
    fuenteGeometria,
    confianza,
  };

  if (t.aprovechamiento === "VP") {
    restricciones.push("Aprovechamiento vedado: pesca prohibida en este tramo.");
    return {
      ...base,
      veredicto: "vedado",
      titulo: `Vedado · ${t.nombre}`,
      color: COLORES.vedado,
      sePuedePescarHoy: false,
      restriccionesHoy: restricciones,
      permisos,
    };
  }

  if (t.aprovechamiento === "ZRTC") {
    restricciones.push("Zona de reserva de trucha común: no se pesca. Cabecera protegida.");
    return {
      ...base,
      veredicto: "reserva_trucha",
      titulo: `Reserva de trucha · ${t.nombre}`,
      color: COLORES.reserva_trucha,
      sePuedePescarHoy: false,
      restriccionesHoy: restricciones,
      permisos,
    };
  }

  if (t.aprovechamiento === "ZPC") {
    permisos.push(
      `Permiso de coto intransferible (${t.matriculaCoto ?? "ZPC"}). Lo expide el titular / servicios territoriales.`
    );
    restricciones.push("Sin ese permiso no es zona libre: es coto (zona de pesca controlada).");
    restricciones.push(ptopCotos.avisoPtop);
    {
      const mat = t.matriculaCoto;
      const ficha = mat ? (ptopCotos.cotos as Record<string, { nombre: string; ptopPublico: boolean }>)[mat] : undefined;
      restricciones.push(
        ficha
          ? `${mat} · ${ficha.nombre}. Plan técnico no publicado aquí. ${ptopCotos.oficina}`
          : `Pregunta por la matrícula del coto. ${ptopCotos.oficina}`
      );
    }
  } else {
    permisos.push("No hace falta permiso de coto: es zona de pesca libre (ZPL).");
  }

  if (t.id === "m10.9") {
    restricciones.push(
      "Sitjar / Sichar: la Resolución 2/11/2006 (DOGV) prohibió la pesca deportiva por mejillón cebra. Turismo Castellón sigue diciendo que no se pesca. El anexo de 2024 lista un tramo ZPL de recreo: antes de lanzar, mira la señalización o pregunta a agentes. No recomendamos 'mejores sitios' aquí."
    );
  }
  if (t.id === "r10.26") {
    restricciones.push(
      "María Cristina: en 2024 la CHJ retiró toneladas de pez (siluro, carpa, carpín) por sequía. El SAIH marca el nivel; si está muy bajo, espera poca pesca."
    );
  }

  if (salmonicola) {
    permisos.push(`Tramos trucheros: ${etiquetaTemporadaTrucha(fecha.getFullYear())}.`);
    permisos.push("Una caña, sin abandono, anzuelo sin arpón, solo mosca o cucharilla. Trucha común siempre sin muerte.");
    if (!truchaOk) {
      restricciones.push("Fuera de temporada salmonícola: no pesques trucha común. El tramo puede estar cerrado a salmónidos.");
    }
    if (nota === "ZPL1") {
      restricciones.push("Días hábiles (nota 1 del anexo, primer tramo del Mijares): martes, jueves, sábados y domingo.");
      if (!diaOk) restricciones.push(`Hoy es ${dow}: no es día hábil en este tramo.`);
    }
    if (nota === "ZPL2") {
      restricciones.push("Días hábiles (nota 2): solo martes y jueves.");
      if (!diaOk) restricciones.push(`Hoy es ${dow}: no es día hábil en este tramo.`);
    }
  } else {
    permisos.push(
      "Aguas no trucheras: artículos 2 y 8 de la Orden 30/2016. Lombriz/asticot permitidos. Autóctonos de la tabla 2.2 con talla o sin muerte según especie."
    );
  }

  let sePuedePescarHoy = true;
  if (t.aprovechamiento === "ZPC") sePuedePescarHoy = false;
  if (salmonicola && (!truchaOk || !diaOk)) sePuedePescarHoy = false;

  return {
    ...base,
    veredicto: t.aprovechamiento === "ZPC" ? "coto" : "libre",
    titulo: `${etiquetaAprovechamiento(t.aprovechamiento)} · ${t.nombre}`,
    color: colorAprovechamiento(t.aprovechamiento),
    sePuedePescarHoy,
    restriccionesHoy: restricciones,
    permisos,
  };
}

export function consultarPorTramo(t: TramoOficial, fecha: Date = new Date()): ConsultaPesca {
  const fuente: ConsultaPesca["fuenteGeometria"] = tramoUsaRadioAnexo(t) ? "radio_anexo" : "poligono_icv";
  return evaluarTramo(t, 0, fuente, fecha);
}

export function consultarPuntoPesca(lat: number, lng: number, fecha: Date = new Date()): ConsultaPesca {
  const poli = buscarPoligonoIcv(lat, lng);
  if (poli) {
    return evaluarTramo(tramoDesdePoligono(poli), 0, "poligono_icv", fecha);
  }

  const hallado = buscarTramoCercano(lat, lng);
  if (!hallado || !hallado.dentro) {
    return {
      veredicto: "fuera_catalogo",
      titulo: hallado
        ? `Fuera de tramo cartografiado (el más cercano: ${hallado.tramo.nombre}, ${hallado.distanciaKm.toFixed(1)} km)`
        : "Fuera del catálogo de tramos",
      color: COLORES.fuera_catalogo,
      tramo: hallado?.tramo ?? null,
      distanciaKm: hallado?.distanciaKm ?? null,
      dentroDelRadio: false,
      sePuedePescarHoy: false,
      fuenteGeometria: "ninguna",
      confianza: "aproximada",
      restriccionesHoy: [
        "Este punto no cae en un polígono ICV (coto o reserva) ni en el radio de un tramo del anexo I.",
        "Puede ser secano, mar o un cauce menor no listado. En mar rige la normativa marítima, no esta app.",
      ],
      permisos: ["Si hay un río o embalse a la vista, acércate a la orilla y vuelve a pulsar, o abre el visor GVA de caza y pesca."],
    };
  }

  return evaluarTramo(hallado.tramo, hallado.distanciaKm, "radio_anexo", fecha);
}

export function todosLosTramos(): TramoOficial[] {
  return tramos as TramoOficial[];
}
