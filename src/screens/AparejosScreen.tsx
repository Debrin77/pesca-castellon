import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from "react-native";
import { useScrollToTop } from "@react-navigation/native";
import { irAConsejos } from "../navigation/irATab";
import aparejosOrilla from "../data/aparejosOrilla.json";
import aparejosEmbarcacion from "../data/aparejosEmbarcacion.json";
import { LinearGradient } from "expo-linear-gradient";
import { useProvincia } from "../context/ProvinciaContext";
import { getProvinciaActiva } from "../provincias/runtime";
import {
  especiesOrillaParaSeleccion,
  especiesEmbarcacionUsuales,
  idsOrillaConocidos,
  resolverEspecie,
} from "../services/catalogoEspeciesService";
import { COLORS, GRADIENTS, RADIUS, SHADOW } from "../theme";
import ListaAnimada from "../components/ListaAnimada";
import MejorHoraPesca from "../components/MejorHoraPesca";
import GraficoEspecie from "../components/GraficoEspecie";
import { FilaAparejo } from "../components/IconoAparejo";
import { tallaDestacada } from "../components/TarjetaEspecie";
import DiagramaMedicion from "../components/DiagramaMedicion";
import { fotoEspecie } from "../data/especiesMedia";
import { criterioMedicionDe } from "../data/criterioMedicion";
import { consejoIdMontajeEspecie, montajesParaEspecie } from "../data/montajesEspecie";
import { recomendacionAparejo } from "../data/recomendacionesAparejo";
import TablaRecomendacionAparejo from "../components/TablaRecomendacionAparejo";
import TerminoAyuda from "../components/TerminoAyuda";
import { terminosEnTexto } from "../data/glosario";

interface Props {
  route?: { params?: { especieId?: string } };
  navigation?: any;
}

type Equipo = {
  cana: string;
  carrete: string;
  linea: string;
  senuelosCebos: string[];
  tecnica: string;
};

export default function AparejosScreen({ route, navigation }: Props) {
  const { provincia: provinciaCtx } = useProvincia();
  const provincia = provinciaCtx ?? getProvinciaActiva();
  const soloContinental = provincia.continentalOnly;
  const optsMontaje = useMemo(
    () => ({ provinciaId: provincia.id, soloContinental }),
    [provincia.id, soloContinental]
  );
  const speciesCatalog = provincia.species as any[];
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);
  const costaLista = useMemo(() => especiesOrillaParaSeleccion(), []);
  const barcoLista = useMemo(() => especiesEmbarcacionUsuales(), []);
  const costaIds = useMemo(() => idsOrillaConocidos(), []);
  const [ambito, setAmbito] = useState<"rio" | "costa" | "barco">("rio");
  const [seleccionada, setSeleccionada] = useState<string | null>(speciesCatalog[0]?.id ?? null);

  useEffect(() => {
    setAmbito("rio");
    setSeleccionada(speciesCatalog[0]?.id ?? null);
  }, [provincia.id]);

  useEffect(() => {
    if (soloContinental && (ambito === "costa" || ambito === "barco")) {
      setAmbito("rio");
      setSeleccionada(speciesCatalog[0]?.id ?? null);
    }
  }, [soloContinental, ambito, speciesCatalog]);

  useLayoutEffect(() => {
    const titulo =
      ambito === "barco" ? "Aparejos · Embarcación" : ambito === "costa" ? "Aparejos · Costa" : "Aparejos";
    navigation?.setOptions({
      title: titulo,
      headerStyle: {
        backgroundColor: ambito === "rio" ? COLORS.primaryDark : COLORS.waterDark,
      },
    });
  }, [ambito, navigation]);

  useEffect(() => {
    const id = route?.params?.especieId;
    const forzarBarco = !!(route?.params as { ambitoEmbarcacion?: boolean } | undefined)?.ambitoEmbarcacion;
    if (!id && !forzarBarco) return;
    if (forzarBarco && !soloContinental) {
      setAmbito("barco");
      setSeleccionada(id || barcoLista[0]?.id || null);
      return;
    }
    if (!id) return;
    if (!soloContinental && costaIds.has(id)) {
      setAmbito("costa");
      setSeleccionada(id);
    } else {
      setAmbito("rio");
      setSeleccionada(id);
    }
  }, [route?.params?.especieId, (route?.params as any)?.ambitoEmbarcacion, costaIds, soloContinental, barcoLista]);

  const listaBase =
    ambito === "barco" && !soloContinental
      ? barcoLista
      : ambito === "costa" && !soloContinental
        ? costaLista
        : speciesCatalog;
  const lista = useMemo(() => {
    if ((ambito !== "costa" && ambito !== "barco") || !seleccionada) return listaBase;
    if (listaBase.some((s: any) => s.id === seleccionada)) return listaBase;
    const extra = resolverEspecie(seleccionada, []);
    return extra ? [...listaBase, extra] : listaBase;
  }, [ambito, listaBase, seleccionada]);
  const sp: any = lista.find((s: any) => s.id === seleccionada) ?? lista[0];
  const foto = fotoEspecie(sp?.id);
  const equipo: Equipo | undefined =
    ambito === "barco"
      ? (aparejosEmbarcacion.porId as Record<string, Equipo>)[sp?.id]
      : ambito === "costa"
        ? (aparejosOrilla.porId as Record<string, Equipo>)[sp?.id]
        : sp?.equipo;
  const talla = sp ? tallaDestacada(sp) : null;
  const medicion = sp ? criterioMedicionDe(sp) : null;
  const mar = (ambito === "costa" || ambito === "barco") && !soloContinental;
  const guiaCompra = sp
    ? recomendacionAparejo(
        sp.id,
        ambito === "barco" ? "embarcacion" : ambito === "costa" ? "costa" : "rio"
      )
    : undefined;
  const terminosFicha = useMemo(() => {
    if (!sp) return [];
    return terminosEnTexto(
      equipo?.tecnica,
      ...(equipo?.senuelosCebos ?? []),
      ...(sp.senuelosClave ?? []),
      guiaCompra?.resumenCompra,
      ...(guiaCompra?.compraRapida ?? [])
    )
      .filter((t) => !!t.diagramaId)
      .slice(0, 8);
  }, [sp, equipo, guiaCompra]);

  return (
    <View style={styles.container}>
      {!soloContinental ? (
        <View style={styles.modoBar}>
          <TouchableOpacity
            style={[styles.modoBtn, ambito === "rio" && styles.modoBtnOnBosque]}
            onPress={() => {
              setAmbito("rio");
              setSeleccionada(speciesCatalog[0]?.id ?? null);
            }}
          >
            <Text style={[styles.modoTxt, ambito === "rio" && styles.modoTxtOn]}>Ríos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modoBtn, ambito === "costa" && styles.modoBtnOnMar]}
            onPress={() => {
              setAmbito("costa");
              setSeleccionada(costaLista[0]?.id ?? null);
            }}
          >
            <Text style={[styles.modoTxt, ambito === "costa" && styles.modoTxtOn]}>Orilla</Text>
          </TouchableOpacity>
          {provincia.id === "castellon" ? (
            <TouchableOpacity
              style={[styles.modoBtn, ambito === "barco" && styles.modoBtnOnMar]}
              onPress={() => {
                setAmbito("barco");
                setSeleccionada(barcoLista[0]?.id ?? null);
              }}
            >
              <Text style={[styles.modoTxt, ambito === "barco" && styles.modoTxtOn]}>Barco</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipBar}
        contentContainerStyle={{ paddingHorizontal: 12 }}
      >
        {lista.map((s: any) => (
          <TouchableOpacity
            key={s.id}
            style={[styles.chip, seleccionada === s.id && (mar ? styles.chipActiveMar : styles.chipActiveBosque)]}
            onPress={() => setSeleccionada(s.id)}
            accessibilityRole="button"
            accessibilityLabel={`Equipo para ${s.nombre}`}
          >
            <GraficoEspecie id={s.id} nombre={s.nombre} size={28} />
            <Text style={[styles.chipText, seleccionada === s.id && styles.chipTextActive]} numberOfLines={1}>
              {s.nombre}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView ref={scrollRef} style={styles.content} contentContainerStyle={{ padding: 16, paddingBottom: 110 }}>
        <Text style={styles.ambitoHint}>
          Equipo recomendado por especie, con guía de compra (anzuelo, arponcillo, cebador, plomo). El sitio de
          pesca ya lo elegiste en Inicio o Mapa.
        </Text>
        {sp ? (
          <ListaAnimada key={`${ambito}-${sp.id}`} replayKey={`${ambito}-${sp.id}`} index={0}>
            <LinearGradient
              colors={
                sp.invasora || sp.id === "cangrejo_azul"
                  ? GRADIENTS.sunset
                  : ambito === "costa" || ambito === "barco"
                    ? GRADIENTS.water
                    : GRADIENTS.primary
              }
              style={styles.headerCard}
            >
              <Text style={styles.headerKicker}>
                {ambito === "barco"
                  ? "Embarcación / kayak · Castellón"
                  : ambito === "costa"
                    ? "Desde tierra · Mediterráneo"
                    : `Continental · ${provincia.nombre}`}
              </Text>
              <View style={styles.headerHero}>
                {foto ? (
                  <Image source={foto} style={styles.headerFoto} accessibilityLabel={`Foto de ${sp.nombre}`} />
                ) : (
                  <GraficoEspecie id={sp.id} nombre={sp.nombre} size={96} />
                )}
                {talla ? (
                  <View style={{ flex: 1 }}>
                    <Text style={styles.headerTallaKicker}>
                      {talla.unidad === "kg" ? "Peso mínimo" : talla.unidad ? "Talla mínima" : "Régimen"}
                    </Text>
                    <Text style={styles.headerTalla}>
                      {talla.valor}
                      {talla.unidad ? <Text style={styles.headerTallaUnidad}> {talla.unidad}</Text> : null}
                    </Text>
                    <Text style={styles.headerTallaPie}>{talla.pie}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.headerName}>{sp.nombre}</Text>
              <Text style={styles.headerScientific}>{sp.nombreCientifico}</Text>
              {(sp.invasora || sp.id === "cangrejo_azul") && (
                <Text style={styles.headerBadge}>ESPECIE INVASORA · NO DEVOLVER</Text>
              )}
            </LinearGradient>

            {medicion ? (
              <DiagramaMedicion
                compact
                criterio={medicion}
                valorMinimo={talla && talla.unidad === medicion.unidad ? talla.valor : null}
              />
            ) : null}

            {talla ? <Text style={styles.stat}>{talla.pie}</Text> : null}
            {ambito === "rio" && sp.cupo ? <Text style={styles.stat}>Cupo: {sp.cupo}</Text> : null}

            {sp.normativaResumen ? <Text style={styles.notes}>{sp.normativaResumen}</Text> : null}
            <Text style={styles.notes}>{sp.notas}</Text>
            {sp.noConfundirCon ? (
              <Text style={styles.notes}>No lo confundas con: {sp.noConfundirCon}</Text>
            ) : null}

            <MejorHoraPesca
              especie={sp}
              ambito={
                ambito === "barco" ? "embarcacion" : ambito === "costa" ? "maritimo" : "continental"
              }
            />

            {ambito === "rio" && (sp.habitats || sp.senuelosClave?.length) ? (
              <View style={[styles.gearCard, { marginTop: 12 }]}>
                {sp.habitats ? (
                  <FilaAparejo tipo="habitat" titulo={`Dónde en ${provincia.nombre}`}>
                    <Text style={styles.gearRowValue}>{sp.habitats}</Text>
                  </FilaAparejo>
                ) : null}
                {sp.senuelosClave?.length > 0 && (
                  <FilaAparejo tipo="senuelo" titulo="Señuelos que más funcionan">
                    {sp.senuelosClave.map((s: string, i: number) => (
                      <Text key={i} style={styles.gearBullet}>
                        • {s}
                      </Text>
                    ))}
                  </FilaAparejo>
                )}
              </View>
            ) : null}

            {sp.normativaEspecial && (
              <View style={styles.avisoLegalBox}>
                <Text style={styles.avisoLegalText}>{sp.normativaEspecial}</Text>
              </View>
            )}

            {equipo ? (
              <View style={styles.gearCard}>
                <Text style={styles.gearTitle}>
                  {ambito === "barco" ? "Equipo de embarcación" : ambito === "costa" ? "Equipo de orilla" : "Equipo recomendado"}
                </Text>
                {ambito === "costa" ? <Text style={styles.gearAviso}>{aparejosOrilla.aviso}</Text> : null}
                {ambito === "barco" ? <Text style={styles.gearAviso}>{aparejosEmbarcacion.aviso}</Text> : null}
                <FilaAparejo tipo="cana" titulo="Caña">
                  <Text style={styles.gearRowValue}>{equipo.cana}</Text>
                </FilaAparejo>
                <FilaAparejo tipo="carrete" titulo="Carrete">
                  <Text style={styles.gearRowValue}>{equipo.carrete}</Text>
                </FilaAparejo>
                <FilaAparejo tipo="linea" titulo="Línea">
                  <Text style={styles.gearRowValue}>{equipo.linea}</Text>
                </FilaAparejo>
                {equipo.senuelosCebos?.length > 0 && (
                  <FilaAparejo tipo="senuelo" titulo="Señuelos / cebos">
                    {equipo.senuelosCebos.map((s: string, i: number) => (
                      <Text key={i} style={styles.gearBullet}>
                        • {s}
                      </Text>
                    ))}
                  </FilaAparejo>
                )}
                <FilaAparejo tipo="tecnica" titulo="Técnica">
                  <Text style={styles.gearRowValue}>{equipo.tecnica}</Text>
                </FilaAparejo>
              </View>
            ) : (
              <Text style={styles.emptyText}>No hay recomendaciones de equipo para esta especie.</Text>
            )}

            {terminosFicha.length > 0 ? (
              <View style={styles.vocabBox}>
                <Text style={styles.vocabTitle}>¿Qué significa…?</Text>
                <Text style={styles.vocabSub}>Toca un término para ver foto y definición</Text>
                <View style={styles.vocabChips}>
                  {terminosFicha.map((t) => (
                    <View key={t.id} style={styles.vocabChip}>
                      <TerminoAyuda id={t.id} />
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {guiaCompra ? (
              <TablaRecomendacionAparejo
                rec={guiaCompra}
                provinciaId={provincia.id}
                ambitoLegal={
                  ambito === "barco" ? "embarcacion" : ambito === "costa" ? "costa" : "rio"
                }
              />
            ) : null}

            {montajesParaEspecie(sp.id, optsMontaje).length > 0 ? (
              <TouchableOpacity
                style={styles.montajeCta}
                onPress={() =>
                  irAConsejos(navigation, {
                    consejoId: consejoIdMontajeEspecie(sp.id, optsMontaje),
                    categoria: "montajes",
                  })
                }
                accessibilityRole="button"
                accessibilityLabel={`Ver montaje de línea para ${sp.nombre}`}
              >
                <Text style={styles.montajeCtaTitle}>Cómo montar la línea</Text>
                <Text style={styles.montajeCtaSub}>
                  Esquema visual: orden de boya, plomo y anzuelo · {montajesParaEspecie(sp.id, optsMontaje)[0].titulo}
                </Text>
              </TouchableOpacity>
            ) : null}
          </ListaAnimada>
        ) : (
          <Text style={styles.emptyText}>Elige una especie arriba.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  modoBar: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 6,
    backgroundColor: COLORS.surface,
  },
  modoBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },
  modoBtnOnBosque: { backgroundColor: COLORS.primaryDark, borderColor: COLORS.primaryDark },
  modoBtnOnMar: { backgroundColor: COLORS.waterDark, borderColor: COLORS.waterDark },
  modoTxt: { fontSize: 14, fontWeight: "700", color: COLORS.textSecondary },
  modoTxtOn: { color: "#fff" },
  chipBar: { maxHeight: 64, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.mist,
    marginRight: 8,
    marginVertical: 10,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    maxWidth: 180,
  },
  chipActiveBosque: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  chipActiveMar: { backgroundColor: COLORS.waterLight, borderColor: COLORS.water },
  chipText: { fontSize: 13, color: COLORS.primaryDark, fontWeight: "700", flexShrink: 1 },
  chipTextActive: { color: COLORS.primaryDark, fontWeight: "800" },
  content: { flex: 1 },
  ambitoHint: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
    fontWeight: "600",
  },
  headerCard: {
    borderRadius: RADIUS.xl,
    padding: 22,
    alignItems: "center",
    marginBottom: 14,
    ...SHADOW,
  },
  headerKicker: {
    fontSize: 11,
    color: "rgba(255,255,255,0.95)",
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  headerHero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 12,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: RADIUS.lg,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  headerFoto: {
    width: 96,
    height: 96,
    borderRadius: RADIUS.md,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  headerTallaKicker: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(255,255,255,0.95)",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  headerTalla: { fontSize: 40, fontWeight: "800", color: "#fff", letterSpacing: -1, lineHeight: 44 },
  headerTallaUnidad: { fontSize: 18, fontWeight: "700", color: "rgba(255,255,255,0.95)" },
  headerTallaPie: { fontSize: 11, color: "rgba(255,255,255,0.92)", marginTop: 2, maxWidth: 180 },
  headerName: { fontSize: 24, fontWeight: "800", color: "#fff", marginTop: 8, letterSpacing: -0.4 },
  headerScientific: { fontSize: 13, color: "rgba(255,255,255,0.95)", fontStyle: "italic", marginTop: 4 },
  headerBadge: { fontSize: 11, color: "#fff", fontWeight: "800", marginTop: 10, letterSpacing: 0.6 },
  notes: { fontSize: 15, color: COLORS.textSecondary, marginBottom: 10, lineHeight: 22 },
  stat: { fontSize: 14, fontWeight: "700", color: COLORS.waterDark, marginBottom: 8, lineHeight: 20 },
  avisoLegalBox: {
    marginBottom: 12,
    backgroundColor: COLORS.dangerLight,
    borderRadius: RADIUS.sm,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  avisoLegalText: { fontSize: 13, color: "#7a1414", lineHeight: 19, fontWeight: "600" },
  gearCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 8,
    ...SHADOW,
  },
  gearTitle: { fontSize: 16, fontWeight: "800", color: COLORS.primaryDark, marginBottom: 6 },
  gearAviso: { fontSize: 12, color: COLORS.textMuted, lineHeight: 18, marginBottom: 8 },
  gearRowLabel: { fontSize: 12, fontWeight: "800", color: COLORS.water, marginTop: 14, letterSpacing: 0.4, textTransform: "uppercase" },
  gearRowValue: { fontSize: 15, color: COLORS.textPrimary, marginTop: 2, lineHeight: 22 },
  gearBullet: { fontSize: 15, color: COLORS.textPrimary, marginTop: 4, marginLeft: 4, lineHeight: 22 },
  emptyText: { fontSize: 14, color: COLORS.textMuted, textAlign: "center", marginTop: 20, lineHeight: 20 },
  montajeCta: {
    marginTop: 14,
    backgroundColor: COLORS.waterLight,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.water,
  },
  montajeCtaTitle: { fontSize: 16, fontWeight: "800", color: COLORS.waterDark },
  montajeCtaSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, lineHeight: 18 },
  vocabBox: {
    marginTop: 12,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  vocabTitle: { fontSize: 15, fontWeight: "800", color: COLORS.primaryDark },
  vocabSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2, marginBottom: 8 },
  vocabChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  vocabChip: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});
