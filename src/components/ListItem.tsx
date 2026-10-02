// One item inside a list. Tap the box to check it off, tap the text to open
// the item's details page, pencil to edit, bin to delete.
// Long names are cut with "..." (the details page shows the full name).
// Under the name: due date (red when overdue), price and quantity, each on its own.
// Editing is done in the shared ItemModal, opened by the screen.
// Deleting asks first, using the shared ConfirmModal.

import { ColorPalette } from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";
import { Item } from "@/types";
import { formatDueDate, isOverdue } from "@/utils/dates";
import { formatPrice } from "@/utils/formatPrice";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ConfirmModal from "./ConfirmModal";

type Props = {
  item: Item;
  onPress: () => void; // the screen opens the details page when this is called
  onToggle: () => void;
  onEdit: () => void; // the screen opens the modal when this is called
  onDelete: () => void; // called only AFTER the user confirms
};

export default function ListItem({
  item,
  onPress,
  onToggle,
  onEdit,
  onDelete,
}: Props) {
  const { colors } = useTheme(); // the colors for the current mode
  const styles = makeStyles(colors);

  // Is the "Delete item?" popup open?
  const [showConfirm, setShowConfirm] = useState(false);

  // Overdue only matters while the item is not done
  const overdue =
    !item.done && item.dueDate !== undefined && isOverdue(item.dueDate);
  const hasMeta =
    item.dueDate !== undefined ||
    item.price !== undefined ||
    item.quantity !== undefined;

  // One small detail: icon + text, e.g. [calendar] Today
  function renderMeta(
    icon: keyof typeof Ionicons.glyphMap,
    label: string,
    danger = false,
  ) {
    return (
      <View style={styles.metaChip}>
        <Ionicons
          name={icon}
          size={13}
          color={danger ? colors.danger : colors.mutedText}
        />
        <Text style={[styles.metaText, danger && styles.overdueText]}>
          {label}
        </Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.row}>
        {/* Checkbox */}
        <TouchableOpacity
          onPress={onToggle}
          hitSlop={10}
          accessibilityLabel={item.done ? "Mark as not done" : "Mark as done"}
        >
          <Ionicons
            name={item.done ? "checkbox" : "square-outline"}
            size={24}
            color={item.done ? colors.primary : colors.mutedText}
          />
        </TouchableOpacity>

        {/* Tap the name and details to open the details page */}
        <TouchableOpacity
          style={styles.content}
          onPress={onPress}
          activeOpacity={0.7}
          accessibilityLabel={`Open ${item.text}`}
        >
          <Text
            style={[styles.text, item.done && styles.textDone]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.text}
          </Text>

          {hasMeta && (
            <View style={styles.metaRow}>
              {item.dueDate !== undefined &&
                renderMeta(
                  "calendar-outline",
                  formatDueDate(item.dueDate),
                  overdue,
                )}
              {item.price !== undefined &&
                renderMeta("pricetag-outline", formatPrice(item.price))}
              {item.quantity !== undefined &&
                renderMeta("cube-outline", `Qty ${item.quantity}`)}
            </View>
          )}
        </TouchableOpacity>

        {/* Edit and delete buttons */}
        <TouchableOpacity
          onPress={onEdit}
          hitSlop={10}
          accessibilityLabel="Edit item"
        >
          <Ionicons name="create-outline" size={22} color={colors.mutedText} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowConfirm(true)}
          hitSlop={10}
          style={styles.deleteButton}
          accessibilityLabel="Delete item"
        >
          <Ionicons name="trash-outline" size={22} color={colors.danger} />
        </TouchableOpacity>
      </View>

      <ConfirmModal
        visible={showConfirm}
        title="Delete item?"
        message={`"${item.text}" will be removed from this list.`}
        confirmLabel="Delete"
        destructive
        onConfirm={onDelete}
        onClose={() => setShowConfirm(false)}
      />
    </>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.glass,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 8,
    },
    content: {
      flex: 1,
      marginHorizontal: 12,
    },
    text: {
      fontSize: 16,
      color: colors.text,
    },
    textDone: {
      textDecorationLine: "line-through",
      color: colors.doneText,
    },
    metaRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      columnGap: 12,
      rowGap: 2,
      marginTop: 4,
    },
    metaChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    metaText: {
      fontSize: 13,
      color: colors.mutedText,
    },
    overdueText: {
      color: colors.danger,
      fontWeight: "600",
    },
    deleteButton: {
      marginLeft: 14,
    },
  });
}
