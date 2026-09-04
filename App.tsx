import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { NavigationContainer, DefaultTheme, NavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts, SourceSans3_400Regular, SourceSans3_600SemiBold, SourceSans3_700Bold, SourceSans3_800ExtraBold } from "@expo-google-fonts/source-sans-3";
import { aplicarEstilosWeb } from "./src/webChrome";
import BarraTabsScroll from "./src/components/BarraTabsScroll";
import PantallaBloqueo from "./src/components/PantallaBloqueo";
import { AccesoProvider } from "./src/context/AccesoContext";
import { ProvinciaProvider, useProvincia } from "./src/context/ProvinciaContext";
import { PuntoConsultaProvider } from "./src/context/PuntoConsultaContext";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import SelectorProvinciaScreen from "./src/screens/SelectorProvinciaScreen";
import { onboardingVisto } from "./src/services/offlineService";

aplicarEstilosWeb();

import HomeScreen from "./src/screens/HomeScreen";
import ZonasLibresScreen from "./src/screens/ZonasLibresScreen";
import EspeciesScreen from "./src/screens/EspeciesScreen";
import AparejosScreen from "./src/screens/AparejosScreen";
import PrevisionScreen from "./src/screens/PrevisionScreen";
import ZoneDetailScreen from "./src/screens/ZoneDetailScreen";
import LicenseScreen from "./src/screens/LicenseScreen";
import MyCatchesScreen from "./src/screens/MyCatchesScreen";
import ConsejosScreen from "./src/screens/ConsejosScreen";
import AjustesScreen from "./src/screens/AjustesScreen";
import SalgoAPescarScreen from "./src/screens/SalgoAPescarScreen";
import { COLORS } from "./src/theme";

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const ZonasLibresStack = createNativeStackNavigator();
const EspeciesStack = createNativeStackNavigator();
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
  headerTitleStyle: { fontWeight: "700" as const, fontSize: 17, fontFamily: "SourceSans3_700Bold" },
};

function HomeStackScreen() {
  const { provincia } = useProvincia();
  return (
    <HomeStack.Navigator screenOptions={stackScreenOptions}>
      <HomeStack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{ title: provincia?.nombreApp ?? "Pesca" }}
      />
      <HomeStack.Screen name="ZoneDetail" component={ZoneDetailScreen} options={{ title: "Detalle de zona" }} />
      <HomeStack.Screen name="License" component={LicenseScreen} options={{ title: "Licencia de pesca" }} />
      <HomeStack.Screen name="Ajustes" component={AjustesScreen} options={{ title: "Ajustes" }} />
      <HomeStack.Screen name="SalgoAPescar" component={SalgoAPescarScreen} options={{ title: "Salgo a pescar" }} />
      <HomeStack.Screen name="Aparejos" component={AparejosScreen} options={{ title: "Aparejos" }} />
      <HomeStack.Screen name="Consejos" component={ConsejosScreen} options={{ title: "Consejos" }} />
    </HomeStack.Navigator>
  );
}

function ZonasLibresStackScreen() {
  const { provincia } = useProvincia();
  return (
    <ZonasLibresStack.Navigator screenOptions={stackScreenOptions}>
      <ZonasLibresStack.Screen
        name="ZonasLibresMain"
        component={ZonasLibresScreen}
        options={{ title: provincia ? `Mapa · ${provincia.nombre}` : "Mapa" }}
      />
      <ZonasLibresStack.Screen name="ZoneDetail" component={ZoneDetailScreen} options={{ title: "Detalle de zona" }} />
      <ZonasLibresStack.Screen name="License" component={LicenseScreen} options={{ title: "Licencia de pesca" }} />
      <ZonasLibresStack.Screen name="Aparejos" component={AparejosScreen} options={{ title: "Aparejos" }} />
    </ZonasLibresStack.Navigator>
  );
}

function EspeciesStackScreen() {
  const { provincia } = useProvincia();
  return (
    <EspeciesStack.Navigator screenOptions={stackScreenOptions}>
      <EspeciesStack.Screen
        name="EspeciesMain"
        component={EspeciesScreen}
        options={{ title: provincia ? `Especies · ${provincia.nombre}` : "Especies" }}
      />
      <EspeciesStack.Screen name="ZoneDetail" component={ZoneDetailScreen} options={{ title: "Detalle de zona" }} />
      <EspeciesStack.Screen name="License" component={LicenseScreen} options={{ title: "Licencia de pesca" }} />
      <EspeciesStack.Screen name="Aparejos" component={AparejosScreen} options={{ title: "Aparejos" }} />
    </EspeciesStack.Navigator>
  );
}

function PrevisionStackScreen() {
  return (
    <PrevisionStack.Navigator
      screenOptions={{
        ...stackScreenOptions,
        headerTransparent: true,
        headerStyle: { backgroundColor: "transparent" },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "700" as const,
          fontSize: 17,
          fontFamily: "SourceSans3_700Bold",
          color: "#fff",
        },
      }}
    >
      <PrevisionStack.Screen
        name="PrevisionMain"
        component={PrevisionScreen}
        options={{ title: "Previsión" }}
      />
    </PrevisionStack.Navigator>
  );
}

function CapturasStackScreen() {
  return (
    <CapturasStack.Navigator screenOptions={stackScreenOptions}>
      <CapturasStack.Screen name="CapturasMain" component={MyCatchesScreen} options={{ title: "Capturas" }} />
      <CapturasStack.Screen name="ZoneDetail" component={ZoneDetailScreen} options={{ title: "Detalle de zona" }} />
    </CapturasStack.Navigator>
  );
}

const TAB_RAIZ: Record<string, { stack: string; screen: string }> = {
  Inicio: { stack: "Inicio", screen: "HomeMain" },
  Mapa: { stack: "Mapa", screen: "ZonasLibresMain" },
  Especies: { stack: "Especies", screen: "EspeciesMain" },
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

function AppNavegacion({ provinciaKey }: { provinciaKey: string }) {
  const navRef = useRef<NavigationContainerRef<any>>(null);

  useEffect(() => {
    if (Platform.OS === "web") return;
    let sub: { remove: () => void } | undefined;
    (async () => {
      try {
        const Notifications = await import("expo-notifications");
        sub = Notifications.addNotificationResponseReceivedListener((resp) => {
          const data = resp.notification.request.content.data as any;
          if (data?.pantalla === "SalgoAPescar") {
            navRef.current?.navigate("Inicio", { screen: "SalgoAPescar" });
          } else if (data?.pantalla === "Previsión") {
            navRef.current?.navigate("Previsión");
          } else if (data?.pantalla === "Mapa") {
            navRef.current?.navigate("Mapa");
          }
        });
      } catch {
        /* web / sin notificaciones */
      }
    })();
    return () => sub?.remove();
  }, []);

  return (
    <NavigationContainer key={provinciaKey} theme={navTheme} ref={navRef}>
      <StatusBar style="light" />
      <Tab.Navigator
        tabBar={(props) => <BarraTabsScroll {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
        }}
      >
        <Tab.Screen name="Inicio" component={HomeStackScreen} options={{ title: "Inicio" }} listeners={listenerIrArriba("Inicio")} />
        <Tab.Screen name="Mapa" component={ZonasLibresStackScreen} options={{ title: "Mapa" }} listeners={listenerIrArriba("Mapa")} />
        <Tab.Screen name="Especies" component={EspeciesStackScreen} options={{ title: "Especies" }} listeners={listenerIrArriba("Especies")} />
        <Tab.Screen name="Previsión" component={PrevisionStackScreen} options={{ title: "Previsión" }} listeners={listenerIrArriba("Previsión")} />
        <Tab.Screen name="Capturas" component={CapturasStackScreen} options={{ title: "Capturas" }} listeners={listenerIrArriba("Capturas")} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

function AppRaiz() {
  const { listo, provinciaId } = useProvincia();
  const [listoOnboarding, setListoOnboarding] = useState(false);
  const [mostrarOnboarding, setMostrarOnboarding] = useState(false);

  useEffect(() => {
    onboardingVisto().then((visto) => {
      setMostrarOnboarding(!visto);
      setListoOnboarding(true);
    });
  }, []);

  if (!listo || !listoOnboarding) {
    return <View style={[styles.root, { backgroundColor: COLORS.primaryDark }]} />;
  }

  if (!provinciaId) {
    return <SelectorProvinciaScreen />;
  }

  return (
    <View style={styles.root}>
      {mostrarOnboarding ? (
        <OnboardingScreen onDone={() => setMostrarOnboarding(false)} />
      ) : (
        <>
          <AppNavegacion provinciaKey={provinciaId} />
          <PantallaBloqueo />
        </>
      )}
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    SourceSans3_400Regular,
    SourceSans3_600SemiBold,
    SourceSans3_700Bold,
    SourceSans3_800ExtraBold,
  });

  if (!fontsLoaded) {
    return <View style={[styles.root, { backgroundColor: COLORS.primaryDark }]} />;
  }

  return (
    <SafeAreaProvider>
      <ProvinciaProvider>
        <PuntoConsultaProvider>
          <AccesoProvider>
            <AppRaiz />
          </AccesoProvider>
        </PuntoConsultaProvider>
      </ProvinciaProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
