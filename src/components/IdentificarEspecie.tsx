import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from "react-native";
import {
  AmbitoId,
  FormaCuerpo,
  RasgosId,
  TamanoAprox,
  identificarPorRasgos,
  CandidatoId,
} from "../services/fishIdService";
import { COLORS, RADIUS } from "../theme";

interface Props {
  catalogo: { id: string; nombre: string }[];
  fotoUri?: string | null;
  onElegir: (especieId: string) => void;
  onCerrar: () => void;
}

const AMBITOS: { id: AmbitoId; label: string }[] = [
  { id: "rio", label: "Río" },
  { id: "embalse", label: "Embalse" },
  { id: "mar", label: "Mar" },
  { id: "ambos", label: "No sé" },
];
const FORMAS: { id: FormaCuerpo; label: string }[] = [
  { id: "alargado", label: "Alargado" },
  { id: "comprimido", label: "Alto / plano" },
  { id: "cilindrico", label: "Cilíndrico" },
  { id: "anguiliforme", label: "Como anguila" },
  { id: "plano", label: "Plano / disco" },
];
const TAMANOS: { id: TamanoAprox; label: string }[] = [
  { id: "muy_pequeno", label: "<10 cm" },
  { id: "pequeno", label: "10–25" },
  { id: "medio", label: "25–50" },
  { id: "grande", label: "50–90" },
  { id: "muy_grande", label: ">90" },
];

export default function IdentificarEspecie({ catalogo, fotoUri, onElegir, onCerrar }: Props) {
  const [ambito, setAmbito] = useState<AmbitoId>("embalse");
  const [forma, setForma] = useState<FormaCuerpo>("alargado");
  const [tamano, setTamano] = useState<TamanoAprox>("medio");
  const [bocaGrande, setBocaGrande] = useState(false);
  const [resultado, setResultado] = useState<CandidatoId[] | null>(null);

  function lanzar() {
    const rasgos: RasgosId = { ambito, forma, tamano, bocaGrande };
    setResultado(identificarPorRasgos(rasgos, catalogo));
  }

  return (
    <View style={styles.box} accessibilityViewIsModal>
      <Text style={styles.title} accessibilityRole="header">
        Identificar especie
      </Text>
      <Text style={styles.sub}>Asistente por rasgos (no es IA de foto). La foto se guarda con la captura.</Text>
      {fotoUri ? <Image source={{ uri: fotoUri }} style={styles.foto} accessibilityLabel="Foto a identificar" /> : null}

      <Text style={styles.label}>Hábitat</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {AMBITOS.map((a) => (
          <Chip key={a.id} active={ambito === a.id} label={a.label} onPress={() => setAmbito(a.id)} />
        ))}
      </ScrollView>
      <Text style={styles.label}>Forma</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {FORMAS.map((a) => (
          <Chip key={a.id} active={forma === a.id} label={a.label} onPress={() => setForma(a.id)} />
        ))}
      </ScrollView>
      <Text style={styles.label}>Tamaño aprox.</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {TAMANOS.map((a) => (
          <Chip key={a.id} active={tamano === a.id} label={a.label} onPress={() => setTamano(a.id)} />
        ))}
      </ScrollView>
      <TouchableOpacity
        style={[styles.toggle, bocaGrande && styles.toggleOn]}
        onPress={() => setBocaGrande((v) => !v)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: bocaGrande }}
      >
        <Text style={styles.toggleText}>Boca grande / predador</Text>
      </TouchableOpacity>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.btn} onPress={lanzar} accessibilityRole="button">
          <Text style={styles.btnText}>Buscar candidatas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnGhost} onPress={onCerrar} accessibilityRole="button">
          <Text style={styles.btnGhostText}>Cerrar</Text>
        </TouchableOpacity>
      </View>

      {resultado ? (
        <View style={styles.res}>
          {resultado.length === 0 ? (
            <Text style={styles.sub}>Sin coincidencias claras. Elige manualmente en el listado.</Text>
          ) : (
            resultado.map((c) => (
              <TouchableOpacity
                key={c.especieId}
                style={styles.cand}
                onPress={() => onElegir(c.especieId)}
                accessibilityRole="button"
                accessibilityLabel={`Elegir ${c.nombre}`}
              >
                <Text style={styles.candName}>
                  {c.nombre} · {c.puntuacion} pts
                </Text>
                <Text style={styles.candMotivos}>{c.motivos.join(" · ")}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      ) : null}
    </View>
  );
}

function Chip({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, active && styles.chipOn]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.chipText, active && styles.chipTextOn]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: COLORS.mist,
    borderRadius: RADIUS.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  title: { fontSize: 15, fontWeight: "800", color: COLORS.textPrimary },
  sub: { fontSize: 11.5, color: COLORS.textSecondary, marginTop: 4, marginBottom: 8 },
  foto: { width: "100%", height: 140, borderRadius: RADIUS.md, marginBottom: 8 },
  label: { fontSize: 11, fontWeight: "800", color: COLORS.textMuted, marginTop: 6, marginBottom: 4 },
  row: { gap: 6, paddingBottom: 4 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 12, fontWeight: "600", color: COLORS.textPrimary },
  chipTextOn: { color: "#fff" },
  toggle: {
    marginTop: 8,
    padding: 10,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  toggleOn: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  toggleText: { fontWeight: "700", color: COLORS.textPrimary, fontSize: 13 },
  actions: { flexDirection: "row", gap: 8, marginTop: 12 },
  btn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.sm, paddingHorizontal: 12, paddingVertical: 10 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  btnGhost: { paddingHorizontal: 12, paddingVertical: 10 },
  btnGhostText: { color: COLORS.textSecondary, fontWeight: "700", fontSize: 13 },
  res: { marginTop: 10 },
  cand: {
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  candName: { fontWeight: "800", color: COLORS.textPrimary, fontSize: 13.5 },
  candMotivos: { fontSize: 11.5, color: COLORS.textSecondary, marginTop: 2 },
});
