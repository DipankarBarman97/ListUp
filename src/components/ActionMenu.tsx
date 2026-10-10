// An "Actions" button that opens a small dropdown menu under it.
// The parent owns the open/closed state, so it can also draw a see-through
// layer behind the menu that closes it when you tap outside.
//
// The menu is drawn right under the button (no popup window), so the parent
// row that holds <ActionMenu /> needs a zIndex higher than the content below.

import { ColorPalette } from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export type MenuAction = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  destructive?: boolean; // shown in red, e.g. Delete
};

type Props = {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  actions: MenuAction[];
};

export default function ActionMenu({
  open,
  onToggle,
  onClose,
  actions,
}: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={[styles.button, open && styles.buttonOpen]}
        onPress={onToggle}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Actions"
        accessibilityState={{ expanded: open }}
      >
        <Ionicons name="ellipsis-horizontal" size={16} color={colors.primary} />
      </TouchableOpacity>

      {open && (
        <View style={styles.menu}>
          {actions.map((action, index) => (
            <View key={action.label}>
              {index > 0 && <View style={styles.divider} />}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  onClose();
                  action.onPress();
                }}
                activeOpacity={0.6}
                accessibilityRole="menuitem"
                accessibilityLabel={action.label}
              >
                <Ionicons
                  name={action.icon}
                  size={18}
                  color={action.destructive ? colors.danger : colors.text}
                />
                <Text
                  style={[
                    styles.menuText,
                    action.destructive && { color: colors.danger },
                  ]}
                >
                  {action.label}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    wrapper: {
      position: "relative",
    },
    button: {
      alignItems: "center",
      justifyContent: "center",
      width: 34,
      height: 34,
      borderRadius: 999,
      backgroundColor: `${colors.primary}1F`,
    },
    buttonOpen: {
      backgroundColor: `${colors.primary}33`,
    },
    menu: {
      position: "absolute",
      top: "100%",
      right: 0,
      marginTop: 8,
      minWidth: 170,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      overflow: "hidden",
      elevation: 8,
      shadowColor: "#000",
      shadowOpacity: 0.15,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 13,
      paddingHorizontal: 16,
    },
    menuText: {
      fontSize: 15,
      fontWeight: "500",
      color: colors.text,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
    },
  });
}
