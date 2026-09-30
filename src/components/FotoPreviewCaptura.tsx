/**
 * Vista previa fiable de la foto de captura.
 * En web usa <img> nativo + blob: URL (Safari a menudo rompe data: URI largas → icono rojo).
 * El <img> usa pointerEvents:none para que onPress del contenedor reciba el toque.
 */
import React, { useEffect, useState } from "react";
import {
  Image,
  ImageStyle,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { COLORS, RADIUS } from "../theme";

type Props = {
  uri: string;
  style?: StyleProp<ImageStyle>;
  onBroken?: () => void;
  onPress?: () => void;
  accessibilityLabel?: string;
};

function dataUriABlobUrl(dataUri: string): string | null {
  try {
    if (typeof document === "undefined" || typeof atob === "undefined") return null;
    const coma = dataUri.indexOf(",");
    if (coma < 0) return null;
    const header = dataUri.slice(0, coma);
    const b64 = dataUri.slice(coma + 1);
    const mime = /data:([^;]+)/i.exec(header)?.[1] || "image/jpeg";
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return URL.createObjectURL(new Blob([arr], { type: mime }));
  } catch {
    return null;
  }
}

export default function FotoPreviewCaptura({
  uri,
  style,
  onBroken,
  onPress,
  accessibilityLabel = "Vista previa de la foto de la captura",
}: Props) {
  const [displayUri, setDisplayUri] = useState<string | null>(null);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setBroken(false);
    let blobUrl: string | null = null;
    let cancelled = false;

    if (Platform.OS === "web" && uri.startsWith("data:image/")) {
      blobUrl = dataUriABlobUrl(uri);
      if (!cancelled) setDisplayUri(blobUrl || uri);
    } else {
      setDisplayUri(uri);
    }

    return () => {
      cancelled = true;
      if (blobUrl) {
        try {
          URL.revokeObjectURL(blobUrl);
        } catch {
          /* ignore */
        }
      }
    };
  }, [uri]);

  const content =
    !uri || broken || !displayUri ? (
      <View style={[styles.box, styles.fallback, style]} accessibilityLabel={accessibilityLabel}>
        <Text style={styles.fallbackTxt}>No se pudo mostrar la foto</Text>
      </View>
    ) : Platform.OS === "web" ? (
      <View style={[styles.box, style, onPress ? styles.clickable : null]} accessibilityLabel={accessibilityLabel}>
        {React.createElement("img", {
          src: displayUri,
          alt: accessibilityLabel,
          // Imprescindible: sin esto el <img> se come el click y no abre el visor.
          style: {
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: 8,
            display: "block",
            backgroundColor: COLORS.mist,
            pointerEvents: "none",
            userSelect: "none",
          },
          draggable: false,
          onError: () => {
            setBroken(true);
            onBroken?.();
          },
        })}
      </View>
    ) : (
      <Image
        source={{ uri: displayUri }}
        style={[styles.box, style]}
        resizeMode="cover"
        accessibilityLabel={accessibilityLabel}
        onError={() => {
          setBroken(true);
          onBroken?.();
        }}
      />
    );

  if (!onPress) return content;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      // @ts-expect-error onClick refuerza el toque en react-native-web
      onClick={(e: { stopPropagation?: () => void }) => {
        e?.stopPropagation?.();
        onPress();
      }}
      style={({ pressed }) => (pressed ? { opacity: 0.88 } : undefined)}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    width: "100%",
    height: 160,
    borderRadius: RADIUS.sm,
    marginTop: 10,
    overflow: "hidden",
    backgroundColor: COLORS.mist,
  },
  clickable: {
    cursor: "pointer" as const,
  },
  fallback: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  fallbackTxt: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
});
