import React from "react";
import { Platform, StyleSheet, View } from "react-native";

type Paleta = {
  cuerpo: string;
  vientre: string;
  aleta: string;
  ojo: string;
  detalle?: string;
};

const DEFAULT: Paleta = {
  cuerpo: "#2A7A94",
  vientre: "#D7EEF5",
  aleta: "#0E4456",
  ojo: "#122018",
};

const POR_ID: Record<string, Paleta> = {
  trucha_comun: { cuerpo: "#3D8B5A", vientre: "#F0E6C8", aleta: "#1F5C35", ojo: "#122018", detalle: "#C45C12" },
  trucha_arcoiris: { cuerpo: "#3A9B6E", vientre: "#FFE8F0", aleta: "#1F5C35", ojo: "#122018", detalle: "#E85D8A" },
  black_bass: { cuerpo: "#4A7A3A", vientre: "#E8F0D8", aleta: "#2F4A22", ojo: "#122018", detalle: "#C4921A" },
  lucio: { cuerpo: "#6B9B4A", vientre: "#EAF5D8", aleta: "#3A5C28", ojo: "#122018" },
  carpa: { cuerpo: "#C47A3A", vientre: "#F6E2C4", aleta: "#8A4A18", ojo: "#122018" },
  carpin: { cuerpo: "#D4924A", vientre: "#F8E8CC", aleta: "#9A5A20", ojo: "#122018" },
  tenca: { cuerpo: "#6A8B4A", vientre: "#E4F0D0", aleta: "#3A5528", ojo: "#122018" },
  barbo: { cuerpo: "#B8864A", vientre: "#F3E2C4", aleta: "#7A4A1A", ojo: "#122018" },
  siluro: { cuerpo: "#5A6470", vientre: "#D8DEE4", aleta: "#343A44", ojo: "#122018" },
  anguila: { cuerpo: "#3A4A3A", vientre: "#C8D4C0", aleta: "#243028", ojo: "#122018" },
  gambusia: { cuerpo: "#6A9AAA", vientre: "#E4F2F6", aleta: "#3A606C", ojo: "#122018" },
  cangrejo_americano: { cuerpo: "#C45C2A", vientre: "#E8A070", aleta: "#8A3010", ojo: "#122018" },
  cangrejo_azul: { cuerpo: "#1A6F8A", vientre: "#7AB8D0", aleta: "#0E4456", ojo: "#122018" },
  mugilidos: { cuerpo: "#5A7A8A", vientre: "#D8E8F0", aleta: "#2A4454", ojo: "#122018" },
  llisa: { cuerpo: "#5A7A8A", vientre: "#D8E8F0", aleta: "#2A4454", ojo: "#122018" },
  lubina: { cuerpo: "#4A6A7A", vientre: "#E8F0F4", aleta: "#2A404C", ojo: "#122018", detalle: "#C4921A" },
  dorada: { cuerpo: "#C4A03A", vientre: "#F6ECC8", aleta: "#8A6A18", ojo: "#122018", detalle: "#E8C84A" },
  sargo: { cuerpo: "#6A7A88", vientre: "#E4EAF0", aleta: "#3A4854", ojo: "#122018" },
  mojarra: { cuerpo: "#7A9AAA", vientre: "#E8F4F8", aleta: "#405868", ojo: "#122018" },
  herrera: { cuerpo: "#8A9AAA", vientre: "#E8F0F4", aleta: "#4A5A68", ojo: "#122018" },
  oblada: { cuerpo: "#7A8A9A", vientre: "#E4ECF2", aleta: "#3A4A58", ojo: "#122018" },
  salema: { cuerpo: "#4A9A6A", vientre: "#D8F0E0", aleta: "#2A6A42", ojo: "#122018" },
  mabra: { cuerpo: "#5A8AAA", vientre: "#D8ECF6", aleta: "#2A5A74", ojo: "#122018" },
  jurel: { cuerpo: "#C4A83A", vientre: "#F4ECC8", aleta: "#8A7018", ojo: "#122018" },
  caballa: { cuerpo: "#3A6A8A", vientre: "#D0E4F0", aleta: "#1A4058", ojo: "#122018", detalle: "#5AC8FA" },
  sepia: { cuerpo: "#8A6A4A", vientre: "#D4B898", aleta: "#5A3A28", ojo: "#122018" },
  calamar: { cuerpo: "#C48A9A", vientre: "#F0D8E0", aleta: "#8A4A5A", ojo: "#122018" },
  pulpo: { cuerpo: "#8A4A8A", vientre: "#D8A8D0", aleta: "#5A2A5A", ojo: "#122018" },
  salmonete: { cuerpo: "#C45A4A", vientre: "#F0C8C0", aleta: "#8A2A28", ojo: "#122018" },
  boga: { cuerpo: "#5A8A9A", vientre: "#D8ECF2", aleta: "#2A5A68", ojo: "#122018" },
  barbo_gitano: { cuerpo: "#A87840", vientre: "#F2E0C0", aleta: "#6E3E14", ojo: "#122018", detalle: "#C4921A" },
  alburno: { cuerpo: "#8AB0C0", vientre: "#E8F4F8", aleta: "#4A7080", ojo: "#122018", detalle: "#C8DCE8" },
  corvina: { cuerpo: "#4A5A6A", vientre: "#D8E0E8", aleta: "#2A3440", ojo: "#122018" },
  palometon: { cuerpo: "#3A5A7A", vientre: "#C8DCE8", aleta: "#1A3048", ojo: "#122018" },
  anjova: { cuerpo: "#4A7A9A", vientre: "#D0E6F2", aleta: "#2A4A64", ojo: "#122018" },
  espeton: { cuerpo: "#5A8AAA", vientre: "#D8ECF6", aleta: "#2A5A74", ojo: "#122018" },
};

type Forma = "pez" | "sepia" | "calamar" | "pulpo" | "cangrejo" | "prohibido" | "anguila";

function formaDe(id?: string, nombre?: string): Forma {
  const k = `${id ?? ""} ${nombre ?? ""}`.toLowerCase();
  if (k.includes("pulpo")) return "pulpo";
  if (k.includes("sepia") || k.includes("jibia")) return "sepia";
  if (k.includes("calamar")) return "calamar";
  if (k.includes("cangrejo")) return "cangrejo";
  if (k.includes("anguila")) return "anguila";
  if (k.includes("datil") || k.includes("nacra") || k.includes("caballito") || k.includes("tortuga") || k.includes("mero")) {
    return "prohibido";
  }
  return "pez";
}

/** Ilustración identificativa a todo color (no silueta monocroma). */
export default function GraficoEspecie({
  id,
  nombre,
  size = 88,
}: {
  id?: string;
  nombre?: string;
  size?: number;
}) {
  const forma = formaDe(id, nombre);
  const pal = (id && POR_ID[id]) || DEFAULT;
  const w = size;
  const h = size * 0.78;

  if (forma === "pulpo") {
    return (
      <View style={[styles.caja, { width: w, height: h }]} accessibilityLabel={`Ilustración de ${nombre ?? "pulpo"}`}>
        <View style={[styles.sombra, { width: w * 0.7, height: h * 0.2, bottom: 2 }]} />
        <View style={{ width: w * 0.58, height: w * 0.44, borderRadius: w, backgroundColor: pal.cuerpo, borderWidth: 2, borderColor: pal.aleta }} />
        <View style={{ position: "absolute", top: h * 0.22, width: 8, height: 8, borderRadius: 4, backgroundColor: pal.ojo, left: w * 0.38 }} />
        <View style={{ flexDirection: "row", gap: 5, marginTop: 2 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View
              key={i}
              style={{
                width: 7,
                height: h * 0.36,
                borderRadius: 4,
                backgroundColor: i % 2 ? pal.vientre : pal.cuerpo,
                transform: [{ rotate: `${(i - 2) * 8}deg` }],
              }}
            />
          ))}
        </View>
      </View>
    );
  }

  if (forma === "sepia") {
    return (
      <View style={[styles.caja, { width: w, height: h }]} accessibilityLabel={`Ilustración de ${nombre ?? "sepia"}`}>
        <View
          style={{
            width: w * 0.82,
            height: h * 0.55,
            backgroundColor: pal.cuerpo,
            borderRadius: h,
            borderWidth: 2,
            borderColor: pal.aleta,
          }}
        />
        <View style={{ position: "absolute", width: w * 0.5, height: h * 0.22, backgroundColor: pal.vientre, borderRadius: h, bottom: h * 0.28 }} />
        <View style={{ position: "absolute", left: w * 0.22, top: h * 0.28, width: 7, height: 7, borderRadius: 4, backgroundColor: pal.ojo }} />
        <View style={{ flexDirection: "row", gap: 3, marginTop: 4 }}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={{ width: 5, height: 12, borderRadius: 3, backgroundColor: pal.aleta }} />
          ))}
        </View>
      </View>
    );
  }

  if (forma === "calamar") {
    return (
      <View style={[styles.caja, { width: w, height: h }]} accessibilityLabel={`Ilustración de ${nombre ?? "calamar"}`}>
        <View style={{ width: w * 0.32, height: h * 0.55, backgroundColor: pal.cuerpo, borderRadius: w, borderWidth: 2, borderColor: pal.aleta }} />
        <View style={{ width: w * 0.22, height: h * 0.12, backgroundColor: pal.vientre, borderRadius: 8, marginTop: -4 }} />
        <View style={{ flexDirection: "row", gap: 3, marginTop: 2 }}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={{ width: 4, height: h * 0.22, borderRadius: 2, backgroundColor: pal.aleta }} />
          ))}
        </View>
      </View>
    );
  }

  if (forma === "cangrejo") {
    return (
      <View style={[styles.caja, { width: w, height: h }]} accessibilityLabel={`Ilustración de ${nombre ?? "cangrejo"}`}>
        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 4, marginBottom: 2 }}>
          <View style={{ width: 14, height: 18, borderRadius: 4, backgroundColor: pal.aleta, transform: [{ rotate: "-25deg" }] }} />
          <View
            style={{
              width: w * 0.55,
              height: h * 0.42,
              backgroundColor: pal.cuerpo,
              borderRadius: 10,
              borderWidth: 2,
              borderColor: pal.aleta,
            }}
          />
          <View style={{ width: 14, height: 18, borderRadius: 4, backgroundColor: pal.aleta, transform: [{ rotate: "25deg" }] }} />
        </View>
        <View style={{ flexDirection: "row", gap: 6 }}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={{ width: 5, height: 12, borderRadius: 2, backgroundColor: pal.vientre }} />
          ))}
        </View>
        <View style={{ position: "absolute", top: h * 0.22, left: w * 0.38, flexDirection: "row", gap: 10 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: pal.ojo }} />
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: pal.ojo }} />
        </View>
      </View>
    );
  }

  if (forma === "anguila") {
    return (
      <View style={[styles.caja, { width: w, height: h }]} accessibilityLabel={`Ilustración de ${nombre ?? "anguila"}`}>
        <View
          style={{
            width: w * 0.88,
            height: h * 0.28,
            backgroundColor: pal.cuerpo,
            borderRadius: h,
            borderWidth: 2,
            borderColor: pal.aleta,
            transform: [{ rotate: "-8deg" }],
          }}
        />
        <View style={{ position: "absolute", left: w * 0.14, top: h * 0.34, width: 6, height: 6, borderRadius: 3, backgroundColor: pal.ojo }} />
        <View style={{ position: "absolute", left: w * 0.12, top: h * 0.48, width: w * 0.28, height: h * 0.1, backgroundColor: pal.vientre, borderRadius: 8 }} />
      </View>
    );
  }

  if (forma === "prohibido") {
    return (
      <View style={[styles.caja, { width: w, height: h }]} accessibilityLabel="Especie protegida">
        <View style={{ width: w * 0.55, height: w * 0.55, borderRadius: w, borderWidth: 5, borderColor: "#B42318", alignItems: "center", justifyContent: "center" }}>
          <View style={{ width: w * 0.32, height: 5, backgroundColor: "#B42318", borderRadius: 3, transform: [{ rotate: "-20deg" }] }} />
        </View>
      </View>
    );
  }

  // Pez genérico a color con vientre, aleta y ojo
  return (
    <View style={[styles.caja, { width: w, height: h }]} accessibilityLabel={`Ilustración de ${nombre ?? "pez"}`}>
      <View style={[styles.sombra, { width: w * 0.7, height: h * 0.16, bottom: 4 }]} />
      <View
        style={{
          width: w * 0.66,
          height: h * 0.5,
          backgroundColor: pal.cuerpo,
          borderRadius: h,
          borderWidth: 2,
          borderColor: pal.aleta,
          overflow: "hidden",
        }}
      >
        <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "42%", backgroundColor: pal.vientre }} />
        {pal.detalle ? (
          <View
            style={{
              position: "absolute",
              top: "30%",
              left: "10%",
              right: "20%",
              height: 4,
              borderRadius: 2,
              backgroundColor: pal.detalle,
              opacity: 0.85,
            }}
          />
        ) : null}
      </View>
      <View
        style={{
          position: "absolute",
          right: 2,
          width: 0,
          height: 0,
          borderTopWidth: 12,
          borderBottomWidth: 12,
          borderLeftWidth: 18,
          borderTopColor: "transparent",
          borderBottomColor: "transparent",
          borderLeftColor: pal.aleta,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: h * 0.12,
          left: w * 0.32,
          width: 0,
          height: 0,
          borderLeftWidth: 8,
          borderRightWidth: 8,
          borderBottomWidth: 14,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderBottomColor: pal.aleta,
        }}
      />
      <View
        style={{
          position: "absolute",
          left: w * 0.22,
          top: h * 0.36,
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: "#fff",
          borderWidth: 2,
          borderColor: pal.ojo,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  caja: { alignItems: "center", justifyContent: "center" },
  sombra: {
    position: "absolute",
    alignSelf: "center",
    backgroundColor: "rgba(12,44,32,0.12)",
    borderRadius: 999,
    ...(Platform.OS === "web" ? ({ filter: "blur(2px)" } as any) : null),
  },
});
