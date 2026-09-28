/**
 * Botón para elegir/hacer foto de una captura.
 * En web usa <label>+<input type="file"> (Safari/PWA respeta el gesto).
 * En nativo delega al onPress (ImagePicker).
 */
import React from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { COLORS } from "../theme";

type Props = {
  label: string;
  /** Solo nativo: abrir ImagePicker / cámara. */
  onPressNative: () => void;
  /** Solo web: archivo elegido. */
  onFileWeb: (file: File) => void;
  /** Si true, pide cámara (capture=environment) en web. */
  capture?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
};

export default function BotonFotoCaptura({
  label,
  onPressNative,
  onFileWeb,
  capture = false,
  style,
  accessibilityLabel,
}: Props) {
  if (Platform.OS === "web") {
    const labelStyle: Record<string, string | number> = {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      minHeight: 40,
      cursor: "pointer",
      margin: 0,
    };
    const textStyle: Record<string, string | number> = {
      fontWeight: 700,
      color: COLORS.textSecondary,
      fontSize: 12,
      textAlign: "center",
      paddingLeft: 8,
      paddingRight: 8,
      paddingTop: 10,
      paddingBottom: 10,
    };
    return (
      <View
        style={[styles.photoBtn, style]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || label}
      >
        {React.createElement(
          "label",
          { style: labelStyle },
          React.createElement("input", {
            type: "file",
            accept: "image/*",
            ...(capture ? { capture: "environment" } : {}),
            style: { display: "none" },
            onChange: (e: { target: { files: FileList | null; value: string } }) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) onFileWeb(file);
            },
          }),
          React.createElement("span", { style: textStyle }, label)
        )}
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.photoBtn, style]}
      onPress={onPressNative}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
    >
      <Text style={styles.photoBtnTxt}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  photoBtn: {
    flex: 1,
    backgroundColor: COLORS.mist,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  photoBtnTxt: {
    fontWeight: "700",
    color: COLORS.textSecondary,
    fontSize: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    textAlign: "center",
  },
});
