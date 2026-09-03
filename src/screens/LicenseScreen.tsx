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
import TemporadaBanner from "../components/TemporadaBanner";
import { useProvincia } from "../context/ProvinciaContext";
import { getProvinciaActiva } from "../provincias/runtime";
import { COLORS, GRADIENTS, RADIUS, SHADOW } from "../theme";
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
  const esSevilla = provincia.id === "sevilla";
  const soloContinental = provincia.continentalOnly;
  const checklist = provincia.checklistAntesDePescar.length
    ? provincia.checklistAntesDePescar
    : esSevilla
      ? CHECKLIST_ANTES_DE_PESCAR_ANDALUCIA
      : CHECKLIST_ANTES_DE_PESCAR;
  const reglas = esSevilla ? REGLAS_GENERALES_ANDALUCIA : REGLAS_GENERALES;
  const vigencia = esSevilla ? textoVigenciaNormativaAndalucia() : textoVigenciaNormativa();
  const fuente = provincia.fuenteNormativa;
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
      <LinearGradient colors={[...GRADIENTS.primary]} style={styles.headerCard}>
        <Text style={styles.headerIcon}>🎫</Text>
        <Text style={styles.headerTitle}>Licencias y normativa</Text>
        <Text style={styles.headerSubtitle}>
          {soloContinental
            ? provincia.etiquetaLicenciaContinental
            : "Continental y marítima recreativa desde tierra"}
        </Text>
      </LinearGradient>

      <TemporadaBanner />

      <Text style={styles.resumen}>{provincia.requisitosLicencia.resumen}</Text>
      <Text style={styles.vigencia}>{vigencia}</Text>

      <View
        style={[
          styles.card,
          provincia.requisitosLicencia.seguroObligatorio ? styles.cardSeguroOn : styles.cardSeguroOff,
        ]}
      >
        <Text style={styles.cardTitle}>
          {provincia.requisitosLicencia.seguroObligatorio
            ? "Seguro obligatorio (Andalucía)"
            : "Seguro de pescador (Castellón)"}
        </Text>
        <Text style={styles.seguroBadge}>
          {provincia.requisitosLicencia.seguroObligatorio
            ? "Obligatorio · responsabilidad civil"
            : "No obligatorio en GVA"}
        </Text>
        <Text style={styles.cardText}>{provincia.requisitosLicencia.seguroNota}</Text>
        <Text style={[styles.cardTitle, { marginTop: 12 }]}>Requisitos en {provincia.nombre}</Text>
        {provincia.requisitosLicencia.requisitos.map((r, i) => (
          <Text key={i} style={styles.bullet}>
            • {r}
          </Text>
        ))}
      </View>

      {!soloContinental ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ámbitos oficiales (GVA)</Text>
          {LICENCIA_INFO.ambitos.map((a) => (
            <View key={a.id} style={styles.ambitoBlock}>
              <Text style={styles.ambitoTitulo}>{a.titulo}</Text>
              <Text style={styles.ambitoDonde}>{a.donde}</Text>
              <Text style={styles.cardText}>{a.detalle}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ámbito continental</Text>
          <Text style={styles.cardText}>{provincia.etiquetaLicenciaContinental}</Text>
          <Text style={[styles.cardText, { marginTop: 6 }]}>{fuente.vigenciaNota}</Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Mis licencias en este móvil</Text>
        <Text style={styles.privacy}>
          Datos opcionales, solo locales (no se envían a ningún servidor). Sirven para recordar la caducidad. No
          sustituyen llevar la licencia oficial encima.
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
          <Text style={styles.ctaText}>{guardando ? "Guardando…" : "Guardar licencia en el móvil"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Reglas generales</Text>
        {reglas.map((e, i) => (
          <Text key={i} style={styles.bullet}>
            • {e}
          </Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Checklist antes de salir</Text>
        {checklist.map((e, i) => (
          <Text key={i} style={styles.bullet}>
            • {e}
          </Text>
        ))}
      </View>

      {!esSevilla ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tallas y régimen por especie</Text>
          {Object.entries(TALLAS_OFICIALES).map(([id, texto]) => (
            <View key={id} style={styles.tallaRow}>
              <Text style={styles.tallaName}>{TALLA_LABELS[id] ?? id}</Text>
              <Text style={styles.tallaVal}>{texto}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {!esSevilla ? (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tasas 2026 (continental)</Text>
            {LICENCIA_INFO.tasas2026.map((t, i) => (
              <View key={i} style={styles.row}>
                <Text style={styles.rowLabel}>{t.concepto}</Text>
                <Text style={styles.rowValue}>{t.precio}</Text>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Exenciones de la tasa</Text>
            {LICENCIA_INFO.exentos.map((e, i) => (
              <Text key={i} style={styles.bullet}>
                • {e}
              </Text>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>A tener en cuenta</Text>
            {LICENCIA_INFO.notas.map((n, i) => (
              <Text key={i} style={styles.bullet}>
                • {n}
              </Text>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Oficina en Castellón</Text>
            <Text style={styles.cardText}>{LICENCIA_INFO.oficinaCastellon}</Text>
          </View>
        </>
      ) : null}

      <TouchableOpacity
        style={styles.ctaButton}
        onPress={() => Linking.openURL(esSevilla ? fuente.urlLicencia : LICENCIA_INFO.tramiteOnline)}
      >
        <Text style={styles.ctaText}>
          {esSevilla
            ? "Tramitar licencia continental (Junta de Andalucía)"
            : "Tramitar licencia continental (Sede GVA)"}
        </Text>
      </TouchableOpacity>

      {!soloContinental ? (
        <TouchableOpacity
          style={styles.ctaButtonSecondary}
          onPress={() => Linking.openURL(LICENCIA_INFO.tramiteMaritimaTierra)}
        >
          <Text style={styles.ctaTextSecondary}>Licencia marítima recreativa desde tierra (GVA)</Text>
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity
        style={styles.ctaButtonSecondary}
        onPress={() => Linking.openURL(fuente.urlOrden || FUENTE_NORMATIVA.urlOrden)}
      >
        <Text style={styles.ctaTextSecondary}>
          {esSevilla ? "Consultar normativa / orden de vedas" : "Consultar resolución de tramos (DOGV)"}
        </Text>
      </TouchableOpacity>

      {!esSevilla ? (
        <TouchableOpacity
          style={styles.ctaButtonSecondary}
          onPress={() => Linking.openURL(LICENCIA_INFO.tramiteAlternativo)}
        >
          <Text style={styles.ctaTextSecondary}>Vía alternativa sin certificado digital</Text>
        </TouchableOpacity>
      ) : null}

      <Text style={styles.footnote}>
        Los importes, vedas y anexos pueden actualizarse cada temporada. Confirma siempre los datos vigentes en la sede
        electrónica y el DOGV antes de pescar.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerCard: {
    borderRadius: RADIUS.lg,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
    ...SHADOW,
  },
  headerIcon: { fontSize: 32, marginBottom: 6 },
  headerTitle: { color: "#fff", fontSize: 19, fontWeight: "700" },
  headerSubtitle: { color: "#dfeee5", fontSize: 13, marginTop: 4, textAlign: "center" },
  resumen: { fontSize: 14, color: COLORS.textPrimary, marginBottom: 8, lineHeight: 20 },
  vigencia: { fontSize: 11.5, color: COLORS.textMuted, marginBottom: 14, lineHeight: 16, fontStyle: "italic" },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 12,
    ...SHADOW,
  },
  cardSeguroOn: {
    borderWidth: 1.5,
    borderColor: COLORS.warning,
    backgroundColor: COLORS.warningLight,
  },
  cardSeguroOff: {
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
  ambitoBlock: {
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  ambitoTitulo: { fontSize: 13.5, fontWeight: "800", color: COLORS.primaryDark },
  ambitoDonde: { fontSize: 12, color: COLORS.waterDark, fontWeight: "700", marginTop: 2, marginBottom: 4 },
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
  tallaRow: { marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tallaName: { fontSize: 13, fontWeight: "700", color: COLORS.textPrimary },
  tallaVal: { fontSize: 12.5, color: COLORS.textSecondary, marginTop: 2, lineHeight: 17 },
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
  footnote: { fontSize: 11, color: COLORS.textMuted, marginTop: 14, textAlign: "center", lineHeight: 16 },
});
