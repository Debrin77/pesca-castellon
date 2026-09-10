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

export const SITIOS_FACILES: Record<"castellon" | "sevilla" | "cordoba" | "cuenca", SitioFacil[]> = {
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
    {
      id: "cs-grao-pinar",
      zoneId: "grao_pinar",
      nombre: "Grao de Castellón · Playa del Pinar",
      lat: 39.98415,
      lng: 0.02415,
      porQue: "Orilla de mar accesible; licencia marítima desde tierra (GVA).",
      ambito: "maritimo",
    },
    {
      id: "cs-benicassim",
      zoneId: "benicassim_voramar",
      nombre: "Benicàssim · Voramar",
      lat: 40.0635,
      lng: 0.092,
      porQue: "Playa urbana típica de spinning/surfcasting de orilla.",
      ambito: "maritimo",
    },
    {
      id: "cs-benicarlo",
      zoneId: "benicarlo_norte",
      nombre: "Benicarló · Playa Norte",
      lat: 40.423,
      lng: 0.4315,
      porQue: "Arena y rompiente; confirma vedados y licencia marítima.",
      ambito: "maritimo",
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
  cordoba: [
    {
      id: "co-guadalmellato",
      zoneId: "embalse_guadalmellato",
      nombre: "Embalse del Guadalmellato",
      lat: 38.048,
      lng: -4.652,
      porQue: "El más citado cerca de Córdoba; orillas y parking habituales.",
      ambito: "continental",
    },
    {
      id: "co-navallana",
      zoneId: "embalse_de_san_rafael_de_navallana",
      nombre: "Embalse de San Rafael de Navallana",
      lat: 37.98435,
      lng: -4.65164,
      porQue: "Cerca de la capital; confirma que no pisas el refugio DERA.",
      ambito: "continental",
    },
    {
      id: "co-iznajar",
      zoneId: "embalse_de_iznajar",
      nombre: "Embalse de Iznájar",
      lat: 37.24204,
      lng: -4.28606,
      porQue: "Gran vaso; mira nivel SAIH y medidas de siluro/mejillón.",
      ambito: "continental",
    },
    {
      id: "co-gq-capital",
      zoneId: "guadalquivir_cordoba_capital",
      nombre: "Guadalquivir · Córdoba capital",
      lat: 37.8765,
      lng: -4.7795,
      porQue: "Tramo urbano accesible; mira ordenanzas y azudes.",
      ambito: "continental",
    },
    {
      id: "co-martin",
      zoneId: "embalse_martin_gonzalo",
      nombre: "Embalse de Martín Gonzalo",
      lat: 38.118,
      lng: -4.312,
      porQue: "Embalse menor; buen banco de pruebas para spinning.",
      ambito: "continental",
    },
  ],
  cuenca: [
    {
      id: "cu-alarcon",
      zoneId: "embalse_de_alarcon",
      nombre: "Embalse de Alarcón",
      lat: 39.6555,
      lng: -2.208,
      porQue: "Gran vaso del Júcar; mira restricciones de cebo y SAIH.",
      ambito: "continental",
    },
    {
      id: "cu-contreras",
      zoneId: "embalse_de_contreras",
      nombre: "Embalse de Contreras",
      lat: 39.5854,
      lng: -1.5238,
      porQue: "Orillas accesibles; confirma límite provincial con CV.",
      ambito: "continental",
    },
    {
      id: "cu-jucar-capital",
      zoneId: "rio_jucar_capital",
      nombre: "Río Júcar · Cuenca capital",
      lat: 40.0705,
      lng: -2.1374,
      porQue: "Tramo urbano accesible; barbos solo sin muerte.",
      ambito: "continental",
    },
    {
      id: "cu-toba",
      zoneId: "embalse_de_la_toba",
      nombre: "Embalse de La Toba",
      lat: 40.223,
      lng: -1.955,
      porQue: "Vaso de Serranía; trucha sin muerte y régimen especial.",
      ambito: "continental",
    },
  ],
};

export function sitiosFacilesDe(provinciaId: "castellon" | "sevilla" | "cordoba" | "cuenca"): SitioFacil[] {
  return SITIOS_FACILES[provinciaId] ?? [];
}
