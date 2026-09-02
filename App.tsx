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
      <HomeStack.Screen name="MyCatches" component={MyCatchesScreen} options={{ title: "Mis puntos y capturas" }} />
    </HomeStack.Navigator>
  );
}

function ZonasLibresStackScreen() {
  return (
    <ZonasLibresStack.Navigator screenOptions={stackScreenOptions}>
      <ZonasLibresStack.Screen name="ZonasLibresMain" component={ZonasLibresScreen} options={{ title: "Zonas libres" }} />
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

const ICONOS: Record<string, NombreIcono> = {
  Inicio: "home",
  "Zonas libres": "water",
  Especies: "fish",
  Aparejos: "construct",
  Previsión: "partly-sunny",
};

export default function App() {
  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textMuted,
          tabBarStyle: {
            position: "absolute",
            left: 12,
            right: 12,
            bottom: 14,
            height: 64,
            borderRadius: 22,
            backgroundColor: COLORS.surface,
            borderTopWidth: 0,
            paddingBottom: 8,
            paddingTop: 8,
            shadowColor: COLORS.primaryDark,
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.12,
            shadowRadius: 20,
            elevation: 12,
          },
          tabBarLabelStyle: { fontSize: 10, fontWeight: "700" as const, letterSpacing: 0.2 },
          tabBarIcon: ({ color, focused, size }) => (
            <TabIcon nombre={ICONOS[route.name] ?? "home"} size={focused ? size + 2 : size} color={color} />
          ),
        })}
      >
        <Tab.Screen name="Inicio" component={HomeStackScreen} />
        <Tab.Screen name="Zonas libres" component={ZonasLibresStackScreen} />
        <Tab.Screen name="Especies" component={EspeciesStackScreen} />
        <Tab.Screen name="Aparejos" component={AparejosScreen} />
        <Tab.Screen name="Previsión" component={PrevisionScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
