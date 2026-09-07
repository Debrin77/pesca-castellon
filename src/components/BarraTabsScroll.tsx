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
import { COLORS } from "../theme";

const ICONO_POR_TAB: Record<string, NombreIcono> = {
  Inicio: "home",
  Mapa: "water",
  Especies: "fish",
  Previsión: "partly-sunny",
  Capturas: "bookmark",
};

/** Ancho pensado para 5 tabs visibles sin forzar scroll en la mayoría de móviles. */
const ANCHO_ITEM = 78;

/**
 * Barra inferior compacta: sin fila «Menú» cuando caben las 5 tabs.
 * Flechas solo si hace falta scroll horizontal.
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
    <>
      {needsScroll ? (
        <View style={styles.topRow}>
          <TouchableOpacity
            style={[styles.arrow, !canLeft && styles.arrowOff]}
            onPress={() => scrollBy(-1)}
            disabled={!canLeft}
            accessibilityLabel="Ver pestañas anteriores"
          >
            <Text style={styles.arrowTxt}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.hint}>Desliza</Text>
          <TouchableOpacity
            style={[styles.arrow, !canRight && styles.arrowOff]}
            onPress={() => scrollBy(1)}
            disabled={!canRight}
            accessibilityLabel="Ver más pestañas"
          >
            <Text style={styles.arrowTxt}>›</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <ScrollView
        ref={scrollRef}
        horizontal
        nestedScrollEnabled
        scrollEnabled={needsScroll}
        showsHorizontalScrollIndicator={needsScroll}
        persistentScrollbar={Platform.OS === "android" && needsScroll}
        bounces={needsScroll}
        decelerationRate="fast"
        snapToInterval={ANCHO_ITEM}
        snapToAlignment="start"
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.row,
          { width: Math.max(contentW, viewportW || contentW) },
          !needsScroll && styles.rowCentered,
        ]}
        style={[
          styles.scroll,
          Platform.OS === "web"
            ? ({ overflowX: needsScroll ? "scroll" : "hidden", overflowY: "hidden", WebkitOverflowScrolling: "touch" } as any)
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
              <TabIcon nombre={iconName} size={26} focused={focused} />
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
    </>
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
    borderRadius: 22,
    overflow: "hidden",
    zIndex: 50,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(20,60,40,0.12)",
    ...(Platform.OS === "web"
      ? ({
          backgroundColor: "rgba(250,252,250,0.92)",
          backdropFilter: "blur(18px) saturate(140%)",
          WebkitBackdropFilter: "blur(18px) saturate(140%)",
          boxShadow: "0 8px 24px rgba(12,44,32,0.12)",
        } as any)
      : {
          backgroundColor: "transparent",
          shadowColor: "#0c2c20",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.12,
          shadowRadius: 14,
          elevation: 8,
        }),
  },
  glassFill: {
    flexGrow: 0,
    paddingTop: 4,
  },
  glassTint: {
    backgroundColor: "rgba(250,252,250,0.65)",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    marginBottom: 0,
  },
  hint: {
    flex: 1,
    textAlign: "center",
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  arrow: {
    width: 28,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowOff: { opacity: 0.4 },
  arrowTxt: { fontSize: 18, fontWeight: "800", color: COLORS.primaryDark, lineHeight: 20 },
  scroll: { maxHeight: 72 },
  row: {
    paddingHorizontal: 4,
    alignItems: "center",
    paddingBottom: 4,
    flexDirection: "row",
  },
  rowCentered: {
    justifyContent: "space-evenly",
  },
  item: {
    width: ANCHO_ITEM,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 2,
    borderRadius: 14,
  },
  itemOn: {
    backgroundColor: "rgba(255,255,255,0.85)",
  },
  label: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
  labelOn: { fontWeight: "800", color: COLORS.textPrimary },
});
