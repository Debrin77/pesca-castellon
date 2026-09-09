export const LICENCIA_INFO = {
  obligatoria: true,
  resumen:
    "En Castellón hacen falta licencias distintas según el agua: continental (ríos, embalses y cotos) y, en el mar, la modalidad marítima que corresponda (desde tierra, embarcación, submarina o esparavel). No se sustituyen entre sí. En cotos (Zonas de Pesca Controlada) puede exigirse además el permiso del coto.",
  tramiteOnline: "https://sede.gva.es/es/detall-tramit?id_proc=681",
  /** Trámite unificado marítimo GVA (tierra, embarcación, submarina, esparavel). */
  tramiteMaritima: "https://sede.gva.es/es/detall-tramit?id_proc=647",
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
      donde: "Orilla del mar · playa, roca o espigón autorizado",
      detalle:
        "Nombre oficial en sede GVA. Decreto 41/2013: no puertos, no a menos de 100 m de bañistas, no vender capturas. También es la que se usa en la práctica para kayak / artefacto flotante (no lista 6.ª/7.ª).",
    },
    {
      id: "maritima_embarcacion" as const,
      titulo: "Pesca marítima recreativa desde embarcación (GVA)",
      donde: "Barco de lista 6.ª o 7.ª (recreo / ocio)",
      detalle:
        "La solicita el titular de la embarcación. Ampara a todas las personas que pesquen desde ese barco (invitados incluidos). Tu licencia de costa/tierra no vale sola para subir a pescar. Decreto 41/2013 art. 7 y RD 347/2011 art. 9.",
    },
    {
      id: "maritima_esparavel" as const,
      titulo: "Pesca con rall o esparavel (GVA)",
      donde: "A pie desde la costa, con red circular de caída",
      detalle:
        "Modalidad tradicional: red circular con plomos que se lanza a mano desde la orilla. Licencia específica (2 años). Exige ≥16 años, empadronamiento en la CV y pertenencia a asociación de recuperación del rall (o certificado de cofradía si eres profesional/jubilado). Veda en diciembre–febrero. Decreto 63/2011.",
    },
  ],
  faqMaritima: [
    {
      pregunta: "¿Puedo ir de invitado en un barco con mi licencia de costa?",
      respuesta:
        "No. La licencia desde tierra no cubre la pesca desde embarcación. Quien debe tener la licencia de embarcación es el titular del barco; esa licencia ampara a todos los que pesquen a bordo. Antes de salir, pregunta al dueño o patrón que esté en vigor.",
    },
    {
      pregunta: "¿Se puede pescar desde kayak en la Comunitat Valenciana?",
      respuesta:
        "Sí, es habitual. En el Decreto 41/2013 la licencia «desde embarcación» solo aplica a naves inscritas en las listas 6.ª o 7.ª del Registro de Matrícula de Buques. El kayak se trata en la práctica como artefacto flotante: hace falta la licencia marítima recreativa desde tierra (personal), no la del barco. Respeta límites de navegación (Capitanía), zonas de baño y puertos. Confirma siempre en sede GVA.",
    },
    {
      pregunta: "¿Qué es el esparavel (rall)?",
      respuesta:
        "Una red circular de hasta unos 6 m de diámetro, con plomos en el borde y un cabo central, que se lanza a mano desde la orilla para cercar peces. No es caña: es un arte tradicional con licencia propia y requisitos (asociación, empadronamiento, edad). No la confundas con la licencia ordinaria de orilla.",
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
    "Si eres dueño del barco, tramita la licencia de embarcación en el procedimiento marítimo GVA (proc. 647). Si vas de invitado, comprueba que el barco la tiene.",
  ],
};
