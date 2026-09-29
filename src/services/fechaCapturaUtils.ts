/**
 * Fecha de captura en UI: AAAA/MM/DD.
 * En almacenamiento / cupos se sigue usando ISO yyyy-mm-dd.
 */

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** Hoy en calendario local (no UTC de toISOString). */
export function hoyFechaUi(): string {
  const d = new Date();
  return `${d.getFullYear()}/${pad2(d.getMonth() + 1)}/${pad2(d.getDate())}`;
}

export function isoAFechaUi(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return iso.replace(/-/g, "/");
  return `${m[1]}/${m[2]}/${m[3]}`;
}

/**
 * Acepta AAAA/MM/DD, AAAA-MM-DD y mezclas AAAA-MM/DD.
 * Devuelve ISO yyyy-mm-dd o null si no es válida.
 */
export function normalizarFechaCapturaAIso(raw: string): string | null {
  const s = raw.trim();
  const m = /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/.exec(s);
  if (!m) return null;
  const y = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10);
  const d = parseInt(m[3], 10);
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || y < 1990 || y > 2100) return null;
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return `${y}-${pad2(mo)}-${pad2(d)}`;
}

/** Nombre de punto que es solo una fecha (auto o importado). */
export function esNombrePuntoSoloFecha(nombre: string): boolean {
  const n = nombre.trim();
  if (!n) return false;
  if (/^Punto del\s+/i.test(n)) {
    return esNombrePuntoSoloFecha(n.replace(/^Punto del\s+/i, ""));
  }
  // DD/MM/AAAA o DD-MM-AAAA
  if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(n)) return true;
  // AAAA/MM/DD o AAAA-MM-DD
  if (/^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(n)) return true;
  return false;
}

/** Si el nombre del punto es una fecha, la parsea a ISO; si no, null. */
export function fechaIsoDesdeNombrePunto(nombre: string): string | null {
  const n = nombre.trim().replace(/^Punto del\s+/i, "");
  // DD/MM/AAAA
  let m = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/.exec(n);
  if (m) {
    let y = parseInt(m[3], 10);
    if (y < 100) y += 2000;
    return normalizarFechaCapturaAIso(`${y}/${m[2]}/${m[1]}`);
  }
  // AAAA/MM/DD
  m = /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/.exec(n);
  if (m) return normalizarFechaCapturaAIso(`${m[1]}/${m[2]}/${m[3]}`);
  return null;
}
