import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import speciesCatalog from "../data/species.json";
import {
  PuntoGuardado,
  Captura,
  obtenerPuntosGuardados,
  guardarPunto,
  eliminarPunto,
  obtenerCapturas,
  guardarCaptura,
  eliminarCaptura,
} from "../services/storageService";
import { obtenerUbicacionActual, solicitarPermisoUbicacion } from "../services/locationService";
import { COLORS, RADIUS, SHADOW } from "../theme";

type Tab = "puntos" | "capturas";

export default function MyCatchesScreen() {
  const [tab, setTab] = useState<Tab>("capturas");
  const [puntos, setPuntos] = useState<PuntoGuardado[]>([]);
  const [capturas, setCapturas] = useState<Captura[]>([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [especieId, setEspecieId] = useState(speciesCatalog[0]?.id ?? "");
  const [nombreLugar, setNombreLugar] = useState("");
  const [tallaCm, setTallaCm] = useState("");
  const [pesoKg, setPesoKg] = useState("");
  const [notas, setNotas] = useState("");

  const cargar = useCallback(async () => {
    setPuntos(await obtenerPuntosGuardados());
    setCapturas(await obtenerCapturas());
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  async function handleGuardarCaptura() {
    await guardarCaptura({
      especieId,
      fecha: new Date().toISOString().slice(0, 10),
      nombreLugar: nombreLugar || undefined,
      tallaCm: tallaCm ? parseFloat(tallaCm) : null,
      pesoKg: pesoKg ? parseFloat(pesoKg) : null,
      notas: notas || undefined,
    });
    setNombreLugar("");
    setTallaCm("");
    setPesoKg("");
    setNotas("");
    setMostrarFormulario(false);
    cargar();
  }

  async function handleGuardarPuntoActual() {
    const ok = await solicitarPermisoUbicacion();
    if (!ok) {
      Alert.alert("Ubicación necesaria", "Activa el permiso de ubicación para guardar tu punto actual.");
      return;
    }
    const loc = await obtenerUbicacionActual();
    if (!loc) {
      Alert.alert("No se pudo obtener tu ubicación", "Inténtalo de nuevo en un momento.");
      return;
    }
    await guardarPunto({ nombre: `Punto del ${new Date().toLocaleDateString("es-ES")}`, lat: loc.lat, lng: loc.lng });
    cargar();
  }

  function especieInfo(id: string) {
    return speciesCatalog.find((s: any) => s.id === id);
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tabBtn, tab === "capturas" && styles.tabBtnActive]} onPress={() => setTab("capturas")}>
          <Text style={[styles.tabBtnText, tab === "capturas" && styles.tabBtnTextActive]}>🎣 Capturas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, tab === "puntos" && styles.tabBtnActive]} onPress={() => setTab("puntos")}>
          <Text style={[styles.tabBtnText, tab === "puntos" && styles.tabBtnTextActive]}>📍 Mis puntos</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {tab === "capturas" && (
          <>
            {!mostrarFormulario ? (
              <TouchableOpacity style={styles.addButton} onPress={() => setMostrarFormulario(true)}>
                <Text style={styles.addButtonText}>+ Registrar nueva captura</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.formCard}>
                <Text style={styles.formLabel}>Especie</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                  {speciesCatalog.map((s: any) => (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.chip, especieId === s.id && styles.chipActive]}
                      onPress={() => setEspecieId(s.id)}
                    >
                      <Text style={[styles.chipText, especieId === s.id && styles.chipTextActive]}>
                        {s.icono} {s.nombre}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.formLabel}>Lugar (opcional)</Text>
                <TextInput style={styles.input} value={nombreLugar} onChangeText={setNombreLugar} placeholder="Ej. Embalse de Arenós" />

                <View style={{ flexDirection: "row", gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.formLabel}>Talla (cm)</Text>
                    <TextInput style={styles.input} value={tallaCm} onChangeText={setTallaCm} keyboardType="numeric" placeholder="—" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.formLabel}>Peso (kg)</Text>
                    <TextInput style={styles.input} value={pesoKg} onChangeText={setPesoKg} keyboardType="numeric" placeholder="—" />
                  </View>
                </View>

                <Text style={styles.formLabel}>Notas (opcional)</Text>
                <TextInput style={[styles.input, { height: 60 }]} value={notas} onChangeText={setNotas} multiline placeholder="Señuelo usado, condiciones..." />

                <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setMostrarFormulario(false)}>
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveButton} onPress={handleGuardarCaptura}>
                    <Text style={styles.saveButtonText}>Guardar captura</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <Text style={styles.sectionTitle}>Historial ({capturas.length})</Text>
            {capturas.length === 0 && <Text style={styles.emptyText}>Aún no has registrado ninguna captura.</Text>}
            {capturas.map((c) => {
              const sp = especieInfo(c.especieId);
              return (
                <View key={c.id} style={styles.card}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={styles.cardTitle}>{sp?.icono} {sp?.nombre ?? c.especieId}</Text>
                    <TouchableOpacity onPress={() => { eliminarCaptura(c.id).then(cargar); }}>
                      <Text style={styles.deleteText}>Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.cardMeta}>{c.fecha} {c.nombreLugar ? `· ${c.nombreLugar}` : ""}</Text>
                  {(c.tallaCm || c.pesoKg) && (
                    <Text style={styles.cardMeta}>
                      {c.tallaCm ? `${c.tallaCm} cm` : ""} {c.pesoKg ? `· ${c.pesoKg} kg` : ""}
                    </Text>
                  )}
                  {c.notas && <Text style={styles.cardNotas}>{c.notas}</Text>}
                </View>
              );
            })}
          </>
        )}

        {tab === "puntos" && (
          <>
            <TouchableOpacity style={styles.addButton} onPress={handleGuardarPuntoActual}>
              <Text style={styles.addButtonText}>📍 Guardar mi ubicación actual como punto</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Puntos guardados ({puntos.length})</Text>
            {puntos.length === 0 && <Text style={styles.emptyText}>Aún no has guardado ningún punto propio.</Text>}
            {puntos.map((p) => (
              <View key={p.id} style={styles.card}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={styles.cardTitle}>{p.nombre}</Text>
                  <TouchableOpacity onPress={() => { eliminarPunto(p.id).then(cargar); }}>
                    <Text style={styles.deleteText}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.cardMeta}>{p.lat.toFixed(4)}, {p.lng.toFixed(4)}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  tabBar: { flexDirection: "row", backgroundColor: COLORS.surface, padding: 6, gap: 6, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: RADIUS.sm, alignItems: "center" },
  tabBtnActive: { backgroundColor: COLORS.primaryLight },
  tabBtnText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: "600" },
  tabBtnTextActive: { color: COLORS.primary },
  content: { flex: 1 },
  addButton: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 13, alignItems: "center", marginBottom: 16 },
  addButtonText: { color: "#fff", fontWeight: "700", fontSize: 13.5 },
  formCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border, ...SHADOW },
  formLabel: { fontSize: 12, fontWeight: "700", color: COLORS.textSecondary, marginBottom: 6, marginTop: 8 },
  input: { backgroundColor: COLORS.background, borderRadius: RADIUS.sm, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13.5, borderWidth: 1, borderColor: COLORS.border, color: COLORS.textPrimary },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.pill, backgroundColor: COLORS.primaryLight, marginRight: 8 },
  chipActive: { backgroundColor: COLORS.primary },
  chipText: { fontSize: 12.5, color: COLORS.primaryDark },
  chipTextActive: { color: "#fff", fontWeight: "600" },
  cancelButton: { flex: 1, paddingVertical: 12, borderRadius: RADIUS.md, alignItems: "center", borderWidth: 1, borderColor: COLORS.border },
  cancelButtonText: { color: COLORS.textSecondary, fontWeight: "600" },
  saveButton: { flex: 1, paddingVertical: 12, borderRadius: RADIUS.md, alignItems: "center", backgroundColor: COLORS.success },
  saveButtonText: { color: "#fff", fontWeight: "700" },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 10 },
  emptyText: { fontSize: 13, color: COLORS.textMuted, fontStyle: "italic" },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border, ...SHADOW },
  cardTitle: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary },
  cardMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  cardNotas: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4, fontStyle: "italic" },
  deleteText: { fontSize: 12, color: COLORS.danger, fontWeight: "600" },
});
