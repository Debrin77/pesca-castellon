/**
 * Vista previa fiable de la foto de captura.
 * En web usa <img> nativo + blob: URL (Safari a menudo rompe data: URI largas → icono rojo).
 */
import React, { useEffect, useState } from "react";
import { Image, Platform, StyleSheet, Text, View, ViewStyle } from "react-native";
import { COLORS, RADIUS } from "../theme";

type Props = {
  uri: string;
  style?: ViewStyle;
  onBroken?: () => void;
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

  if (!uri || broken || !displayUri) {
    return (
      <View style={[styles.box, styles.fallback, style]} accessibilityLabel={accessibilityLabel}>
        <Text style={styles.fallbackTxt}>No se pudo mostrar la foto</Text>
      </View>
    );
  }

  if (Platform.OS === "web") {
    return (
      <View style={[styles.box, style]} accessibilityLabel={accessibilityLabel}>
        {React.createElement("img", {
          src: displayUri,
          alt: accessibilityLabel,
          style: {
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: 8,
            display: "block",
            backgroundColor: COLORS.mist,
          },
          onError: () => {
            setBroken(true);
            onBroken?.();
          },
        })}
      </View>
    );
  }

  return (
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
