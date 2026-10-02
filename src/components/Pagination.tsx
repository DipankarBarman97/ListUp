// A row of page buttons: [<] 1 ... 4 [5] 6 ... 12 [>]
// It only shows the buttons. The parent keeps track of the current page
// and decides which items to display (see the usage example below).

import { ColorPalette } from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type PaginationProps = {
  currentPage: number; // starts at 1
  totalPages: number;
  onPageChange: (page: number) => void;
};

// Work out which buttons to show. Always shows the first page, the last page,
// and the pages right next to the current one. Gaps become "...".
// Example: current 6 of 12 -> [1, "...", 5, 6, 7, "...", 12]
function getPageItems(current: number, total: number): (number | "...")[] {
  const wanted = new Set<number>([1, total, current - 1, current, current + 1]);
  const pages = [...wanted]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);

  const items: (number | "...")[] = [];
  pages.forEach((page, index) => {
    if (index > 0) {
      const gap = page - pages[index - 1];
      if (gap === 2) {
        items.push(page - 1); // only one page missing: show it instead of "..."
      } else if (gap > 2) {
        items.push("...");
      }
    }
    items.push(page);
  });
  return items;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  // Nothing to paginate
  if (totalPages <= 1) {
    return null;
  }

  const isFirst = currentPage <= 1;
  const isLast = currentPage >= totalPages;

  return (
    <View style={styles.row}>
      {/* Previous */}
      <TouchableOpacity
        style={[styles.button, isFirst && styles.disabled]}
        onPress={() => onPageChange(currentPage - 1)}
        disabled={isFirst}
        accessibilityLabel="Previous page"
      >
        <Ionicons name="chevron-back" size={18} color={colors.text} />
      </TouchableOpacity>

      {/* Page numbers */}
      {getPageItems(currentPage, totalPages).map((item, index) => {
        if (item === "...") {
          return (
            <Text key={`dots-${index}`} style={styles.dots}>
              ...
            </Text>
          );
        }

        const active = item === currentPage;
        return (
          <TouchableOpacity
            key={item}
            style={[styles.button, active && styles.activeButton]}
            onPress={() => onPageChange(item)}
            accessibilityLabel={`Page ${item}`}
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.label, active && styles.activeLabel]}>
              {item}
            </Text>
          </TouchableOpacity>
        );
      })}

      {/* Next */}
      <TouchableOpacity
        style={[styles.button, isLast && styles.disabled]}
        onPress={() => onPageChange(currentPage + 1)}
        disabled={isLast}
        accessibilityLabel="Next page"
      >
        <Ionicons name="chevron-forward" size={18} color={colors.text} />
      </TouchableOpacity>
    </View>
  );
}

// Total height of the pagination row. Screens use it to lift the + button.
export const PAGINATION_HEIGHT = 54;

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    row: {
      height: PAGINATION_HEIGHT,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      paddingTop: 12,
      paddingBottom: 8,
    },
    button: {
      minWidth: 34,
      height: 34,
      paddingHorizontal: 8,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    activeButton: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    disabled: {
      opacity: 0.4,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
    },
    activeLabel: {
      color: colors.white,
    },
    dots: {
      width: 18,
      textAlign: "center",
      color: colors.mutedText,
      fontSize: 14,
    },
  });
}
