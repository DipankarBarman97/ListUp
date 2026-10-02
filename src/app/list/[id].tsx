// The details screen for ONE list. The [id] in the file name means the
// screen receives an "id" from the URL, so it knows which list to show.
// All typing (add item, edit item, rename list) happens in the shared InputModal.

import ConfirmModal from "@/components/ConfirmModal";
import FilterTabs from "@/components/FilterTabs";
import Pagination, { PAGINATION_HEIGHT } from "@/components/Pagination";
import ScreenBackground from "@/components/ScreenBackground";
import { ColorPalette } from "@/constants/colors";
import { useLists } from "@/context/ListsContext";
import { useTheme } from "@/context/ThemeContext";
import { Item } from "@/types";
import { sameName } from "@/utiles/sameName";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams } from "expo-router";
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

// The message shown when the selected tab has nothing in it
const EMPTY_MESSAGES: Record<Filter, string> = {
  all: "This list is empty. Tap the + button to add your first item.",
  active: "No active items. Everything is done.",
  done: "Nothing completed yet.",
};

export default function ListScreen() {
  // Get the id from the route, then find that list
  const { id } = useLocalSearchParams<{ id: string }>();
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

  // Which tab is selected
  const [filter, setFilter] = useState<Filter>("all");

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

  // Only the items that match the selected tab
  const filteredItems = list.items.filter((item) => {
    if (filter === "done") return item.done;
    if (filter === "active") return !item.done;
    return true;
  });

  // Keep the page valid, e.g. after deleting the last item on the last page
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filteredItems.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  // Changing tabs always starts again from page 1
  const changeFilter = (next: Filter) => {
    setFilter(next);
    setPage(1);
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      <ScreenBackground />
      {/* Show the list title in the top bar */}
      <Stack.Screen options={{ title: list.title }} />

      {/* Title with a pencil to rename the list */}
      <View style={styles.titleRow}>
        <Text style={styles.title}>{list.title}</Text>
        <TouchableOpacity onPress={() => setShowRename(true)} hitSlop={10}>
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
      <InputModal
        visible={showAddItem}
        title="Add item"
        placeholder="Item name"
        confirmLabel="Add"
        validate={(text) =>
          list.items.some((i) => sameName(i.text, text))
            ? "This item is already in the list."
            : null
        }
        onSubmit={(text) => addItem(list.id, text)}
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
      <InputModal
        visible={editingItem !== null}
        title="Edit item"
        initialValue={editingItem ? editingItem.text : ""}
        validate={(text) =>
          list.items.some(
            (i) => i.id !== editingItem?.id && sameName(i.text, text),
          )
            ? "This item is already in the list."
            : null
        }
        onSubmit={(text) => {
          if (editingItem) {
            editItem(list.id, editingItem.id, text);
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
      marginBottom: 12,
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
