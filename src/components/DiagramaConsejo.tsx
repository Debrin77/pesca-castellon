import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { COLORS, RADIUS } from "../theme";
import { GUIAS_MEDIA, type IdDiagrama } from "../data/consejosMedia";
import GuiaFotoConsejo from "./GuiaFotoConsejo";
import EsquemaMontajeLinea from "./EsquemaMontajeLinea";
import { montajePorDiagramaId } from "../data/montajesEspecie";

export type { IdDiagrama };

type Props = {
  id: IdDiagrama;
  /** Ancho del lienzo; altura se adapta al esquema. */
  width?: number;
};

const LINE = COLORS.waterDark;
const ACCENT = COLORS.primaryDark;
const FILL = COLORS.waterLight;
const WIRE = "#8B6914";

/** Lienzo con borde suave para enmarcar el dibujo. */
function Lienzo({
  width,
  height,
  children,
  label,
}: {
  width: number;
  height: number;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <View
      style={[styles.lienzo, { width, height }]}
      accessibilityLabel={label}
      accessible
    >
      {children}
    </View>
  );
}

function Paso({ n, x, y }: { n: number; x: number; y: number }) {
  return (
    <View style={[styles.paso, { left: x, top: y }]}>
      <Text style={styles.pasoTxt}>{n}</Text>
    </View>
  );
}

/** Línea de sedal (barra redondeada). */
function Hilo({
  left,
  top,
  w,
  h = 3,
  color = LINE,
  rotate,
}: {
  left: number;
  top: number;
  w: number;
  h?: number;
  color?: string;
  rotate?: string;
}) {
  return (
    <View
      style={{
        position: "absolute",
        left,
        top,
        width: w,
        height: h,
        borderRadius: h,
        backgroundColor: color,
        transform: rotate ? [{ rotate }] : undefined,
      }}
    />
  );
}

/** Anzuelo esquemático (simple). */
function AnzueloDibujo({
  left,
  top,
  size = 28,
  color = ACCENT,
  barbless = false,
}: {
  left: number;
  top: number;
  size?: number;
  color?: string;
  barbless?: boolean;
}) {
  const eye = size * 0.22;
  return (
    <View style={{ position: "absolute", left, top, width: size * 0.55, height: size }}>
      <View
        style={{
          width: eye,
          height: eye,
          borderRadius: eye,
          borderWidth: 2,
          borderColor: color,
          alignSelf: "center",
        }}
      />
      <View
        style={{
          width: 3,
          height: size * 0.45,
          backgroundColor: color,
          alignSelf: "center",
          marginTop: -1,
        }}
      />
      <View
        style={{
          width: size * 0.42,
          height: size * 0.38,
          borderWidth: 3,
          borderColor: color,
          borderTopWidth: 0,
          borderLeftWidth: 0,
          borderBottomRightRadius: size * 0.35,
          borderTopRightRadius: 2,
          alignSelf: "flex-end",
          marginTop: -size * 0.08,
          marginRight: 2,
        }}
      />
      {!barbless && (
        <View
          style={{
            position: "absolute",
            right: 4,
            bottom: size * 0.28,
            width: 6,
            height: 2.5,
            backgroundColor: color,
            transform: [{ rotate: "-35deg" }],
          }}
        />
      )}
    </View>
  );
}

function NudoPalomar({ width }: { width: number }) {
  const h = 118;
  return (
    <Lienzo width={width} height={h} label="Diagrama nudo Palomar en 4 pasos">
      <Paso n={1} x={8} y={8} />
      <Hilo left={28} top={22} w={48} />
      <Hilo left={28} top={30} w={48} color={COLORS.water} />
      <View style={[styles.ojo, { left: 78, top: 18 }]} />
      <Text style={[styles.miniLabel, { left: 28, top: 40 }]}>doblar</Text>

      <Paso n={2} x={118} y={8} />
      <View style={[styles.lazo, { left: 138, top: 16 }]} />
      <Text style={[styles.miniLabel, { left: 132, top: 52 }]}>lazo</Text>

      <Paso n={3} x={198} y={8} />
      <AnzueloDibujo left={218} top={14} size={32} barbless />
      <View style={[styles.lazo, { left: 212, top: 52, width: 36, height: 22 }]} />
      <Text style={[styles.miniLabel, { left: 208, top: 78 }]}>pasar anzuelo</Text>

      <Paso n={4} x={268} y={8} />
      <AnzueloDibujo left={288} top={20} size={36} barbless />
      <Hilo left={278} top={18} w={20} />
      <Text style={[styles.miniLabel, { left: 278, top: 78 }]}>apretar</Text>
    </Lienzo>
  );
}

function NudoClinch({ width }: { width: number }) {
  const h = 110;
  return (
    <Lienzo width={width} height={h} label="Diagrama clinch mejorado">
      <Paso n={1} x={10} y={10} />
      <AnzueloDibujo left={36} top={18} size={30} />
      <Hilo left={28} top={24} w={36} />
      <Text style={[styles.miniLabel, { left: 28, top: 72 }]}>por el ojal</Text>

      <Paso n={2} x={110} y={10} />
      <Hilo left={130} top={28} w={50} />
      {[0, 1, 2, 3, 4].map((i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            left: 138 + i * 7,
            top: 36,
            width: 10,
            height: 10,
            borderRadius: 5,
            borderWidth: 2,
            borderColor: LINE,
          }}
        />
      ))}
      <Text style={[styles.miniLabel, { left: 128, top: 72 }]}>5–7 vueltas</Text>

      <Paso n={3} x={210} y={10} />
      <View style={[styles.lazo, { left: 232, top: 22, width: 40, height: 28 }]} />
      <Hilo left={248} top={18} w={3} h={40} />
      <Text style={[styles.miniLabel, { left: 228, top: 72 }]}>por el hueco</Text>

      <Paso n={4} x={290} y={10} />
      <AnzueloDibujo left={310} top={22} size={34} />
      <Hilo left={300} top={20} w={18} />
      <Text style={[styles.miniLabel, { left: 300, top: 72 }]}>mojar y tirar</Text>
    </Lienzo>
  );
}

function NudoUni({ width }: { width: number }) {
  return (
    <Lienzo width={width} height={100} label="Diagrama Trilene">
      <Paso n={1} x={12} y={8} />
      <AnzueloDibujo left={40} top={16} size={28} />
      <View style={[styles.lazo, { left: 36, top: 48, width: 44, height: 28 }]} />
      <Text style={[styles.miniLabel, { left: 36, top: 80 }]}>círculo</Text>

      <Paso n={2} x={120} y={8} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Hilo key={i} left={140} top={24 + i * 8} w={36} color={i % 2 ? COLORS.water : LINE} />
      ))}
      <Text style={[styles.miniLabel, { left: 138, top: 80 }]}>vueltas dentro</Text>

      <Paso n={3} x={220} y={8} />
      <AnzueloDibujo left={248} top={20} size={34} />
      <Hilo left={236} top={18} w={22} />
      <Text style={[styles.miniLabel, { left: 236, top: 80 }]}>apretar</Text>
    </Lienzo>
  );
}

function NudoAlbright({ width }: { width: number }) {
  return (
    <Lienzo width={width} height={100} label="Diagrama Albright trenza a fluoro">
      <Paso n={1} x={10} y={8} />
      <View style={[styles.lazo, { left: 36, top: 22, width: 50, height: 36, borderColor: COLORS.primary }]} />
      <Text style={[styles.miniLabel, { left: 36, top: 72 }]}>lazo fluoro</Text>

      <Paso n={2} x={120} y={8} />
      <Hilo left={140} top={30} w={60} color={WIRE} h={4} />
      <View style={[styles.lazo, { left: 150, top: 40, width: 44, height: 24 }]} />
      <Text style={[styles.miniLabel, { left: 140, top: 72 }]}>trenza dentro</Text>

      <Paso n={3} x={230} y={8} />
      {[0, 1, 2, 3].map((i) => (
        <Hilo key={i} left={250 + i * 6} top={28} w={4} h={36} color={WIRE} />
      ))}
      <Hilo left={248} top={48} w={40} />
      <Text style={[styles.miniLabel, { left: 248, top: 72 }]}>10–12 vueltas</Text>
    </Lienzo>
  );
}

function NudoLoop({ width }: { width: number }) {
  return (
    <Lienzo width={width} height={90} label="Diagrama lazo del pescador">
      <Paso n={1} x={20} y={12} />
      <Hilo left={48} top={28} w={50} />
      <Hilo left={48} top={36} w={50} color={COLORS.water} />
      <Text style={[styles.miniLabel, { left: 48, top: 52 }]}>doblar extremo</Text>

      <Paso n={2} x={140} y={12} />
      <View style={[styles.lazo, { left: 168, top: 20, width: 48, height: 36 }]} />
      <View
        style={{
          position: "absolute",
          left: 178,
          top: 28,
          width: 28,
          height: 20,
          borderRadius: 10,
          borderWidth: 2,
          borderColor: ACCENT,
        }}
      />
      <Text style={[styles.miniLabel, { left: 160, top: 64 }]}>nudo doble</Text>

      <Paso n={3} x={250} y={12} />
      <View style={[styles.lazo, { left: 278, top: 18, width: 56, height: 42 }]} />
      <Text style={[styles.miniLabel, { left: 278, top: 64 }]}>ojal listo</Text>
    </Lienzo>
  );
}

function AnzueloSimple({ width }: { width: number }) {
  return (
    <Lienzo width={width} height={88} label="Anzuelo simple">
      <AnzueloDibujo left={40} top={12} size={56} />
      <Text style={[styles.etiqueta, { left: 110, top: 18 }]}>Ojal</Text>
      <Hilo left={88} top={22} w={18} h={2} color={COLORS.textMuted} />
      <Text style={[styles.etiqueta, { left: 110, top: 42 }]}>Vástago</Text>
      <Text style={[styles.etiqueta, { left: 110, top: 62 }]}>Curva + punta</Text>
      <View style={[styles.badge, { right: 16, top: 28 }]}>
        <Text style={styles.badgeTxt}>1 punta</Text>
      </View>
    </Lienzo>
  );
}

function AnzueloTriple({ width }: { width: number }) {
  return (
    <Lienzo width={width} height={88} label="Anzuelo triple">
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            left: 48,
            top: 18,
            transform: [{ rotate: `${i * 120 - 30}deg` }],
          }}
        >
          <View style={{ width: 3, height: 28, backgroundColor: ACCENT, borderRadius: 2 }} />
          <View
            style={{
              width: 16,
              height: 14,
              borderWidth: 2.5,
              borderColor: ACCENT,
              borderTopWidth: 0,
              borderLeftWidth: 0,
              borderBottomRightRadius: 12,
              marginLeft: 1,
              marginTop: -4,
            }}
          />
        </View>
      ))}
      <View
        style={{
          position: "absolute",
          left: 44,
          top: 36,
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: COLORS.gold,
          borderWidth: 2,
          borderColor: ACCENT,
        }}
      />
      <Text style={[styles.etiqueta, { left: 120, top: 24 }]}>3 puntas unidas</Text>
      <Text style={[styles.etiqueta, { left: 120, top: 46 }]}>Cucharillas / crank</Text>
      <View style={[styles.badgeWarn, { right: 12, top: 28 }]}>
        <Text style={styles.badgeWarnTxt}>Más daño</Text>
      </View>
    </Lienzo>
  );
}

function AnzueloOffset({ width }: { width: number }) {
  return (
    <Lienzo width={width} height={88} label="Anzuelo offset weedless">
      <View style={{ position: "absolute", left: 36, top: 16 }}>
        <View style={{ width: 14, height: 10, borderWidth: 2, borderColor: ACCENT, borderRadius: 4 }} />
        <View style={{ width: 18, height: 3, backgroundColor: ACCENT, marginLeft: 8, marginTop: 2 }} />
        <View style={{ width: 3, height: 36, backgroundColor: ACCENT, marginLeft: 22 }} />
        <View
          style={{
            width: 22,
            height: 18,
            borderWidth: 3,
            borderColor: ACCENT,
            borderTopWidth: 0,
            borderLeftWidth: 0,
            borderBottomRightRadius: 16,
            marginLeft: 22,
            marginTop: -6,
          }}
        />
      </View>
      <View
        style={{
          position: "absolute",
          left: 72,
          top: 28,
          width: 40,
          height: 16,
          borderRadius: 8,
          backgroundColor: "#6B9B4A",
          opacity: 0.85,
        }}
      />
      <Text style={[styles.etiqueta, { left: 130, top: 22 }]}>Pala desplazada</Text>
      <Text style={[styles.etiqueta, { left: 130, top: 44 }]}>Punta oculta (texas)</Text>
    </Lienzo>
  );
}

function AnzueloCircle({ width }: { width: number }) {
  return (
    <Lienzo width={width} height={88} label="Circle hook">
      <View
        style={{
          position: "absolute",
          left: 44,
          top: 18,
          width: 44,
          height: 44,
          borderRadius: 22,
          borderWidth: 3.5,
          borderColor: ACCENT,
          borderLeftColor: "transparent",
          transform: [{ rotate: "25deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          left: 58,
          top: 14,
          width: 10,
          height: 10,
          borderRadius: 5,
          borderWidth: 2,
          borderColor: ACCENT,
        }}
      />
      <Text style={[styles.etiqueta, { left: 120, top: 22 }]}>Punta hacia el ojal</Text>
      <Text style={[styles.etiqueta, { left: 120, top: 44 }]}>Se clava solo al tensar</Text>
    </Lienzo>
  );
}

function AnzueloMosca({ width }: { width: number }) {
  return (
    <Lienzo width={width} height={88} label="Anzuelo de mosca">
      <AnzueloDibujo left={40} top={14} size={48} barbless />
      <View
        style={{
          position: "absolute",
          left: 48,
          top: 28,
          width: 22,
          height: 10,
          borderRadius: 4,
          backgroundColor: "#C45C12",
          opacity: 0.8,
        }}
      />
      <View
        style={{
          position: "absolute",
          left: 52,
          top: 22,
          width: 14,
          height: 8,
          borderRadius: 3,
          backgroundColor: "#E8C84A",
        }}
      />
      <Text style={[styles.etiqueta, { left: 120, top: 22 }]}>Hierro fino · sin arpón</Text>
      <Text style={[styles.etiqueta, { left: 120, top: 44 }]}>Seca / ninfa / streamer</Text>
    </Lienzo>
  );
}

function PlomoPiramide({ width }: { width: number }) {
  return (
    <Lienzo width={width} height={90} label="Plomo pirámide">
      <View style={[styles.triBase, { left: 48, top: 22 }]} />
      <View
        style={{
          position: "absolute",
          left: 70,
          top: 14,
          width: 10,
          height: 10,
          borderRadius: 5,
          borderWidth: 2,
          borderColor: WIRE,
        }}
      />
      <Text style={[styles.etiqueta, { left: 120, top: 24 }]}>Ancla en arena</Text>
      <Text style={[styles.etiqueta, { left: 120, top: 46 }]}>Surfcasting · 80–150 g</Text>
    </Lienzo>
  );
}

function PlomoBala({ width }: { width: number }) {
  return (
    <Lienzo width={width} height={90} label="Plomo bala bullet">
      <View
        style={{
          position: "absolute",
          left: 44,
          top: 28,
          width: 52,
          height: 28,
          borderRadius: 14,
          backgroundColor: "#9AA4AE",
          borderWidth: 2,
          borderColor: "#5A6470",
        }}
      />
      <View
        style={{
          position: "absolute",
          left: 88,
          top: 30,
          width: 0,
          height: 0,
          borderTopWidth: 12,
          borderBottomWidth: 12,
          borderLeftWidth: 18,
          borderTopColor: "transparent",
          borderBottomColor: "transparent",
          borderLeftColor: "#9AA4AE",
        }}
      />
      <Text style={[styles.etiqueta, { left: 130, top: 24 }]}>Texas / carolina</Text>
      <Text style={[styles.etiqueta, { left: 130, top: 46 }]}>3–14 g embalse</Text>
    </Lienzo>
  );
}

function PlomoOliva({ width }: { width: number }) {
  return (
    <Lienzo width={width} height={90} label="Plomo oliva">
      <View
        style={{
          position: "absolute",
          left: 48,
          top: 26,
          width: 56,
          height: 32,
          borderRadius: 28,
          backgroundColor: "#8A9AAA",
          borderWidth: 2,
          borderColor: "#4A5A68",
          transform: [{ scaleY: 0.85 }],
        }}
      />
      <Hilo left={42} top={40} w={70} h={2} color={LINE} />
      <Text style={[styles.etiqueta, { left: 130, top: 24 }]}>Deslizante en línea</Text>
      <Text style={[styles.etiqueta, { left: 130, top: 46 }]}>Fondo / running</Text>
    </Lienzo>
  );
}

function PlomoGota({ width }: { width: number }) {
  return (
    <Lienzo width={width} height={90} label="Plomo gota drop shot">
      <Hilo left={68} top={12} w={3} h={36} />
      <AnzueloDibujo left={58} top={20} size={24} barbless />
      <View
        style={{
          position: "absolute",
          left: 58,
          top: 52,
          width: 22,
          height: 28,
          borderRadius: 11,
          backgroundColor: "#7A8690",
          borderWidth: 2,
          borderColor: "#3A4450",
        }}
      />
      <Text style={[styles.etiqueta, { left: 120, top: 24 }]}>Peso al final</Text>
      <Text style={[styles.etiqueta, { left: 120, top: 46 }]}>Drop shot · bass</Text>
    </Lienzo>
  );
}

function CucharillaGiratoria({ width }: { width: number }) {
  return (
    <Lienzo width={width} height={96} label="Cucharilla giratoria">
      <Hilo left={40} top={44} w={36} h={3} color={WIRE} />
      <View
        style={{
          position: "absolute",
          left: 72,
          top: 28,
          width: 36,
          height: 22,
          borderRadius: 18,
          backgroundColor: "#C0C8D0",
          borderWidth: 2,
          borderColor: "#6A727A",
          transform: [{ rotate: "-25deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          left: 108,
          top: 38,
          width: 14,
          height: 14,
          borderRadius: 7,
          backgroundColor: COLORS.gold,
          borderWidth: 2,
          borderColor: "#8A6A18",
        }}
      />
      <AnzueloDibujo left={122} top={28} size={32} />
      <Text style={[styles.etiqueta, { left: 170, top: 22 }]}>Pala que gira</Text>
      <Text style={[styles.etiqueta, { left: 170, top: 44 }]}>N.º 0–2 río · 2–4 embalse</Text>
    </Lienzo>
  );
}

function CucharillaOndulante({ width }: { width: number }) {
  return (
    <Lienzo width={width} height={96} label="Cucharilla ondulante">
      <View
        style={{
          position: "absolute",
          left: 48,
          top: 30,
          width: 70,
          height: 28,
          borderRadius: 14,
          backgroundColor: "#D4A84A",
          borderWidth: 2,
          borderColor: "#8A6A18",
          transform: [{ rotate: "12deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          left: 54,
          top: 36,
          width: 18,
          height: 10,
          borderRadius: 4,
          backgroundColor: "rgba(255,255,255,0.45)",
        }}
      />
      <AnzueloDibujo left={112} top={28} size={30} />
      <Text style={[styles.etiqueta, { left: 170, top: 22 }]}>Vaivea al recuperar</Text>
      <Text style={[styles.etiqueta, { left: 170, top: 44 }]}>Trucha · jurel orilla</Text>
    </Lienzo>
  );
}

function SnapClip({ width }: { width: number }) {
  return (
    <Lienzo width={width} height={90} label="Clip snap de acero">
      <View
        style={{
          position: "absolute",
          left: 48,
          top: 28,
          width: 48,
          height: 28,
          borderWidth: 3,
          borderColor: "#5A6470",
          borderRadius: 12,
          borderTopRightRadius: 4,
        }}
      />
      <View
        style={{
          position: "absolute",
          left: 88,
          top: 32,
          width: 16,
          height: 20,
          borderWidth: 2.5,
          borderColor: "#5A6470",
          borderLeftWidth: 0,
          borderRadius: 4,
        }}
      />
      <Text style={[styles.etiqueta, { left: 130, top: 22 }]}>Abre–cierra en 1 s</Text>
      <Text style={[styles.etiqueta, { left: 130, top: 44 }]}>Cambia señuelo sin nudo</Text>
    </Lienzo>
  );
}

function Emerillon({ width }: { width: number }) {
  return (
    <Lienzo width={width} height={90} label="Emerillón">
      <View style={[styles.ojo, { left: 48, top: 32, width: 16, height: 16 }]} />
      <View
        style={{
          position: "absolute",
          left: 66,
          top: 34,
          width: 28,
          height: 14,
          borderRadius: 4,
          backgroundColor: "#8A9AAA",
          borderWidth: 2,
          borderColor: "#4A5A68",
        }}
      />
      <View style={[styles.ojo, { left: 96, top: 32, width: 16, height: 16 }]} />
      <Text style={[styles.etiqueta, { left: 130, top: 22 }]}>Gira: menos enredos</Text>
      <Text style={[styles.etiqueta, { left: 130, top: 44 }]}>Entre línea y señuelo</Text>
    </Lienzo>
  );
}

function Mosqueton({ width }: { width: number }) {
  return (
    <Lienzo width={width} height={90} label="Mosquetón de pesca">
      <View
        style={{
          position: "absolute",
          left: 52,
          top: 18,
          width: 36,
          height: 52,
          borderWidth: 3.5,
          borderColor: "#5A6470",
          borderRadius: 18,
        }}
      />
      <View
        style={{
          position: "absolute",
          left: 78,
          top: 28,
          width: 3,
          height: 28,
          backgroundColor: COLORS.gold,
          borderRadius: 2,
        }}
      />
      <Text style={[styles.etiqueta, { left: 120, top: 22 }]}>Más fuerte que snap</Text>
      <Text style={[styles.etiqueta, { left: 120, top: 44 }]}>Lucio / costa / jig</Text>
    </Lienzo>
  );
}

function ConectorRapido({ width }: { width: number }) {
  return (
    <Lienzo width={width} height={90} label="Conector rápido tippet ring">
      <Hilo left={40} top={40} w={36} />
      <View
        style={{
          position: "absolute",
          left: 74,
          top: 32,
          width: 20,
          height: 20,
          borderRadius: 10,
          borderWidth: 3,
          borderColor: COLORS.gold,
          backgroundColor: COLORS.warningLight,
        }}
      />
      <Hilo left={96} top={40} w={36} color={COLORS.primary} />
      <Text style={[styles.etiqueta, { left: 150, top: 22 }]}>Anilla micro</Text>
      <Text style={[styles.etiqueta, { left: 150, top: 44 }]}>Cambia bajos en seco</Text>
    </Lienzo>
  );
}

function TablaTallas({ width }: { width: number }) {
  const filas = [
    { sp: "Trucha", t: "#14–#10 · cuch. 0–1" },
    { sp: "Bass", t: "#2–#1/0 · offset 3/0" },
    { sp: "Carpa/barbo", t: "#8–#4 cebo" },
    { sp: "Lucio", t: "#2/0–#4/0 + cable" },
    { sp: "Lubina costa", t: "#1–#2/0 · jig 7–15 g" },
    { sp: "Dorada/sargo", t: "#6–#2 · pirámide" },
  ];
  return (
    <Lienzo width={width} height={158} label="Tabla rápida de tallas de anzuelo por especie">
      <Text style={[styles.tablaTitulo, { left: 12, top: 8 }]}>Guía rápida (orientativa)</Text>
      {filas.map((f, i) => (
        <View key={f.sp} style={[styles.tablaFila, { top: 32 + i * 20, width: width - 24 }]}>
          <Text style={styles.tablaSp}>{f.sp}</Text>
          <Text style={styles.tablaT}>{f.t}</Text>
        </View>
      ))}
    </Lienzo>
  );
}

/** Fallback esquemático (View) solo si no hay guía fotográfica en consejosMedia. */
const MAPA: Partial<Record<IdDiagrama, (p: { width: number }) => React.ReactElement>> = {
  "nudo-palomar": NudoPalomar,
  "nudo-clinch": NudoClinch,
  "nudo-trilene": NudoUni,
  "nudo-albright": NudoAlbright,
  "nudo-loop": NudoLoop,
  "anzuelo-simple": AnzueloSimple,
  "anzuelo-triple": AnzueloTriple,
  "anzuelo-offset": AnzueloOffset,
  "anzuelo-circle": AnzueloCircle,
  "anzuelo-mosca": AnzueloMosca,
  "plomo-piramide": PlomoPiramide,
  "plomo-bala": PlomoBala,
  "plomo-oliva": PlomoOliva,
  "plomo-gota": PlomoGota,
  "cucharilla-giratoria": CucharillaGiratoria,
  "cucharilla-ondulante": CucharillaOndulante,
  "snap-clip": SnapClip,
  emerillon: Emerillon,
  mosqueton: Mosqueton,
  "conector-rapido": ConectorRapido,
  "tabla-tallas": TablaTallas,
};

/** Ancho mínimo del lienzo según el esquema (nudos en pasos necesitan más). */
function anchoMinimo(id: IdDiagrama): number {
  if (id.startsWith("nudo-")) return 340;
  if (id === "tabla-tallas") return 300;
  return 280;
}

/**
 * Esquema gráfico sencillo (sin SVG) para nudos, anzuelos, plomos y conectores.
 * Pensado para que un principiante entienda el montaje de un vistazo.
 */
export default function DiagramaConsejo({ id, width = 340 }: Props) {
  /** Montajes por especie: esquema de línea (orden de piezas + regulación). */
  const montaje = montajePorDiagramaId(id);
  if (montaje) {
    return <EsquemaMontajeLinea montaje={montaje} width={Math.max(width, 280)} />;
  }

  /** Preferir fotografías empaquetadas (más claras para principiantes). */
  const guia = GUIAS_MEDIA[id];
  if (guia) {
    return <GuiaFotoConsejo guia={guia} width={width} />;
  }

  const Comp = MAPA[id];
  if (!Comp) return null;
  const lienzoW = Math.max(width, anchoMinimo(id));
  const content = <Comp width={lienzoW} />;
  return (
    <View style={styles.wrap}>
      {lienzoW > width + 4 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxWidth: width }}>
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 12, alignItems: "center" },
  lienzo: {
    backgroundColor: COLORS.mist,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    position: "relative",
  },
  paso: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primaryDark,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  pasoTxt: { color: "#fff", fontSize: 11, fontWeight: "800" },
  miniLabel: {
    position: "absolute",
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textMuted,
  },
  etiqueta: {
    position: "absolute",
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  ojo: {
    position: "absolute",
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2.5,
    borderColor: LINE,
    backgroundColor: FILL,
  },
  lazo: {
    position: "absolute",
    width: 40,
    height: 28,
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: LINE,
    backgroundColor: "transparent",
  },
  badge: {
    position: "absolute",
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  badgeTxt: { fontSize: 11, fontWeight: "800", color: COLORS.primaryDark },
  badgeWarn: {
    position: "absolute",
    backgroundColor: COLORS.warningLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  badgeWarnTxt: { fontSize: 11, fontWeight: "800", color: COLORS.warning },
  triBase: {
    width: 0,
    height: 0,
    borderLeftWidth: 28,
    borderRightWidth: 28,
    borderBottomWidth: 48,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#8A9AAA",
  },
  tablaTitulo: {
    position: "absolute",
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.primaryDark,
  },
  tablaFila: {
    position: "absolute",
    left: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    paddingBottom: 2,
  },
  tablaSp: { fontSize: 12, fontWeight: "700", color: COLORS.textPrimary, width: "38%" },
  tablaT: { fontSize: 11.5, fontWeight: "600", color: COLORS.waterDark, flex: 1, textAlign: "right" },
});
