// One item inside a list. Tap the box to check it off, pencil to edit, bin to delete.
// Editing is done in the shared InputModal, opened by the screen.
// Deleting asks first, using the shared ConfirmModal.

import { ColorPalette } from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";
import { Item } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ConfirmModal from "./ConfirmModal";

type Props = {
  item: Item;
  onToggle: () => void;
  onEdit: () => void; // the screen opens the modal when this is called
  onDelete: () => void; // called only AFTER the user confirms
};

export default function ListItem({ item, onToggle, onEdit, onDelete }: Props) {
  const { colors } = useTheme(); // the colors for the current mode
  const styles = makeStyles(colors);

  // Is the "Delete item?" popup open?
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <>
      <View style={styles.row}>
        {/* Checkbox */}
        <TouchableOpacity onPress={onToggle} hitSlop={10}>
          <Ionicons
            name={item.done ? "checkbox" : "square-outline"}
            size={24}
            color={item.done ? colors.primary : colors.mutedText}
          />
        </TouchableOpacity>

        {/* Item text */}
        <Text style={[styles.text, item.done && styles.textDone]}>
          {item.text}
        </Text>

        {/* Edit and delete buttons */}
        <TouchableOpacity onPress={onEdit} hitSlop={10}>
          <Ionicons name="create-outline" size={22} color={colors.mutedText} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowConfirm(true)}
          hitSlop={10}
          style={styles.deleteButton}
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
    text: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
      marginHorizontal: 12,
    },
    textDone: {
      textDecorationLine: "line-through",
      color: colors.doneText,
    },
    deleteButton: {
      marginLeft: 14,
    },
  });
}
