// Decides which colors the app uses (light or dark) and shares them with every screen.
// - By default it follows the phone's own light/dark setting.
// - If the user taps the sun/moon button, their choice is saved and used from then on.
// Any component can call useTheme() to get the right colors.

import { ColorPalette, darkColors, lightColors } from "@/constants/colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { useColorScheme } from "react-native";

type ThemeChoice = "light" | "dark";

// Everything the context gives to the components
type ThemeContextType = {
  colors: ColorPalette; // the colors to use right now
  isDark: boolean; // true when dark mode is on
  toggleTheme: () => void; // switch between light and dark
};

// The label the user's choice is saved under on the phone
const THEME_KEY = "listup-theme";

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // The phone's own setting: "light", "dark" (or nothing)
  const systemScheme = useColorScheme();

  // The user's saved choice. null = they never chose, so follow the phone.
  const [savedChoice, setSavedChoice] = useState<ThemeChoice | null>(null);

  // LOAD the saved choice once when the app opens
  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY)
      .then((value) => {
        if (value === "light" || value === "dark") {
          setSavedChoice(value);
        }
      })
      .catch((error) => console.log("Could not load theme", error));
  }, []);

  // The user's choice wins. If there is none, follow the phone.
  const isDark =
    savedChoice !== null ? savedChoice === "dark" : systemScheme === "dark";

  function toggleTheme() {
    const next: ThemeChoice = isDark ? "light" : "dark";
    setSavedChoice(next);
    AsyncStorage.setItem(THEME_KEY, next).catch((error) =>
      console.log("Could not save theme", error),
    );
  }

  const value: ThemeContextType = {
    colors: isDark ? darkColors : lightColors,
    isDark,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// The hook components use to get the colors
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === null) {
    throw new Error("useTheme must be used inside <ThemeProvider>");
  }
  return context;
}
