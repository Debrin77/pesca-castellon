/**
 * Consejos prácticos de pesca: nudos, anzuelos, plomos, conectores, cebos
 * y vocabulario — con esquemas gráficos para no desanimar al principiante.
 * Orientado a pesca continental y de orilla en Castellón.
 * No sustituye la normativa ni un curso presencial de seguridad.
 */

import type { IdDiagrama } from "../components/DiagramaConsejo";

export type CategoriaConsejo =
  | "nudos"
  | "anzuelos"
  | "plomos"
  | "conectores"
  | "cebos"
  | "aparejos"
  | "vocabulario"
  | "seguridad";

export interface ConsejoItem {
  id: string;
  titulo: string;
  resumen: string;
  detalle: string;
  /** Pasos numerados (se muestran bajo el diagrama). */
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
    subtitulo: "Atar el anzuelo al sedal sin perder la mañana",
    items: [
      {
        id: "nudo-palomar",
        titulo: "Nudo Palomar",
        resumen: "El más fiable para anzuelo o mosca. Empieza por este.",
        detalle:
          "Ideal para trenza y monofilamento. Conserva casi toda la resistencia del hilo. Deja ~2 mm de sobrante y corta en diagonal.",
        pasos: [
          "Dobla unos 15 cm de línea (queda doble).",
          "Pasa el doble por el ojal del anzuelo.",
          "Haz un lazo simple sobre sí misma (nudo flojo).",
          "Pasa el anzuelo entero por ese lazo.",
          "Moja el hilo, aprieta despacio y corta el sobrante.",
        ],
        diagrama: "nudo-palomar",
        tags: ["anzuelo", "mosca", "fuerte", "principiante"],
      },
      {
        id: "nudo-clinch",
        titulo: "Clinch mejorado",
        resumen: "Rápido para anzuelos y giratorios en nylon.",
        detalle:
          "Muy usado en monofilamento. Evítalo en trenza fina (resbala): ahí usa Palomar.",
        pasos: [
          "Pasa la punta por el ojal.",
          "Da 5–7 vueltas alrededor de la línea principal.",
          "Vuelve a pasar la punta por el hueco junto al ojal y luego por el lazo grande.",
          "Lubrica (agua o saliva) y aprieta tirando del anzuelo y de la línea.",
        ],
        diagrama: "nudo-clinch",
        tags: ["nylon", "rápido"],
      },
      {
        id: "nudo-uni",
        titulo: "Uni knot / Grinner",
        resumen: "Versátil: anzuelo, emerillón o unir líneas similares.",
        detalle:
          "Si aprendes solo dos nudos, que sean Palomar y Uni. El Uni también une dos monofilamentos del mismo diámetro.",
        pasos: [
          "Pasa por el ojal y forma un círculo hacia atrás.",
          "Da 5–6 vueltas dentro del círculo con la punta.",
          "Tira primero de la punta y luego de la línea principal.",
          "Recorta el sobrante corto.",
        ],
        diagrama: "nudo-uni",
        tags: ["unir", "emerillón"],
      },
      {
        id: "nudo-albright",
        titulo: "Albright (trenza → fluorocarbono)",
        resumen: "Empalme tippet/bajo cuando cambias de material.",
        detalle:
          "Practica en seco en casa: en el agua, con frío, cuesta más. Alternativa fácil: anilla micro (conector) + dos Uni.",
        pasos: [
          "Haz un lazo con el fluorocarbono.",
          "Introduce la trenza por el lazo.",
          "Da 10–12 vueltas hacia atrás sobre ambas ramas del lazo.",
          "Pasa la punta de la trenza por el lazo y aprieta por etapas.",
        ],
        diagrama: "nudo-albright",
        tags: ["trenza", "fluoro"],
      },
      {
        id: "nudo-loop",
        titulo: "Lazo de cirujano (surgeon's loop)",
        resumen: "Crear un ojal al final de la línea o tippet.",
        detalle:
          "Sirve para montar moscas con lazo o enganchar un snap. Deja el lazo del tamaño justo para no enredar.",
        pasos: [
          "Dobla el extremo de la línea.",
          "Haz un nudo simple pasando dos veces por el ojal (nudo doble).",
          "Aprieta mojando y ajusta el tamaño del lazo.",
        ],
        diagrama: "nudo-loop",
        tags: ["lazo", "mosca"],
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
        resumen: "El de siempre en texas y carolina para bass.",
        detalle:
          "Se ensarta en la línea delante del anzuelo offset. 3–7 g orilla poco profunda; 10–14 g si hay viento o quieres fondo rápido. En Arenós con agua clara, a menudo menos peso y más finesse.",
        diagrama: "plomo-bala",
        tags: ["bass", "texas"],
      },
      {
        id: "pl-piramide",
        titulo: "Pirámide",
        resumen: "Ancla en arena: surfcasting de orilla.",
        detalle:
          "80–150 g típicos en playas de Castellón (dorada, herrera). La base plana se clava con la corriente. Combina con montaje running (plomo deslizante) para que el pez no note el peso al picar.",
        diagrama: "plomo-piramide",
        tags: ["costa", "surfcasting"],
      },
      {
        id: "pl-oliva",
        titulo: "Oliva / cilindro deslizante",
        resumen: "Fondo en río o playa con línea libre.",
        detalle:
          "La línea pasa por el plomo; el pez tira y el carrete gira sin arrastrar el peso de inmediato. Muy útil con carpa/barbo donde cebar esté permitido.",
        diagrama: "plomo-oliva",
        tags: ["fondo", "running"],
      },
      {
        id: "pl-gota",
        titulo: "Gota / drop shot",
        resumen: "Peso al final; el anzuelo queda arriba en el bajo.",
        detalle:
          "Montaje finesse: anzuelo a 30–60 cm del plomo. Ideal en puntas profundas de embalse en verano. Empieza con 5–10 g.",
        diagrama: "plomo-gota",
        tags: ["bass", "finesse"],
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
          "Ata un solo nudo (Palomar o Uni) al snap y cambia cucharillas, vinilos o crank sin cortar línea. Elige snaps de calidad: los baratos se abren con un bass o una lubina. Talla pequeña para UL; media para spinning 10–30 g.",
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
          "Anilla diminuta entre trenza y bajo. Atas Uni a cada lado. Ideal si rompes bajos a menudo en roca (sargo, rockfishing). Alternativa al Albright cuando empiezas.",
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
          "N.º 0–1 trucha; n.º 2–4 embalse o jurel desde orilla. Un anzuelo simple sin muerte en zona sensible. Amanecer y agua oxigenada tras lluvia suave.",
        diagrama: "cucharilla-giratoria",
        tags: ["río", "búsqueda", "trucha"],
      },
      {
        id: "senuelo-cucharilla-ond",
        titulo: "Cucharilla ondulante",
        resumen: "Chapa que vaivea: menos giro, más balanceo.",
        detalle:
          "Muy clásica a trucha en Castellón. Plateada o cobriza. Recupera a velocidad constante; para un segundo si sientes toque.",
        diagrama: "cucharilla-ondulante",
        tags: ["trucha", "clásico"],
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
        resumen: "Black bass y lucio en embalse.",
        detalle:
          "Stickbaits, craws y swimbaits en 7–12 cm. Colores naturales con agua clara; chartreuse/blanco con turbia. Recoge lento junto a riprap, colas y sombra.",
        tags: ["bass", "lucio"],
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
    subtitulo: "Montajes que cubren el 90 % de salidas",
    items: [
      {
        id: "ap-kit-principiante",
        titulo: "Kit mínimo para no desanimarte",
        resumen: "Caja plana: 2 snaps, 2 emerillones, 1 mosquetón, plomos y anzuelos.",
        detalle:
          "1) Ata un snap a la línea con Palomar. 2) Engancha la cucharilla o el vinilo al snap. 3) Si usas cucharilla giratoria, pon emerillón + snap. 4) Lleva corta-hilos y 5 anzuelos de repuesto sin arponcillo. Con eso montas en menos de un minuto.",
        tags: ["kit", "principiante", "rápido"],
      },
      {
        id: "ap-spinning",
        titulo: "Spinning ligero / medio",
        resumen: "Caña 2,10–2,40 m · 5–25 g · trenza 0.08–0.12 + fluoro 0.20–0.28.",
        detalle:
          "El setup más polivalente para embalses de Castellón. Carrete 2500–3000. Bajo de fluorocarbono 1–1,5 m. Sirve para softbait, crank y cucharilla.",
        tags: ["embalse", "bass"],
      },
      {
        id: "ap-feeder",
        titulo: "Feeder / fondo para carpa y barbo",
        resumen: "Caña feeder 3,3–3,6 m · nailon 0.20–0.25 · cage.",
        detalle:
          "Solo donde cebar esté permitido (no trucheros). Montaje anti-enredo con emerillón y anzuelo a la medida del cebo.",
        tags: ["carpa", "barbo"],
      },
      {
        id: "ap-ultralight",
        titulo: "Ultralight de río",
        resumen: "Caña 1,80–2,10 m · 0.5–7 g · nylon 0.14–0.18.",
        detalle:
          "Para trucha y ciprínidos en tramos estrechos. Un anzuelo sin muerte y suela con agarre. Una sola caña en tramos trucheros.",
        tags: ["trucha", "río"],
      },
      {
        id: "ap-surf",
        titulo: "Surfcasting / spinning de orilla",
        resumen: "Costa de Castellón sin vedados ni puertos.",
        detalle:
          "Caña 2,7–3,6 m según distancia. Pirámide + running para dorada. Respeta bandas de baño (mapa de la app).",
        tags: ["costa"],
      },
    ],
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
