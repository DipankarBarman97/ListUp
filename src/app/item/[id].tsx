// The details page for ONE item. It opens when you tap an item in a list.
// Shows everything about the item (full name, due date, price, quantity, total).
// A checkbox marks it done, and the "Actions" dropdown lets you edit or delete it.
// The [id] in the file name is the item's id, taken from the URL.

import ActionMenu, { MenuAction } from "@/components/ActionMenu";
import ConfirmModal from "@/components/ConfirmModal";
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
  Pressable,
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

  // Which popup is open? And is the Actions dropdown open?
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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

  // What the Actions dropdown offers
  const actions: MenuAction[] = [
    {
      label: "Edit",
      icon: "create-outline",
      onPress: () => setShowEdit(true),
    },
    {
      label: "Delete",
      icon: "trash-outline",
      onPress: () => setShowDelete(true),
      destructive: true,
    },
  ];

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
          <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
            <Ionicons
              name={icon}
              size={16}
              color={danger ? colors.danger : colors.primary}
            />
          </View>
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
        {/* Header: checkbox, full name (wraps over as many lines as it needs)
            and the Actions dropdown. It sits above the layer below so the
            open menu stays tappable. */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => toggleItem(list.id, item.id)}
            hitSlop={10}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: item.done }}
            accessibilityLabel={item.done ? "Mark as not done" : "Mark as done"}
          >
            <Ionicons
              name={item.done ? "checkmark-circle" : "ellipse-outline"}
              size={26}
              color={item.done ? colors.primary : colors.mutedText}
            />
          </TouchableOpacity>

          <Text style={[styles.title, item.done && styles.titleDone]}>
            {item.text}
          </Text>

          <ActionMenu
            open={menuOpen}
            onToggle={() => setMenuOpen((open) => !open)}
            onClose={() => setMenuOpen(false)}
            actions={actions}
          />
        </View>

        {/* Tap anywhere outside the dropdown to close it */}
        {menuOpen && (
          <Pressable
            style={styles.backdrop}
            onPress={() => setMenuOpen(false)}
            accessibilityLabel="Close menu"
          />
        )}

        {/* Details card */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>Details</Text>
          {overdue && (
            <View style={[styles.badge, styles.badgeDanger]}>
              <Ionicons name="alert-circle" size={14} color={colors.danger} />
              <Text style={[styles.badgeText, styles.dangerText]}>Overdue</Text>
            </View>
          )}
        </View>
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
      paddingTop: 16,
    },

    // flexGrow lets the dim layer below cover the whole screen, even when
    // the content is short
    content: {
      flexGrow: 1,
      paddingBottom: 24,
    },

    // --- Header and dropdown layering (header > backdrop > rest of content) ---
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      marginBottom: 20,
      zIndex: 20,
      elevation: 20,
    },
    checkbox: {
      marginTop: 3.5, // lines the box up with the first line of the title
    },
    title: {
      marginTop: 3.5,
      flex: 1,
      fontSize: 20,
      fontWeight: "600",
      lineHeight: 28,
      color: colors.text,
    },
    titleDone: {
      textDecorationLine: "line-through",
      color: colors.doneText,
    },
    backdrop: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      zIndex: 10,
      elevation: 10,
    },

    // --- Details ---
    sectionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      marginBottom: 10,
    },
    badge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingVertical: 5,
      paddingHorizontal: 12,
      borderRadius: 999,
    },
    badgeDanger: {
      backgroundColor: `${colors.danger}1A`,
    },
    badgeText: {
      fontSize: 13,
      fontWeight: "600",
    },
    sectionLabel: {
      fontSize: 13,
      fontWeight: "700",
      letterSpacing: 0.6,
      textTransform: "uppercase",
      color: colors.mutedText,
    },
    card: {
      backgroundColor: colors.glass,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      borderRadius: 14,
      paddingHorizontal: 16,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      paddingVertical: 12,
    },
    rowLabel: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    rowIcon: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: `${colors.primary}1F`,
    },
    rowIconDanger: {
      backgroundColor: `${colors.danger}1A`,
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
    emptyText: {
      textAlign: "center",
      color: colors.mutedText,
      marginTop: 40,
      fontSize: 16,
    },
  });
}
