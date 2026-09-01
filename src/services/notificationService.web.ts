/**
 * Metro elige este archivo automáticamente al compilar para web
 * (en vez de notificationService.native.ts). Las notificaciones
 * programadas son una capacidad de la app nativa; en el navegador no
 * hacen nada, pero mantenemos la misma firma de funciones para que el
 * resto del código (HomeScreen, etc.) no necesite saber en qué
 * plataforma está corriendo.
 *
 * A propósito, este archivo NO importa "expo-notifications": aunque
 * solo se llame a estas funciones y siempre devuelvan false/0, el mero
 * hecho de importar el paquete ya ejecuta código suyo al cargar la
 * página, y eso es lo que causaba la pantalla en blanco en el navegador.
 */
import { IndicePescaDia } from "./fishingIndexService";

export async function solicitarPermisoNotificaciones(): Promise<boolean> {
  return false;
}

export async function programarAlertasPesca(dias: IndicePescaDia[]): Promise<number> {
  return 0;
}

export async function cancelarAlertasPesca(): Promise<void> {
  return;
}
