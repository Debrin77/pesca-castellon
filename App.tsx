import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { aplicarEstilosWeb } from "./src/webChrome";
import TabIcon, { NombreIcono } from "./src/components/TabIcon";

aplicarEstilosWeb();

import HomeScreen from "./src/screens/HomeScreen";
import ZonasLibresScreen from "./src/screens/ZonasLibresScreen";
import EspeciesScreen from "./src/screens/EspeciesScreen";
import AparejosScreen from "./src/screens/AparejosScreen";
import PrevisionScreen from "./src/screens/PrevisionScreen";
import ZoneDetailScreen from "./src/screens/ZoneDetailScreen";
import LicenseScreen from "./src/screens/LicenseScreen";
import MyCatchesScreen from "./src/screens/MyCatchesScreen";
import { COLORS } from "./src/theme";

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const ZonasLibresStack = createNativeStackNavigator();
const EspeciesStack = createNativeStackNavigator();
const AparejosStack = createNativeStackNavigator();
const PrevisionStack = createNativeStackNavigator();
const CapturasStack = createNativeStackNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, primary: COLORS.primary, background: COLORS.background },
};

const stackScreenOptions = {
  headerStyle: { backgroundColor: COLORS.primaryDark },
  headerTintColor: "#fff",
  headerShadowVisible: false,
  headerTitleStyle: { fontWeight: "700" as const, fontSize: 17 },
};

function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={stackScreenOptions}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} options={{ title: "Pesca Castellón" }} />
      <HomeStack.Screen name="ZoneDetail" component={ZoneDetailScreen} options={{ title: "Detalle de zona" }} />
      <HomeStack.Screen name="License" component={LicenseScreen} options={{ title: "Licencia de pesca" }} />
    </HomeStack.Navigator>
  );
}

function ZonasLibresStackScreen() {
  return (
    <ZonasLibresStack.Navigator screenOptions={stackScreenOptions}>
      <ZonasLibresStack.Screen name="ZonasLibresMain" component={ZonasLibresScreen} options={{ title: "Mapa" }} />
      <ZonasLibresStack.Screen name="ZoneDetail" component={ZoneDetailScreen} options={{ title: "Detalle de zona" }} />
      <ZonasLibresStack.Screen name="License" component={LicenseScreen} options={{ title: "Licencia de pesca" }} />
    </ZonasLibresStack.Navigator>
  );
}

function EspeciesStackScreen() {
  return (
    <EspeciesStack.Navigator screenOptions={stackScreenOptions}>
      <EspeciesStack.Screen name="EspeciesMain" component={EspeciesScreen} options={{ title: "Especies" }} />
      <EspeciesStack.Screen name="ZoneDetail" component={ZoneDetailScreen} options={{ title: "Detalle de zona" }} />
      <EspeciesStack.Screen name="License" component={LicenseScreen} options={{ title: "Licencia de pesca" }} />
    </EspeciesStack.Navigator>
  );
}

function AparejosStackScreen() {
  return (
    <AparejosStack.Navigator screenOptions={stackScreenOptions}>
      <AparejosStack.Screen name="AparejosMain" component={AparejosScreen} options={{ title: "Aparejos" }} />
    </AparejosStack.Navigator>
  );
}

function PrevisionStackScreen() {
  return (
    <PrevisionStack.Navigator screenOptions={stackScreenOptions}>
      <PrevisionStack.Screen name="PrevisionMain" component={PrevisionScreen} options={{ title: "Previsión" }} />
    </PrevisionStack.Navigator>
  );
}

function CapturasStackScreen() {
  return (
    <CapturasStack.Navigator screenOptions={stackScreenOptions}>
      <CapturasStack.Screen name="CapturasMain" component={MyCatchesScreen} options={{ title: "Capturas" }} />
    </CapturasStack.Navigator>
  );
}

const ICONOS: Record<string, NombreIcono> = {
  Inicio: "home",
  Mapa: "water",
  Especies: "fish",
  Aparejos: "construct",
  Previsión: "partly-sunny",
  Capturas: "bookmark",
};

const TAB_RAIZ: Record<string, { stack: string; screen: string }> = {
  Inicio: { stack: "Inicio", screen: "HomeMain" },
  Mapa: { stack: "Mapa", screen: "ZonasLibresMain" },
  Especies: { stack: "Especies", screen: "EspeciesMain" },
  Aparejos: { stack: "Aparejos", screen: "AparejosMain" },
  Previsión: { stack: "Previsión", screen: "PrevisionMain" },
  Capturas: { stack: "Capturas", screen: "CapturasMain" },
};

function listenerIrArriba(nombreTab: string) {
  return ({ navigation }: { navigation: any }) => ({
    tabPress: () => {
      const dest = TAB_RAIZ[nombreTab];
      if (!dest) return;
      navigation.navigate(dest.stack, { screen: dest.screen });
    },
  });
}

export default function App() {
  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textMuted,
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            position: "absolute",
            left: 8,
            right: 8,
            bottom: 10,
            height: 62,
            borderRadius: 20,
            backgroundColor: COLORS.surface,
            borderTopWidth: 0,
            paddingBottom: 6,
            paddingTop: 6,
            shadowColor: COLORS.primaryDark,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.1,
            shadowRadius: 16,
            elevation: 12,
          },
          tabBarLabelStyle: { fontSize: 9, fontWeight: "700" as const, letterSpacing: 0.1 },
          tabBarIcon: ({ color, focused, size }) => (
            <TabIcon nombre={ICONOS[route.name] ?? "home"} size={focused ? size + 1 : size - 1} color={color} />
          ),
        })}
      >
        <Tab.Screen name="Inicio" component={HomeStackScreen} listeners={listenerIrArriba("Inicio")} />
        <Tab.Screen name="Mapa" component={ZonasLibresStackScreen} listeners={listenerIrArriba("Mapa")} />
        <Tab.Screen name="Especies" component={EspeciesStackScreen} listeners={listenerIrArriba("Especies")} />
        <Tab.Screen name="Aparejos" component={AparejosStackScreen} listeners={listenerIrArriba("Aparejos")} />
        <Tab.Screen name="Previsión" component={PrevisionStackScreen} listeners={listenerIrArriba("Previsión")} />
        <Tab.Screen name="Capturas" component={CapturasStackScreen} listeners={listenerIrArriba("Capturas")} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
