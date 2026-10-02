// Very faint colored circles that sit BEHIND the list.
// Glass is see-through, so it needs a hint of color behind it to look like glass.
// Put <ScreenBackground /> as the first thing inside a screen's SafeAreaView.

import { ColorPalette } from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";
import { StyleSheet, View } from "react-native";

const TOP_CIRCLE_OPACITY = 0.04;
const MIDDLE_CIRCLE_OPACITY = 0.04;

export default function ScreenBackground() {
  const { colors } = useTheme(); // the colors for the current mode
  const styles = makeStyles(colors);

  return (
    // absoluteFill = cover the whole screen; "none" = never block taps
    <View style={[StyleSheet.absoluteFill, styles.wrapper]}>
      <View style={styles.circleTop} />
      <View style={styles.circleMiddle} />
    </View>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    wrapper: {
      pointerEvents: "none",
      overflow: "hidden", // cut off the parts of circles that go past the screen
    },
    circleTop: {
      position: "absolute",
      top: -40,
      right: -70,
      width: 260,
      height: 260,
      borderRadius: 130,
      backgroundColor: colors.primary,
      opacity: TOP_CIRCLE_OPACITY,
    },
    circleMiddle: {
      position: "absolute",
      top: 260,
      left: -110,
      width: 300,
      height: 300,
      borderRadius: 150,
      backgroundColor: colors.accent,
      opacity: MIDDLE_CIRCLE_OPACITY,
    },
  });
}
