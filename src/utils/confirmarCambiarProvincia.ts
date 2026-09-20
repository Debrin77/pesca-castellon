import { Alert, Platform } from "react-native";

/**
 * Antes de salir de una provincia: avisa que el diario (capturas, puntos, rutas)
 * no se borra. Solo cambia mapa y normas.
 */
export function confirmarCambiarProvincia(
  nombreActual: string,
  onConfirm: () => void | Promise<void>
): void {
  const titulo = "Cambiar provincia";
  const mensaje =
    `Tus capturas, puntos y rutas de ${nombreActual} se quedan guardados.\n\n` +
    "Solo cambiarás el mapa y las normas. Cada provincia guarda su propio cuaderno.";

  if (Platform.OS === "web" && typeof window !== "undefined") {
    if (window.confirm(`${titulo}\n\n${mensaje}`)) {
      void onConfirm();
    }
    return;
  }

  Alert.alert(titulo, mensaje, [
    { text: "Quedarme", style: "cancel" },
    {
      text: "Cambiar",
      onPress: () => {
        void onConfirm();
      },
    },
  ]);
}
