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
import { BlurView } from "expo-blur";
import TabIcon from "./TabIcon";
import { COLOR_TAB, NombreIcono } from "./tabTheme";
import { COLORS, RADIUS } from "../theme";

const ICONO_POR_TAB: Record<string, NombreIcono> = {
  Inicio: "home",
  Mapa: "water",
  Especies: "fish",
  Aparejos: "construct",
  Consejos: "book",
  Previsión: "partly-sunny",
  Capturas: "bookmark",
};

/** Ancho a propósito: en móvil solo caben 3–4 → hay que deslizar. */
const ANCHO_ITEM = 88;

/**
 * Barra inferior con scroll + vidrio sobrio (menos “juguete”, más app).
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

  const body = (
    <View style={styles.inner}>
      {needsScroll && (
        <TouchableOpacity
          style={[styles.edgeBtn, styles.edgeLeft, !canLeft && styles.edgeOff]}
          onPress={() => scrollBy(-1)}
          disabled={!canLeft}
          accessibilityLabel="Ver pestañas anteriores"
        >
          <Text style={styles.edgeTxt}>‹</Text>
        </TouchableOpacity>
      )}

      <ScrollView
        ref={scrollRef}
        horizontal
        nestedScrollEnabled
        scrollEnabled
        showsHorizontalScrollIndicator={false}
        persistentScrollbar={false}
        bounces
        decelerationRate="fast"
        snapToInterval={ANCHO_ITEM}
        snapToAlignment="start"
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.row, { width: Math.max(contentW, viewportW || contentW) }]}
        style={[
          styles.scroll,
          Platform.OS === "web"
            ? ({ overflowX: "scroll", overflowY: "hidden", WebkitOverflowScrolling: "touch" } as any)
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
              activeOpacity={0.8}
            >
              <TabIcon nombre={iconName} size={24} focused={focused} />
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

      {needsScroll && (
        <TouchableOpacity
          style={[styles.edgeBtn, styles.edgeRight, !canRight && styles.edgeOff]}
          onPress={() => scrollBy(1)}
          disabled={!canRight}
          accessibilityLabel="Ver más pestañas"
        >
          <Text style={styles.edgeTxt}>›</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View
      nativeID="barra-tabs-scroll"
      style={[styles.shell, { paddingBottom: Math.max(insets.bottom, 8) }]}
      onLayout={onShellLayout}
    >
      {Platform.OS === "web" ? (
        <View style={styles.glassFill}>{body}</View>
      ) : (
        <BlurView intensity={48} tint="light" style={styles.glassFill}>
          <View style={styles.glassTint}>{body}</View>
        </BlurView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 8,
    borderRadius: RADIUS.xl,
    overflow: "hidden",
    zIndex: 50,
    borderWidth: 1,
    borderColor: "rgba(216,226,219,0.95)",
    ...(Platform.OS === "web"
      ? ({
          backgroundColor: "rgba(247,250,247,0.94)",
          backdropFilter: "blur(18px) saturate(140%)",
          WebkitBackdropFilter: "blur(18px) saturate(140%)",
          boxShadow: "0 10px 28px rgba(12,44,32,0.14)",
        } as any)
      : {
          backgroundColor: "transparent",
          shadowColor: "#0c2c20",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.14,
          shadowRadius: 16,
          elevation: 10,
        }),
  },
  glassFill: {
    flexGrow: 0,
    paddingTop: 8,
  },
  glassTint: {
    backgroundColor: "rgba(247,250,247,0.78)",
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
  },
  edgeBtn: {
    width: 28,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  edgeLeft: { marginLeft: 2 },
  edgeRight: { marginRight: 2 },
  edgeOff: { opacity: 0.28 },
  edgeTxt: { fontSize: 22, fontWeight: "700", color: COLORS.primaryDark, lineHeight: 24 },
  scroll: { flex: 1, maxHeight: 78 },
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
    backgroundColor: "rgba(255,255,255,0.85)",
  },
  label: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.05,
  },
  labelOn: { fontWeight: "800" },
});
