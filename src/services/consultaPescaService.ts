import ptopCotos from "../data/ptopCotos.json";
import {
  Aprovechamiento,
  diaHabilMijares,
  etiquetaTemporadaTrucha,
  temporadaTruchaAbierta,
} from "../data/normativa2026";
import { periodoBarboAbierto, periodoBogaAbierto, avisosPorNotaAnexo } from "../provincias/sevilla/normativa";
import { getProvinciaActiva } from "../provincias/runtime";
import { distanciaKm } from "./geoService";
import {
  buscarPoligonoIcv,
  matriculasConPoligono,
  PoligonoIcv,
  tramosConPoligono,
} from "./geojsonHit";
import { PIN, SEMAFORO } from "../theme";

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
  /** Cuenca hidrológica orientativa (Mijares, Palancia, Sénia…). */
  cuenca?: string;
  /** Municipios asociados para el buscador. */
  municipios?: string[];
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
  especiesHabituales?: string;
  especiesIds?: string[];
  sitiosCosta?: { nombre: string; especies: string; cuando: string; detalle: string }[];
}

const COLORES: Record<VeredictoPesca, string> = {
  libre: SEMAFORO.si,
  coto: SEMAFORO.coto,
  vedado: SEMAFORO.no,
  reserva_trucha: SEMAFORO.no,
  fuera_catalogo: SEMAFORO.neutro,
};

export function colorSemaforo(c: Pick<ConsultaPesca, "veredicto" | "sePuedePescarHoy">): string {
  if (c.veredicto === "coto") return SEMAFORO.coto;
  if (c.veredicto === "vedado" || c.veredicto === "reserva_trucha") return SEMAFORO.no;
  if (c.veredicto === "fuera_catalogo") return SEMAFORO.neutro;
  if (c.sePuedePescarHoy) return SEMAFORO.si;
  return SEMAFORO.no;
}

function notaDias(nota: string | null | undefined): "ZPL1" | "ZPL2" | null {
  if (nota === "ZPL1" || nota === "ZPL2") return nota;
  return null;
}

export function colorAprovechamiento(a: Aprovechamiento): string {
  if (a === "ZPL") return PIN.libre;
  if (a === "ZPC") return PIN.coto;
  return PIN.vedado;
}

export function etiquetaAprovechamiento(a: Aprovechamiento): string {
  if (a === "ZPL") return "Zona libre (ZPL)";
  if (a === "ZPC") return "Coto / zona controlada (ZPC)";
  if (a === "ZRTC") return "Reserva de trucha común";
  return "Vedado de pesca";
}

function tramosActivos(): TramoOficial[] {
  return getProvinciaActiva().tramos as TramoOficial[];
}

function tramoDesdePoligono(p: PoligonoIcv): TramoOficial {
  const existente = p.tramoId ? tramosActivos().find((t) => t.id === p.tramoId) : undefined;
  if (existente) return existente;
  const ap: Aprovechamiento =
    p.capa === "zpc" ? "ZPC" : p.capa === "zpl" ? "ZPL" : p.capa === "zrtc" ? "ZRTC" : "VP";
  return {
    id: `icv-${p.capa}-${p.id}`,
    codigo: p.matricula ?? p.id,
    nombre: p.nombre,
    rio: p.masa ?? "",
    lat: 0,
    lng: 0,
    radioKm: 0,
    vocacion: p.vocacion ?? "",
    regimen: ap === "ZPC" || ap === "ZPL" ? "Recreo" : "No pescable",
    aprovechamiento: ap,
    matriculaCoto: p.matricula ?? undefined,
    fichaId: null,
    especies: p.capa === "zra" ? ["anguila"] : p.capa === "zrtc" ? ["trucha_comun"] : [],
  };
}

export function tramoUsaRadioAnexo(t: TramoOficial): boolean {
  const p = getProvinciaActiva();
  if (!p.tieneIcv) return true;
  if (tramosConPoligono().has(t.id)) return false;
  if (t.matriculaCoto && matriculasConPoligono().has(t.matriculaCoto)) return false;
  return true;
}

export function buscarTramoCercano(
  lat: number,
  lng: number
): { tramo: TramoOficial; distanciaKm: number; dentro: boolean } | null {
  let mejor: TramoOficial | null = null;
  let mejorD = Infinity;
  for (const t of tramosActivos()) {
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
  const provincia = getProvinciaActiva();
  const esAndalucia = provincia.id === "sevilla";
  const confianza: ConsultaPesca["confianza"] =
    fuenteGeometria === "poligono_icv" ? "oficial" : "aproximada";
  const salmonicola = /salmon/i.test(t.vocacion);
  const truchaOk = temporadaTruchaAbierta(fecha);
  const nota = notaDias(t.notaAnexo);
  const diaOk = diaHabilMijares(nota, fecha);
  const dow = fecha.toLocaleDateString("es-ES", { weekday: "long" });

  const restricciones: string[] = [];
  const permisos: string[] = [provincia.etiquetaLicenciaContinental];
  if (esAndalucia && provincia.requisitosLicencia.seguroObligatorio) {
    permisos.push("Seguro obligatorio de responsabilidad civil del pescador (Junta de Andalucía).");
  }
  if (fuenteGeometria === "poligono_icv") {
    permisos.push(
      esAndalucia
        ? "Límite según polígono oficial DERA / Junta de Andalucía (Orden 13/01/2023), no un círculo alrededor del centroide."
        : "Límite según polígono oficial ICV (no un círculo alrededor del centroide)."
    );
  } else {
    restricciones.push(
      esAndalucia
        ? "Este tramo no tiene polígono DERA: usamos el radio orientativo alrededor del centro. Mira la señalización."
        : "Este tramo ZPL/VP aún no tiene polígono ICV: usamos el radio del anexo I alrededor del centroide. En la orilla exacta puede haber un error de decenas de metros."
    );
  }

  if (esAndalucia) {
    const ficha = t.fichaId
      ? (provincia.zones as { id: string; avisos?: string[] }[]).find((z) => z.id === t.fichaId)
      : undefined;
    const avisosFicha = ficha?.avisos?.length ? ficha.avisos : avisosPorNotaAnexo(t.notaAnexo);
    for (const a of avisosFicha) {
      if (!restricciones.includes(a)) restricciones.push(a);
    }
  }

  const base = {
    tramo: t,
    distanciaKm: distancia,
    dentroDelRadio: true,
    fuenteGeometria,
    confianza,
    especiesIds: t.especies,
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
    if (esAndalucia) {
      permisos.push(
        `Permiso de coto (${t.matriculaCoto ?? "ZPC"}). Lo gestiona la sociedad / titular del coto en Andalucía.`
      );
      restricciones.push("Sin ese permiso no es zona libre: es coto de pesca.");
      restricciones.push("Consulta condiciones del coto y la orden de vedas de la Junta de Andalucía.");
    } else {
      permisos.push(
        `Permiso de coto intransferible (${t.matriculaCoto ?? "ZPC"}). Lo expide el titular / servicios territoriales.`
      );
      restricciones.push("Sin ese permiso no es zona libre: es coto (zona de pesca controlada).");
      restricciones.push(ptopCotos.avisoPtop);
      {
        const mat = t.matriculaCoto;
        const ficha = mat
          ? (ptopCotos.cotos as Record<string, { nombre: string; ptopPublico: boolean }>)[mat]
          : undefined;
        restricciones.push(
          ficha
            ? `${mat} · ${ficha.nombre}. Plan técnico no publicado aquí. ${ptopCotos.oficina}`
            : `Pregunta por la matrícula del coto. ${ptopCotos.oficina}`
        );
      }
    }
  } else {
    permisos.push(
      esAndalucia
        ? "No hace falta permiso de coto: es zona de pesca libre (aguas libres)."
        : "No hace falta permiso de coto: es zona de pesca libre (ZPL)."
    );
  }

  if (!esAndalucia) {
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
  }

  if (salmonicola && !esAndalucia) {
    permisos.push(`Tramos trucheros: ${etiquetaTemporadaTrucha(fecha.getFullYear())}.`);
    permisos.push(
      "Una caña, sin abandono, anzuelo sin arpón, solo mosca o cucharilla. Trucha común siempre sin muerte."
    );
    if (!truchaOk) {
      restricciones.push(
        "Fuera de temporada salmonícola: no pesques trucha común. El tramo puede estar cerrado a salmónidos."
      );
    }
    if (nota === "ZPL1") {
      restricciones.push(
        "Días hábiles (nota 1 del anexo, primer tramo del Mijares): martes, jueves, sábados y domingo."
      );
      if (!diaOk) restricciones.push(`Hoy es ${dow}: no es día hábil en este tramo.`);
    }
    if (nota === "ZPL2") {
      restricciones.push("Días hábiles (nota 2): solo martes y jueves.");
      if (!diaOk) restricciones.push(`Hoy es ${dow}: no es día hábil en este tramo.`);
    }
  } else if (esAndalucia) {
    permisos.push(
      "Art. 5.2: aguas libres si no es coto ni refugio. En Sevilla no hay cotos de ciprínidos (Anexo V.4)."
    );
    permisos.push(
      `Barbo: captura y suelta, ${periodoBarboAbierto(fecha) ? "hoy hábil" : "hoy en veda"} (1 jul–25 feb). Boga: captura y suelta, ${periodoBogaAbierto(fecha) ? "hoy hábil" : "hoy en veda"} (1 may–31 ene).`
    );
    permisos.push("Art. 6: 200 m de presas y escalas. Horario art. 4: 1 h antes del orto – 1 h después del ocaso.");
    if (t.notaAnexo === "ANEXO_V_3") {
      permisos.push(
        "Anexo V.3: en este embalse/tramo las competiciones oficiales FAPD pueden retener barbos en rejones durante su veda."
      );
    }
  } else {
    permisos.push(
      "Aguas no trucheras: artículos 2 y 8 de la Orden 30/2016. Lombriz/asticot permitidos. Autóctonos de la tabla 2.2 con talla o sin muerte según especie."
    );
  }

  let sePuedePescarHoy = true;
  if (t.aprovechamiento === "ZPC") sePuedePescarHoy = false;
  if (!esAndalucia && salmonicola && (!truchaOk || !diaOk)) sePuedePescarHoy = false;

  return {
    ...base,
    veredicto: t.aprovechamiento === "ZPC" ? "coto" : "libre",
    titulo: `${etiquetaAprovechamiento(t.aprovechamiento)} · ${t.nombre}`,
    color: colorSemaforo({
      veredicto: t.aprovechamiento === "ZPC" ? "coto" : "libre",
      sePuedePescarHoy,
    }),
    sePuedePescarHoy,
    restriccionesHoy: restricciones,
    permisos,
  };
}

export function consultarPorTramo(t: TramoOficial, fecha: Date = new Date()): ConsultaPesca {
  const fuente: ConsultaPesca["fuenteGeometria"] = tramoUsaRadioAnexo(t)
    ? "radio_anexo"
    : "poligono_icv";
  return evaluarTramo(t, 0, fuente, fecha);
}

export function consultarPuntoPesca(lat: number, lng: number, fecha: Date = new Date()): ConsultaPesca {
  const provincia = getProvinciaActiva();

  if (provincia.tieneIcv) {
    const poli = buscarPoligonoIcv(lat, lng);
    if (poli) {
      return evaluarTramo(tramoDesdePoligono(poli), 0, "poligono_icv", fecha);
    }
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
        provincia.notaConsultaAprox,
        provincia.continentalOnly
          ? "En esta provincia la guía es solo continental."
          : "En mar rige la normativa marítima, no esta ficha continental.",
      ],
      permisos: [
        provincia.id === "sevilla"
          ? "Si hay un embalse o río a la vista, acércate a la orilla y vuelve a pulsar."
          : "Si hay un río o embalse a la vista, acércate a la orilla y vuelve a pulsar, o abre el visor GVA de caza y pesca.",
      ],
    };
  }

  return evaluarTramo(hallado.tramo, hallado.distanciaKm, "radio_anexo", fecha);
}

export function todosLosTramos(): TramoOficial[] {
  return tramosActivos();
}
