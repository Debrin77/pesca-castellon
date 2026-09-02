/**
 * Consejos prácticos de pesca: nudos, anzuelos, cebos, aparejos básicos
 * y vocabulario. Orientado a pesca continental y de orilla en Castellón.
 * No sustituye la normativa ni un curso presencial de seguridad.
 */

export type CategoriaConsejo =
  | "nudos"
  | "anzuelos"
  | "cebos"
  | "aparejos"
  | "vocabulario"
  | "seguridad";

export interface ConsejoItem {
  id: string;
  titulo: string;
  resumen: string;
  detalle: string;
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
    subtitulo: "Los que más se usan en río y embalse",
    items: [
      {
        id: "nudo-palomar",
        titulo: "Nudo Palomar",
        resumen: "Anclar anzuelo o mosca a la línea con mucha resistencia.",
        detalle:
          "Doble unos 15 cm de línea, pásala por el ojal, haz un lazo simple sobre sí misma, pasa el anzuelo por el lazo y tira despacio mojando el hilo. Ideal para trenza y monofilamento. Deja ~2 mm de sobrante.",
        tags: ["anzuelo", "mosca", "fuerte"],
      },
      {
        id: "nudo-clinch",
        titulo: "Clinch mejorado",
        resumen: "Rápido para anzuelos y giratorios en nylon.",
        detalle:
          "Pasa el hilo por el ojal, da 5-7 vueltas alrededor de la línea principal, vuelve a pasar la punta por el hueco junto al ojal y luego por el lazo grande. Lubrica y aprieta. Evítalo en trenza fina (usa Palomar).",
        tags: ["nylon", "rápido"],
      },
      {
        id: "nudo-uni",
        titulo: "Uni knot / Grinner",
        resumen: "Versátil: anzuelo, emerillón o unir líneas similares.",
        detalle:
          "Pasa por el ojal, forma un círculo hacia atrás y da 5-6 vueltas dentro del círculo con la punta. Tira de la punta y luego de la línea principal. Muy útil para unir dos monofilamentos del mismo diámetro.",
        tags: ["unir", "emerillón"],
      },
      {
        id: "nudo-albright",
        titulo: "Albright (trenza → fluorocarbono)",
        resumen: "Empalme tippet/bajo cuando cambias de material.",
        detalle:
          "Haz un lazo con el fluoro, introduce la trenza, da 10-12 vueltas hacia atrás sobre ambas ramas del lazo y pasa la punta por el lazo. Aprieta por etapas. Practica en seco antes de ir al agua.",
        tags: ["trenza", "fluoro"],
      },
      {
        id: "nudo-loop",
        titulo: "Lazo de cirujano (surgeon's loop)",
        resumen: "Crear un ojal al final de la línea o tippet.",
        detalle:
          "Dobla el extremo, haz un nudo simple doble (dos pasadas por el ojal) y aprieta. Sirve para montar moscas con lazo o conectar rápidos. Deja el lazo del tamaño justo para no enredar.",
        tags: ["lazo", "mosca"],
      },
    ],
  },
  {
    id: "anzuelos",
    titulo: "Tipos de anzuelo",
    subtitulo: "Forma, tamaño y uso en Castellón",
    items: [
      {
        id: "anz-simple",
        titulo: "Anzuelo simple",
        resumen: "El estándar en cebo natural y spinning ligero.",
        detalle:
          "Tallas frecuentes: #8–#2 para barbo/carpa con cebo; #1/0–#3/0 para black bass con señuelos blandos. Sin arponcillo (barbless) es obligatorio o muy recomendable en tramos trucheros y pesca sin muerte.",
        tags: ["cebo", "sin muerte"],
      },
      {
        id: "anz-triple",
        titulo: "Anzuelo triple",
        resumen: "En cucharillas, crankbaits y algunos jerkbaits.",
        detalle:
          "Engancha más, pero daña más al pez. En cotos sin muerte o trucheros suele estar limitado o prohibido: revisa el PTOP. Sustituir triples por simples es buena práctica si devuelves.",
        tags: ["cucharilla", "bass"],
      },
      {
        id: "anz-offset",
        titulo: "Offset / worm hook",
        resumen: "Para softbaits y montajes texas/carolina antihierba.",
        detalle:
          "La pala desplazada permite ocultar la punta en el señuelo (weedless). Muy útil en embalses con vegetación (Arenós, Sichar). Combina con weight bullet según profundidad.",
        tags: ["bass", "embalse"],
      },
      {
        id: "anz-circle",
        titulo: "Circle hook",
        resumen: "Pesca a fondo con cebo vivo/muerto (donde esté permitido).",
        detalle:
          "Se clavará solo al tensar, normalmente en la comisura. No hagas tirón de clavado clásico. En continental valenciano el cebo vivo de pez está prohibido con carácter general.",
        tags: ["fondo", "normativa"],
      },
      {
        id: "anz-mosca",
        titulo: "Anzuelo de mosca",
        resumen: "Vástago corto/largo según seca, ninfa o streamer.",
        detalle:
          "En tramos salmonícolas de Castellón (cabeceras, cotos de mosca) suele exigirse un solo anzuelo sin muerte. Elige hierro fino para secas y más robusto para streamers de bass en embalse.",
        tags: ["trucha", "mosca"],
      },
    ],
  },
  {
    id: "cebos",
    titulo: "Cebos y señuelos",
    subtitulo: "Qué funciona y qué está limitado por ley",
    items: [
      {
        id: "cebo-lombriz",
        titulo: "Lombriz y asticot",
        resumen: "Clásicos de ciprínidos en aguas no trucheras.",
        detalle:
          "Permitidos en aguas no trucheras. Prohibidos o muy restringidos en tramos trucheros (Orden 30/2016). Ideales para barbo, carpa y mújol en desembocaduras. Usa anzuelo acorde al tamaño del cebo.",
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
          "Stickbaits, craws y swimbaits en 7–12 cm. Colores naturales (verde, ajonjolí) con agua clara; chartreuse/blanco con agua turbia o cielo cubierto. Recoge lento junto a riprap, colas y sombra de orilla.",
        tags: ["bass", "lucio"],
      },
      {
        id: "senuelo-cucharilla",
        titulo: "Cucharilla y spinner",
        resumen: "Búsqueda rápida en río y cola de embalse.",
        detalle:
          "Nº 2–4 en ríos; más grandes en embalse abierto. Un anzuelo simple sin muerte si estás en zona sensible. Muy efectiva al amanecer y con agua oxigenada tras lluvias suaves.",
        tags: ["río", "búsqueda"],
      },
      {
        id: "senuelo-mosca",
        titulo: "Mosca (seca / ninfa / streamer)",
        resumen: "Trucha y también bass en superficie.",
        detalle:
          "Ninfas al principio de temporada; secas con eclosiones de tarde; streamers cuando hay corriente o depredadores. En cotos de mosca respeta la técnica obligatoria del cartel.",
        tags: ["trucha", "técnica"],
      },
      {
        id: "cebo-costa",
        titulo: "Orilla de mar (Castellón)",
        resumen: "Sardina, gamba, cangrejo ermitaño, artificiales.",
        detalle:
          "Desde tierra: licencia marítima. No pescar en puertos ni a menos de 100 m de bañistas en temporada. Para lubina/llissa, cabezas plomadas y vinilos o cebo natural en rompiente al amanecer/atardecer.",
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
        id: "ap-spinning",
        titulo: "Spinning ligero / medio",
        resumen: "Caña 2,10–2,40 m · 5–25 g · trenza 0.08–0.12 + fluoro 0.20–0.28.",
        detalle:
          "El setup más polivalente para embalses de Castellón. Carrete 2500–3000. Bajo de fluorocarbono 1–1,5 m. Sirve para softbait, crank y cucharilla. En orilla con vegetación sube a 15–40 g.",
        tags: ["embalse", "bass"],
      },
      {
        id: "ap-feeder",
        titulo: "Feeder / fondo para carpa y barbo",
        resumen: "Caña feeder 3,3–3,6 m · nailon 0.20–0.25 · semilínea con cage.",
        detalle:
          "Solo donde cebar esté permitido (no trucheros). Montaje anti-enredo con emerillón y anzuelo a la medida del cebo. Cupos y tallas: revisa ficha del tramo y Orden 30/2016.",
        tags: ["carpa", "barbo"],
      },
      {
        id: "ap-ultralight",
        titulo: "Ultralight de río",
        resumen: "Caña 1,80–2,10 m · 0.5–7 g · nylon 0.14–0.18.",
        detalle:
          "Para trucha y ciprínidos en tramos estrechos (Villahermosa, Palancia alto). Prioriza un anzuelo sin muerte y suela de feltro/agarre en piedras húmedas. Una sola caña en tramos trucheros.",
        tags: ["trucha", "río"],
      },
      {
        id: "ap-surf",
        titulo: "Surfcasting ligero / spinning de orilla",
        resumen: "Costa de Castellón sin entrar en vedados ni puertos.",
        detalle:
          "Caña 2,7–3,6 m según distancia. Respeta bandas de baño y zonas portuarias (marcadas en el mapa de la app). Mejor mar de fondo suave que temporal fuerte de levante.",
        tags: ["costa"],
      },
      {
        id: "ap-terminal",
        titulo: "Terminal tackle mínimo",
        resumen: "Emerillones, snaps, plomos bullet, stops, corta-hilos.",
        detalle:
          "Lleva dos tamaños de emerillón, snaps de calidad (no se abren al pez), plomos 3–14 g, anzuelos de repuesto sin arponcillo y un corta-hilos. Menos es más: organiza en una cajita plana.",
        tags: ["kit"],
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
          "Sigue las normas generales (horario, especies, cebos). Algunas ZPL del Mijares tienen días hábiles concretos (notas del anexo). En la app aparecen en verde.",
        tags: ["legal"],
      },
      {
        id: "voc-zpc",
        titulo: "ZPC — Zona de pesca controlada (coto)",
        resumen: "Necesitas permiso del adjudicatario además de la licencia.",
        detalle:
          "El PTOP del coto puede fijar cupos, días y técnicas. En el mapa: ámbar. Toca el polígono ICV para ver el veredicto.",
        tags: ["coto"],
      },
      {
        id: "voc-vp",
        titulo: "VP / vedado",
        resumen: "Tramo no pescable o reserva.",
        detalle:
          "Prohibido pescar. Incluye cabeceras de protección y algunas reservas. En el mapa: rojo.",
        tags: ["veda"],
      },
      {
        id: "voc-sin-muerte",
        titulo: "Pesca sin muerte (catch & release)",
        resumen: "Debes devolver el pez vivo al agua de inmediato.",
        detalle:
          "Obligatoria para trucha común y barbos autóctonos. Usa anzuelo sin arponcillo, humedece las manos y minimiza el tiempo fuera del agua. No es lo mismo que 'ZPL': una ZPL puede permitir retención de otras especies.",
        tags: ["ética"],
      },
      {
        id: "voc-vocacion",
        titulo: "Vocación salmonícola / ciprinícola",
        resumen: "Clasificación oficial del tramo según especies objetivo.",
        detalle:
          "Salmonícola: orientación a truchas, normas más estrictas de cebo y cañas. Ciprinícola: carpas, barbos, etc. 'Poco modificada' vs 'modificada' indica el grado de alteración del hábitat.",
        tags: ["ficha"],
      },
      {
        id: "voc-ptop",
        titulo: "PTOP",
        resumen: "Plan técnico de ordenación piscícola del coto.",
        detalle:
          "Documento del coto con cupos, horarios y especies. La app muestra orientación general; el cartel del tramo y el PTOP mandan si hay conflicto.",
        tags: ["coto"],
      },
      {
        id: "voc-saih",
        titulo: "SAIH",
        resumen: "Sistema Automático de Información Hidrológica.",
        detalle:
          "Datos de embalses de la CHJ (volumen, caudales). En la ficha de cada embalse de la app verás el % de llenado cuando la consulta funciona.",
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
          "Mira el SAIH y el cielo de montaña. No cruces puentes bajos con agua chocolate. En Mijares y Palancia el estiaje engaña: la orilla socavada cede.",
        tags: ["río"],
      },
      {
        id: "seg-electricidad",
        titulo: "Tormentas eléctricas",
        resumen: "Caña = pararrayos. Recoge y aléjate del agua abierta.",
        detalle:
          "Si oyes truenos, termina. Evita crestas, árboles solos y embalse abierto. Reanuda 30 minutos después del último trueno.",
        tags: ["meteo"],
      },
      {
        id: "seg-invasoras",
        titulo: "Invasoras y desinfección",
        resumen: "No muevas agua ni plantas entre masas.",
        detalle:
          "Bass, lucio y siluro: no los devuelvas donde la norma lo prohíbe; el siluro no se transporta. Limpia suelas y redes al cambiar de río para no extender mejillón cebra y algas.",
        tags: ["bioseguridad"],
      },
      {
        id: "seg-horario",
        titulo: "Horario legal",
        resumen: "De 1 h antes del orto a 1 h después del ocaso.",
        detalle:
          "Pesca nocturna continental prohibida salvo molinà de anguila autorizada. La app muestra el recordatorio en previsión y fichas.",
        tags: ["legal"],
      },
    ],
  },
];
