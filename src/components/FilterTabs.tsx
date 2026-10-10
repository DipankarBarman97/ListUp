// A row of pill-shaped filter chips: ( All 5 ) ( Active 3 ) ( Done 2 )
// It only shows the chips. The parent keeps track of which chip is selected
// and decides which items to display.

import { ColorPalette } from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Tab<T extends string> = {
  key: T;
  label: string;
  count?: number; // shown in a small badge next to the label when provided
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
    // Horizontal scroll keeps the chips on one row even with many tabs
    // or large system font sizes.
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        keyboardShouldPersistTaps="handled"
      >
        {tabs.map((tab) => {
          const active = tab.key === value;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.chip, active && styles.activeChip]}
              onPress={() => onChange(tab.key)}
              activeOpacity={0.8}
              accessibilityRole="tab"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.label, active && styles.activeLabel]}>
                {tab.label}
              </Text>
              {tab.count !== undefined && (
                <View style={[styles.badge, active && styles.activeBadge]}>
                  <Text style={[styles.badgeText, active && styles.activeLabel]}>
                    {tab.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    wrapper: {
      marginBottom: 12,
      // ScrollView would otherwise stretch to fill the screen height
      flexGrow: 0,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    // Unselected: soft tinted pill with primary-colored text
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 999,
      backgroundColor: `${colors.primary}1F`,
    },
    // Selected: solid primary pill
    activeChip: {
      backgroundColor: colors.primary,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.primary,
    },
    activeLabel: {
      color: colors.white,
    },
    badge: {
      minWidth: 20,
      height: 20,
      paddingHorizontal: 6,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: `${colors.primary}26`,
    },
    activeBadge: {
      backgroundColor: "rgba(255, 255, 255, 0.25)",
    },
    badgeText: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.primary,
    },
  });
}
