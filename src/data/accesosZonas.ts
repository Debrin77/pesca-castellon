/**
 * Accesos y aparcamientos orientativos por ficha de zona.
 * No sustituyen carteles ni señalización local.
 */
export type AccesoZona = {
  zoneId: string;
  resumen: string;
  puntos: { nombre: string; detalle: string; lat?: number; lng?: number }[];
  aviso?: string;
};

const ACCESOS: AccesoZona[] = [
  {
    zoneId: "embalse_arenos",
    resumen: "Accesos orientativos a Embalse de Arenós (Arenoso). Confirma el último tramo en Maps; el nivel cambia la orilla.",
    puntos: [
      {
        nombre: "Entorno principal",
        detalle: "Aparcamiento / ensanches habituales. No bloquees pistas ni curvas sin visibilidad.",
        lat: 40.0867,
        lng: -0.5471,
      },
    ],
  },
  {
    zoneId: "embalse_sichar",
    resumen: "Accesos orientativos a Embalse de Sichar. Confirma el último tramo en Maps; el nivel cambia la orilla.",
    puntos: [
      {
        nombre: "Entorno principal",
        detalle: "Aparcamiento / ensanches habituales. No bloquees pistas ni curvas sin visibilidad.",
        lat: 40.0105,
        lng: -0.2332,
      },
    ],
  },
  {
    zoneId: "embalse_maria_cristina",
    resumen: "Accesos orientativos a Embalse de María Cristina. Confirma el último tramo en Maps; el nivel cambia la orilla.",
    puntos: [
      {
        nombre: "Entorno principal",
        detalle: "Aparcamiento / ensanches habituales. No bloquees pistas ni curvas sin visibilidad.",
        lat: 40.0282,
        lng: -0.1619,
      },
    ],
  },
  {
    zoneId: "rio_palancia_regajo",
    resumen: "Accesos orientativos a Embalse del Regajo / Río Palancia (Jérica-Teresa). Confirma el último tramo en Maps; el nivel cambia la orilla.",
    puntos: [
      {
        nombre: "Entorno principal",
        detalle: "Aparcamiento / ensanches habituales. No bloquees pistas ni curvas sin visibilidad.",
        lat: 39.8899,
        lng: -0.5245,
      },
    ],
  },
  {
    zoneId: "rio_mijares_puebla_arenoso_libre",
    resumen: "Accesos orientativos a Río Mijares - Puebla de Arenoso (Libre sin muerte). Confirma el último tramo en Maps; el nivel cambia la orilla.",
    puntos: [
      {
        nombre: "Entorno principal",
        detalle: "Aparcamiento / ensanches habituales. No bloquees pistas ni curvas sin visibilidad.",
        lat: 40.095,
        lng: -0.5,
      },
    ],
  },
  {
    zoneId: "embalse_regajo_libre",
    resumen: "Accesos orientativos a Embalse del Regajo (Libre sin muerte). Confirma el último tramo en Maps; el nivel cambia la orilla.",
    puntos: [
      {
        nombre: "Entorno principal",
        detalle: "Aparcamiento / ensanches habituales. No bloquees pistas ni curvas sin visibilidad.",
        lat: 39.8899,
        lng: -0.5245,
      },
    ],
  },
  {
    zoneId: "embalse_ulldecona",
    resumen: "Accesos orientativos a Embalse de Ulldecona. Confirma el último tramo en Maps; el nivel cambia la orilla.",
    puntos: [
      {
        nombre: "Entorno principal",
        detalle: "Aparcamiento / ensanches habituales. No bloquees pistas ni curvas sin visibilidad.",
        lat: 40.6707,
        lng: 0.2336,
      },
    ],
  },
  {
    zoneId: "embalse_de_cala",
    resumen: "Accesos orientativos a Embalse de Cala. Confirma el último tramo en Maps; el nivel cambia la orilla.",
    puntos: [
      {
        nombre: "Entorno principal",
        detalle: "Aparcamiento / ensanches habituales. No bloquees pistas ni curvas sin visibilidad.",
        lat: 37.72475,
        lng: -6.12029,
      },
    ],
  },
  {
    zoneId: "embalse_de_jose_toran",
    resumen: "Accesos orientativos a Embalse de José Torán. Confirma el último tramo en Maps; el nivel cambia la orilla.",
    puntos: [
      {
        nombre: "Entorno principal",
        detalle: "Aparcamiento / ensanches habituales. No bloquees pistas ni curvas sin visibilidad.",
        lat: 37.76629,
        lng: -5.48167,
      },
    ],
  },
  {
    zoneId: "embalse_de_jarrama",
    resumen: "Accesos orientativos a Embalse de Jarrama. Confirma el último tramo en Maps; el nivel cambia la orilla.",
    puntos: [
      {
        nombre: "Entorno principal",
        detalle: "Aparcamiento / ensanches habituales. No bloquees pistas ni curvas sin visibilidad.",
        lat: 37.67357,
        lng: -6.50592,
      },
    ],
  }
];

const POR_ID: Record<string, AccesoZona> = Object.fromEntries(ACCESOS.map((a) => [a.zoneId, a]));

export function accesoDeZona(zoneId: string | undefined | null): AccesoZona | null {
  if (!zoneId) return null;
  return POR_ID[zoneId] ?? null;
}
