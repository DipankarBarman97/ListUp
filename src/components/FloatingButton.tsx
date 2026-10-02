// A round "+" button in the primary color, floating in the bottom-right corner.
// It reads the safe-area insets so it stays above the phone's navigation bar.
// Pass bottomOffset to lift it higher (for example, above a pagination row).

import { ColorPalette } from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  onPress: () => void;
  bottomOffset?: number; // extra space from the bottom, default 0
};

export default function FloatingButton({ onPress, bottomOffset = 0 }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme(); // the colors for the current mode
  const styles = makeStyles(colors);

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          bottom: 24 + insets.bottom + bottomOffset,
          right: 24 + insets.right,
        },
      ]}
      onPress={onPress}
      accessibilityLabel="Add"
    >
      <Ionicons name="add" size={32} color={colors.white} />
    </TouchableOpacity>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    button: {
      position: "absolute",
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary,
      elevation: 4,
    },
  });
}
