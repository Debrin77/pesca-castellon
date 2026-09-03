import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { IndicePescaDia } from "./fishingIndexService";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function solicitarPermisoNotificaciones(): Promise<boolean> {
  const { status: actual } = await Notifications.getPermissionsAsync();
  if (actual === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("pesca-alertas", {
      name: "Alertas de buenos días de pesca",
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  return status === "granted";
}

const PREFIJO_ID = "alerta-pesca-";

/**
 * Reprograma las alertas de "buen día de pesca" para los próximos días.
 * Cancela las notificaciones programadas anteriormente por esta función
 * (usa un prefijo propio en el identificador) para no duplicar avisos.
 *
 * Para cada día con categoría "buena" o "excelente" programa DOS avisos:
 * - La víspera a las 20:00 (si ese momento aún no ha pasado)
 * - La misma mañana a las 07:00 (si ese momento aún no ha pasado)
 */
export async function programarAlertasPesca(dias: IndicePescaDia[]): Promise<number> {
  const programadas = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of programadas) {
    if (n.identifier.startsWith(PREFIJO_ID)) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }

  const ahora = new Date();
  let contador = 0;

  for (const dia of dias) {
    if (dia.categoria !== "excelente" && dia.categoria !== "buena") continue;

    const esExcelente = dia.categoria === "excelente";
    const fechaDia = new Date(dia.fecha + "T00:00:00");

    const cuerpoBase = `Índice de pesca: ${dia.puntuacion}/100 · ${dia.faseLunar} ${dia.iconoLuna} · Viento ${dia.vientoMaxKmh} km/h`;

    // Aviso la víspera a las 20:00
    const vispera = new Date(fechaDia);
    vispera.setDate(vispera.getDate() - 1);
    vispera.setHours(20, 0, 0, 0);
    if (vispera > ahora) {
      await Notifications.scheduleNotificationAsync({
        identifier: `${PREFIJO_ID}vispera-${dia.fecha}`,
        content: {
          title: esExcelente ? "🎣 Mañana pinta excelente para pescar" : "🎣 Mañana es buen día para pescar",
          body: `${cuerpoBase}\nToca para abrir el modo salida.`,
          data: { pantalla: "SalgoAPescar", fecha: dia.fecha },
        },
        trigger: vispera,
      });
      contador++;
    }

    // Aviso la misma mañana a las 07:00
    const manana = new Date(fechaDia);
    manana.setHours(7, 0, 0, 0);
    if (manana > ahora) {
      await Notifications.scheduleNotificationAsync({
        identifier: `${PREFIJO_ID}manana-${dia.fecha}`,
        content: {
          title: esExcelente ? "🎣 Hoy pinta excelente para pescar" : "🎣 Hoy es buen día para pescar",
          body: `${cuerpoBase}\nToca para abrir el modo salida.`,
          data: { pantalla: "SalgoAPescar", fecha: dia.fecha },
        },
        trigger: manana,
      });
      contador++;
    }
  }

  return contador;
}

export async function cancelarAlertasPesca(): Promise<void> {
  const programadas = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of programadas) {
    if (n.identifier.startsWith(PREFIJO_ID)) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }
}
