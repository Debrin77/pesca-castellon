import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking } from "react-native";
import { ConsultaPesca } from "../services/consultaPescaService";
import { fuentePoligonosOficiales } from "../services/geojsonHit";
import { getProvinciaActiva } from "../provincias/runtime";
import { sitiosDeTramo } from "../services/sitiosComunidad";
import { avisoSitiosCosta } from "../services/consultaCostaService";
import { infoPermisoCoto } from "../data/permisosCoto";
import { debeMostrarPescaRec } from "../services/pescaRecService";
import { guardarPermisoDia, tienePermisoHoy } from "../services/cupoService";
import { consejoIdMontajeEspecie } from "../data/montajesEspecie";
import SitiosOrientativos from "./SitiosOrientativos";
import ListaAnimada from "./ListaAnimada";
import SemaforoVeredicto, { etiquetaHoy } from "./SemaforoVeredicto";
import PescaRecBanner from "./PescaRecBanner";
import { certezaDeConsulta } from "../data/certezaConsulta";
import { COLORS, RADIUS } from "../theme";
import { colorSemaforo } from "../services/consultaPescaService";

interface Props {
  consulta: ConsultaPesca;
  onFicha?: () => void;
  /** Lista de especies del punto ya elegido (no vuelve a pedir el mapa). */
  onEspecies?: () => void;
  /** Equipo recomendado de la especie destacada del tramo. */
  onAparejos?: (especieId: string) => void;
  /** Esquema visual de línea para la especie destacada (si hay montaje). */
  onMontaje?: (especieId: string) => void;
  /** Resumen corto: semáforo + título; el resto tras «Ver detalle». */
  compacto?: boolean;
  /**
   * En Inicio el hero ya muestra HOY SÍ/NO: el compacto solo aporta
   * certeza (OFICIAL/ORIENTATIVO) + ficha, sin repetir el veredicto.
   */
  ocultarVeredictoCompacto?: boolean;
  /** Control externo del expandido (Inicio: gesto del hero). */
  expandido?: boolean;
  onToggleDetalle?: () => void;
}

export default function ConsultaPescaCard({
  consulta,
  onFicha,
  onEspecies,
  onAparejos,
  onMontaje,
  compacto = false,
  ocultarVeredictoCompacto = false,
  expandido,
  onToggleDetalle,
}: Props) {
  const provincia = getProvinciaActiva();
  const especieDestacada =
    consulta.ambito === "maritimo" ? consulta.especiesIds?.[0] : consulta.tramo?.especies?.[0];
  const montajeDisponible = especieDestacada ? !!consejoIdMontajeEspecie(especieDestacada) : false;
  const mar = consulta.ambito === "maritimo";
  const acento = mar ? COLORS.water : COLORS.primary;
  const certeza = certezaDeConsulta(consulta, { provinciaId: provincia.id });
  const noOficial = certeza.nivel !== "oficial";
  const fuente = consulta.fuenteNormativaDetalle;
  const permisoInfo =
    consulta.veredicto === "coto"
      ? infoPermisoCoto(provincia.id, consulta.tramo?.matriculaCoto, consulta.tramo?.nombre)
      : null;
  const [permisoHoy, setPermisoHoy] = useState(false);
  const [internoExpandido, setInternoExpandido] = useState(false);
  const mostrarTodo = !compacto || (expandido ?? internoExpandido);

  function toggleDetalle() {
    if (onToggleDetalle) onToggleDetalle();
    else setInternoExpandido((v) => !v);
  }

  useEffect(() => {
    const mat = consulta.tramo?.matriculaCoto;
    if (!mat) {
      setPermisoHoy(false);
      return;
    }
    void tienePermisoHoy(mat).then(setPermisoHoy);
  }, [consulta.tramo?.matriculaCoto, consulta.titulo]);

  return (
    <ListaAnimada replayKey={`${consulta.veredicto}-${consulta.titulo}`} index={0}>
      <View style={styles.card}>
        {compacto && !mostrarTodo ? (
          <>
            <View style={[styles.compactoRow, { borderLeftColor: colorSemaforo(consulta) }]}>
              <View style={{ flex: 1 }}>
                <View
                  style={[
                    styles.certezaChip,
                    noOficial ? styles.certezaChipAprox : styles.certezaChipOficial,
                  ]}
                  accessibilityLabel={certeza.a11y}
                >
                  <Text style={styles.certezaChipTxt}>
                    {certeza.sello} · {certeza.etiqueta}
                  </Text>
                </View>
                {!ocultarVeredictoCompacto ? (
                  <Text style={[styles.compactoHoy, { color: colorSemaforo(consulta) }]}>
                    {etiquetaHoy(consulta).texto}
                  </Text>
                ) : null}
                <Text style={styles.title} numberOfLines={2}>
                  {consulta.titulo}
                </Text>
                {consulta.tramo ? (
                  <Text style={styles.meta} numberOfLines={1}>
                    Tramo {consulta.tramo.codigo} · {consulta.tramo.rio}
                  </Text>
                ) : (
                  <Text style={styles.meta} numberOfLines={1}>
                    {ocultarVeredictoCompacto ? certeza.aviso : etiquetaHoy(consulta).sub}
                  </Text>
                )}
                {noOficial && !ocultarVeredictoCompacto ? (
                  <Text style={styles.certezaAviso} numberOfLines={2}>
                    {certeza.aviso}
                  </Text>
                ) : null}
              </View>
            </View>
            <TouchableOpacity
              onPress={toggleDetalle}
              style={styles.btnDetalle}
              accessibilityRole="button"
              accessibilityLabel="Ver detalle del tramo"
            >
              <Text style={[styles.btnDetalleTxt, { color: acento }]}>Ver detalle ›</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <SemaforoVeredicto consulta={consulta} />
            {/* La certeza (OFICIAL / ORIENTATIVO) va en el propio semáforo; no repetir pill débil. */}
            <Text style={styles.title}>{consulta.titulo}</Text>
            {consulta.tramo && (
              <Text style={styles.meta}>
                Tramo {consulta.tramo.codigo} · {consulta.tramo.rio} · {consulta.tramo.vocacion}
              </Text>
            )}
          </>
        )}

        {mostrarTodo ? (
          <>
            {consulta.permisos.map((p, i) => (
              <Text key={`p-${i}`} style={styles.ok}>
                {p}
              </Text>
            ))}
            {consulta.restriccionesHoy.map((p, i) => (
              <Text key={`r-${i}`} style={styles.warn}>
                {p}
              </Text>
            ))}

            {permisoInfo ? (
              <View style={styles.permisoBox}>
                <Text style={styles.permisoTitle}>Permiso de coto</Text>
                <Text style={styles.ok}>{permisoInfo.comoObtener}</Text>
                <Text style={styles.fuente}>{permisoInfo.avisoPtop}</Text>
                {permisoInfo.urlTramite ? (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(permisoInfo.urlTramite!)}
                    accessibilityRole="link"
                    accessibilityLabel="Abrir trámite de permiso"
                  >
                    <Text style={[styles.link, { color: acento }]}>Abrir trámite / sede</Text>
                  </TouchableOpacity>
                ) : null}
                {consulta.tramo?.matriculaCoto ? (
                  <TouchableOpacity
                    style={styles.btnGhost}
                    onPress={async () => {
                      const mat = consulta.tramo!.matriculaCoto!;
                      await guardarPermisoDia({
                        matricula: mat,
                        fecha: new Date().toISOString().slice(0, 10),
                        notas: "Marcado en dispositivo (no es el permiso oficial)",
                      });
                      setPermisoHoy(true);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Marcar permiso del día en el móvil"
                  >
                    <Text style={[styles.btnGhostText, { color: acento }]}>
                      {permisoHoy ? "Permiso del día marcado ✓" : "Marcar permiso del día (local)"}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}

            {consulta.especiesHabituales ? (
              <Text style={[styles.especies, { color: acento }]}>
                Especies habituales: {consulta.especiesHabituales}
              </Text>
            ) : consulta.tramo?.especies?.length ? (
              <Text style={[styles.especies, { color: acento }]}>
                Especies habituales: {consulta.tramo.especies.join(" · ")}
              </Text>
            ) : null}

            {mar ? (
              <SitiosOrientativos
                sitios={consulta.sitiosCosta ?? []}
                titulo="Dónde se pesca a caña (uso habitual)"
                aviso={avisoSitiosCosta()}
              />
            ) : consulta.tramo &&
              consulta.veredicto !== "vedado" &&
              consulta.veredicto !== "reserva_trucha" ? (
              <SitiosOrientativos sitios={sitiosDeTramo(consulta.tramo.id)} />
            ) : null}

            {consulta.veredicto === "fuera_catalogo" && !mar ? (
              <View style={styles.coberturaBox}>
                <Text style={styles.coberturaTitle}>Cobertura del mapa</Text>
                <Text style={styles.ok}>{provincia.coberturaCartografica.resumen}</Text>
                {provincia.coberturaCartografica.urlVisor ? (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(provincia.coberturaCartografica.urlVisor!)}
                    accessibilityRole="link"
                    accessibilityLabel="Abrir cartografía oficial"
                  >
                    <Text style={[styles.link, { color: acento }]}>Cartografía oficial ›</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}

            {fuente ? (
              <View style={styles.fuenteBox}>
                <Text style={styles.fuenteKicker}>NORMATIVA · CONSULTA {fuente.consultadoEn}</Text>
                <Text style={styles.fuente}>{fuente.titulo}</Text>
                <Text style={styles.fuente}>{fuente.vigenciaNota}</Text>
                {fuente.urlOrden ? (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(fuente.urlOrden!)}
                    accessibilityRole="link"
                  >
                    <Text style={[styles.link, { color: acento }]}>Ver fuente oficial</Text>
                  </TouchableOpacity>
                ) : null}
                {!mar && provincia.tieneIcv ? (
                  <Text style={styles.fuente}>{fuentePoligonosOficiales()}</Text>
                ) : null}
              </View>
            ) : mar ? (
              <Text style={styles.fuente}>Normativa marítima CV / estatal</Text>
            ) : (
              <>
                <Text style={styles.fuente}>{provincia.fuenteNormativa.titulo}</Text>
                {provincia.tieneIcv ? (
                  <Text style={styles.fuente}>{fuentePoligonosOficiales()}</Text>
                ) : null}
              </>
            )}

            {debeMostrarPescaRec(consulta.ambito) ? <PescaRecBanner compacto /> : null}

            <View style={styles.row}>
              {consulta.tramo?.fichaId && onFicha ? (
                <TouchableOpacity onPress={onFicha} style={[styles.btn, { backgroundColor: acento }]}>
                  <Text style={styles.btnText}>Ficha del agua</Text>
                </TouchableOpacity>
              ) : null}
              {onEspecies ? (
                <TouchableOpacity
                  onPress={onEspecies}
                  style={styles.btnGhost}
                  accessibilityRole="button"
                  accessibilityLabel="Ver especies de este punto"
                >
                  <Text style={[styles.btnGhostText, { color: acento }]}>Especies</Text>
                </TouchableOpacity>
              ) : null}
              {especieDestacada && onAparejos ? (
                <TouchableOpacity
                  onPress={() => onAparejos(especieDestacada)}
                  style={styles.btnGhost}
                  accessibilityRole="button"
                  accessibilityLabel="Ver aparejo de la especie destacada"
                >
                  <Text style={[styles.btnGhostText, { color: acento }]}>Aparejo</Text>
                </TouchableOpacity>
              ) : null}
              {especieDestacada && montajeDisponible && onMontaje ? (
                <TouchableOpacity
                  onPress={() => onMontaje(especieDestacada)}
                  style={styles.btnGhost}
                  accessibilityRole="button"
                  accessibilityLabel="Ver montaje típico de la especie destacada"
                >
                  <Text style={[styles.btnGhostText, { color: acento }]}>Montaje</Text>
                </TouchableOpacity>
              ) : null}
              {compacto ? (
                <TouchableOpacity
                  onPress={toggleDetalle}
                  style={styles.btnGhost}
                  accessibilityRole="button"
                  accessibilityLabel="Ocultar detalle del tramo"
                >
                  <Text style={[styles.btnGhostText, { color: acento }]}>Ocultar</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </>
        ) : null}
      </View>
    </ListaAnimada>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  certezaChip: {
    alignSelf: "flex-start",
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 6,
  },
  certezaChipOficial: { backgroundColor: COLORS.primaryDark },
  certezaChipAprox: { backgroundColor: COLORS.warning },
  certezaChipTxt: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  certezaAviso: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.warning,
    lineHeight: 15,
  },
  title: { fontSize: 15, fontWeight: "800", color: COLORS.textPrimary, lineHeight: 20 },
  meta: { fontSize: 11.5, color: COLORS.textSecondary, marginTop: 4, marginBottom: 8 },
  ok: { fontSize: 12.5, color: COLORS.textSecondary, lineHeight: 18, marginBottom: 4 },
  warn: { fontSize: 12.5, color: COLORS.danger, lineHeight: 18, marginBottom: 4, fontWeight: "600" },
  especies: { fontSize: 12, marginTop: 6, fontWeight: "600" },
  fuenteBox: { marginTop: 10, paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border },
  fuenteKicker: { fontSize: 10, fontWeight: "800", color: COLORS.textMuted, letterSpacing: 0.4, marginBottom: 2 },
  fuente: { fontSize: 10, color: COLORS.textSecondary, marginTop: 4, fontStyle: "italic" },
  link: { fontSize: 12, fontWeight: "700", marginTop: 6 },
  permisoBox: {
    marginTop: 8,
    marginBottom: 4,
    padding: 10,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.warningLight,
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  permisoTitle: { fontSize: 12, fontWeight: "800", color: COLORS.warning, marginBottom: 4 },
  coberturaBox: {
    marginTop: 8,
    marginBottom: 4,
    padding: 10,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.mist,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  coberturaTitle: { fontSize: 12, fontWeight: "800", color: COLORS.textPrimary, marginBottom: 4 },
  row: { flexDirection: "row", gap: 8, marginTop: 12, flexWrap: "wrap" },
  btn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.sm, paddingHorizontal: 12, paddingVertical: 8 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  btnGhost: { borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.sm, paddingHorizontal: 12, paddingVertical: 8, marginTop: 6 },
  btnGhostText: { color: COLORS.primary, fontWeight: "700", fontSize: 12 },
  btnDetalle: { marginTop: 4, paddingVertical: 6 },
  btnDetalleTxt: { fontSize: 13, fontWeight: "800" },
  compactoRow: {
    borderLeftWidth: 4,
    paddingLeft: 10,
    paddingVertical: 2,
  },
  compactoHoy: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
});
