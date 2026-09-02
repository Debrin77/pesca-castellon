import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import TabIcon, { NombreIcono } from "./src/components/TabIcon";
import { StatusBar } from "expo-status-bar";

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
  headerStyle: { backgroundColor: COLORS.primary },
  headerTintColor: "#fff",
  headerTitleStyle: { fontWeight: "700" as const },
};

function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={stackScreenOptions}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} options={{ title: "🎣 Pesca Castellón" }} />
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
            left: 14,
            right: 14,
            bottom: 18,
            height: 68,
            borderRadius: 26,
            backgroundColor: COLORS.surface,
            borderTopWidth: 0,
            paddingBottom: 10,
            paddingTop: 10,
            shadowColor: "#0f3d29",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 16,
            elevation: 10,
          },
          tabBarLabelStyle: { fontSize: 10.5, fontWeight: "700" as const },
           tabBarIcon: ({ color, focused, size }) => ( <TabIcon nombre={ICONOS[route.name] ?? "home"} size={focused ? size + 2 : size} color={color} /> ),
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
