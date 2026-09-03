import tramos from "../../data/tramosOficiales.json";
import zones from "../../data/zones.json";
import species from "../../data/species.json";
import { CHECKLIST_ANTES_DE_PESCAR, FUENTE_NORMATIVA } from "../../data/normativa2026";
import type { ProvinciaConfig } from "../types";

export const castellonConfig: ProvinciaConfig = {
  id: "castellon",
  nombre: "Castellón",
  nombreApp: "Pesca Castellón",
  continentalOnly: false,
  regionMapa: {
    latitude: 40.05,
    longitude: -0.02,
    latitudeDelta: 1.25,
    longitudeDelta: 1.25,
  },
  regionCosta: { latitude: 40.05, longitude: 0.12, zoom: 10 },
  cuencas: ["Mijares", "Palancia", "Sénia", "Otras"],
  tramos: tramos as ProvinciaConfig["tramos"],
  zones: zones as any[],
  species: species as any[],
  tieneIcv: true,
  tieneSaih: true,
  embalsesPanel: [
    { nombre: "EMBALSE DE ARENÓS", etiqueta: "Arenós", zoneId: "embalse_arenos" },
    { nombre: "EMBALSE DE SICHAR", etiqueta: "Sichar", zoneId: "embalse_sichar" },
    { nombre: "EMBALSE DE Mª CRISTINA", etiqueta: "Mª Cristina", zoneId: "embalse_maria_cristina" },
    { nombre: "EMBALSE DE ULLDECONA", etiqueta: "Ulldecona", zoneId: "embalse_ulldecona" },
  ],
  fuenteNormativa: FUENTE_NORMATIVA,
  checklistAntesDePescar: CHECKLIST_ANTES_DE_PESCAR,
  etiquetaLicenciaContinental: "Licencia de pesca continental GVA.",
  requisitosLicencia: {
    resumen:
      "En Castellón hacen falta licencias distintas según el agua: continental (ríos, embalses y cotos) y, en la orilla del mar, la de pesca marítima recreativa desde tierra (GVA). No se sustituyen entre sí. En cotos (ZPC) puede exigirse además el permiso del coto.",
    seguroObligatorio: false,
    seguroNota:
      "En la Comunitat Valenciana no se exige seguro de responsabilidad civil para tramitar ni ejercer la licencia de pesca.",
    requisitos: [
      "Licencia continental GVA en ríos y embalses.",
      "Licencia marítima recreativa desde tierra (GVA) si pescas en la orilla del mar.",
      "En ZPC: además, permiso del coto / PTOP del día.",
      "No hace falta seguro de RC de pescador (a diferencia de Andalucía).",
    ],
  },
  notaConsultaAprox:
    "Este punto no cae en un polígono ICV (coto o reserva) ni en el radio de un tramo del anexo I. Puede ser secano, mar o un cauce menor no listado.",
  oleaje: { lat: 39.98, lng: 0.02, etiqueta: "Oleaje frente al Grao" },
};
