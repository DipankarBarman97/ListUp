// The details page for ONE item. It opens when you tap an item in a list.
// Shows everything about the item (full name, due date, price, quantity, total)
// and lets you mark it done, edit it, or delete it.
// The [id] in the file name is the item's id, taken from the URL.

import ConfirmModal from "@/components/ConfirmModal";
import GradientBox from "@/components/GradientBox";
import ItemModal from "@/components/ItemModal";
import ScreenBackground from "@/components/ScreenBackground";
import { ColorPalette } from "@/constants/colors";
import { useLists } from "@/context/ListsContext";
import { useTheme } from "@/context/ThemeContext";
import { Item, List } from "@/types";
import { formatDueDate, isOverdue } from "@/utils/dates";
import { formatPrice, itemTotal } from "@/utils/formatPrice";
import { sameName } from "@/utils/sameName";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type IconName = keyof typeof Ionicons.glyphMap;

// Look through all lists for the item, and return it with the list it is in
function findItem(
  lists: List[],
  id: string | undefined,
): { list: List; item: Item } | null {
  for (const list of lists) {
    const item = list.items.find((i) => i.id === id);
    if (item) return { list, item };
  }
  return null;
}

export default function ItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { lists, toggleItem, editItem, deleteItem } = useLists();
  const { colors } = useTheme(); // the colors for the current mode
  const styles = makeStyles(colors);

  // Which popup is open?
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const found = findItem(lists, id);

  // The item may not exist (for example, if it was deleted)
  if (!found) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: "Item" }} />
        <Text style={styles.emptyText}>This item could not be found.</Text>
      </SafeAreaView>
    );
  }

  const { list, item } = found;
  const overdue =
    !item.done && item.dueDate !== undefined && isOverdue(item.dueDate);

  // One line of the details card: icon + label on the left, value on the right.
  // value = null means "not set".
  function renderRow(
    icon: IconName,
    label: string,
    value: string | null,
    danger = false,
  ) {
    return (
      <View style={styles.row}>
        <View style={styles.rowLabel}>
          <Ionicons name={icon} size={18} color={colors.mutedText} />
          <Text style={styles.rowLabelText}>{label}</Text>
        </View>
        <Text
          style={[
            styles.rowValue,
            value === null && styles.notSet,
            danger && styles.dangerText,
          ]}
        >
          {value ?? "Not set"}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      <ScreenBackground />
      <Stack.Screen options={{ title: "Item details" }} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Full name: wraps over as many lines as it needs */}
        <Text style={[styles.title, item.done && styles.titleDone]}>
          {item.text}
        </Text>

        {/* Done / Active */}
        <View style={styles.statusRow}>
          <Ionicons
            name={item.done ? "checkmark-circle" : "ellipse-outline"}
            size={18}
            color={item.done ? colors.primary : colors.mutedText}
          />
          <Text style={styles.statusLabel}>
            {item.done ? "Done" : "Active"}
          </Text>
        </View>

        {/* Details card */}
        <View style={styles.card}>
          {renderRow("list-outline", "List", list.title)}
          <View style={styles.divider} />
          {renderRow(
            "calendar-outline",
            "Due date",
            item.dueDate !== undefined
              ? `${formatDueDate(item.dueDate)}${overdue ? " (overdue)" : ""}`
              : null,
            overdue,
          )}
          <View style={styles.divider} />
          {renderRow(
            "pricetag-outline",
            "Price",
            item.price !== undefined ? formatPrice(item.price) : null,
          )}
          <View style={styles.divider} />
          {renderRow(
            "cube-outline",
            "Quantity",
            item.quantity !== undefined ? String(item.quantity) : null,
          )}
          {item.price !== undefined && (
            <>
              <View style={styles.divider} />
              {renderRow("cash-outline", "Total", formatPrice(itemTotal(item)))}
            </>
          )}
        </View>

        {/* Main action: mark done / not done */}
        <TouchableOpacity
          style={styles.mainButton}
          onPress={() => toggleItem(list.id, item.id)}
        >
          <GradientBox style={styles.mainButtonInner}>
            <Ionicons
              name={item.done ? "refresh" : "checkmark"}
              size={20}
              color={colors.white}
            />
            <Text style={styles.mainButtonText}>
              {item.done ? "Mark as not done" : "Mark as done"}
            </Text>
          </GradientBox>
        </TouchableOpacity>

        {/* Edit and delete */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowEdit(true)}
          >
            <Ionicons name="create-outline" size={20} color={colors.text} />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => setShowDelete(true)}
          >
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
            <Text style={[styles.actionText, styles.dangerText]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Popup 1: edit the item */}
      <ItemModal
        visible={showEdit}
        title="Edit item"
        initial={{
          text: item.text,
          dueDate: item.dueDate,
          price: item.price,
          quantity: item.quantity,
        }}
        validate={(text) =>
          list.items.some((i) => i.id !== item.id && sameName(i.text, text))
            ? "This item is already in the list."
            : null
        }
        onSubmit={(input) => editItem(list.id, item.id, input)}
        onClose={() => setShowEdit(false)}
      />

      {/* Popup 2: ask before deleting, then go back to the list */}
      <ConfirmModal
        visible={showDelete}
        title="Delete item?"
        message={`"${item.text}" will be removed from "${list.title}".`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          deleteItem(list.id, item.id);
          router.back();
        }}
        onClose={() => setShowDelete(false)}
      />
    </SafeAreaView>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    content: {
      paddingBottom: 24,
    },
    title: {
      fontSize: 26,
      fontWeight: "700",
      color: colors.text,
    },
    titleDone: {
      textDecorationLine: "line-through",
      color: colors.doneText,
    },
    statusRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 8,
      marginBottom: 16,
    },
    statusLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.mutedText,
    },
    card: {
      backgroundColor: colors.glass,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      borderRadius: 10,
      paddingHorizontal: 16,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      paddingVertical: 14,
    },
    rowLabel: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    rowLabelText: {
      fontSize: 15,
      color: colors.mutedText,
    },
    rowValue: {
      flex: 1,
      textAlign: "right",
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
    },
    notSet: {
      fontWeight: "400",
      color: colors.doneText,
    },
    dangerText: {
      color: colors.danger,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
    },
    mainButton: {
      borderRadius: 10,
      overflow: "hidden", // keep the gradient inside the rounded corners
      marginTop: 20,
    },
    mainButtonInner: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 14,
    },
    mainButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.white,
    },
    actionRow: {
      flexDirection: "row",
      gap: 12,
      marginTop: 12,
    },
    actionButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    deleteButton: {
      borderColor: colors.danger,
    },
    actionText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
    },
    emptyText: {
      textAlign: "center",
      color: colors.mutedText,
      marginTop: 40,
      fontSize: 16,
    },
  });
}
