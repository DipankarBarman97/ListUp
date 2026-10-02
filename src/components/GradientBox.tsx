// A box filled with the app's blue gradient (it changes with light / dark mode).
// Use it anywhere you want the gradient: the header, buttons, and so on.
// You give it a style (size, rounded corners, padding) and put things inside it.

import { useTheme } from "@/context/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import { ReactNode } from "react";
import { StyleProp, ViewStyle } from "react-native";

type Props = {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

export default function GradientBox({ style, children }: Props) {
  const { colors } = useTheme(); // the colors for the current mode

  return (
    <LinearGradient
      colors={colors.gradient} // the two colors to blend
      start={{ x: 0, y: 0 }} // top-left
      end={{ x: 1, y: 1 }} // bottom-right
      style={style}
    >
      {children}
    </LinearGradient>
  );
}
