/**
 * Visor a pantalla completa de la foto de una captura: ver completa + zoom
 * (botones +/−, rueda en web, pinch en iOS vía ScrollView).
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
type Props = {
  uri: string | null;
  titulo?: string;
  onCerrar: () => void;
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

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.5;

export default function VisorFotoCaptura({ uri, titulo, onCerrar }: Props) {
  const visible = !!uri;
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [displayUri, setDisplayUri] = useState<string | null>(null);
  const blobRef = useRef<string | null>(null);
  const { width: sw, height: sh } = Dimensions.get("window");

  useEffect(() => {
    setZoom(MIN_ZOOM);
    if (blobRef.current) {
      try {
        URL.revokeObjectURL(blobRef.current);
      } catch {
        /* ignore */
      }
      blobRef.current = null;
    }
    if (!uri) {
      setDisplayUri(null);
      return;
    }
    if (Platform.OS === "web" && uri.startsWith("data:image/")) {
      const blob = dataUriABlobUrl(uri);
      blobRef.current = blob;
      setDisplayUri(blob || uri);
    } else {
      setDisplayUri(uri);
    }
    return () => {
      if (blobRef.current) {
        try {
          URL.revokeObjectURL(blobRef.current);
        } catch {
          /* ignore */
        }
        blobRef.current = null;
      }
    };
  }, [uri]);

  const imgW = useMemo(() => sw * zoom, [sw, zoom]);
  const imgH = useMemo(() => sh * 0.78 * zoom, [sh, zoom]);

  function ajustarZoom(delta: number) {
    setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round((z + delta) * 10) / 10)));
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCerrar}
      statusBarTranslucent
    >
      <View style={styles.root} accessibilityViewIsModal>
        <View style={styles.topBar}>
          <Text style={styles.titulo} numberOfLines={1}>
            {titulo?.trim() || "Foto de la captura"}
          </Text>
          <TouchableOpacity
            onPress={onCerrar}
            accessibilityRole="button"
            accessibilityLabel="Cerrar visor de foto"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.cerrar}>Cerrar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.stage}>
          {displayUri ? (
            Platform.OS === "web" ? (
              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                maximumZoomScale={MAX_ZOOM}
                minimumZoomScale={MIN_ZOOM}
                centerContent
                // @ts-expect-error web wheel zoom helper
                onWheel={(e: { deltaY?: number; preventDefault?: () => void }) => {
                  if (!e?.deltaY) return;
                  e.preventDefault?.();
                  ajustarZoom(e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP);
                }}
              >
                {React.createElement("img", {
                  src: displayUri,
                  alt: titulo || "Foto de la captura",
                  draggable: false,
                  style: {
                    width: imgW,
                    height: imgH,
                    objectFit: "contain",
                    display: "block",
                    touchAction: "pinch-zoom",
                    userSelect: "none",
                    backgroundColor: "#000",
                  },
                })}
              </ScrollView>
            ) : (
              <ScrollView
                style={styles.scroll}
                contentContainerStyle={[
                  styles.scrollContent,
                  { minWidth: imgW, minHeight: imgH },
                ]}
                maximumZoomScale={MAX_ZOOM}
                minimumZoomScale={MIN_ZOOM}
                centerContent
                bouncesZoom
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
              >
                <Pressable onPress={() => { /* evita cerrar al tocar la foto */ }}>
                  <Image
                    source={{ uri: displayUri }}
                    style={{ width: imgW, height: imgH }}
                    resizeMode="contain"
                    accessibilityLabel={titulo || "Foto de la captura a pantalla completa"}
                  />
                </Pressable>
              </ScrollView>
            )
          ) : (
            <Text style={styles.vacio}>No hay foto</Text>
          )}
        </View>

        <View style={styles.controles}>
          <TouchableOpacity
            style={styles.zoomBtn}
            onPress={() => ajustarZoom(-ZOOM_STEP)}
            accessibilityRole="button"
            accessibilityLabel="Alejar foto"
          >
            <Text style={styles.zoomBtnTxt}>−</Text>
          </TouchableOpacity>
          <Text style={styles.zoomLabel}>{Math.round(zoom * 100)}%</Text>
          <TouchableOpacity
            style={styles.zoomBtn}
            onPress={() => ajustarZoom(ZOOM_STEP)}
            accessibilityRole="button"
            accessibilityLabel="Acercar foto"
          >
            <Text style={styles.zoomBtnTxt}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.zoomBtn, styles.resetBtn]}
            onPress={() => setZoom(MIN_ZOOM)}
            accessibilityRole="button"
            accessibilityLabel="Restablecer zoom"
          >
            <Text style={styles.resetTxt}>1×</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.hint}>
          {Platform.OS === "web"
            ? "Rueda del ratón o botones +/− · pellizca en táctil"
            : "Pellizca o usa +/− para ampliar el registro fotográfico"}
        </Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.96)",
    paddingTop: Platform.OS === "web" ? 12 : 48,
    paddingBottom: 16,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 12,
  },
  titulo: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  cerrar: {
    color: "#9ad4e8",
    fontSize: 16,
    fontWeight: "800",
  },
  stage: {
    flex: 1,
    minHeight: 240,
  },
  scroll: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  vacio: { color: "#aaa", textAlign: "center", marginTop: 40 },
  controles: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  zoomBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  zoomBtnTxt: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "300",
    lineHeight: 32,
  },
  zoomLabel: {
    color: "#fff",
    fontWeight: "700",
    minWidth: 56,
    textAlign: "center",
    fontSize: 15,
  },
  resetBtn: { width: 48 },
  resetTxt: { color: "#fff", fontWeight: "800", fontSize: 14 },
  hint: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 20,
  },
});
