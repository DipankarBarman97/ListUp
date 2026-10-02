// The root of the app. Expo Router runs this first.
// It wraps every screen with the providers and sets up the navigation header.

import GradientBox from "@/components/GradientBox";
import { ListsProvider } from "@/context/ListsContext";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

// This part sits INSIDE ThemeProvider, so it is allowed to call useTheme()
function RootStack() {
  const { colors, isDark, toggleTheme } = useTheme();

  return (
    <>
      {/* The header is blue in both modes, so the status bar icons stay light */}
      <StatusBar style="light" />

      <Stack
        screenOptions={{
          // Solid color first, then the gradient is drawn on top of it
          headerStyle: { backgroundColor: colors.primary },
          headerBackground: () => (
            <GradientBox style={StyleSheet.absoluteFill} />
          ),
          headerTintColor: colors.white,
          headerTitleStyle: { fontWeight: "600" },
          // Screen background while moving between screens (avoids a white flash in dark mode)
          contentStyle: { backgroundColor: colors.background },
          // Sun / moon button on the right of every header
          headerRight: () => (
            <TouchableOpacity onPress={toggleTheme} hitSlop={10}>
              <Ionicons
                name={isDark ? "sunny-outline" : "moon-outline"}
                size={22}
                color={colors.white}
              />
            </TouchableOpacity>
          ),
        }}
      >
        {/* src/app/index.tsx */}
        <Stack.Screen name="index" options={{ title: "My Lists" }} />
        {/* src/app/list/[id].tsx */}
        <Stack.Screen name="list/[id]" options={{ title: "List" }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ListsProvider>
          <RootStack />
        </ListsProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
