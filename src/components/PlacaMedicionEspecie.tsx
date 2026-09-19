import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import Svg, { Path, Line, Polygon, Circle, G, Text as SvgText } from "react-native-svg";
import type { CriterioMedicion, PatronMedicion } from "../data/criterioMedicion";
import { diagramaMedicionEspecie } from "../data/diagramasMedicionEspecie";
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
  if (k.includes("mojarra")) return "mojarra";
  if (k.includes("sargo") || k.includes("diplodus")) return "sargo";
  if (k.includes("boga")) return "boga";
  if (k.includes("dorada") || k.includes("sparus")) return "dorada";
  if (k.includes("lubina") || k.includes("llobarro") || k.includes("dicentrarchus")) return "lubina";
  return "pez";
}

const INK = "#1a2e28";
const ACCENT = COLORS.primary;

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
      <SvgText x={mid} y={y - 8} fill={ACCENT} fontSize="11" fontWeight="700" textAnchor="middle">
        {etiqueta}
      </SvgText>
    </G>
  );
}

function CotaAncho({ x, y1, y2, etiqueta }: { x: number; y1: number; y2: number; etiqueta: string }) {
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

function SiluetaPez({ morfo }: { morfo: Morfo }) {
  if (morfo === "pez" || morfo === "lubina") {
    return (
      <G>
        <Path
          d="M48 78 C58 62, 78 52, 118 50 C148 48, 188 52, 228 58 C248 52, 268 48, 292 52 L318 44 L338 58 L318 72 L292 68 C268 78, 248 82, 228 84 C188 92, 148 96, 118 94 C88 92, 68 88, 52 82 C46 80, 44 78, 48 78 Z"
          fill="#e8f0ec"
          stroke={INK}
          strokeWidth={1.8}
        />
        <Path d="M130 50 C138 38, 158 34, 172 42" fill="none" stroke={INK} strokeWidth={1.5} />
        <Path d="M180 52 C190 40, 210 38, 228 48" fill="none" stroke={INK} strokeWidth={1.5} />
        <Circle cx={72} cy={70} r={3.2} fill={INK} />
        <Path d="M48 78 L38 74 L38 82 Z" fill={INK} />
      </G>
    );
  }
  if (morfo === "dorada") {
    return (
      <G>
        <Path
          d="M55 80 C70 48, 110 36, 160 38 C200 40, 240 48, 270 58 L300 42 L322 62 L300 82 L270 78 C240 92, 200 100, 160 100 C110 100, 72 92, 55 80 Z"
          fill="#f3efe2"
          stroke={INK}
          strokeWidth={1.8}
        />
        <Circle cx={88} cy={68} r={3.4} fill={INK} />
        <Circle cx={120} cy={52} r={4} fill="#d4a017" stroke={INK} strokeWidth={1} />
        <Path d="M55 80 L42 74 L42 86 Z" fill={INK} />
      </G>
    );
  }
  if (morfo === "sargo" || morfo === "mojarra" || morfo === "boga" || morfo === "salema") {
    return (
      <G>
        <Path
          d="M52 78 C68 50, 108 40, 155 42 C195 44, 235 52, 265 62 L292 46 L314 64 L292 82 L265 78 C235 94, 195 102, 155 102 C108 102, 70 94, 52 78 Z"
          fill="#eef2f4"
          stroke={INK}
          strokeWidth={1.8}
        />
        <Circle cx={82} cy={70} r={3.2} fill={INK} />
        <Path d="M52 78 L40 72 L40 84 Z" fill={INK} />
      </G>
    );
  }
  if (morfo === "llisa" || morfo === "caballa" || morfo === "jurel" || morfo === "salmonete") {
    return (
      <G>
        <Path
          d="M42 78 C55 60, 90 52, 140 52 C190 52, 240 56, 275 64 L305 50 L328 68 L305 86 L275 78 C240 90, 190 96, 140 96 C90 96, 58 90, 42 78 Z"
          fill="#e4edf2"
          stroke={INK}
          strokeWidth={1.8}
        />
        <Circle cx={68} cy={70} r={3} fill={INK} />
        <Path d="M42 78 L30 72 L30 84 Z" fill={INK} />
      </G>
    );
  }
  if (morfo === "anguila") {
    return (
      <G>
        <Path
          d="M30 78 C50 70, 90 66, 140 68 C200 70, 260 74, 310 80 C320 82, 328 86, 334 90 C328 94, 318 96, 310 94 C260 88, 200 84, 140 82 C90 80, 50 82, 32 88 C26 84, 26 80, 30 78 Z"
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
          return <Path key={i} d={`M${x} 85 Q${x - 6} 110 ${x + 4} 128`} fill="none" stroke={INK} strokeWidth={2} />;
        })}
      </G>
    );
  }
  if (morfo === "sepia") {
    return (
      <G>
        <Path
          d="M90 70 C120 48, 180 42, 240 48 C270 52, 295 62, 310 78 C295 94, 270 102, 240 104 C180 108, 120 100, 90 82 C82 76, 82 74, 90 70 Z"
          fill="#efe6da"
          stroke={INK}
          strokeWidth={1.8}
        />
        <CotaLongitud x1={95} x2={305} y={128} etiqueta="Longitud del manto" />
      </G>
    );
  }
  if (morfo === "calamar") {
    return (
      <G>
        <Path
          d="M160 40 C175 40, 190 50, 195 70 L200 110 C198 118, 190 122, 180 120 L170 80 C165 55, 160 45, 160 40 Z"
          fill="#f2e4ea"
          stroke={INK}
          strokeWidth={1.8}
        />
        <CotaLongitud x1={168} x2={198} y={28} etiqueta="Longitud del manto" />
      </G>
    );
  }
  return (
    <G>
      <Path
        d="M140 70 C155 55, 195 50, 230 55 C250 58, 265 70, 260 88 C250 105, 210 112, 175 110 C150 108, 130 95, 140 70 Z"
        fill="#f0e0d4"
        stroke={INK}
        strokeWidth={1.8}
      />
      <CotaAncho x={318} y1={58} y2={108} etiqueta="Anchura" />
    </G>
  );
}

function extremosPez(morfo: Morfo): { xHocico: number; xCola: number; yCota: number } {
  if (morfo === "anguila") return { xHocico: 30, xCola: 334, yCota: 118 };
  if (morfo === "caballa" || morfo === "llisa") return { xHocico: 30, xCola: 328, yCota: 122 };
  if (morfo === "dorada") return { xHocico: 42, xCola: 322, yCota: 126 };
  return { xHocico: 38, xCola: 338, yCota: 122 };
}

function etiquetaCota(patron: PatronMedicion, valorMinimo?: string | null, unidad?: string): string {
  if (valorMinimo) {
    if (patron === "pulpo_peso") return `Peso mínimo · ${valorMinimo} ${unidad ?? "kg"}`;
    return `Longitud total · mín. ${valorMinimo} ${unidad ?? "cm"}`;
  }
  if (patron === "pez_horquilla") return "Longitud a la horquilla";
  if (patron === "cefalopodo_manto") return "Longitud del manto";
  if (patron === "pulpo_peso") return "Peso del ejemplar entero";
  if (patron === "cangrejo_caparazon") return "Anchura del caparazón";
  return "Longitud total";
}

function pieNorma(criterio: CriterioMedicion): string {
  if (criterio.patron === "cefalopodo_manto") return "Longitud del manto (cm): no cuentes tentáculos";
  if (criterio.patron === "pulpo_peso") return "Peso entero en báscula (kg)";
  if (criterio.patron === "cangrejo_caparazon") return "Anchura del caparazón (cm), sin pinzas";
  return "Norma UE / RD 560 · longitud total (cm): punta del hocico → extremo de la aleta caudal";
}

/**
 * Placa técnica por especie: dibujo de esa especie + cota en español (cm/kg).
 */
export default function PlacaMedicionEspecie({ especieId, nombre, criterio, valorMinimo }: Props) {
  const placaImg = diagramaMedicionEspecie(especieId);
  const morfo = morfoDe(especieId, nombre);
  const esPez =
    criterio.patron === "pez_total" ||
    criterio.patron === "pez_horquilla" ||
    criterio.patron === "anguila";
  const { xHocico, xCola, yCota } = extremosPez(morfo);
  const badge = etiquetaCota(criterio.patron, valorMinimo, criterio.unidad);

  if (placaImg) {
    return (
      <View style={styles.box}>
        <Image
          source={placaImg}
          style={styles.placaImg}
          resizeMode="contain"
          accessibilityLabel={`Diagrama de medición de ${nombre ?? "la especie"} en español`}
        />
        {valorMinimo ? (
          <View style={styles.badgeMin}>
            <Text style={styles.badgeMinTxt}>
              Mínimo legal: {valorMinimo} {criterio.unidad}
            </Text>
          </View>
        ) : null}
        <Text style={styles.pie}>{pieNorma(criterio)}</Text>
      </View>
    );
  }

  return (
    <View style={styles.box}>
      <Svg
        width="100%"
        height={168}
        viewBox="0 0 380 160"
        accessibilityLabel={`Diagrama de medición de ${nombre ?? "la especie"}`}
      >
        <SiluetaPez morfo={morfo} />
        {esPez ? <CotaLongitud x1={xHocico} x2={xCola} y={yCota} etiqueta={badge} /> : null}
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
      <Text style={styles.pie}>{pieNorma(criterio)}</Text>
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
  placaImg: {
    width: "100%",
    height: 168,
    alignSelf: "center",
  },
  badgeMin: {
    alignSelf: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 4,
    marginTop: 4,
  },
  badgeMinTxt: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  pie: {
    marginTop: 6,
    paddingHorizontal: 8,
    fontSize: 10,
    lineHeight: 14,
    color: COLORS.textSecondary,
    fontWeight: "600",
    textAlign: "center",
  },
});
