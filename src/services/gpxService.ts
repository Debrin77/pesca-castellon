import { Platform, Share, Alert } from "react-native";
import type { Captura, PuntoGuardado } from "./storageService";
import type { TrackPesca } from "./trackService";

function escXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function construirGpx(opts: {
  nombre: string;
  puntos?: PuntoGuardado[];
  capturas?: Captura[];
  tracks?: TrackPesca[];
}): string {
  const now = new Date().toISOString();
  const wpts: string[] = [];

  for (const p of opts.puntos ?? []) {
    wpts.push(
      `  <wpt lat="${p.lat}" lon="${p.lng}">\n` +
        `    <name>${escXml(p.nombre)}</name>\n` +
        `    <time>${p.creadoEn}</time>\n` +
        (p.notas ? `    <desc>${escXml(p.notas)}</desc>\n` : "") +
        `    <type>waypoint</type>\n` +
        `  </wpt>`
    );
  }

  for (const c of opts.capturas ?? []) {
    if (c.lat == null || c.lng == null) continue;
    const nombre = c.nombreLugar || c.especieId;
    wpts.push(
      `  <wpt lat="${c.lat}" lon="${c.lng}">\n` +
        `    <name>${escXml(`Captura: ${nombre}`)}</name>\n` +
        `    <time>${c.fecha}T12:00:00Z</time>\n` +
        `    <desc>${escXml([c.especieId, c.tallaCm != null ? `${c.tallaCm} cm` : null, c.notas].filter(Boolean).join(" · "))}</desc>\n` +
        `    <type>catch</type>\n` +
        `  </wpt>`
    );
  }

  const trks: string[] = [];
  for (const t of opts.tracks ?? []) {
    if (!t.puntos.length) continue;
    const pts = t.puntos
      .map(
        (pt) =>
          `      <trkpt lat="${pt.lat}" lon="${pt.lng}"><time>${pt.t}</time></trkpt>`
      )
      .join("\n");
    trks.push(
      `  <trk>\n    <name>${escXml(t.nombre)}</name>\n    <type>${escXml(t.modalidad)}</type>\n    <trkseg>\n${pts}\n    </trkseg>\n  </trk>`
    );
  }

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<gpx version="1.1" creator="Pesca Castellón" xmlns="http://www.topografix.com/GPX/1/1">\n` +
    `  <metadata><name>${escXml(opts.nombre)}</name><time>${now}</time></metadata>\n` +
    wpts.join("\n") +
    (wpts.length ? "\n" : "") +
    trks.join("\n") +
    (trks.length ? "\n" : "") +
    `</gpx>\n`
  );
}

export async function exportarYCompartirGpx(
  nombreArchivo: string,
  gpx: string
): Promise<void> {
  if (Platform.OS === "web" && typeof document !== "undefined") {
    const blob = new Blob([gpx], { type: "application/gpx+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nombreArchivo.endsWith(".gpx") ? nombreArchivo : `${nombreArchivo}.gpx`;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  try {
    await Share.share({
      title: nombreArchivo,
      message: gpx,
    });
  } catch (err) {
    Alert.alert("GPX", "No se pudo compartir el archivo.");
    console.warn(err);
  }
}
