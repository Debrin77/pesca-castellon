export const LICENCIA_INFO = {
  obligatoria: true,
  resumen:
    "En Castellón hacen falta licencias distintas según el agua: continental (ríos, embalses y cotos) y, en la orilla del mar, la de pesca marítima recreativa desde tierra (nombre oficial GVA). No se sustituyen entre sí. En cotos (Zonas de Pesca Controlada) puede exigirse además el permiso del coto.",
  tramiteOnline: "https://sede.gva.es/es/detall-tramit?id_proc=681",
  tramiteMaritimaTierra: "https://sede.gva.es/es/inicio/procedimientos?id_proc=17170",
  tramiteAlternativo: "https://agroambient.gva.es/es/web/medio-natural/llicencies-de-caca",
  oficinaCastellon: "Av. Hermanos Bou, 47 · 12003 Castelló de la Plana",
  tasas2026: [
    { concepto: "Licencia continental — 1 año", precio: "9,35 €" },
    { concepto: "Licencia continental — 3 años", precio: "26,19 €" },
  ],
  ambitos: [
    {
      id: "continental" as const,
      titulo: "Pesca continental (GVA)",
      donde: "Ríos, embalses, canales y cotos de interior",
      detalle:
        "Licencia de pesca continental de la Comunitat Valenciana. Obligatoria en todos los tramos; en ZPC además el permiso del coto.",
    },
    {
      id: "maritima_tierra" as const,
      titulo: "Pesca marítima recreativa desde tierra (GVA)",
      donde: "Orilla del mar (no embarcación ni submarina)",
      detalle:
        "Nombre oficial en sede GVA. Decreto 41/2013: no puertos, no a menos de 100 m de bañistas, no vender capturas.",
    },
    {
      id: "maritima_embarcacion" as const,
      titulo: "Pesca marítima desde embarcación / kayak",
      donde: "Mar (fuera de dársena); Columbretes = reserva",
      detalle:
        "No vale sola la licencia «desde tierra». Usa el ritual Salgo en barco, PescaREC cuando aplique y la cartografía oficial de reservas.",
    },
  ],
  exentos: [
    "Mayores de 67 años",
    "Menores de 14 años",
    "Pensionistas por incapacidad permanente",
    "Familias numerosas o monoparentales de categoría especial (bonificación/exención)",
  ],
  notas: [
    "El trámite continental se paga mediante el modelo 046, concepto 9832.",
    "Además de la licencia autonómica, algunos cotos (Zonas de Pesca Controlada) exigen un permiso o tasa adicional propia del coto.",
    "En la Comunitat Valenciana no se exige seguro de responsabilidad civil del pescador (sí es obligatorio en Andalucía).",
    "Llévala siempre contigo junto al DNI: los agentes medioambientales pueden solicitarla en cualquier momento.",
    "Las tasas e importes pueden actualizarse cada ejercicio — confírmalos en la sede electrónica antes de pagar.",
    "Puedes anotar en la app la caducidad de tus licencias: se guarda solo en este dispositivo.",
    "Embarcación: el semáforo de orilla no autoriza a zarpar; usa modalidad Barco y el índice Salgo en barco.",
  ],
};
