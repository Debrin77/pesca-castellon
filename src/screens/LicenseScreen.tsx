import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { LICENCIA_INFO } from "../data/license";
import {
  CHECKLIST_ANTES_DE_PESCAR,
  FUENTE_NORMATIVA,
  REGLAS_GENERALES,
  TALLAS_OFICIALES,
  textoVigenciaNormativa,
} from "../data/normativa2026";
import {
  CHECKLIST_ANTES_DE_PESCAR_ANDALUCIA,
  REGLAS_GENERALES_ANDALUCIA,
  textoVigenciaNormativaAndalucia,
} from "../provincias/sevilla/normativa";
import {
  CHECKLIST_ANTES_DE_PESCAR_CLM,
  REGLAS_GENERALES_CLM,
  textoVigenciaNormativaClm,
} from "../provincias/cuenca/normativa";
import TemporadaBanner from "../components/TemporadaBanner";
import PescaRecBanner from "../components/PescaRecBanner";
import ApartadoPlegable from "../components/ApartadoPlegable";
import { infoPermisoCoto } from "../data/permisosCoto";
import { documentacionKayakDeProvincia } from "../data/documentacionKayak";
import { useProvincia } from "../context/ProvinciaContext";
import { getProvinciaActiva } from "../provincias/runtime";
import { esProvinciaAndalucia, esProvinciaCastillaLaMancha } from "../provincias/types";
import { COLORS, GRADIENTS, RADIUS, SHADOW, SPACING } from "../theme";
import {
  diasHastaCaducidad,
  eliminarLicencia,
  ETIQUETA_LICENCIA,
  guardarLicencia,
  LicenciaGuardada,
  obtenerLicencias,
  TipoLicencia,
} from "../services/storageService";

const TALLA_LABELS: Record<string, string> = {
  trucha_comun: "Trucha común",
  trucha_arcoiris: "Trucha arcoíris",
  barbo: "Barbo",
  carpa: "Carpa",
  carpin: "Carpín",
  tenca: "Tenca",
  anguila: "Anguila",
  llobarro: "Llobarro / lubina (río)",
  black_bass: "Black bass",
  lucio: "Lucio",
  siluro: "Siluro",
  mugilidos: "Mújoles / llisses",
};

function avisar(titulo: string, mensaje: string) {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.alert(`${titulo}\n\n${mensaje}`);
    return;
  }
  Alert.alert(titulo, mensaje);
}

export default function LicenseScreen() {
  const { provincia: provinciaCtx } = useProvincia();
  const provincia = provinciaCtx ?? getProvinciaActiva();
  const esAndalucia = esProvinciaAndalucia(provincia.id);
  const esClm = esProvinciaCastillaLaMancha(provincia.id);
  const soloContinental = provincia.continentalOnly;
  const checklist = provincia.checklistAntesDePescar.length
    ? provincia.checklistAntesDePescar
    : esAndalucia
      ? CHECKLIST_ANTES_DE_PESCAR_ANDALUCIA
      : esClm
        ? CHECKLIST_ANTES_DE_PESCAR_CLM
        : CHECKLIST_ANTES_DE_PESCAR;
  const reglas = esAndalucia
    ? REGLAS_GENERALES_ANDALUCIA
    : esClm
      ? REGLAS_GENERALES_CLM
      : REGLAS_GENERALES;
  const vigencia = esAndalucia
    ? textoVigenciaNormativaAndalucia()
    : esClm
      ? textoVigenciaNormativaClm()
      : textoVigenciaNormativa();
  const fuente = provincia.fuenteNormativa;
  const docKayak = documentacionKayakDeProvincia(provincia.id);
  const [licencias, setLicencias] = useState<LicenciaGuardada[]>([]);
  const [tipo, setTipo] = useState<TipoLicencia>("continental");
  const [numero, setNumero] = useState("");
  const [caducaEl, setCaducaEl] = useState("");
  const [notas, setNotas] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(() => {
    obtenerLicencias().then(setLicencias);
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  async function onGuardar() {
    setGuardando(true);
    try {
      await guardarLicencia({ tipo, numero, caducaEl, notas });
      setNumero("");
      setCaducaEl("");
      setNotas("");
      cargar();
      avisar(
        "Guardada",
        "La licencia queda solo en este dispositivo. Puedes borrarla cuando quieras."
      );
    } catch (e: any) {
      avisar("Revisa los datos", e?.message ?? "No se pudo guardar.");
    } finally {
      setGuardando(false);
    }
  }

  async function onBorrar(id: string) {
    await eliminarLicencia(id);
    cargar();
  }

  const tituloSeguro = provincia.requisitosLicencia.seguroObligatorio
    ? "Seguro obligatorio (Andalucía)"
    : esClm
      ? "Seguro de pescador (Castilla-La Mancha)"
      : "Seguro de pescador (C. Valenciana)";
  const subSeguro = provincia.requisitosLicencia.seguroObligatorio
    ? "Obligatorio · responsabilidad civil"
    : esClm
      ? "No obligatorio con carácter general en CLM"
      : "No obligatorio en GVA";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 100, paddingTop: 8 }}
    >
      <LinearGradient colors={[...GRADIENTS.primary]} style={styles.headerCard}>
        <Text style={styles.headerIcon}>🎫</Text>
        <Text style={styles.headerTitle}>Licencias y normativa</Text>
        <Text style={styles.headerSubtitle}>
          {soloContinental
            ? provincia.etiquetaLicenciaContinental
            : "Continental y marítima recreativa desde tierra"}
        </Text>
        <Text style={styles.headerHint}>Toca cada apartado para leerlo</Text>
      </LinearGradient>

      <View style={styles.bannerWrap}>
        <TemporadaBanner />
      </View>

      <Text style={styles.resumen}>{provincia.requisitosLicencia.resumen}</Text>
      <Text style={styles.vigencia}>{vigencia}</Text>

      <ApartadoPlegable
        titulo={`Normativa en vigor · ${provincia.nombre}`}
        subCerrado={fuente.titulo}
        subAbierto="Fuente y vigencia oficiales"
      >
        <Text style={styles.cardText}>{fuente.titulo}</Text>
        <Text style={[styles.cardText, { marginTop: 4 }]}>{fuente.vigenciaNota}</Text>
        <Text style={styles.privacy}>
          Consulta en la app: {new Date().toISOString().slice(0, 10)}. El cartel y el boletín oficial
          mandan.
        </Text>
      </ApartadoPlegable>

      <ApartadoPlegable
        titulo={`Cupos (catálogo ${provincia.nombre})`}
        subCerrado="Límites por especie de esta provincia"
        subAbierto="Solo especies locales · el coto puede endurecer"
      >
        <Text style={styles.privacy}>
          Solo especies de esta provincia. El plan técnico / permiso del coto puede endurecer el cupo.
        </Text>
        {(provincia.species as any[]).slice(0, 12).map((sp) => (
          <View key={sp.id} style={styles.tallaRow}>
            <Text style={styles.tallaName}>{sp.nombre}</Text>
            <Text style={styles.tallaVal}>{sp.cupo ?? sp.tallaOficial ?? "—"}</Text>
          </View>
        ))}
      </ApartadoPlegable>

      <ApartadoPlegable
        titulo="Permisos de coto"
        subCerrado="Cómo obtener el permiso del día"
        subAbierto="Trámite y aviso PTOP"
      >
        <Text style={styles.cardText}>{infoPermisoCoto(provincia.id).comoObtener}</Text>
        <Text style={[styles.privacy, { marginTop: 6 }]}>
          {infoPermisoCoto(provincia.id).avisoPtop}
        </Text>
        {esAndalucia ? (
          <Text style={[styles.cardText, { marginTop: 8 }]}>
            En {provincia.nombre} (ciprínidos) no hay cotos tipificados como en Castellón: las aguas
            libres y los refugios (VP) mandan. Si aparece un coto en cartel, pide el permiso al
            titular.
          </Text>
        ) : null}
      </ApartadoPlegable>

      {docKayak ? (
        <ApartadoPlegable
          titulo="Kayak · documentación"
          subCerrado="Qué pedir en embalse y, si aplica, en mar"
          subAbierto="Navegación, pesca y mar"
        >
          <Text style={styles.cardText}>{docKayak.embalse.resumen}</Text>
          <Text style={[styles.cardTitle, { marginTop: 12 }]}>
            Embalse · navegación ({docKayak.embalse.organismoTipico})
          </Text>
          {docKayak.embalse.navegacion.map((d, i) => (
            <Text key={`kn-${i}`} style={styles.bullet}>
              • {d}
            </Text>
          ))}
          <Text style={[styles.cardTitle, { marginTop: 12 }]}>Embalse · pesca desde kayak</Text>
          {docKayak.embalse.pesca.map((d, i) => (
            <Text key={`kp-${i}`} style={styles.bullet}>
              • {d}
            </Text>
          ))}
          {docKayak.mar ? (
            <>
              <Text style={[styles.cardTitle, { marginTop: 12 }]}>Mar · kayak (artefacto flotante)</Text>
              <Text style={[styles.privacy, { marginBottom: 4 }]}>{docKayak.mar.resumen}</Text>
              {docKayak.mar.kayak.map((d, i) => (
                <Text key={`mk-${i}`} style={styles.bullet}>
                  • {d}
                </Text>
              ))}
              <Text style={[styles.cardTitle, { marginTop: 12 }]}>Mar · barco matriculado</Text>
              {docKayak.mar.barcoMatriculado.map((d, i) => (
                <Text key={`mb-${i}`} style={styles.bullet}>
                  • {d}
                </Text>
              ))}
            </>
          ) : (
            <Text style={[styles.privacy, { marginTop: 12 }]}>
              En {provincia.nombre} esta guía es continental: no hay flujo de pesca marítima desde
              kayak/barco en la app.
            </Text>
          )}
          <Text style={[styles.privacy, { marginTop: 10 }]}>
            Detalle por embalse: ficha del vaso → panel «Kayak · embalse». Confirma siempre en la web
            del organismo.
          </Text>
        </ApartadoPlegable>
      ) : null}

      <ApartadoPlegable
        titulo="Cartografía · qué está cubierto"
        subCerrado="Prohibiciones, aguas libres y «SIN TRAMO»"
        subAbierto="Cobertura del mapa de la app"
      >
        <Text style={styles.cardText}>{provincia.coberturaCartografica.resumen}</Text>
        <Text style={[styles.cardTitle, { marginTop: 12 }]}>Prohibiciones declaradas</Text>
        <Text style={styles.cardText}>{provincia.coberturaCartografica.prohibiciones}</Text>
        <Text style={[styles.cardTitle, { marginTop: 12 }]}>Aguas libres / cauces</Text>
        <Text style={styles.cardText}>{provincia.coberturaCartografica.aguasLibres}</Text>
        <Text style={[styles.privacy, { marginTop: 8 }]}>
          «SIN TRAMO» en el semáforo no es veda automática: significa que el punto no está en el
          catálogo geométrico de la app.
        </Text>
        {provincia.coberturaCartografica.urlVisor ? (
          <TouchableOpacity
            onPress={() => Linking.openURL(provincia.coberturaCartografica.urlVisor!)}
            accessibilityRole="link"
            accessibilityLabel="Abrir visor oficial de cartografía de pesca"
          >
            <Text style={styles.link}>Abrir visor / cartografía oficial</Text>
          </TouchableOpacity>
        ) : null}
      </ApartadoPlegable>

      {soloContinental ? (
        <ApartadoPlegable
          titulo="PescaREC"
          subCerrado="No aplica en ríos y embalses"
          subAbierto="App estatal de pesca marítima"
        >
          <Text style={styles.cardText}>
            PescaREC es la app estatal para pesca marítima recreativa. En {provincia.nombre} esta
            guía es continental: no aplica ni se exige en ríos/embalses.
          </Text>
        </ApartadoPlegable>
      ) : (
        <ApartadoPlegable
          titulo="PescaREC (marítima)"
          subCerrado="Declaraciones en costa y mar"
          subAbierto="Banner y enlace a la app estatal"
        >
          <PescaRecBanner />
        </ApartadoPlegable>
      )}

      <ApartadoPlegable
        titulo={tituloSeguro}
        subCerrado={subSeguro}
        subAbierto={`Requisitos en ${provincia.nombre}`}
        style={
          provincia.requisitosLicencia.seguroObligatorio
            ? styles.apartadoSeguroOn
            : styles.apartadoSeguroOff
        }
      >
        <Text style={styles.seguroBadge}>{subSeguro}</Text>
        <Text style={styles.cardText}>{provincia.requisitosLicencia.seguroNota}</Text>
        <Text style={[styles.cardTitle, { marginTop: 12 }]}>
          Requisitos en {provincia.nombre}
        </Text>
        {provincia.requisitosLicencia.requisitos.map((r, i) => (
          <Text key={i} style={styles.bullet}>
            • {r}
          </Text>
        ))}
      </ApartadoPlegable>

      {!soloContinental ? (
        <ApartadoPlegable
          titulo="Ámbitos oficiales (GVA)"
          subCerrado="Continental y marítima desde tierra"
          subAbierto="Dónde aplica cada licencia"
        >
          {LICENCIA_INFO.ambitos.map((a) => (
            <View key={a.id} style={styles.ambitoBlock}>
              <Text style={styles.ambitoTitulo}>{a.titulo}</Text>
              <Text style={styles.ambitoDonde}>{a.donde}</Text>
              <Text style={styles.cardText}>{a.detalle}</Text>
            </View>
          ))}
        </ApartadoPlegable>
      ) : (
        <ApartadoPlegable
          titulo="Ámbito continental"
          subCerrado={provincia.etiquetaLicenciaContinental}
          subAbierto="Licencia de ríos y embalses"
        >
          <Text style={styles.cardText}>{provincia.etiquetaLicenciaContinental}</Text>
          <Text style={[styles.cardText, { marginTop: 6 }]}>{fuente.vigenciaNota}</Text>
        </ApartadoPlegable>
      )}

      <ApartadoPlegable
        titulo="Mis licencias en este móvil"
        subCerrado={
          licencias.length === 0
            ? "Ninguna guardada · opcional para recordar caducidad"
            : `${licencias.length} guardada${licencias.length === 1 ? "" : "s"} · solo en este dispositivo`
        }
        subAbierto="Datos locales · no sustituyen la licencia oficial"
        inicialAbierto
      >
        <Text style={styles.privacy}>
          Datos opcionales, solo locales (no se envían a ningún servidor). Sirven para recordar la
          caducidad. No sustituyen llevar la licencia oficial encima.
        </Text>

        {licencias.length === 0 ? (
          <Text style={styles.empty}>Aún no hay ninguna guardada.</Text>
        ) : (
          licencias.map((l) => {
            const dias = diasHastaCaducidad(l.caducaEl);
            const estado =
              dias < 0 ? "Caducada" : dias <= 30 ? `Caduca en ${dias} días` : "En vigor";
            const color =
              dias < 0 ? COLORS.danger : dias <= 30 ? COLORS.warning : COLORS.success;
            return (
              <View key={l.id} style={styles.licRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.licTipo}>{ETIQUETA_LICENCIA[l.tipo]}</Text>
                  <Text style={styles.licMeta}>
                    Caduca {l.caducaEl}
                    {l.numero ? ` · nº ${l.numero}` : ""}
                  </Text>
                  <Text style={[styles.licEstado, { color }]}>{estado}</Text>
                </View>
                <TouchableOpacity onPress={() => onBorrar(l.id)} style={styles.borrarBtn}>
                  <Text style={styles.borrarTxt}>Borrar</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}

        <Text style={styles.formLabel}>Tipo</Text>
        <View style={styles.tipoRow}>
          {(soloContinental
            ? (["continental"] as TipoLicencia[])
            : (["continental", "maritima_tierra"] as TipoLicencia[])
          ).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tipoChip, tipo === t && styles.tipoChipOn]}
              onPress={() => setTipo(t)}
            >
              <Text style={[styles.tipoChipTxt, tipo === t && styles.tipoChipTxtOn]}>
                {t === "continental" ? "Continental" : "Marítima tierra"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.formLabel}>Caducidad (AAAA-MM-DD)</Text>
        <TextInput
          style={styles.input}
          value={caducaEl}
          onChangeText={setCaducaEl}
          placeholder="2026-12-31"
          placeholderTextColor={COLORS.textMuted}
          autoCapitalize="none"
        />
        <Text style={styles.formLabel}>Número / referencia (opcional)</Text>
        <TextInput
          style={styles.input}
          value={numero}
          onChangeText={setNumero}
          placeholder="Solo si quieres anotarlo"
          placeholderTextColor={COLORS.textMuted}
          autoCapitalize="none"
        />
        <Text style={styles.formLabel}>Notas (opcional)</Text>
        <TextInput
          style={[styles.input, { minHeight: 44 }]}
          value={notas}
          onChangeText={setNotas}
          placeholder={
            provincia.requisitosLicencia.seguroObligatorio
              ? "p. ej. nº póliza seguro RC / aseguradora"
              : "p. ej. renovar en sede"
          }
          placeholderTextColor={COLORS.textMuted}
        />
        <TouchableOpacity style={styles.ctaButton} onPress={onGuardar} disabled={guardando}>
          <Text style={styles.ctaText}>
            {guardando ? "Guardando…" : "Guardar licencia en el móvil"}
          </Text>
        </TouchableOpacity>
      </ApartadoPlegable>

      <ApartadoPlegable
        titulo="Reglas generales"
        subCerrado="Normas básicas de la temporada"
        subAbierto="Resumen operativo"
      >
        {reglas.map((e, i) => (
          <Text key={i} style={styles.bullet}>
            • {e}
          </Text>
        ))}
      </ApartadoPlegable>

      <ApartadoPlegable
        titulo="Antes de salir"
        subCerrado="Checklist rápido previo a la jornada"
        subAbierto="Documentación y comprobaciones"
      >
        {checklist.map((e, i) => (
          <Text key={i} style={styles.bullet}>
            • {e}
          </Text>
        ))}
      </ApartadoPlegable>

      <ApartadoPlegable
        titulo="Tallas y régimen por especie"
        subCerrado="Talla mínima / régimen oficial"
        subAbierto="Catálogo de esta provincia"
      >
        {esAndalucia || esClm
          ? (provincia.species as any[]).map((sp) => (
              <View key={sp.id} style={styles.tallaRow}>
                <Text style={styles.tallaName}>{sp.nombre}</Text>
                <Text style={styles.tallaVal}>{sp.tallaOficial ?? "—"}</Text>
              </View>
            ))
          : Object.entries(TALLAS_OFICIALES).map(([id, texto]) => (
              <View key={id} style={styles.tallaRow}>
                <Text style={styles.tallaName}>{TALLA_LABELS[id] ?? id}</Text>
                <Text style={styles.tallaVal}>{texto}</Text>
              </View>
            ))}
      </ApartadoPlegable>

      {esClm ? (
        <ApartadoPlegable
          titulo="Tramitación Castilla-La Mancha"
          subCerrado="Sede JCCM · cotos y tasas"
          subAbierto="Dónde tramitar la licencia CLM"
        >
          <Text style={styles.cardText}>
            Licencia y cotos: sede electrónica / oficinas de la Junta de Comunidades de Castilla-La
            Mancha. Confirma el plan técnico del coto y la Orden de vedas vigente. Las tasas y
            exenciones las publica la JCCM cada temporada (no uses importes de la GVA).
          </Text>
        </ApartadoPlegable>
      ) : !esAndalucia ? (
        <>
          <ApartadoPlegable
            titulo="Tasas 2026 (continental)"
            subCerrado="Importes oficiales GVA"
            subAbierto="Concepto y precio"
          >
            {LICENCIA_INFO.tasas2026.map((t, i) => (
              <View key={i} style={styles.row}>
                <Text style={styles.rowLabel}>{t.concepto}</Text>
                <Text style={styles.rowValue}>{t.precio}</Text>
              </View>
            ))}
          </ApartadoPlegable>

          <ApartadoPlegable
            titulo="Exenciones de la tasa"
            subCerrado="Quién no paga la tasa"
            subAbierto="Casos exentos"
          >
            {LICENCIA_INFO.exentos.map((e, i) => (
              <Text key={i} style={styles.bullet}>
                • {e}
              </Text>
            ))}
          </ApartadoPlegable>

          <ApartadoPlegable
            titulo="A tener en cuenta"
            subCerrado="Notas prácticas de la licencia"
            subAbierto="Recordatorios útiles"
          >
            {LICENCIA_INFO.notas.map((n, i) => (
              <Text key={i} style={styles.bullet}>
                • {n}
              </Text>
            ))}
          </ApartadoPlegable>

          <ApartadoPlegable
            titulo="Oficina en Castellón"
            subCerrado="Atención presencial"
            subAbierto="Dirección y contacto"
          >
            <Text style={styles.cardText}>{LICENCIA_INFO.oficinaCastellon}</Text>
          </ApartadoPlegable>
        </>
      ) : null}

      <View style={styles.ctaWrap}>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() =>
            Linking.openURL(esAndalucia || esClm ? fuente.urlLicencia : LICENCIA_INFO.tramiteOnline)
          }
        >
          <Text style={styles.ctaText}>
            {esAndalucia
              ? "Tramitar licencia continental (Junta de Andalucía)"
              : esClm
                ? "Tramitar licencia continental (JCCM)"
                : "Tramitar licencia continental (Sede GVA)"}
          </Text>
        </TouchableOpacity>

        {!soloContinental ? (
          <TouchableOpacity
            style={styles.ctaButtonSecondary}
            onPress={() => Linking.openURL(LICENCIA_INFO.tramiteMaritimaTierra)}
          >
            <Text style={styles.ctaTextSecondary}>
              Licencia marítima recreativa desde tierra (GVA)
            </Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={styles.ctaButtonSecondary}
          onPress={() => Linking.openURL(fuente.urlOrden || FUENTE_NORMATIVA.urlOrden)}
        >
          <Text style={styles.ctaTextSecondary}>
            {esAndalucia || esClm
              ? "Consultar normativa / orden de vedas"
              : "Consultar resolución de tramos (DOGV)"}
          </Text>
        </TouchableOpacity>

        {!esAndalucia && !esClm ? (
          <TouchableOpacity
            style={styles.ctaButtonSecondary}
            onPress={() => Linking.openURL(LICENCIA_INFO.tramiteAlternativo)}
          >
            <Text style={styles.ctaTextSecondary}>Vía alternativa sin certificado digital</Text>
          </TouchableOpacity>
        ) : null}

        <Text style={styles.footnote}>
          Los importes, vedas y anexos pueden actualizarse cada temporada. Confirma siempre los datos
          vigentes en la sede electrónica
          {esAndalucia ? " y el BOJA" : esClm ? " y el DOCM" : " y el DOGV"} antes de pescar.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerCard: {
    borderRadius: RADIUS.lg,
    padding: 20,
    alignItems: "center",
    marginBottom: 12,
    marginHorizontal: SPACING.sm,
    ...SHADOW,
  },
  headerIcon: { fontSize: 32, marginBottom: 6 },
  headerTitle: { color: "#fff", fontSize: 19, fontWeight: "700" },
  headerSubtitle: { color: "#dfeee5", fontSize: 13, marginTop: 4, textAlign: "center" },
  headerHint: {
    color: "rgba(223,238,229,0.85)",
    fontSize: 12,
    marginTop: 10,
    fontWeight: "600",
    textAlign: "center",
  },
  bannerWrap: { marginHorizontal: SPACING.sm, marginBottom: 4 },
  resumen: {
    fontSize: 14,
    color: COLORS.textPrimary,
    marginBottom: 8,
    marginHorizontal: SPACING.md,
    lineHeight: 20,
  },
  vigencia: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    marginBottom: 8,
    marginHorizontal: SPACING.md,
    lineHeight: 16,
    fontStyle: "italic",
  },
  apartadoSeguroOn: {
    borderWidth: 1.5,
    borderColor: COLORS.warning,
    backgroundColor: COLORS.warningLight,
  },
  apartadoSeguroOff: {
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: { fontSize: 15, fontWeight: "700", marginBottom: 8, color: COLORS.textPrimary },
  seguroBadge: {
    alignSelf: "flex-start",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
    overflow: "hidden",
  },
  cardText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  link: { fontSize: 13, fontWeight: "700", color: COLORS.primary, marginTop: 10 },
  ambitoBlock: {
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  ambitoTitulo: { fontSize: 13.5, fontWeight: "800", color: COLORS.primaryDark },
  ambitoDonde: {
    fontSize: 12,
    color: COLORS.waterDark,
    fontWeight: "700",
    marginTop: 2,
    marginBottom: 4,
  },
  privacy: { fontSize: 12, color: COLORS.textMuted, lineHeight: 17, marginBottom: 10 },
  empty: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 8 },
  licRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  licTipo: { fontSize: 13, fontWeight: "800", color: COLORS.textPrimary },
  licMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  licEstado: { fontSize: 12, fontWeight: "800", marginTop: 2 },
  borrarBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  borrarTxt: { color: COLORS.danger, fontWeight: "700", fontSize: 12 },
  formLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
    marginTop: 10,
    marginBottom: 6,
  },
  tipoRow: { flexDirection: "row", gap: 8 },
  tipoChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: COLORS.mist,
  },
  tipoChipOn: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  tipoChipTxt: { fontSize: 12, fontWeight: "700", color: COLORS.textSecondary },
  tipoChipTxtOn: { color: COLORS.primaryDark },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "web" ? 10 : 12,
    fontSize: 14,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.mist,
  },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  rowLabel: { fontSize: 13, color: COLORS.textSecondary, flex: 1 },
  rowValue: { fontSize: 13, fontWeight: "700", color: COLORS.primary },
  bullet: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 4, lineHeight: 18 },
  tallaRow: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tallaName: { fontSize: 13, fontWeight: "700", color: COLORS.textPrimary },
  tallaVal: { fontSize: 12.5, color: COLORS.textSecondary, marginTop: 2, lineHeight: 17 },
  ctaWrap: { marginHorizontal: SPACING.md, marginTop: 8 },
  ctaButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
  },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  ctaButtonSecondary: {
    borderColor: COLORS.primary,
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 10,
  },
  ctaTextSecondary: { color: COLORS.primary, fontWeight: "600", fontSize: 13 },
  footnote: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 14,
    textAlign: "center",
    lineHeight: 16,
  },
});
