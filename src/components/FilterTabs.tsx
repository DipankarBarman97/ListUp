// A row of tabs for filtering a list: [ All 5 | Active 3 | Done 2 ]
// It only shows the tabs. The parent keeps track of which tab is selected
// and decides which items to display.

import { ColorPalette } from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Tab<T extends string> = {
  key: T;
  label: string;
  count?: number; // shown after the label when provided
};

type Props<T extends string> = {
  tabs: Tab<T>[];
  value: T; // the key of the selected tab
  onChange: (key: T) => void;
};

export default function FilterTabs<T extends string>({
  tabs,
  value,
  onChange,
}: Props<T>) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  return (
    <View style={styles.row}>
      {tabs.map((tab) => {
        const active = tab.key === value;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, active && styles.activeTab]}
            onPress={() => onChange(tab.key)}
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.label, active && styles.activeLabel]}>
              {tab.count === undefined
                ? tab.label
                : `${tab.label} (${tab.count})`}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      gap: 4,
      padding: 4,
      marginBottom: 12,
      borderRadius: 12,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tab: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
    },
    activeTab: {
      backgroundColor: colors.primary,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.mutedText,
    },
    activeLabel: {
      color: colors.white,
    },
  });
}
