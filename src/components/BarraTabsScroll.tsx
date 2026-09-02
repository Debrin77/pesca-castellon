import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  LayoutChangeEvent,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
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

/** Ancho grande a propósito: en móvil solo caben 3–4 → hay que deslizar. */
const ANCHO_ITEM = 96;

/**
 * Barra inferior con scroll horizontal e iconos grandes a todo color.
 * En web fuerza overflow-x visible (RN Web a veces lo oculta).
 */
export default function BarraTabsScroll({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [viewportW, setViewportW] = useState(0);
  const [scrollX, setScrollX] = useState(0);
  const contentW = state.routes.length * ANCHO_ITEM;
  const needsScroll = viewportW > 0 && contentW > viewportW + 4;
  const maxScroll = Math.max(0, contentW - viewportW);
  const canLeft = scrollX > 4;
  const canRight = scrollX < maxScroll - 4;

  useEffect(() => {
    const x = Math.min(maxScroll, Math.max(0, state.index * ANCHO_ITEM - ANCHO_ITEM * 0.5));
    scrollRef.current?.scrollTo({ x, animated: true });
  }, [state.index, maxScroll]);

  function onShellLayout(e: LayoutChangeEvent) {
    setViewportW(e.nativeEvent.layout.width);
  }

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    setScrollX(e.nativeEvent.contentOffset.x);
  }

  function scrollBy(dir: -1 | 1) {
    const next = Math.max(0, Math.min(maxScroll, scrollX + dir * ANCHO_ITEM * 2));
    scrollRef.current?.scrollTo({ x: next, animated: true });
  }

  return (
    <View
      nativeID="barra-tabs-scroll"
      style={[styles.shell, { paddingBottom: Math.max(insets.bottom, 10) }]}
      onLayout={onShellLayout}
    >
      <View style={styles.topRow}>
        {needsScroll ? (
          <TouchableOpacity
            style={[styles.arrow, !canLeft && styles.arrowOff]}
            onPress={() => scrollBy(-1)}
            disabled={!canLeft}
            accessibilityLabel="Ver pestañas anteriores"
          >
            <Text style={styles.arrowTxt}>‹</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.arrowSpacer} />
        )}
        <Text style={styles.hint}>
          {needsScroll ? "Desliza · flechas · scrollbar →" : "Menú"}
        </Text>
        {needsScroll ? (
          <TouchableOpacity
            style={[styles.arrow, !canRight && styles.arrowOff]}
            onPress={() => scrollBy(1)}
            disabled={!canRight}
            accessibilityLabel="Ver más pestañas"
          >
            <Text style={styles.arrowTxt}>›</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.arrowSpacer} />
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        nestedScrollEnabled
        scrollEnabled
        showsHorizontalScrollIndicator
        persistentScrollbar={Platform.OS === "android"}
        bounces
        decelerationRate="fast"
        snapToInterval={ANCHO_ITEM}
        snapToAlignment="start"
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.row,
          { width: Math.max(contentW, viewportW || contentW) },
        ]}
        style={[
          styles.scroll,
          Platform.OS === "web"
            ? ({
                overflowX: "scroll",
                overflowY: "hidden",
                WebkitOverflowScrolling: "touch",
              } as any)
            : null,
        ]}
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
              style={[styles.item, focused && styles.itemOn]}
              activeOpacity={0.75}
            >
              <TabIcon nombre={iconName} size={32} focused={focused} />
              <Text
                numberOfLines={1}
                style={[
                  styles.label,
                  { color: focused ? color : COLORS.textSecondary },
                  focused && styles.labelOn,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    position: "absolute",
    left: 4,
    right: 4,
    bottom: 4,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingTop: 6,
    zIndex: 50,
    ...SHADOW,
    ...(Platform.OS === "web"
      ? ({ boxShadow: "0 10px 28px rgba(12,44,32,0.16)" } as any)
      : null),
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    marginBottom: 2,
  },
  hint: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: "700",
  },
  arrow: {
    width: 32,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowOff: { opacity: 0.35 },
  arrowSpacer: { width: 32 },
  arrowTxt: { fontSize: 22, fontWeight: "800", color: COLORS.primaryDark, lineHeight: 24 },
  scroll: { maxHeight: 96 },
  row: {
    paddingHorizontal: 4,
    alignItems: "center",
    paddingBottom: 6,
    flexDirection: "row",
  },
  item: {
    width: ANCHO_ITEM,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    borderRadius: 16,
  },
  itemOn: {
    backgroundColor: COLORS.mist,
  },
  label: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  labelOn: { fontWeight: "800" },
});
