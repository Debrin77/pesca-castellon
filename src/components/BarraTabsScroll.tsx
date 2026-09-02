import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import TabIcon from "./TabIcon";
import { COLOR_TAB, NombreIcono } from "./tabTheme";
import { COLORS, SHADOW } from "../theme";

const ICONO_POR_TAB: Record<string, NombreIcono> = {
  Inicio: "home",
  Mapa: "water",
  Especies: "fish",
  Aparejos: "construct",
  Consejos: "book",
  Previsión: "partly-sunny",
  Capturas: "bookmark",
};

const ANCHO_ITEM = 78;

/**
 * Barra inferior con scroll horizontal: iconos grandes a todo color.
 * Con 7 pestañas el usuario desliza para llegar a Consejos / Previsión / Capturas.
 */
export default function BarraTabsScroll({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const x = Math.max(0, state.index * ANCHO_ITEM - ANCHO_ITEM * 1.5);
    scrollRef.current?.scrollTo({ x, animated: true });
  }, [state.index]);

  return (
    <View style={[styles.shell, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        bounces
        contentContainerStyle={styles.row}
        style={styles.scroll}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const label =
            typeof options.tabBarLabel === "string"
              ? options.tabBarLabel
              : options.title ?? route.name;
          const iconName = ICONO_POR_TAB[route.name] ?? "home";
          const color = COLOR_TAB[iconName];

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? String(label)}
              onPress={onPress}
              onLongPress={() => navigation.emit({ type: "tabLongPress", target: route.key })}
              style={styles.item}
              activeOpacity={0.75}
            >
              <TabIcon nombre={iconName} size={26} focused={focused} />
              <Text
                numberOfLines={1}
                style={[styles.label, { color: focused ? color : COLORS.textMuted }, focused && styles.labelOn]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <Text style={styles.hint}>Desliza la barra →</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    position: "absolute",
    left: 6,
    right: 6,
    bottom: 6,
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingTop: 8,
    ...SHADOW,
    ...(Platform.OS === "web" ? ({ boxShadow: "0 8px 24px rgba(12,44,32,0.12)" } as any) : null),
  },
  scroll: { maxHeight: 78 },
  row: {
    paddingHorizontal: 8,
    alignItems: "center",
    minWidth: "100%",
  },
  item: {
    width: ANCHO_ITEM,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 2,
  },
  label: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  labelOn: { fontWeight: "800" },
  hint: {
    textAlign: "center",
    fontSize: 9,
    color: COLORS.textMuted,
    paddingBottom: 2,
    fontWeight: "600",
  },
});
