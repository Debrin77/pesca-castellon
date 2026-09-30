/**
 * Visor a pantalla completa (nativo): Modal + zoom.
 * En web se usa VisorFotoCaptura.web.tsx (portal al body).
 */
import React, { useEffect, useMemo, useState } from "react";
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

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.5;

export default function VisorFotoCaptura({ uri, titulo, onCerrar }: Props) {
  const visible = !!uri;
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const { width: sw, height: sh } = Dimensions.get("window");
  const imgW = useMemo(() => Math.max(120, sw * zoom), [sw, zoom]);
  const imgH = useMemo(() => Math.max(120, sh * 0.72 * zoom), [sh, zoom]);

  useEffect(() => {
    setZoom(MIN_ZOOM);
  }, [uri]);

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
      presentationStyle="overFullScreen"
    >
      <View style={styles.root} accessibilityViewIsModal accessibilityLabel="Visor de foto de captura">
        <View style={styles.topBar}>
          <Text style={styles.titulo} numberOfLines={1}>
            {titulo?.trim() || "Foto de la captura"}
          </Text>
          <TouchableOpacity
            onPress={onCerrar}
            accessibilityRole="button"
            accessibilityLabel="Cerrar visor de foto"
            style={styles.cerrarBtn}
          >
            <Text style={styles.cerrar}>Cerrar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.stage}>
          {uri ? (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={[styles.scrollContent, { minWidth: imgW, minHeight: imgH }]}
              maximumZoomScale={MAX_ZOOM}
              minimumZoomScale={MIN_ZOOM}
              centerContent
              bouncesZoom
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
            >
              <Pressable>
                <Image
                  source={{ uri }}
                  style={{ width: imgW, height: imgH }}
                  resizeMode="contain"
                  accessibilityLabel={titulo || "Foto de la captura a pantalla completa"}
                />
              </Pressable>
            </ScrollView>
          ) : (
            <Text style={styles.vacio}>Cargando foto…</Text>
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
          {Platform.OS === "ios"
            ? "Pellizca o usa +/− para ampliar el registro fotográfico"
            : "Usa +/− para ampliar el registro fotográfico"}
        </Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.96)",
    paddingTop: 48,
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
  titulo: { flex: 1, color: "#fff", fontSize: 16, fontWeight: "700" },
  cerrarBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 8,
  },
  cerrar: { color: "#9ad4e8", fontSize: 16, fontWeight: "800" },
  stage: { flex: 1, minHeight: 240 },
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  zoomBtnTxt: { color: "#fff", fontSize: 28, fontWeight: "300", lineHeight: 32 },
  zoomLabel: {
    color: "#fff",
    fontWeight: "700",
    minWidth: 56,
    textAlign: "center",
    fontSize: 15,
  },
  resetBtn: { width: 52 },
  resetTxt: { color: "#fff", fontWeight: "800", fontSize: 14 },
  hint: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 20,
  },
});
