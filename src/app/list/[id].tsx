// The details screen for ONE list. The [id] in the file name means the
// screen receives an "id" from the URL, so it knows which list to show.
// Adding and editing an item happens in ItemModal (name, due date, price, qty).
// Creating and renaming use the simple InputModal.

import ConfirmModal from "@/components/ConfirmModal";
import FilterTabs from "@/components/FilterTabs";
import ItemModal from "@/components/ItemModal";
import Pagination, { PAGINATION_HEIGHT } from "@/components/Pagination";
import ScreenBackground from "@/components/ScreenBackground";
import { ColorPalette } from "@/constants/colors";
import { useLists } from "@/context/ListsContext";
import { useTheme } from "@/context/ThemeContext";
import { Item } from "@/types";
import { formatPrice, itemTotal } from "@/utils/formatPrice";
import { sameName } from "@/utils/sameName";
import { Ionicons } from "@expo/vector-icons";
import { Href, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FloatingButton from "../../components/FloatingButton";
import InputModal from "../../components/InputModal";
import ListItem from "../../components/ListItem";

// Which items the list is showing
type Filter = "all" | "active" | "done";

// How the items are ordered: as added, or by due date
type Sort = "manual" | "due";

// The message shown when the selected tab has nothing in it
const EMPTY_MESSAGES: Record<Filter, string> = {
  all: "This list is empty. Tap the + button to add your first item.",
  active: "No active items. Everything is done.",
  done: "Nothing completed yet.",
};

export default function ListScreen() {
  // Get the id from the route, then find that list
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    lists,
    renameList,
    addItem,
    toggleItem,
    editItem,
    deleteItem,
    clearCompleted,
  } = useLists();
  const { colors } = useTheme(); // the colors for the current mode
  const styles = makeStyles(colors);

  const list = lists.find((l) => l.id === id);

  // Which popup is open?
  const [showAddItem, setShowAddItem] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null); // null = closed

  // Which tab is selected, and how items are ordered
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("manual");

  // Pagination
  const PAGE_SIZE = 15;
  const [page, setPage] = useState(1);

  // The list may not exist (for example, if it was deleted)
  if (!list) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.emptyText}>This list could not be found.</Text>
      </SafeAreaView>
    );
  }

  const doneCount = list.items.filter((item) => item.done).length;
  const activeCount = list.items.length - doneCount;

  // Price totals: everything, and only the items not checked off yet
  const hasPrices = list.items.some((item) => item.price !== undefined);
  const total = list.items.reduce((sum, item) => sum + itemTotal(item), 0);
  const remaining = list.items
    .filter((item) => !item.done)
    .reduce((sum, item) => sum + itemTotal(item), 0);

  // Only the items that match the selected tab
  const filteredItems = list.items.filter((item) => {
    if (filter === "done") return item.done;
    if (filter === "active") return !item.done;
    return true;
  });

  // "Due date" sort: earliest first, items without a date go last
  const sortedItems =
    sort === "due"
      ? [...filteredItems].sort((a, b) => {
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.localeCompare(b.dueDate);
        })
      : filteredItems;

  // Keep the page valid, e.g. after deleting the last item on the last page
  const totalPages = Math.max(1, Math.ceil(sortedItems.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = sortedItems.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  // Changing tabs or sort always starts again from page 1
  const changeFilter = (next: Filter) => {
    setFilter(next);
    setPage(1);
  };
  const toggleSort = () => {
    setSort((current) => (current === "manual" ? "due" : "manual"));
    setPage(1);
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      <ScreenBackground />
      {/* Show the list title in the top bar */}
      <Stack.Screen options={{ title: list.title }} />

      {/* Title with a pencil to rename the list */}
      <View style={styles.titleRow}>
        <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
          {list.title}
        </Text>
        <TouchableOpacity
          onPress={() => setShowRename(true)}
          hitSlop={10}
          accessibilityLabel="Rename list"
        >
          <Ionicons name="create-outline" size={22} color={colors.mutedText} />
        </TouchableOpacity>
      </View>

      {/* Progress, and "Clear completed" when something is checked off */}
      <View style={styles.progressRow}>
        <Text style={styles.progress}>
          {doneCount} of {list.items.length} done
        </Text>
        {doneCount > 0 && (
          <TouchableOpacity
            onPress={() => setShowClearConfirm(true)}
            hitSlop={10}
          >
            <Text style={styles.clearText}>Clear completed</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Totals on the left (only if some item has a price), sort button on the right */}
      <View style={styles.infoRow}>
        {hasPrices && (
          <Text style={styles.totals}>
            Total {formatPrice(total)} · Left {formatPrice(remaining)}
          </Text>
        )}
        <TouchableOpacity
          style={styles.sortButton}
          onPress={toggleSort}
          hitSlop={10}
          accessibilityLabel="Change sort order"
        >
          <Ionicons name="swap-vertical" size={16} color={colors.primary} />
          <Text style={styles.sortText}>
            {sort === "due" ? "Due date" : "Manual"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tabs: All / Active / Done */}
      <FilterTabs
        tabs={[
          { key: "all", label: "All", count: list.items.length },
          { key: "active", label: "Active", count: activeCount },
          { key: "done", label: "Done", count: doneCount },
        ]}
        value={filter}
        onChange={changeFilter}
      />

      <FlatList
        data={pageItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <ListItem
            item={item}
            onPress={() => router.push(`/item/${item.id}` as Href)}
            onToggle={() => toggleItem(list.id, item.id)}
            onEdit={() => setEditingItem(item)}
            onDelete={() => deleteItem(list.id, item.id)}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>{EMPTY_MESSAGES[filter]}</Text>
        }
      />

      {/* Sticks to the bottom, outside the scrolling list */}
      <Pagination
        currentPage={safePage}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      <FloatingButton
        onPress={() => setShowAddItem(true)}
        bottomOffset={totalPages > 1 ? PAGINATION_HEIGHT : 0}
      />

      {/* Popup 1: add an item */}
      <ItemModal
        visible={showAddItem}
        title="Add item"
        confirmLabel="Add"
        validate={(text) =>
          list.items.some((i) => sameName(i.text, text))
            ? "This item is already in the list."
            : null
        }
        onSubmit={(input) => addItem(list.id, input)}
        onClose={() => setShowAddItem(false)}
      />

      {/* Popup 2: rename the list */}
      <InputModal
        visible={showRename}
        title="Rename list"
        initialValue={list.title}
        validate={(text) =>
          lists.some((l) => l.id !== list.id && sameName(l.title, text))
            ? "A list with this name already exists."
            : null
        }
        onSubmit={(text) => renameList(list.id, text)}
        onClose={() => setShowRename(false)}
      />

      {/* Popup 3: edit an item (open when editingItem is not null) */}
      <ItemModal
        visible={editingItem !== null}
        title="Edit item"
        initial={
          editingItem
            ? {
                text: editingItem.text,
                dueDate: editingItem.dueDate,
                price: editingItem.price,
                quantity: editingItem.quantity,
              }
            : undefined
        }
        validate={(text) =>
          list.items.some(
            (i) => i.id !== editingItem?.id && sameName(i.text, text),
          )
            ? "This item is already in the list."
            : null
        }
        onSubmit={(input) => {
          if (editingItem) {
            editItem(list.id, editingItem.id, input);
          }
        }}
        onClose={() => setEditingItem(null)}
      />

      {/* Popup 4: ask before clearing the completed items */}
      <ConfirmModal
        visible={showClearConfirm}
        title="Clear completed?"
        message={`${doneCount} completed ${
          doneCount === 1 ? "item" : "items"
        } will be removed from "${list.title}".`}
        confirmLabel="Clear"
        destructive
        onConfirm={() => {
          clearCompleted(list.id);
          setShowClearConfirm(false);
        }}
        onClose={() => setShowClearConfirm(false)}
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
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    title: {
      flex: 1,
      fontSize: 26,
      fontWeight: "700",
      color: colors.text,
      marginRight: 12,
    },
    progressRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 4,
      marginBottom: 8,
    },
    progress: {
      fontSize: 14,
      color: colors.mutedText,
    },
    clearText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.danger,
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    totals: {
      flex: 1,
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginRight: 12,
    },
    sortButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginLeft: "auto",
    },
    sortText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.primary,
    },
    listContent: {
      paddingBottom: 100, // space so the + button never covers the last item
    },
    emptyText: {
      textAlign: "center",
      color: colors.mutedText,
      marginTop: 40,
      fontSize: 16,
    },
  });
}
