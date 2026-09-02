/** Genera src/data/playasEspigonesCosta.json. Nombres: Turismo Castellón (Diputación). */
import { writeFileSync } from "fs";

const arena = "Dorada, lisas, lubina, herrera, sargo";
const idsArena = ["dorada", "llisa", "lubina", "herrera", "sargo"];
const roca = "Sargo, lubina, sepia, dorada, espetón";
const idsRoca = ["sargo", "lubina", "sepia", "dorada", "espeton"];
const mix = "Lubina, dorada, sargo, sepia, lisas";
const idsMix = ["lubina", "dorada", "sargo", "sepia", "llisa"];

function p(id, nombre, tramo, especies, especiesIds, sitios, extra = {}) {
  const lat = tramo.reduce((s, x) => s + x.lat, 0) / tramo.length;
  const lng = tramo.reduce((s, x) => s + x.lng, 0) / tramo.length;
  return {
    id,
    nombre,
    lat: Math.round(lat * 1e5) / 1e5,
    lng: Math.round(lng * 1e5) / 1e5,
    anchoKm: extra.anchoKm ?? 0.24,
    tramo,
    especies,
    especiesIds,
    sitios,
    ...(extra.veda ? { vedaOrilla: true, normaVeda: extra.normaVeda } : {}),
  };
}

function esp(nombre, detalle, especies = "Dorada, lubina, sargo") {
  return [{ nombre, especies, cuando: "Alba y última luz legal", detalle }];
}

const playas = [
  // —— Vinaròs norte → sur (Qualitur / Diputación)
  p("vinaros_riu_senia", "Playa del Riu de la Sénia (Vinaròs)", [{ lat: 40.524, lng: 0.517 }, { lat: 40.52, lng: 0.513 }], roca, idsRoca, esp("Orilla del Riu Sénia", "Límite con Tarragona. No es Sòl de Riu.")),
  p("vinaros_sol_riu", "Cala del Sòl de Riu (Vinaròs)", [{ lat: 40.52, lng: 0.513 }, { lat: 40.516, lng: 0.509 }], roca, idsRoca, esp("Cala Sòl de Riu", "Esta cala. No es la Sénia.")),
  p("vinaros_sunyera", "Cala de la Sunyera (Vinaròs)", [{ lat: 40.516, lng: 0.509 }, { lat: 40.513, lng: 0.506 }], roca, idsRoca, esp("Sunyera", "Solo esta cala.")),
  p("vinaros_deveses", "Playa de les Deveses (Vinaròs)", [{ lat: 40.513, lng: 0.506 }, { lat: 40.508, lng: 0.501 }], roca, idsRoca, esp("Les Deveses", "Tramo norte de Vinaròs, no el Fortí.")),
  p("vinaros_timbes", "Cala de les Timbes (Vinaròs)", [{ lat: 40.508, lng: 0.501 }, { lat: 40.505, lng: 0.498 }], roca, idsRoca, esp("Les Timbes", "Solo Timbes.")),
  p("vinaros_llanetes", "Cala de les Llanetes (Vinaròs)", [{ lat: 40.505, lng: 0.498 }, { lat: 40.501, lng: 0.494 }], roca, idsRoca, esp("Les Llanetes", "Solo Llanetes.")),
  p("vinaros_roca_plana", "Cala de la Roca Plana (Vinaròs)", [{ lat: 40.501, lng: 0.494 }, { lat: 40.497, lng: 0.491 }], roca, idsRoca, esp("Roca Plana", "Solo esta cala.")),
  p("vinaros_foradada", "Cala de la Foradada (Vinaròs)", [{ lat: 40.497, lng: 0.491 }, { lat: 40.493, lng: 0.488 }], roca, idsRoca, esp("Foradada", "Solo Foradada.")),
  p("vinaros_les_cales", "Playa de les Cales (Vinaròs)", [{ lat: 40.493, lng: 0.488 }, { lat: 40.489, lng: 0.485 }], roca, idsRoca, esp("Les Cales", "No es el Pastor.")),
  p("vinaros_pastor", "Cala El Pastor (Vinaròs)", [{ lat: 40.489, lng: 0.485 }, { lat: 40.486, lng: 0.483 }], roca, idsRoca, esp("El Pastor", "Solo El Pastor.")),
  p("vinaros_triador", "Playa del Triador (Vinaròs)", [{ lat: 40.486, lng: 0.483 }, { lat: 40.482, lng: 0.48 }], mix, idsMix, esp("Triador", "No es la cala del Pinar de Vinaròs.")),
  p("vinaros_cala_pinar", "Cala El Pinar (Vinaròs)", [{ lat: 40.482, lng: 0.48 }, { lat: 40.48, lng: 0.478 }], roca, idsRoca, esp("Cala El Pinar de Vinaròs", "No es el Pinar del Grao de Castellón.")),
  p("vinaros_barbiguera", "Playa de la Barbiguera (Vinaròs)", [{ lat: 40.48, lng: 0.478 }, { lat: 40.477, lng: 0.476 }], mix, idsMix, esp("Barbiguera", "Solo Barbiguera.")),
  p("vinaros_saldonar", "Playa del Saldonar (Vinaròs)", [{ lat: 40.477, lng: 0.476 }, { lat: 40.474, lng: 0.474 }], mix, idsMix, esp("Saldonar", "No es Els Cossis.")),
  p("vinaros_cossis", "Cala Els Cossis (Vinaròs)", [{ lat: 40.474, lng: 0.474 }, { lat: 40.472, lng: 0.473 }], roca, idsRoca, esp("Els Cossis", "Solo Cossis.")),
  p("vinaros_boca_riu", "Playa de la Boca del Riu (Vinaròs)", [{ lat: 40.472, lng: 0.473 }, { lat: 40.47, lng: 0.472 }], mix, idsMix, esp("Boca del Riu", "Antes del núcleo urbano.")),
  p("vinaros_forti", "Playa del Fortí (Vinaròs)", [{ lat: 40.47, lng: 0.478 }, { lat: 40.466, lng: 0.475 }], mix, idsMix, esp("Espigones del Fortí", "Urbana. No es Fora del Forat ni el puerto.")),
  p("vinaros_fora_forat", "Playa de Fora del Forat (Vinaròs)", [{ lat: 40.466, lng: 0.475 }, { lat: 40.463, lng: 0.473 }], arena, idsArena, esp("Fora del Forat", "Paseo urbano. No es el Fortí ni el Clot.")),
  p("vinaros_clot", "Playa del Clot (Vinaròs)", [{ lat: 40.463, lng: 0.473 }, { lat: 40.46, lng: 0.47 }], arena, idsArena, esp("El Clot", "Urbana junto al puerto. La dársena no.")),
  p("vinaros_pinets", "Cala dels Pinets (Vinaròs)", [{ lat: 40.458, lng: 0.468 }, { lat: 40.456, lng: 0.466 }], roca, idsRoca, esp("Pinets", "Costa sur. No es Fondo de Bola.")),
  p("vinaros_fondo_bola", "Cala del Fondo de Bola (Vinaròs)", [{ lat: 40.456, lng: 0.466 }, { lat: 40.454, lng: 0.464 }], roca, idsRoca, esp("Fondo de Bola", "Solo esta cala.")),
  p("vinaros_roques", "Cala de les Roques (Vinaròs)", [{ lat: 40.454, lng: 0.464 }, { lat: 40.452, lng: 0.462 }], roca, idsRoca, esp("Les Roques", "No es Les Salines.")),
  p("vinaros_salines", "Playa de les Salines (Vinaròs)", [{ lat: 40.452, lng: 0.462 }, { lat: 40.449, lng: 0.46 }], mix, idsMix, esp("Les Salines", "Costa sur.")),
  p("vinaros_puntal1", "Cala del Puntal I (Vinaròs)", [{ lat: 40.449, lng: 0.46 }, { lat: 40.447, lng: 0.458 }], roca, idsRoca, esp("Puntal I", "No es Puntal II.")),
  p("vinaros_puntal2", "Cala del Puntal II (Vinaròs)", [{ lat: 40.447, lng: 0.458 }, { lat: 40.445, lng: 0.456 }], roca, idsRoca, esp("Puntal II", "No es Aiguadoliva.")),
  p("vinaros_aiguadoliva", "Playa de Aiguadoliva (Vinaròs)", [{ lat: 40.445, lng: 0.456 }, { lat: 40.44, lng: 0.452 }], mix, idsMix, esp("Aiguadoliva", "Sur de Vinaròs, hacia Benicarló.")),

  // —— Benicarló
  p("benicarlo_norte", "Playa Norte o Mar Chica (Benicarló)", [{ lat: 40.426, lng: 0.434 }, { lat: 40.42, lng: 0.429 }], arena, idsArena, esp("Mar Chica", "Norte de Benicarló. No es el Morrongo.")),
  p("benicarlo_morrongo", "Playa del Morrongo (Benicarló)", [{ lat: 40.42, lng: 0.429 }, { lat: 40.415, lng: 0.425 }], arena, idsArena, esp("Espigones del Morrongo", "Playa urbana. No es la dársena.")),
  p("benicarlo_caracola", "Playa La Caracola (Benicarló)", [{ lat: 40.414, lng: 0.424 }, { lat: 40.408, lng: 0.419 }], arena, idsArena, esp("La Caracola", "Sur de Benicarló. No es el Morrongo ni Peñíscola.")),

  // —— Peñíscola
  p("peniscola_norte", "Playa Norte de Peñíscola", [{ lat: 40.378, lng: 0.413 }, { lat: 40.36, lng: 0.405 }], arena, idsArena, esp("Espigones de Playa Norte", "Solo la Norte. No es la Sur ni el puerto."), { anchoKm: 0.28 }),
  p("peniscola_sur", "Playa Sur de Peñíscola", [{ lat: 40.355, lng: 0.403 }, { lat: 40.34, lng: 0.394 }], arena, idsArena, esp("Espigones de Playa Sur", "Solo la Sur. Dársena no."), { anchoKm: 0.28 }),
  p("peniscola_irta_volante", "Cala Volante (Irta, Peñíscola)", [{ lat: 40.328, lng: 0.372 }, { lat: 40.318, lng: 0.358 }], roca, idsRoca, esp("Cala Volante", "Reserva marina: pesca a pie prohibida."), { veda: true, normaVeda: "Decreto 163/2006: orilla de Irta vedada (Cala Volante–Mundina)." }),

  // —— Alcossebre (norte Irta → sur Torreblanca)
  p("alcossebre_mundina", "Cala Mundina (Alcossebre)", [{ lat: 40.268, lng: 0.312 }, { lat: 40.262, lng: 0.304 }], roca, idsRoca, esp("Mundina", "Irta: pesca a pie no."), { veda: true, normaVeda: "Decreto 163/2006. No es Manyetes." }),
  p("alcossebre_ribamar", "Calas de Ribamar (Alcossebre)", [{ lat: 40.262, lng: 0.304 }, { lat: 40.256, lng: 0.296 }], roca, idsRoca, esp("Ribamar", "Irta / acceso natural."), { veda: true, normaVeda: "Dentro o al borde de Irta: si hay cartel, no lances." }),
  p("alcossebre_blanca", "Cala Blanca (Alcossebre)", [{ lat: 40.252, lng: 0.292 }, { lat: 40.248, lng: 0.288 }], roca, idsRoca, esp("Cala Blanca", "Virgen, no es Manyetes.")),
  p("alcossebre_manyetes", "Playa Manyetes o Tropicana (Alcossebre)", [{ lat: 40.246, lng: 0.286 }, { lat: 40.241, lng: 0.281 }], mix, idsMix, esp("Manyetes / Tropicana", "No es Las Fuentes ni Cala Blanca.")),
  p("alcossebre_fuentes", "Playa Las Fuentes (Alcossebre)", [{ lat: 40.241, lng: 0.281 }, { lat: 40.237, lng: 0.277 }], mix, idsMix, esp("Las Fuentes", "Entre Manyetes y el Carregador.")),
  p("alcossebre_carregador", "Playa del Carregador (Alcossebre)", [{ lat: 40.237, lng: 0.277 }, { lat: 40.231, lng: 0.272 }], arena, idsArena, esp("Espigón del Carregador", "Núcleo de Alcossebre. No la dársena."), { anchoKm: 0.26 }),
  p("alcossebre_romana", "Playa Romana (Alcossebre)", [{ lat: 40.231, lng: 0.272 }, { lat: 40.226, lng: 0.267 }], arena, idsArena, esp("Romana", "No es el Carregador ni El Moro.")),
  p("alcossebre_moro", "Playa del Moro (Alcossebre)", [{ lat: 40.226, lng: 0.267 }, { lat: 40.222, lng: 0.262 }], mix, idsMix, esp("El Moro", "No es Tres Playas.")),
  p("alcossebre_tres", "Tres Playas (Alcossebre)", [{ lat: 40.222, lng: 0.262 }, { lat: 40.218, lng: 0.257 }], mix, idsMix, esp("Tres Playas", "No es el Serradal de Alcossebre.")),
  p("alcossebre_serradal", "Playa Serradal (Alcossebre)", [{ lat: 40.218, lng: 0.257 }, { lat: 40.212, lng: 0.25 }], mix, idsMix, esp("Serradal de Alcossebre", "No es el Serradal del Grao de Castellón.")),

  // —— Torreblanca / Cabanes
  p("torreblanca_norte", "Playa Norte de Torreblanca", [{ lat: 40.21, lng: 0.228 }, { lat: 40.204, lng: 0.221 }], arena, idsArena, esp("Torreblanca Norte", "No es Torrenostra.")),
  p("torreblanca_torrenostra", "Playa Torrenostra (Torreblanca)", [{ lat: 40.204, lng: 0.221 }, { lat: 40.194, lng: 0.212 }], arena, idsArena, esp("Torrenostra", "Núcleo playero. El Prat (humedal) no se pesca."), { anchoKm: 0.26 }),
  p("cabanes_cuartell", "Playa Cuartell Vell (Cabanes)", [{ lat: 40.16, lng: 0.188 }, { lat: 40.15, lng: 0.178 }], mix, idsMix, esp("Cuartell Vell", "No es Torre la Sal.")),
  p("cabanes_torre_sal", "Playa Torre la Sal (Cabanes)", [{ lat: 40.145, lng: 0.176 }, { lat: 40.132, lng: 0.164 }], mix, idsMix, esp("Espigón de Torre la Sal", "Solo Torre la Sal. El Prat al norte."), { anchoKm: 0.26 }),

  // —— Orpesa
  p("orpesa_amplaries", "Playa de les Amplàries (Orpesa)", [{ lat: 40.104, lng: 0.154 }, { lat: 40.094, lng: 0.142 }], mix, idsMix, esp("Espigón de Les Amplàries", "No es La Concha ni el puerto."), { anchoKm: 0.26 }),
  p("orpesa_concha", "Playa de la Concha (Orpesa)", [{ lat: 40.094, lng: 0.142 }, { lat: 40.086, lng: 0.13 }], arena, idsArena, esp("Espigones de La Concha", "No es Amplàries ni Morro de Gos.")),
  p("orpesa_renega", "Playa La Renegà (Orpesa)", [{ lat: 40.086, lng: 0.13 }, { lat: 40.082, lng: 0.124 }], roca, idsRoca, esp("La Renegà", "Roca. No es La Concha.")),
  p("orpesa_morro_gos", "Playa Morro de Gos (Orpesa)", [{ lat: 40.082, lng: 0.124 }, { lat: 40.074, lng: 0.114 }], mix, idsMix, esp("Morro de Gos", "Hacia Benicàssim. No es Bellver.")),
  p("orpesa_vella", "Cala de Orpesa la Vella (Orpesa)", [{ lat: 40.092, lng: 0.136 }, { lat: 40.089, lng: 0.133 }], roca, idsRoca, esp("Orpesa la Vella", "Junto al pueblo viejo. Cala corta."), { anchoKm: 0.2 }),
  p("orpesa_retor", "Cala del Retor (Orpesa)", [{ lat: 40.078, lng: 0.12 }, { lat: 40.075, lng: 0.116 }], roca, idsRoca, esp("Cala del Retor", "No es Morro de Gos."), { anchoKm: 0.2 }),
  p("orpesa_bellver", "Playetas de Bellver (Orpesa)", [{ lat: 40.072, lng: 0.11 }, { lat: 40.068, lng: 0.102 }], mix, idsMix, esp("Bellver", "Hacia Voramar. No es Benicàssim.")),

  // —— Benicàssim norte → sur
  p("benicassim_voramar", "Playa Voramar (Benicàssim)", [{ lat: 40.068, lng: 0.1 }, { lat: 40.059, lng: 0.084 }], mix, idsMix, esp("Espigones de Voramar", "Solo Voramar. No es Torre San Vicente."), { anchoKm: 0.26 }),
  p("benicassim_torreon", "Playa Torre San Vicente (Benicàssim)", [{ lat: 40.059, lng: 0.084 }, { lat: 40.053, lng: 0.075 }], mix, idsMix, esp("Espigones del Torreón", "Solo Torre San Vicente.")),
  p("benicassim_heliopolis", "Playa Heliópolis (Benicàssim)", [{ lat: 40.053, lng: 0.075 }, { lat: 40.046, lng: 0.064 }], arena, idsArena, esp("Heliópolis", "Surfcasting. No es la Almadraba.")),
  p("benicassim_almadraba", "Playa Almadraba (Benicàssim)", [{ lat: 40.046, lng: 0.064 }, { lat: 40.038, lng: 0.052 }], arena, idsArena, esp("Almadraba", "No es Heliópolis ni Els Terrers.")),
  p("benicassim_terrers", "Playa Els Terrers (Benicàssim)", [{ lat: 40.038, lng: 0.052 }, { lat: 40.022, lng: 0.042 }], mix, idsMix, esp("Els Terrers", "Última de Benicàssim. El Serradal del Grao empieza al sur."), { anchoKm: 0.26 }),

  // —— Grao de Castellón: puerto → norte hacia Benicàssim (oficial)
  p(
    "grao_pinar",
    "Playa del Pinar (Grao de Castellón)",
    [
      { lat: 39.9765, lng: 0.0195 },
      { lat: 39.9918, lng: 0.0288 },
    ],
    "Lubina, dorada, palometón, sargo, sepia, lisas",
    ["lubina", "dorada", "palometon", "sargo", "sepia", "llisa"],
    [
      {
        nombre: "Pinar: Planetario y espigón norte (cara mar)",
        especies: "Lubina, palometón, dorada, sepia",
        cuando: "Amanecer; pases",
        detalle:
          "Arranca en el límite NORTE del puerto (Planetario) y llega al Camí de la Plana. No es el Gurugú ni el Serradal. El tramo del espigón (a veces dicho «Pilar») es este Pinar. Dársena prohibida. Al SUR del puerto ya no es Castellón: es Almassora.",
      },
    ],
    { anchoKm: 0.26 }
  ),
  p(
    "grao_gurugu",
    "Playa del Gurugú (Grao de Castellón)",
    [
      { lat: 39.9922, lng: 0.0292 },
      { lat: 40.0048, lng: 0.0365 },
    ],
    "Dorada, lisas, lubina, sargo",
    ["dorada", "llisa", "lubina", "sargo"],
    [
      {
        nombre: "Gurugú (Camí de la Plana–Riu Sec)",
        especies: "Dorada, lisa, lubina",
        cuando: "Alba; chiringuitos en verano",
        detalle: "Entre el Pinar y el Serradal. Aeroclub a la espalda. No es el Pinar (más al sur, junto al puerto) ni el Serradal (más al norte, hacia Benicàssim).",
      },
    ],
    { anchoKm: 0.26 }
  ),
  p(
    "grao_serradal",
    "Playa del Serradal (Grao de Castellón)",
    [
      { lat: 40.0052, lng: 0.0369 },
      { lat: 40.0215, lng: 0.0495 },
    ],
    "Dorada, lubina, lisas, sargo",
    ["dorada", "lubina", "llisa", "sargo"],
    [
      {
        nombre: "Serradal (Riu Sec–Benicàssim)",
        especies: "Dorada, lubina, lisa",
        cuando: "Alba",
        detalle: "La más al NORTE del Grao: dunas, hasta el término de Benicàssim (Els Terrers). No es el Gurugú ni el Pinar. Tampoco el Serradal de Alcossebre.",
      },
    ],
    { anchoKm: 0.26 }
  ),

  // —— Almassora (sur del puerto / Millars)
  p("almassora_benafeli", "Playa de Benafelí (Almassora)", [{ lat: 39.96, lng: 0.004 }, { lat: 39.932, lng: -0.018 }], arena, idsArena, esp("Benafelí", "Sur del puerto de Castellón. No es el Pinar. La gola del Millars está vedada."), { anchoKm: 0.28 }),
  p("almassora_pla_torre", "Playa Pla de la Torre (Almassora)", [{ lat: 39.928, lng: -0.022 }, { lat: 39.905, lng: -0.038 }], arena, idsArena, esp("Pla de la Torre (Almassora)", "Hacia Burriana. No es Benafelí.")),

  // —— Burriana
  p("burriana_arenal", "Playa El Arenal (Burriana)", [{ lat: 39.856, lng: -0.056 }, { lat: 39.848, lng: -0.068 }], mix, idsMix, esp("Espigones del Arenal", "No es la Malvarrosa ni el puerto."), { anchoKm: 0.26 }),
  p("burriana_malvarrosa", "Playa Malvarrosa-Grao (Burriana)", [{ lat: 39.847, lng: -0.07 }, { lat: 39.838, lng: -0.086 }], arena, idsArena, esp("Malvarrosa-Grao de Burriana", "No es el Arenal ni Nules.")),

  // —— Nules
  p("nules_alcudia", "Playa de L'Alcúdia (Nules)", [{ lat: 39.832, lng: -0.096 }, { lat: 39.826, lng: -0.104 }], arena, idsArena, esp("L'Alcúdia", "Nules norte. No es El Bovalar.")),
  p("nules_bovalar", "Playa El Bovalar (Nules)", [{ lat: 39.826, lng: -0.104 }, { lat: 39.822, lng: -0.11 }], arena, idsArena, esp("El Bovalar", "No es Les Marines.")),
  p("nules_marines", "Playa Les Marines (Nules)", [{ lat: 39.822, lng: -0.11 }, { lat: 39.817, lng: -0.118 }], arena, idsArena, esp("Les Marines de Nules", "A veces dicha Palmeral. No es El Rajadell.")),
  p("nules_rajadell", "Playa El Rajadell (Nules)", [{ lat: 39.817, lng: -0.118 }, { lat: 39.812, lng: -0.124 }], arena, idsArena, esp("El Rajadell", "Sur de Nules, hacia Moncofa.")),

  // —— Moncofa
  p("moncofa_pedraroja", "Playa Pedraroja (Moncofa)", [{ lat: 39.812, lng: -0.124 }, { lat: 39.808, lng: -0.13 }], mix, idsMix, esp("Pedraroja", "Norte de Moncofa.")),
  p("moncofa_estanyol", "Playa Estanyol (Moncofa)", [{ lat: 39.808, lng: -0.13 }, { lat: 39.803, lng: -0.136 }], arena, idsArena, esp("L'Estanyol", "No es Masbó ni el Grau.")),
  p("moncofa_masbo", "Playa Masbó (Moncofa)", [{ lat: 39.803, lng: -0.136 }, { lat: 39.798, lng: -0.14 }], arena, idsArena, esp("Masbó", "No es Beniesma.")),
  p("moncofa_beniesma", "Playa Beniesma (Moncofa)", [{ lat: 39.798, lng: -0.14 }, { lat: 39.794, lng: -0.144 }], arena, idsArena, esp("Beniesma", "No es el Grau de Moncofa.")),
  p("moncofa_grau", "Playa Grau (Moncofa)", [{ lat: 39.794, lng: -0.144 }, { lat: 39.788, lng: -0.15 }], arena, idsArena, esp("Grau de Moncofa", "Núcleo. No es Belcaire.")),
  p("moncofa_belcaire", "Playa Belcaire (Moncofa)", [{ lat: 39.788, lng: -0.15 }, { lat: 39.782, lng: -0.156 }], mix, idsMix, esp("Belcaire", "Sur de Moncofa, hacia Xilxes.")),

  // —— Xilxes / Llosa / Almenara
  p("xilxes_cases", "Playa les Cases — Norte (Xilxes)", [{ lat: 39.782, lng: -0.156 }, { lat: 39.776, lng: -0.164 }], arena, idsArena, esp("Les Cases (norte)", "No es El Cerezo.")),
  p("xilxes_cerezo", "Playa del Cerezo — Sur (Xilxes)", [{ lat: 39.776, lng: -0.164 }, { lat: 39.77, lng: -0.172 }], arena, idsArena, esp("El Cerezo (sur)", "No es La Llosa.")),
  p("la_llosa", "Playa La Llosa", [{ lat: 39.77, lng: -0.172 }, { lat: 39.76, lng: -0.184 }], arena, idsArena, esp("Espigón de La Llosa", "Solo La Llosa.")),
  p("almenara_casablanca", "Playa Casablanca (Almenara)", [{ lat: 39.756, lng: -0.19 }, { lat: 39.74, lng: -0.208 }], arena, ["dorada", "llisa", "lubina", "cangrejo_azul"], esp("Casablanca", "Playa de Almenara al mar. Los Estanys no son esta orilla."), { anchoKm: 0.26 }),
];

const data = {
  aviso:
    "Nombres según Turismo Castellón (Diputación). En el Grao: Pinar (desde el puerto hacia el NORTE), Gurugú (en medio), Serradal (hasta Benicàssim). Al sur del puerto no es el Pinar: es Almassora. Cada toque es una sola playa. Dársena prohibida. Irta: pesca a pie no.",
  kmOrilla: 2.4,
  lineaCosta: [
    { lat: 40.525, lng: 0.518 },
    { lat: 40.47, lng: 0.475 },
    { lat: 40.417, lng: 0.43 },
    { lat: 40.36, lng: 0.407 },
    { lat: 40.3, lng: 0.348 },
    { lat: 40.24, lng: 0.278 },
    { lat: 40.2, lng: 0.216 },
    { lat: 40.14, lng: 0.17 },
    { lat: 40.092, lng: 0.14 },
    { lat: 40.055, lng: 0.078 },
    { lat: 40.022, lng: 0.05 },
    { lat: 40.005, lng: 0.037 },
    { lat: 39.992, lng: 0.029 },
    { lat: 39.978, lng: 0.021 },
    { lat: 39.945, lng: -0.01 },
    { lat: 39.91, lng: -0.032 },
    { lat: 39.85, lng: -0.066 },
    { lat: 39.82, lng: -0.112 },
    { lat: 39.79, lng: -0.148 },
    { lat: 39.75, lng: -0.195 },
    { lat: 39.705, lng: -0.225 },
  ],
  especiesPorDefecto: "Lubina, dorada, sargo, mojarra, lisas/mabra, sepia, calamar, pulpo, jurel, salmonete",
  playas,
};

writeFileSync(new URL("../src/data/playasEspigonesCosta.json", import.meta.url), JSON.stringify(data, null, 2) + "\n");
console.log("playas", playas.length);
