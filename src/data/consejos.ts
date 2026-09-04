/**
 * Consejos prácticos de pesca: nudos, anzuelos, plomos, conectores, cebos
 * y vocabulario — con fotografías reales paso a paso (sin croquis).
 * Orientado a pesca continental y de orilla en Castellón.
 * No sustituye la normativa ni un curso presencial de seguridad.
 */

import type { IdDiagrama } from "./consejosMedia";
import { MONTAJES_ESPECIE } from "./montajesEspecie";

export type CategoriaConsejo =
  | "nudos"
  | "anzuelos"
  | "plomos"
  | "conectores"
  | "cebos"
  | "aparejos"
  | "montajes"
  | "vocabulario"
  | "seguridad";

export interface ConsejoItem {
  id: string;
  titulo: string;
  resumen: string;
  detalle: string;
  /** Pasos numerados (se muestran bajo la guía fotográfica). */
  pasos?: string[];
  /** Esquema gráfico asociado. */
  diagrama?: IdDiagrama;
  tags?: string[];
}

export interface SeccionConsejos {
  id: CategoriaConsejo;
  titulo: string;
  subtitulo: string;
  items: ConsejoItem[];
}

export const SECCIONES_CONSEJOS: SeccionConsejos[] = [
  {
    id: "nudos",
    titulo: "Nudos básicos",
    subtitulo: "Atar el anzuelo al sedal: fotos reales, paso a paso",
    items: [
      {
        id: "nudo-palomar",
        titulo: "Nudo Palomar",
        resumen: "El más fiable para anzuelo o mosca. Empieza por este.",
        detalle:
          "Ideal en trenza y monofilamento: conserva casi toda la resistencia del hilo. Deja ~2 mm de sobrante y corta en diagonal. Las siete fotos son pasos reales (estilo Knots 3D), empaquetadas para usar sin red.",
        pasos: [
          "Dobla ~15 cm de línea y pasa el doble por el ojal.",
          "Haz un nudo simple flojo con el doble.",
          "Abre el lazo para que quepa el anzuelo entero.",
          "Pasa el anzuelo completo por el lazo.",
          "Tira para que el lazo baje al ojal.",
          "Moja el hilo y aprieta sin tirones secos.",
          "Corta el sobrante a ~2 mm.",
        ],
        diagrama: "nudo-palomar",
        tags: ["anzuelo", "mosca", "fuerte", "principiante", "fotos"],
      },
      {
        id: "nudo-clinch",
        titulo: "Clinch mejorado",
        resumen: "Rápido para anzuelos y giratorios en nylon.",
        detalle:
          "Clásico en monofilamento. Evítalo en trenza fina (resbala): ahí Palomar o Trilene. Las fotos muestran el clinch básico, el mejorado y el nudo ya asentado.",
        pasos: [
          "Pasa la punta por el ojal y da 5–7 vueltas alrededor de la línea.",
          "Vuelve a pasar por el hueco junto al ojal y luego por el lazo grande (mejorado).",
          "Lubrica y aprieta tirando del anzuelo y de la línea.",
        ],
        diagrama: "nudo-clinch",
        tags: ["nylon", "rápido", "fotos"],
      },
      {
        id: "nudo-trilene",
        titulo: "Trilene (doble pasada por el ojal)",
        resumen: "Terminal sólido para anzuelo, snap o emerillón en nylon/fluoro.",
        detalle:
          "Si aprendes dos nudos de terminal, que sean Palomar y Trilene. La doble pasada por el ojal da un asiento limpio y fiable. No lo uses para unir dos líneas distintas: ahí Albright o anilla micro.",
        pasos: [
          "Pasa la punta por el ojal y vuelve a pasarla (doble hilo en el ojal).",
          "Da 5–6 vueltas alrededor de la línea madre.",
          "Pasa la punta por la «ventana» del doble lazo junto al ojal.",
          "Moja, aprieta y recorta el sobrante corto.",
        ],
        diagrama: "nudo-trilene",
        tags: ["anzuelo", "emerillón", "nylon", "fotos"],
      },
      {
        id: "nudo-albright",
        titulo: "Albright (trenza → fluorocarbono)",
        resumen: "Empalme de materiales distintos: tippet o bajo transparente.",
        detalle:
          "Une trenza fina con un bajo de fluorocarbono más grueso. Practica en seco: con frío y manos mojadas cuesta más. Alternativa fácil: anilla micro + Trilene a cada lado.",
        pasos: [
          "Haz un lazo con el fluorocarbono (el grueso).",
          "Introduce la trenza por el lazo.",
          "Da 10–12 vueltas apretadas hacia el cierre del lazo.",
          "Pasa la punta por el lazo (mismo lado por el que entró) y aprieta por etapas.",
        ],
        diagrama: "nudo-albright",
        tags: ["trenza", "fluoro", "empalme", "fotos"],
      },
      {
        id: "nudo-loop",
        titulo: "Lazo del pescador (Angler's loop)",
        resumen: "Ojal fijo al final de la línea o tippet (ABOK #1017).",
        detalle:
          "Crea un ojal que no se cierra bajo tensión. Sirve para snap, mosca con lazo o unir bajos. Ajusta el tamaño del ojal antes de apretar: demasiado grande enreda en el lance.",
        pasos: [
          "Forma el lazo del tamaño deseado al final de la línea.",
          "Cruza y pasa la punta según la estructura del lazo del pescador (ver fotos).",
          "Moja, asienta el nudo y deja un sobrante corto.",
        ],
        diagrama: "nudo-loop",
        tags: ["lazo", "mosca", "snap", "fotos"],
      },
    ],
  },
  {
    id: "anzuelos",
    titulo: "Anzuelos y tallas",
    subtitulo: "Forma, tamaño y qué poner a cada especie",
    items: [
      {
        id: "anz-tallas",
        titulo: "Talla recomendada por especie",
        resumen: "Tabla rápida para no comprar a ciegas en la tienda.",
        detalle:
          "En anzuelos, número alto (#14) = más pequeño; #1/0, #2/0… = más grandes. En Castellón: sin arponcillo en tramos trucheros y pesca sin muerte. Orientativo: el cebo o el señuelo mandan el tamaño final.",
        diagrama: "tabla-tallas",
        tags: ["guía", "principiante", "talla"],
      },
      {
        id: "anz-simple",
        titulo: "Anzuelo simple",
        resumen: "El estándar en cebo natural y spinning ligero.",
        detalle:
          "Tallas frecuentes: #8–#2 para barbo/carpa con cebo; #1/0–#3/0 para black bass con blandos. Sin arponcillo (barbless) obligatorio o muy recomendable en tramos trucheros.",
        diagrama: "anzuelo-simple",
        tags: ["cebo", "sin muerte"],
      },
      {
        id: "anz-triple",
        titulo: "Anzuelo triple",
        resumen: "En cucharillas, crankbaits y algunos jerkbaits.",
        detalle:
          "Engancha más, pero daña más al pez. En cotos sin muerte o trucheros suele estar limitado: revisa el PTOP. Sustituir triples por simples es buena práctica si devuelves.",
        diagrama: "anzuelo-triple",
        tags: ["cucharilla", "bass"],
      },
      {
        id: "anz-offset",
        titulo: "Offset / worm hook",
        resumen: "Para softbaits y montajes texas/carolina antihierba.",
        detalle:
          "La pala desplazada permite ocultar la punta en el señuelo (weedless). Muy útil en embalses con vegetación (Arenós, Sichar). Combina con plomo bala según profundidad.",
        diagrama: "anzuelo-offset",
        tags: ["bass", "embalse"],
      },
      {
        id: "anz-circle",
        titulo: "Circle hook",
        resumen: "Pesca a fondo con cebo (donde esté permitido).",
        detalle:
          "Se clavará solo al tensar, normalmente en la comisura. No hagas tirón de clavado clásico. En continental valenciano el cebo vivo de pez está prohibido con carácter general.",
        diagrama: "anzuelo-circle",
        tags: ["fondo", "normativa"],
      },
      {
        id: "anz-mosca",
        titulo: "Anzuelo de mosca",
        resumen: "Vástago corto/largo según seca, ninfa o streamer.",
        detalle:
          "En tramos salmonícolas de Castellón suele exigirse un solo anzuelo sin muerte. Hierro fino para secas; más robusto para streamers de bass en embalse.",
        diagrama: "anzuelo-mosca",
        tags: ["trucha", "mosca"],
      },
    ],
  },
  {
    id: "plomos",
    titulo: "Tipos de plomo",
    subtitulo: "Para que el cebo o el señuelo lleguen donde toca",
    items: [
      {
        id: "pl-bala",
        titulo: "Bala (bullet)",
        resumen: "Cónico, delante del offset: Texas y Carolina para bass.",
        detalle:
          "La foto muestra el plomo bala asentado sobre el softbait. 3–7 g en orilla poco profunda; 10–14 g con viento o fondo rápido. En Arenós con agua clara, a menudo menos peso y más finesse.",
        diagrama: "plomo-bala",
        tags: ["bass", "texas", "fotos"],
      },
      {
        id: "pl-piramide",
        titulo: "Pirámide",
        resumen: "Ancla en arena: surfcasting de orilla.",
        detalle:
          "La foto es un plomo pirámide con snap. 80–150 g típicos en playas de Castellón (dorada, herrera). La base plana se clava con la corriente; en running el pez no nota todo el peso al picar.",
        diagrama: "plomo-piramide",
        tags: ["costa", "surfcasting", "fotos"],
      },
      {
        id: "pl-oliva",
        titulo: "Oliva / cilindro deslizante",
        resumen: "Fondo en río o playa con línea libre (running).",
        detalle:
          "La línea atraviesa el plomo; el pez tira y el carrete gira sin arrastrar el peso de inmediato. Útil con carpa/barbo donde cebar esté permitido.",
        diagrama: "plomo-oliva",
        tags: ["fondo", "running", "fotos"],
      },
      {
        id: "pl-gota",
        titulo: "Gota / drop shot",
        resumen: "Peso al final; el anzuelo queda arriba en el bajo.",
        detalle:
          "Montaje finesse: anzuelo a 30–60 cm del plomo terminal. Ideal en puntas profundas de embalse en verano. Empieza con 5–10 g.",
        diagrama: "plomo-gota",
        tags: ["bass", "finesse", "fotos"],
      },
    ],
  },
  {
    id: "conectores",
    titulo: "Clips y conectores",
    subtitulo: "Cambiar de señuelo en segundos (sin rehacer el nudo)",
    items: [
      {
        id: "con-snap",
        titulo: "Clip / snap de acero",
        resumen: "El atajo del principiante: abre, engancha, cierra.",
        detalle:
          "Ata un solo nudo (Palomar o Trilene) al snap y cambia cucharillas, vinilos o crank sin cortar línea. Elige snaps de calidad: los baratos se abren con un bass o una lubina. Talla pequeña para UL; media para spinning 10–30 g.",
        diagrama: "snap-clip",
        tags: ["rápido", "principiante", "kit"],
      },
      {
        id: "con-emerillon",
        titulo: "Emerillón (swivel)",
        resumen: "Gira para que la línea no se enrede.",
        detalle:
          "Imprescindible con cucharilla giratoria y montajes de fondo. Emerillón + snap = combo cómodo. No pongas uno enorme: el pez lo ve en agua clara.",
        diagrama: "emerillon",
        tags: ["cucharilla", "anti-enredo"],
      },
      {
        id: "con-mosqueton",
        titulo: "Mosquetón de pesca",
        resumen: "Más robusto que el snap fino: lucio, costa, jigs pesados.",
        detalle:
          "Úsalo cuando el señuelo es grande o el pez tiene dientes (lucio: además bajo de acero o fluoro grueso). Para trucha UL es excesivo: ahí snap micro.",
        diagrama: "mosqueton",
        tags: ["lucio", "costa"],
      },
      {
        id: "con-rapido",
        titulo: "Anilla micro / conector de bajo",
        resumen: "Cambia el fluorocarbono sin deshacer la trenza.",
        detalle:
          "Anilla diminuta entre trenza y bajo. Atas Trilene (o Uni) a cada lado. Ideal si rompes bajos a menudo en roca (sargo, rockfishing). Alternativa al Albright cuando empiezas.",
        diagrama: "conector-rapido",
        tags: ["fluoro", "fácil"],
      },
    ],
  },
  {
    id: "cebos",
    titulo: "Cebos y señuelos",
    subtitulo: "Qué funciona y qué está limitado por ley",
    items: [
      {
        id: "senuelo-cucharilla-gir",
        titulo: "Cucharilla giratoria",
        resumen: "Pala que da vueltas: busca pez rápido en río y cola.",
        detalle:
          "La foto muestra un spinner completo (pala + cuerpo + anzuelo). N.º 0–1 trucha; n.º 2–4 embalse. Emerillón delante obligatorio. Anzuelo simple sin muerte en zona sensible.",
        diagrama: "cucharilla-giratoria",
        tags: ["río", "búsqueda", "trucha", "fotos"],
      },
      {
        id: "senuelo-cucharilla-ond",
        titulo: "Cucharilla ondulante",
        resumen: "Spoon / blinker: chapa que vaivea, sin el giro del spinner.",
        detalle:
          "Las fotos son spoons metálicos (ondulantes), no giratorias. Plateada, cobriza o dorada. Recupera constante; para un segundo si sientes toque. Clásica a trucha en Castellón.",
        diagrama: "cucharilla-ondulante",
        tags: ["trucha", "clásico", "fotos"],
      },
      {
        id: "cebo-lombriz",
        titulo: "Lombriz y asticot",
        resumen: "Clásicos de ciprínidos en aguas no trucheras.",
        detalle:
          "Permitidos en aguas no trucheras. Prohibidos o muy restringidos en tramos trucheros (Orden 30/2016). Ideales para barbo, carpa y mújol. Anzuelo acorde al tamaño del cebo.",
        tags: ["legal", "ciprínidos"],
      },
      {
        id: "cebo-prohibidos",
        titulo: "Cebos prohibidos (general)",
        resumen: "Peces vivos, cangrejos, huevas, anfibios.",
        detalle:
          "Con carácter general no puedes usar peces vivos, cangrejos, huevas ni anfibios como cebo. Tampoco cebar el agua en tramos trucheros. Si dudas, pesca a señuelo artificial.",
        tags: ["norma", "importante"],
      },
      {
        id: "senuelo-soft",
        titulo: "Softbaits (vinilos)",
        resumen: "Twisters, shads y creaturas para bass y lucio.",
        detalle:
          "Las fotos muestran vinilos reales: twisters de cola rizada y shads. 7–12 cm. Naturales con agua clara; chartreuse/blanco con turbia. Texas o cabeza plomada junto a riprap, colas y sombra.",
        diagrama: "vinilo-soft",
        tags: ["bass", "lucio", "fotos"],
      },
      {
        id: "senuelo-mosca",
        titulo: "Mosca (seca / ninfa / streamer)",
        resumen: "Trucha y también bass en superficie.",
        detalle:
          "Ninfas al principio de temporada; secas con eclosiones de tarde; streamers con corriente o depredadores. En cotos de mosca respeta la técnica del cartel.",
        tags: ["trucha", "técnica"],
      },
      {
        id: "cebo-costa",
        titulo: "Orilla de mar (Castellón)",
        resumen: "Gusano, tita, vinilos y jigs legales.",
        detalle:
          "Desde tierra: licencia marítima. No pescar en puertos ni a menos de 100 m de bañistas en temporada. Lubina/llissa: cabezas plomadas o cebo en rompiente al alba/atardecer.",
        tags: ["costa", "marítima"],
      },
    ],
  },
  {
    id: "aparejos",
    titulo: "Aparejos básicos",
    subtitulo: "Montajes reales que cubren el 90 % de salidas",
    items: [
      {
        id: "ap-kit-principiante",
        titulo: "Kit mínimo para no desanimarte",
        resumen: "Caja plana: snaps, emerillones, plomos y anzuelos sin arponcillo.",
        detalle:
          "1) Ata un snap a la línea con Palomar o Trilene. 2) Engancha cucharilla o vinilo al snap. 3) Con giratoria: emerillón + snap. 4) Corta-hilos y 5 anzuelos de repuesto. Montas en menos de un minuto.",
        pasos: [
          "Snaps y emerillones en la cajita.",
          "Un solo nudo (Palomar/Trilene) al snap.",
          "Engancha el señuelo al snap (cambio en 1 s).",
          "Plomos y anzuelos de repuesto sin arponcillo.",
        ],
        diagrama: "kit-principiante",
        tags: ["kit", "principiante", "rápido", "fotos"],
      },
      {
        id: "ap-spinning",
        titulo: "Spinning ligero / medio",
        resumen: "Caña 2,10–2,40 m · 5–25 g · trenza 0.08–0.12 + fluoro 0.20–0.28.",
        detalle:
          "Setup polivalente para embalses de Castellón. La foto Texas muestra bala + offset + softbait weedless; con cucharilla usa emerillón + snap. Carrete 2500–3000 y bajo de flúoro 1–1,5 m.",
        pasos: [
          "Línea → bajo de flúoro → emerillón/snap → señuelo.",
          "Vinilo: Texas (bala + offset). Cucharilla: emerillón + snap.",
          "Caña 2,10–2,40 m y carrete 2500–3000.",
        ],
        diagrama: "montaje-spinning",
        tags: ["embalse", "bass", "fotos"],
      },
      {
        id: "ap-feeder",
        titulo: "Feeder / fondo para carpa y barbo",
        resumen: "Caña feeder 3,3–3,6 m · nailon 0.20–0.25 · cage o oliva.",
        detalle:
          "Plomo deslizante + emerillón de tope + bajo + anzuelo. Solo donde cebar esté permitido (no trucheros). Anzuelo a la medida del cebo.",
        pasos: [
          "Plomo deslizante (oliva o cage) en la línea.",
          "Emerillón de tope + bajo + anzuelo.",
          "Solo donde cebar esté permitido.",
        ],
        diagrama: "montaje-fondo",
        tags: ["carpa", "barbo", "fotos"],
      },
      {
        id: "ap-ultralight",
        titulo: "Ultralight de río",
        resumen: "Caña 1,80–2,10 m · 0.5–7 g · nylon 0.14–0.18.",
        detalle:
          "Trucha y ciprínidos en tramos estrechos. Cucharilla ondulante pequeña o spinner n.º 0–1. Un anzuelo sin muerte y suela con agarre. Una sola caña en tramos trucheros.",
        diagrama: "cucharilla-ondulante",
        tags: ["trucha", "río", "fotos"],
      },
      {
        id: "ap-surf",
        titulo: "Surfcasting / spinning de orilla",
        resumen: "Costa de Castellón sin vedados ni puertos.",
        detalle:
          "Caña 2,7–3,6 m según distancia. Pirámide + running para dorada (ver foto del plomo). Respeta bandas de baño (mapa de la app).",
        diagrama: "plomo-piramide",
        tags: ["costa", "fotos"],
      },
    ],
  },
  {
    id: "montajes",
    titulo: "Montajes por especie",
    subtitulo: "Cómo montar la línea: el de siempre + cómo regular boya/señuelo",
    items: MONTAJES_ESPECIE.map((m) => ({
      id: m.consejoId,
      titulo: m.titulo,
      resumen: m.resumen,
      detalle: `${m.regulacion.join(" ")} Alternativa: ${m.alternativa}`,
      pasos: m.pasos,
      diagrama: m.diagramaId as IdDiagrama,
      tags: [
        "principiante",
        "montaje",
        m.ambito,
        ...m.especieIds.slice(0, 3),
      ],
    })),
  },
  {
    id: "vocabulario",
    titulo: "Vocabulario",
    subtitulo: "Palabras que verás en carteles y en la app",
    items: [
      {
        id: "voc-zpl",
        titulo: "ZPL — Zona de pesca libre",
        resumen: "Puedes pescar con licencia sin permiso de coto.",
        detalle:
          "Sigue las normas generales (horario, especies, cebos). Algunas ZPL del Mijares tienen días hábiles concretos. En la app: verde.",
        tags: ["legal"],
      },
      {
        id: "voc-zpc",
        titulo: "ZPC — Zona de pesca controlada (coto)",
        resumen: "Necesitas permiso del adjudicatario además de la licencia.",
        detalle:
          "El PTOP del coto puede fijar cupos, días y técnicas. En el mapa: ámbar.",
        tags: ["coto"],
      },
      {
        id: "voc-vp",
        titulo: "VP / vedado",
        resumen: "Tramo no pescable o reserva.",
        detalle: "Prohibido pescar. Incluye cabeceras de protección. En el mapa: rojo.",
        tags: ["veda"],
      },
      {
        id: "voc-sin-muerte",
        titulo: "Pesca sin muerte (catch & release)",
        resumen: "Debes devolver el pez vivo al agua de inmediato.",
        detalle:
          "Obligatoria para trucha común y barbos autóctonos. Anzuelo sin arponcillo, manos húmedas, poco tiempo fuera del agua.",
        tags: ["ética"],
      },
      {
        id: "voc-vocacion",
        titulo: "Vocación salmonícola / ciprinícola",
        resumen: "Clasificación oficial del tramo según especies objetivo.",
        detalle:
          "Salmonícola: orientación a truchas, normas más estrictas. Ciprinícola: carpas, barbos, etc.",
        tags: ["ficha"],
      },
      {
        id: "voc-ptop",
        titulo: "PTOP",
        resumen: "Plan técnico de ordenación piscícola del coto.",
        detalle:
          "Documento del coto con cupos, horarios y especies. Cartel y PTOP mandan si hay conflicto con la app.",
        tags: ["coto"],
      },
      {
        id: "voc-saih",
        titulo: "SAIH",
        resumen: "Sistema Automático de Información Hidrológica.",
        detalle:
          "Datos de embalses de la CHJ. En la ficha de cada embalse verás el % de llenado cuando la consulta funciona.",
        tags: ["embalse"],
      },
    ],
  },
  {
    id: "seguridad",
    titulo: "Seguridad y buena práctica",
    subtitulo: "Volver a casa importa más que la captura",
    items: [
      {
        id: "seg-riadas",
        titulo: "Caudales y riadas",
        resumen: "Tras tormentas en cabecera el nivel sube en minutos.",
        detalle:
          "Mira el SAIH y el cielo de montaña. No cruces puentes bajos con agua chocolate.",
        tags: ["río"],
      },
      {
        id: "seg-electricidad",
        titulo: "Tormentas eléctricas",
        resumen: "Caña = pararrayos. Recoge y aléjate del agua abierta.",
        detalle:
          "Si oyes truenos, termina. Evita crestas y embalse abierto. Reanuda 30 min después del último trueno.",
        tags: ["meteo"],
      },
      {
        id: "seg-invasoras",
        titulo: "Invasoras y desinfección",
        resumen: "No muevas agua ni plantas entre masas.",
        detalle:
          "Bass, lucio y siluro: no los devuelvas donde la norma lo prohíbe. Limpia suelas y redes al cambiar de río.",
        tags: ["bioseguridad"],
      },
      {
        id: "seg-horario",
        titulo: "Horario legal",
        resumen: "De 1 h antes del orto a 1 h después del ocaso.",
        detalle:
          "Pesca nocturna continental prohibida salvo molinà de anguila autorizada.",
        tags: ["legal"],
      },
    ],
  },
];
