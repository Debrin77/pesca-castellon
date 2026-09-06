import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Platform,
  type ImageSourcePropType,
} from "react-native";
import { Asset } from "expo-asset";
import type { MontajeEspecie, PiezaMontaje } from "../data/montajesEspecie";
import { CREDITO_FOTOS_MONTAJE, fotoDePiezaMontaje } from "../data/montajePiezasMedia";
import { COLORS, RADIUS } from "../theme";

type Props = {
  montaje: MontajeEspecie;
  width?: number;
};

const FOTO = 72;

/**
 * Orden del aparejo con foto real de cada elemento + la misma explicación.
 * En web: <img> nativo con URI de expo-asset (RN-web oculta el img a opacity:0).
 * En nativo: Image + require(), como GuiaFotoConsejo.
 */
export default function EsquemaMontajeLinea({ montaje, width = 320 }: Props) {
  return (
    <View
      style={[styles.wrap, { width }]}
      accessibilityLabel={`Montaje: ${montaje.titulo}. ${montaje.piezas.map((p) => p.etiqueta).join(", ")}`}
    >
      <Text style={styles.kicker}>Orden del aparejo (de la caña al final)</Text>
      {montaje.piezas.map((p, i) => (
        <View key={`${p.etiqueta}-${i}`} style={styles.row}>
          <View style={styles.rail}>
            <FotoPieza
              source={fotoDePiezaMontaje(p)}
              label={`${etiquetaTipo(p.tipo)}: ${p.etiqueta}`}
              tipo={p.tipo}
            />
            {i < montaje.piezas.length - 1 ? <View style={styles.line} /> : null}
          </View>
          <View style={styles.chip}>
            <Text style={styles.tipo}>{etiquetaTipo(p.tipo)}</Text>
            <Text style={styles.etiqueta}>{p.etiqueta}</Text>
            {p.detalle ? <Text style={styles.detalle}>{p.detalle}</Text> : null}
          </View>
        </View>
      ))}
      <Text style={styles.alt}>Alternativa: {montaje.alternativa}</Text>
      {montaje.regulacion.length > 0 ? (
        <View style={styles.regBox}>
          <Text style={styles.regTitle}>Cómo regular</Text>
          {montaje.regulacion.map((r, i) => (
            <Text key={i} style={styles.regItem}>
              · {r}
            </Text>
          ))}
        </View>
      ) : null}
      <Text style={styles.credito}>{CREDITO_FOTOS_MONTAJE}</Text>
    </View>
  );
}

function uriDeAsset(source: ImageSourcePropType): string | null {
  try {
    if (typeof source === "number") {
      const asset = Asset.fromModule(source);
      return asset.localUri ?? asset.uri ?? null;
    }
    if (source && typeof source === "object" && !Array.isArray(source) && "uri" in source) {
      return typeof source.uri === "string" ? source.uri : null;
    }
  } catch {
    return null;
  }
  return null;
}

function FotoPieza({
  source,
  label,
  tipo,
}: {
  source: ImageSourcePropType;
  label: string;
  tipo: PiezaMontaje["tipo"];
}) {
  const [error, setError] = useState(false);
  const uri = useMemo(() => uriDeAsset(source), [source]);

  if (error) {
    return (
      <View style={[styles.fotoFrame, styles.fotoFallback]} accessibilityLabel={label}>
        <Text style={styles.fotoFallbackTxt}>{etiquetaTipo(tipo).slice(0, 1)}</Text>
      </View>
    );
  }

  // Web: img real visible (RN-web usa background-image + img a opacity:0).
  if (Platform.OS === "web" && uri) {
    return (
      <View style={styles.fotoFrame} accessibilityLabel={label}>
        {React.createElement("img", {
          src: uri,
          alt: label,
          draggable: false,
          onError: () => setError(true),
          style: {
            width: FOTO,
            height: FOTO,
            objectFit: "cover",
            display: "block",
          },
        })}
      </View>
    );
  }

  return (
    <View style={styles.fotoFrame}>
      <Image
        source={source}
        style={styles.foto}
        resizeMode="cover"
        accessibilityLabel={label}
        fadeDuration={0}
        onError={() => setError(true)}
      />
    </View>
  );
}

function etiquetaTipo(t: PiezaMontaje["tipo"]): string {
  switch (t) {
    case "linea":
      return "Línea";
    case "emerillon":
      return "Emerillón";
    case "snap":
      return "Snap";
    case "boya":
      return "Boya";
    case "plomo":
      return "Plomo";
    case "anzuelo":
      return "Anzuelo";
    case "senuelo":
      return "Señuelo";
    case "cebo":
      return "Cebo";
    default:
      return "Pieza";
  }
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "center",
    backgroundColor: COLORS.mist,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    marginTop: 10,
  },
  kicker: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.waterDark,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  row: { flexDirection: "row", alignItems: "stretch", minHeight: FOTO + 12 },
  rail: { width: FOTO, alignItems: "center" },
  fotoFrame: {
    width: FOTO,
    height: FOTO,
    borderRadius: RADIUS.sm,
    overflow: "hidden",
    backgroundColor: COLORS.waterLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  foto: { width: FOTO, height: FOTO, opacity: 1 },
  fotoFallback: { alignItems: "center", justifyContent: "center" },
  fotoFallbackTxt: { fontSize: 22, fontWeight: "800", color: COLORS.waterDark },
  line: {
    flex: 1,
    width: 3,
    backgroundColor: COLORS.water,
    marginTop: 4,
    marginBottom: 2,
    borderRadius: 2,
    minHeight: 8,
  },
  chip: {
    flex: 1,
    marginLeft: 10,
    marginBottom: 10,
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: RADIUS.sm,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.water,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  tipo: { fontSize: 10, fontWeight: "800", color: COLORS.textMuted, textTransform: "uppercase" },
  etiqueta: { fontSize: 14, fontWeight: "800", color: COLORS.textPrimary, marginTop: 1 },
  detalle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2, lineHeight: 16 },
  alt: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  regBox: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  regTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.primaryDark,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  regItem: { fontSize: 12, lineHeight: 17, color: COLORS.textSecondary, marginBottom: 2 },
  credito: {
    marginTop: 10,
    fontSize: 10,
    color: COLORS.textMuted,
    lineHeight: 14,
    fontStyle: "italic",
  },
});
