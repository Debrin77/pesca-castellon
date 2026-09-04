/**
 * “Caras” visuales premium sin depender de fotos externas:
 * gradiente + emoji/ambiente por tipo de zona o especie.
 */
export type CaraVisual = {
  emoji: string;
  gradiente: readonly [string, string];
  etiqueta: string;
};

const ZONA_POR_ID: Record<string, CaraVisual> = {
  embalse_arenos: { emoji: "🏞️", gradiente: ["#1a5640", "#0e4456"], etiqueta: "Embalse de montaña" },
  embalse_sichar: { emoji: "🌊", gradiente: ["#2a7a94", "#13485a"], etiqueta: "Embalse · Mijares" },
  embalse_maria_cristina: { emoji: "💧", gradiente: ["#1a6f8a", "#0c2c20"], etiqueta: "Embalse · Rambla" },
  embalse_ulldecona: { emoji: "🌄", gradiente: ["#164a36", "#1a6f8a"], etiqueta: "Embalse · Cérvol" },
  embalse_regajo_libre: { emoji: "🪞", gradiente: ["#2a7a94", "#0e4456"], etiqueta: "Embalse libre" },
  rio_palancia_regajo: { emoji: "🏞️", gradiente: ["#1a5640", "#0f3326"], etiqueta: "Río Palancia" },
  rio_palancia_teresa_libre: { emoji: "🌿", gradiente: ["#2f7d4a", "#0c2c20"], etiqueta: "Palancia libre" },
  rio_palancia_teresa_bejis_libre: { emoji: "🍃", gradiente: ["#2f7d4a", "#13485a"], etiqueta: "Palancia alto" },
  rio_mijares_puebla_arenoso_libre: { emoji: "🏞️", gradiente: ["#1a6f8a", "#0c2c20"], etiqueta: "Mijares" },
  rio_villahermosa_alto: { emoji: "🐟", gradiente: ["#164a36", "#24352c"], etiqueta: "Cabecera truchera" },
};

const ZONA_POR_TIPO: Record<string, CaraVisual> = {
  embalse: { emoji: "🌊", gradiente: ["#2a7a94", "#0e4456"], etiqueta: "Embalse" },
  rio: { emoji: "🌿", gradiente: ["#1a5640", "#0c2c20"], etiqueta: "Río" },
  default: { emoji: "🎣", gradiente: ["#1a5640", "#0f3326"], etiqueta: "Zona de pesca" },
};

const ESPECIE_CARA: Record<string, CaraVisual> = {
  trucha_comun: { emoji: "🐟", gradiente: ["#2f7d4a", "#0c2c20"], etiqueta: "Salmonícola" },
  trucha_arcoiris: { emoji: "🌈", gradiente: ["#1a6f8a", "#2f7d4a"], etiqueta: "Repoblación" },
  barbo: { emoji: "🐠", gradiente: ["#164a36", "#1a6f8a"], etiqueta: "Ciprinícola" },
  carpa: { emoji: "🐡", gradiente: ["#c45c12", "#0e4456"], etiqueta: "Ciprinícola" },
  black_bass: { emoji: "🦈", gradiente: ["#c45c12", "#0c2c20"], etiqueta: "Invasora" },
  lucio: { emoji: "🐊", gradiente: ["#b42318", "#0c2c20"], etiqueta: "Invasora" },
  siluro: { emoji: "👹", gradiente: ["#b42318", "#24352c"], etiqueta: "Invasora" },
  anguila: { emoji: "🐍", gradiente: ["#1a6f8a", "#0c2c20"], etiqueta: "Migradora" },
  mugilidos: { emoji: "🌊", gradiente: ["#2a7a94", "#13485a"], etiqueta: "Estuario / mar" },
  // Orilla Castellón (15 usuales + invasora)
  lubina: { emoji: "🐟", gradiente: ["#2a7a94", "#0e4456"], etiqueta: "Orilla · mar" },
  dorada: { emoji: "🐠", gradiente: ["#1a6f8a", "#13485a"], etiqueta: "Orilla · mar" },
  sargo: { emoji: "🐡", gradiente: ["#2a7a94", "#0c2c20"], etiqueta: "Roca / escollera" },
  mojarra: { emoji: "🐟", gradiente: ["#2a7a94", "#1a5640"], etiqueta: "Rockfishing" },
  herrera: { emoji: "🐠", gradiente: ["#1a6f8a", "#0e4456"], etiqueta: "Surfcasting" },
  oblada: { emoji: "🐟", gradiente: ["#2a7a94", "#13485a"], etiqueta: "Escollera" },
  salema: { emoji: "🐠", gradiente: ["#1a5640", "#0e4456"], etiqueta: "Roca / algas" },
  llisa: { emoji: "🌊", gradiente: ["#2a7a94", "#13485a"], etiqueta: "Playa / golas" },
  mabra: { emoji: "🌊", gradiente: ["#1a6f8a", "#0c2c20"], etiqueta: "Surfcasting" },
  jurel: { emoji: "🐟", gradiente: ["#2a7a94", "#0e4456"], etiqueta: "Spinning orilla" },
  caballa: { emoji: "🐟", gradiente: ["#1a6f8a", "#13485a"], etiqueta: "Espigón" },
  sepia: { emoji: "🦑", gradiente: ["#2a7a94", "#24352c"], etiqueta: "Cefalópodo" },
  calamar: { emoji: "🦑", gradiente: ["#1a6f8a", "#0c2c20"], etiqueta: "Eging" },
  pulpo: { emoji: "🐙", gradiente: ["#2a7a94", "#0e4456"], etiqueta: "Roca" },
  salmonete: { emoji: "🐠", gradiente: ["#c45c12", "#0e4456"], etiqueta: "Arena / piedra" },
  cangrejo_azul: { emoji: "🦀", gradiente: ["#c45c12", "#0c2c20"], etiqueta: "Invasora" },
};

export function caraDeZona(zone: { id?: string; tipo?: string; nombre?: string } | null): CaraVisual {
  if (!zone) return ZONA_POR_TIPO.default;
  if (zone.id && ZONA_POR_ID[zone.id]) return ZONA_POR_ID[zone.id];
  const n = `${zone.id ?? ""} ${zone.nombre ?? ""} ${zone.tipo ?? ""}`.toLowerCase();
  if (n.includes("embalse")) return ZONA_POR_TIPO.embalse;
  if (n.includes("rio") || n.includes("río")) return ZONA_POR_TIPO.rio;
  return ZONA_POR_TIPO.default;
}

export function caraDeEspecie(sp: { id?: string; invasora?: boolean; icono?: string } | null): CaraVisual {
  if (!sp) return { emoji: "🐟", gradiente: ["#1a6f8a", "#0c2c20"], etiqueta: "Especie" };
  if (sp.id && ESPECIE_CARA[sp.id]) return ESPECIE_CARA[sp.id];
  if (sp.invasora) return { emoji: sp.icono || "⚠️", gradiente: ["#c45c12", "#0c2c20"], etiqueta: "Invasora" };
  return {
    emoji: sp.icono || "🐟",
    gradiente: ["#1a6f8a", "#0c2c20"],
    etiqueta: "Especie",
  };
}
