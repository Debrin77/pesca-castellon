/**
 * Sitios curados para la primera salida (acceso fácil, perdona errores).
 * No sustituyen el catálogo oficial ni el semáforo del punto.
 */
export type SitioFacil = {
  id: string;
  zoneId: string;
  nombre: string;
  lat: number;
  lng: number;
  porQue: string;
  ambito: "continental" | "maritimo";
};

export const SITIOS_FACILES: Record<"castellon" | "sevilla", SitioFacil[]> = {
  castellon: [
    {
      id: "cs-sichar",
      zoneId: "embalse_sichar",
      nombre: "Embalse de Sichar",
      lat: 40.0105,
      lng: -0.2332,
      porQue: "Embalse accesible, orillas amplias y especies habituales de principiante.",
      ambito: "continental",
    },
    {
      id: "cs-maria",
      zoneId: "embalse_maria_cristina",
      nombre: "Embalse de María Cristina",
      lat: 40.0282,
      lng: -0.1619,
      porQue: "Cerca de Castellón ciudad; buen sitio para practicar lance corto.",
      ambito: "continental",
    },
    {
      id: "cs-regajo",
      zoneId: "embalse_regajo_libre",
      nombre: "Embalse del Regajo (libre)",
      lat: 39.8899,
      lng: -0.5245,
      porQue: "Tramo libre sin muerte: ideal para aprender sin presión de cupo.",
      ambito: "continental",
    },
    {
      id: "cs-palancia",
      zoneId: "rio_palancia_teresa_libre",
      nombre: "Palancia · Teresa (libre)",
      lat: 39.87,
      lng: -0.58,
      porQue: "Río libre sin muerte; confirma cartel y caudal antes de lanzar.",
      ambito: "continental",
    },
    {
      id: "cs-arenos",
      zoneId: "embalse_arenos",
      nombre: "Embalse de Arenós",
      lat: 40.0867,
      lng: -0.5471,
      porQue: "Gran vaso con muchas orillas; mira el nivel SAIH si baja mucho.",
      ambito: "continental",
    },
  ],
  sevilla: [
    {
      id: "se-cala",
      zoneId: "embalse_de_cala",
      nombre: "Embalse de Cala",
      lat: 37.72475,
      lng: -6.12029,
      porQue: "El más citado cerca de Sevilla; orillas y parking habituales.",
      ambito: "continental",
    },
    {
      id: "se-toran",
      zoneId: "embalse_de_jose_toran",
      nombre: "Embalse de José Torán",
      lat: 37.76629,
      lng: -5.48167,
      porQue: "Embalse accesible; confirma que no pisas refugio DERA en cola.",
      ambito: "continental",
    },
    {
      id: "se-gergal",
      zoneId: "embalse_de_gergal",
      nombre: "Embalse de Gergal",
      lat: 37.60414,
      lng: -6.04904,
      porQue: "Buen banco de pruebas para spinning / fondo sencillo.",
      ambito: "continental",
    },
    {
      id: "se-barqueta",
      zoneId: "tramos_de_la_barqueta_paseo_de_la_o_y_chapina_en",
      nombre: "Guadalquivir · Barqueta / Chapina",
      lat: 37.37268,
      lng: -5.99749,
      porQue: "Tramo urbano accesible; mira ordenanzas y refugios cercanos.",
      ambito: "continental",
    },
    {
      id: "se-aguila",
      zoneId: "embalse_de_torre_del_aguila",
      nombre: "Torre del Águila",
      lat: 37.03432,
      lng: -5.71923,
      porQue: "Embalse amplio; evita márgenes de refugio señalizados.",
      ambito: "continental",
    },
  ],
};

export function sitiosFacilesDe(provinciaId: "castellon" | "sevilla"): SitioFacil[] {
  return SITIOS_FACILES[provinciaId] ?? [];
}
