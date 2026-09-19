import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Path, Line, Polygon, Circle, G, Text as SvgText } from "react-native-svg";
import type { CriterioMedicion, PatronMedicion } from "../data/criterioMedicion";
import { COLORS, RADIUS } from "../theme";

type Props = {
  especieId?: string | null;
  nombre?: string | null;
  criterio: CriterioMedicion;
  valorMinimo?: string | null;
};

type Morfo =
  | "lubina"
  | "dorada"
  | "sargo"
  | "mojarra"
  | "salema"
  | "llisa"
  | "jurel"
  | "caballa"
  | "salmonete"
  | "boga"
  | "anguila"
  | "pulpo"
  | "sepia"
  | "calamar"
  | "cangrejo"
  | "pez";

function morfoDe(id?: string | null, nombre?: string | null): Morfo {
  const k = `${id ?? ""} ${nombre ?? ""}`.toLowerCase();
  if (k.includes("pulpo")) return "pulpo";
  if (k.includes("sepia") || k.includes("jibia")) return "sepia";
  if (k.includes("calamar")) return "calamar";
  if (k.includes("cangrejo")) return "cangrejo";
  if (k.includes("anguila")) return "anguila";
  if (k.includes("caballa") || k.includes("estornino") || k.includes("scomber")) return "caballa";
  if (k.includes("jurel") || k.includes("chicharro") || k.includes("trachurus")) return "jurel";
  if (k.includes("salmonete") || k.includes("mullus")) return "salmonete";
  if (k.includes("llisa") || k.includes("lisa") || k.includes("mabra") || k.includes("mugil")) return "llisa";
  if (k.includes("salema") || k.includes("salpa") || k.includes("sarpa")) return "salema";
  if (k.includes("mojarra") || k.includes("diplodus vulgaris")) return "mojarra";
  if (k.includes("sargo") || k.includes("diplodus")) return "sargo";
  if (k.includes("boga")) return "boga";
  if (k.includes("dorada") || k.includes("sparus")) return "dorada";
  if (k.includes("lubina") || k.includes("llobarro") || k.includes("dicentrarchus")) return "lubina";
  return "pez";
}

const INK = "#1a2e28";
const ACCENT = COLORS.primary;

/** Flechas de cota longitud (hocico → cola) en coordenadas del pez. */
function CotaLongitud({
  x1,
  x2,
  y,
  etiqueta,
}: {
  x1: number;
  x2: number;
  y: number;
  etiqueta: string;
}) {
  const mid = (x1 + x2) / 2;
  return (
    <G>
      <Line x1={x1} y1={y - 10} x2={x1} y2={y + 4} stroke={INK} strokeWidth={1.2} />
      <Line x1={x2} y1={y - 10} x2={x2} y2={y + 4} stroke={INK} strokeWidth={1.2} />
      <Line x1={x1} y1={y} x2={x2} y2={y} stroke={INK} strokeWidth={1.6} />
      <Polygon points={`${x1},${y} ${x1 + 7},${y - 4} ${x1 + 7},${y + 4}`} fill={INK} />
      <Polygon points={`${x2},${y} ${x2 - 7},${y - 4} ${x2 - 7},${y + 4}`} fill={INK} />
      <SvgText
        x={mid}
        y={y - 8}
        fill={ACCENT}
        fontSize="11"
        fontWeight="700"
        textAnchor="middle"
      >
        {etiqueta}
      </SvgText>
    </G>
  );
}

function CotaAncho({
  x,
  y1,
  y2,
  etiqueta,
}: {
  x: number;
  y1: number;
  y2: number;
  etiqueta: string;
}) {
  const mid = (y1 + y2) / 2;
  return (
    <G>
      <Line x1={x - 4} y1={y1} x2={x + 10} y2={y1} stroke={INK} strokeWidth={1.2} />
      <Line x1={x - 4} y1={y2} x2={x + 10} y2={y2} stroke={INK} strokeWidth={1.2} />
      <Line x1={x} y1={y1} x2={x} y2={y2} stroke={INK} strokeWidth={1.6} />
      <Polygon points={`${x},${y1} ${x - 4},${y1 + 7} ${x + 4},${y1 + 7}`} fill={INK} />
      <Polygon points={`${x},${y2} ${x - 4},${y2 - 7} ${x + 4},${y2 - 7}`} fill={INK} />
      <SvgText x={x + 14} y={mid + 4} fill={ACCENT} fontSize="11" fontWeight="700">
        {etiqueta}
      </SvgText>
    </G>
  );
}

/** Siluetas laterales reconocibles (estilo placa técnica). */
function SiluetaPez({ morfo }: { morfo: Morfo }) {
  // Cuerpo genérico pez (fallback)
  if (morfo === "pez" || morfo === "lubina") {
    // Lubina: alargada, 2 dorsales, cola moderada
    return (
      <G>
        <Path
          d="M48 78
             C58 62, 78 52, 118 50
             C148 48, 188 52, 228 58
             C248 52, 268 48, 292 52
             L318 44 L338 58 L318 72 L292 68
             C268 78, 248 82, 228 84
             C188 92, 148 96, 118 94
             C88 92, 68 88, 52 82
             C46 80, 44 78, 48 78 Z"
          fill="#e8f0ec"
          stroke={INK}
          strokeWidth={1.8}
        />
        <Path d="M130 50 C138 38, 158 34, 172 42" fill="none" stroke={INK} strokeWidth={1.5} />
        <Path d="M180 52 C190 40, 210 38, 228 48" fill="none" stroke={INK} strokeWidth={1.5} />
        <Path d="M150 94 C158 108, 178 110, 192 100" fill="none" stroke={INK} strokeWidth={1.4} />
        <Path d="M100 78 C108 70, 118 70, 126 78" fill="none" stroke={INK} strokeWidth={1.2} />
        <Circle cx={72} cy={70} r={3.2} fill={INK} />
        <Path d="M48 78 L38 74 L38 82 Z" fill={INK} />
      </G>
    );
  }

  if (morfo === "dorada") {
    // Dorada: cuerpo alto, perfil empinado, cola ahorquillada, mancha conceptual
    return (
      <G>
        <Path
          d="M55 80
             C70 48, 110 36, 160 38
             C200 40, 240 48, 270 58
             L300 42 L322 62 L300 82 L270 78
             C240 92, 200 100, 160 100
             C110 100, 72 92, 55 80 Z"
          fill="#f3efe2"
          stroke={INK}
          strokeWidth={1.8}
        />
        <Path d="M140 38 C150 24, 175 22, 195 34" fill="none" stroke={INK} strokeWidth={1.5} />
        <Path d="M155 100 C165 112, 190 114, 210 102" fill="none" stroke={INK} strokeWidth={1.4} />
        <Circle cx={88} cy={68} r={3.4} fill={INK} />
        <Circle cx={120} cy={52} r={4} fill="#d4a017" stroke={INK} strokeWidth={1} />
        <Path d="M55 80 L42 74 L42 86 Z" fill={INK} />
      </G>
    );
  }

  if (morfo === "sargo" || morfo === "mojarra" || morfo === "boga") {
    return (
      <G>
        <Path
          d="M52 78
             C68 50, 108 40, 155 42
             C195 44, 235 52, 265 62
             L292 46 L314 64 L292 82 L265 78
             C235 94, 195 102, 155 102
             C108 102, 70 94, 52 78 Z"
          fill="#eef2f4"
          stroke={INK}
          strokeWidth={1.8}
        />
        {/* Barras verticales sargo */}
        {morfo === "sargo" ? (
          <>
            <Line x1={120} y1={48} x2={118} y2={96} stroke={INK} strokeWidth={1.2} opacity={0.45} />
            <Line x1={150} y1={46} x2={148} y2={98} stroke={INK} strokeWidth={1.2} opacity={0.45} />
            <Line x1={180} y1={48} x2={178} y2={96} stroke={INK} strokeWidth={1.2} opacity={0.45} />
          </>
        ) : null}
        {morfo === "mojarra" ? (
          <>
            <Line x1={130} y1={48} x2={128} y2={96} stroke={INK} strokeWidth={1.3} opacity={0.5} />
            <Line x1={175} y1={46} x2={173} y2={98} stroke={INK} strokeWidth={1.3} opacity={0.5} />
          </>
        ) : null}
        <Path d="M145 42 C155 28, 180 26, 200 38" fill="none" stroke={INK} strokeWidth={1.5} />
        <Path d="M160 102 C170 114, 195 114, 215 102" fill="none" stroke={INK} strokeWidth={1.4} />
        <Circle cx={82} cy={70} r={3.2} fill={INK} />
        <Path d="M52 78 L40 72 L40 84 Z" fill={INK} />
      </G>
    );
  }

  if (morfo === "salema") {
    return (
      <G>
        <Path
          d="M50 80
             C65 55, 105 44, 155 46
             C200 48, 245 56, 275 66
             L302 50 L322 68 L302 86 L275 80
             C245 96, 200 104, 155 104
             C105 104, 68 96, 50 80 Z"
          fill="#e6f4ea"
          stroke={INK}
          strokeWidth={1.8}
        />
        {/* Rayas longitudinales salema */}
        <Path d="M90 62 C140 58, 200 64, 260 72" fill="none" stroke="#2a7a4a" strokeWidth={1.3} opacity={0.7} />
        <Path d="M88 76 C140 72, 200 78, 258 84" fill="none" stroke="#2a7a4a" strokeWidth={1.3} opacity={0.7} />
        <Path d="M92 88 C145 86, 200 90, 255 94" fill="none" stroke="#2a7a4a" strokeWidth={1.3} opacity={0.7} />
        <Path d="M150 46 C160 32, 185 30, 205 42" fill="none" stroke={INK} strokeWidth={1.5} />
        <Circle cx={78} cy={72} r={3.2} fill={INK} />
        <Path d="M50 80 L38 74 L38 86 Z" fill={INK} />
      </G>
    );
  }

  if (morfo === "llisa") {
    return (
      <G>
        <Path
          d="M42 78
             C55 60, 90 52, 140 52
             C190 52, 240 56, 275 64
             L305 50 L328 68 L305 86 L275 78
             C240 90, 190 96, 140 96
             C90 96, 58 90, 42 78 Z"
          fill="#e4edf2"
          stroke={INK}
          strokeWidth={1.8}
        />
        <Path d="M160 52 C170 40, 195 38, 215 48" fill="none" stroke={INK} strokeWidth={1.4} />
        <Path d="M120 96 C130 108, 155 110, 175 100" fill="none" stroke={INK} strokeWidth={1.3} />
        <Circle cx={68} cy={70} r={3} fill={INK} />
        {/* Hocico romo mugílido */}
        <Path d="M42 78 C36 74, 34 70, 38 66 C42 70, 44 74, 42 78 Z" fill={INK} />
      </G>
    );
  }

  if (morfo === "jurel") {
    return (
      <G>
        <Path
          d="M48 78
             C62 52, 100 42, 150 44
             C195 46, 235 54, 262 64
             L295 40 L318 68 L295 96 L262 80
             C235 96, 195 104, 150 104
             C100 104, 64 96, 48 78 Z"
          fill="#f5f0d8"
          stroke={INK}
          strokeWidth={1.8}
        />
        {/* Escudetes laterales */}
        <Path d="M120 74 L255 74" stroke={INK} strokeWidth={1.2} strokeDasharray="3 2" />
        <Path d="M155 44 C165 28, 195 26, 220 40" fill="none" stroke={INK} strokeWidth={1.5} />
        <Circle cx={78} cy={68} r={3.2} fill={INK} />
        <Path d="M48 78 L36 72 L36 84 Z" fill={INK} />
      </G>
    );
  }

  if (morfo === "caballa") {
    return (
      <G>
        <Path
          d="M40 76
             C55 58, 95 50, 150 50
             C200 50, 250 54, 285 62
             L315 48 L340 68 L315 88 L285 80
             C250 92, 200 98, 150 98
             C95 98, 55 92, 40 76 Z"
          fill="#dceaf2"
          stroke={INK}
          strokeWidth={1.8}
        />
        {/* Vermiculaciones dorsales */}
        <Path d="M100 56 C120 48, 140 58, 160 52 C180 46, 200 56, 220 50 C240 46, 255 54, 270 58"
          fill="none" stroke={INK} strokeWidth={1.2} opacity={0.55} />
        {/* Pinulas */}
        <Line x1={250} y1={60} x2={250} y2={66} stroke={INK} strokeWidth={1.2} />
        <Line x1={260} y1={60} x2={260} y2={66} stroke={INK} strokeWidth={1.2} />
        <Line x1={270} y1={62} x2={270} y2={68} stroke={INK} strokeWidth={1.2} />
        <Line x1={250} y1={86} x2={250} y2={92} stroke={INK} strokeWidth={1.2} />
        <Line x1={260} y1={86} x2={260} y2={92} stroke={INK} strokeWidth={1.2} />
        <Circle cx={66} cy={70} r={2.8} fill={INK} />
        <Path d="M40 76 L28 70 L28 82 Z" fill={INK} />
      </G>
    );
  }

  if (morfo === "salmonete") {
    return (
      <G>
        <Path
          d="M50 80
             C65 58, 100 48, 150 50
             C195 52, 235 58, 265 68
             L290 52 L312 70 L290 88 L265 82
             C235 96, 195 102, 150 102
             C100 102, 68 94, 50 80 Z"
          fill="#f6e4de"
          stroke={INK}
          strokeWidth={1.8}
        />
        {/* Barbillones */}
        <Path d="M55 88 Q48 102 42 110" fill="none" stroke={INK} strokeWidth={1.4} />
        <Path d="M62 90 Q58 104 54 112" fill="none" stroke={INK} strokeWidth={1.4} />
        <Path d="M140 50 C148 36, 170 34, 188 44" fill="none" stroke={INK} strokeWidth={1.4} />
        <Path d="M195 52 C205 40, 225 40, 240 50" fill="none" stroke={INK} strokeWidth={1.4} />
        <Circle cx={78} cy={70} r={3} fill={INK} />
        <Path d="M50 80 L38 74 L38 86 Z" fill={INK} />
      </G>
    );
  }

  if (morfo === "anguila") {
    return (
      <G>
        <Path
          d="M30 78
             C50 70, 90 66, 140 68
             C200 70, 260 74, 310 80
             C320 82, 328 86, 334 90
             C328 94, 318 96, 310 94
             C260 88, 200 84, 140 82
             C90 80, 50 82, 32 88
             C26 84, 26 80, 30 78 Z"
          fill="#d8e0d6"
          stroke={INK}
          strokeWidth={1.8}
        />
        <Circle cx={48} cy={76} r={2.6} fill={INK} />
      </G>
    );
  }

  if (morfo === "pulpo") {
    return (
      <G>
        <Circle cx={200} cy={58} r={32} fill="#efe4f0" stroke={INK} strokeWidth={1.8} />
        <Circle cx={188} cy={52} r={4} fill={INK} />
        <Circle cx={212} cy={52} r={4} fill={INK} />
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const x = 155 + i * 18;
          return (
            <Path
              key={i}
              d={`M${x} 85 Q${x - 6} 110 ${x + 4} 128`}
              fill="none"
              stroke={INK}
              strokeWidth={2}
            />
          );
        })}
        {/* Báscula */}
        <Path d="M78 48 L120 48 L112 70 L86 70 Z" fill="#e8f0ec" stroke={INK} strokeWidth={1.5} />
        <Line x1={99} y1={36} x2={99} y2={48} stroke={INK} strokeWidth={1.5} />
        <Circle cx={99} cy={34} r={5} fill="none" stroke={INK} strokeWidth={1.5} />
      </G>
    );
  }

  if (morfo === "sepia") {
    return (
      <G>
        <Path
          d="M90 70
             C120 48, 180 42, 240 48
             C270 52, 295 62, 310 78
             C295 94, 270 102, 240 104
             C180 108, 120 100, 90 82
             C82 76, 82 74, 90 70 Z"
          fill="#efe6da"
          stroke={INK}
          strokeWidth={1.8}
        />
        <Path d="M90 76 C70 70, 55 78, 48 90" fill="none" stroke={INK} strokeWidth={1.5} />
        <Path d="M90 80 C68 82, 52 92, 46 104" fill="none" stroke={INK} strokeWidth={1.5} />
        <Circle cx={250} cy={70} r={3} fill={INK} />
        {/* Cota manto: borde anterior → extremo */}
        <CotaLongitud x1={95} x2={305} y={128} etiqueta="Longitud del manto" />
      </G>
    );
  }

  if (morfo === "calamar") {
    return (
      <G>
        <Path
          d="M160 40
             C175 40, 190 50, 195 70
             L200 110
             C198 118, 190 122, 180 120
             L170 80
             C165 55, 160 45, 160 40 Z"
          fill="#f2e4ea"
          stroke={INK}
          strokeWidth={1.8}
        />
        <Path d="M170 118 L155 145" stroke={INK} strokeWidth={1.5} />
        <Path d="M180 120 L180 148" stroke={INK} strokeWidth={1.5} />
        <Path d="M190 118 L205 145" stroke={INK} strokeWidth={1.5} />
        <Circle cx={178} cy={58} r={2.8} fill={INK} />
        <CotaLongitud x1={168} x2={198} y={28} etiqueta="Longitud del manto" />
      </G>
    );
  }

  // cangrejo
  return (
    <G>
      <Path
        d="M140 70
           C155 55, 195 50, 230 55
           C250 58, 265 70, 260 88
           C250 105, 210 112, 175 110
           C150 108, 130 95, 140 70 Z"
        fill="#f0e0d4"
        stroke={INK}
        strokeWidth={1.8}
      />
      <Path d="M140 78 L105 60 L95 70 L128 88 Z" fill="#e8d0c0" stroke={INK} strokeWidth={1.4} />
      <Path d="M255 78 L290 60 L300 70 L268 88 Z" fill="#e8d0c0" stroke={INK} strokeWidth={1.4} />
      <Circle cx={175} cy={78} r={3} fill={INK} />
      <Circle cx={215} cy={78} r={3} fill={INK} />
      <CotaAncho x={318} y1={58} y2={108} etiqueta="Anchura" />
    </G>
  );
}

function extremosPez(morfo: Morfo): { xHocico: number; xCola: number; yCota: number } {
  if (morfo === "anguila") return { xHocico: 30, xCola: 334, yCota: 118 };
  if (morfo === "caballa") return { xHocico: 28, xCola: 340, yCota: 122 };
  if (morfo === "llisa") return { xHocico: 34, xCola: 328, yCota: 122 };
  if (morfo === "jurel") return { xHocico: 36, xCola: 318, yCota: 126 };
  if (morfo === "dorada") return { xHocico: 42, xCola: 322, yCota: 126 };
  if (morfo === "salema") return { xHocico: 38, xCola: 322, yCota: 126 };
  if (morfo === "salmonete") return { xHocico: 38, xCola: 312, yCota: 126 };
  return { xHocico: 38, xCola: 338, yCota: 122 };
}

function etiquetaCota(patron: PatronMedicion, valorMinimo?: string | null, unidad?: string): string {
  if (valorMinimo) return `Longitud total · mín. ${valorMinimo} ${unidad ?? "cm"}`;
  if (patron === "pez_horquilla") return "Longitud a la horquilla";
  if (patron === "cefalopodo_manto") return "Longitud del manto";
  if (patron === "pulpo_peso") return "Peso del ejemplar entero";
  if (patron === "cangrejo_caparazon") return "Anchura del caparazón";
  return "Longitud total";
}

/**
 * Placa técnica por especie: silueta reconocible + cota en español (UE/RD 560).
 */
export default function PlacaMedicionEspecie({ especieId, nombre, criterio, valorMinimo }: Props) {
  const morfo = morfoDe(especieId, nombre);
  const esPez =
    criterio.patron === "pez_total" ||
    criterio.patron === "pez_horquilla" ||
    criterio.patron === "anguila";
  const esManto = criterio.patron === "cefalopodo_manto";
  const esPeso = criterio.patron === "pulpo_peso";

  const { xHocico, xCola, yCota } = extremosPez(morfo);
  const badge = etiquetaCota(criterio.patron, valorMinimo, criterio.unidad);

  return (
    <View style={styles.box}>
      <Svg width="100%" height={168} viewBox="0 0 380 160" accessibilityLabel={`Diagrama de medición de ${nombre ?? "la especie"}`}>
        <SiluetaPez morfo={morfo} />
        {esPez ? <CotaLongitud x1={xHocico} x2={xCola} y={yCota} etiqueta={badge} /> : null}
        {esPeso ? (
          <SvgText x={190} y={148} fill={ACCENT} fontSize="12" fontWeight="700" textAnchor="middle">
            {valorMinimo ? `Peso mínimo · ${valorMinimo} kg` : "Pesar el ejemplar entero"}
          </SvgText>
        ) : null}
        {/* Leyendas A / B en español */}
        {esPez ? (
          <>
            <SvgText x={xHocico} y={yCota + 18} fill={INK} fontSize="9" fontWeight="600" textAnchor="middle">
              Hocico
            </SvgText>
            <SvgText x={xCola} y={yCota + 18} fill={INK} fontSize="9" fontWeight="600" textAnchor="middle">
              Extremo cola
            </SvgText>
          </>
        ) : null}
      </Svg>
      <Text style={styles.pie}>
        {esPez
          ? "Norma UE / RD 560 · longitud total (cm): punta del hocico → extremo de la aleta caudal"
          : esManto
            ? "Longitud del manto (cm): no cuentes tentáculos"
            : esPeso
              ? "Peso entero en báscula (kg)"
              : "Anchura del caparazón (cm), sin pinzas"}
      </Text>
    </View>
  );
}

export { morfoDe };

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    backgroundColor: "#f7faf8",
    paddingTop: 6,
    paddingBottom: 8,
    paddingHorizontal: 4,
    marginBottom: 10,
    overflow: "hidden",
  },
  pie: {
    marginTop: 2,
    paddingHorizontal: 8,
    fontSize: 10,
    lineHeight: 14,
    color: COLORS.textSecondary,
    fontWeight: "600",
    textAlign: "center",
  },
});
