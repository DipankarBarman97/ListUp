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

// The icon shown above the empty message
const EMPTY_ICONS: Record<Filter, keyof typeof Ionicons.glyphMap> = {
  all: "list-outline",
  active: "checkmark-done-outline",
  done: "hourglass-outline",
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

  // Long titles: the header card shows 2 lines. If the title is longer,
  // "Show more" lets the user read all of it.
  const TITLE_COLLAPSED_LINES = 2;
  const [titleExpanded, setTitleExpanded] = useState(false);
  const [titleTooLong, setTitleTooLong] = useState(false);

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
  const hasItems = list.items.length > 0;
  const progressPercent = hasItems
    ? Math.round((doneCount / list.items.length) * 100)
    : 0;

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

      {/* Header card: title, progress, and (if any item has a price) totals */}
      <View style={styles.headerCard}>
        {/* Title with a pencil to rename the list */}
        <View style={styles.titleRow}>
          <View style={styles.titleWrap}>
            {/* Tap the title to show all of it (or fold it back) */}
            <Text
              style={styles.title}
              numberOfLines={titleExpanded ? undefined : TITLE_COLLAPSED_LINES}
              ellipsizeMode="tail"
              onPress={
                titleTooLong ? () => setTitleExpanded((v) => !v) : undefined
              }
            >
              {list.title}
            </Text>

            {/* Invisible copy with NO line limit, only used to count the lines.
                (A Text with numberOfLines only reports the lines it shows, so it
                cannot tell us whether it was cut off.) */}
            <Text
              style={[styles.title, styles.titleMeasure]}
              importantForAccessibility="no-hide-descendants"
              accessibilityElementsHidden
              onTextLayout={(e) =>
                setTitleTooLong(
                  e.nativeEvent.lines.length > TITLE_COLLAPSED_LINES,
                )
              }
            >
              {list.title}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowRename(true)}
            hitSlop={10}
            accessibilityLabel="Rename list"
          >
            <Ionicons name="create-outline" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Only shown when the title is longer than 2 lines */}
        {titleTooLong && (
          <TouchableOpacity
            style={styles.titleToggle}
            onPress={() => setTitleExpanded((v) => !v)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={
              titleExpanded ? "Show less of the title" : "Show full title"
            }
          >
            <Text style={styles.titleToggleText}>
              {titleExpanded ? "Show less" : "Show more"}
            </Text>
            <Ionicons
              name={titleExpanded ? "chevron-up" : "chevron-down"}
              size={14}
              color={colors.primary}
            />
          </TouchableOpacity>
        )}

        {/* Progress, and "Clear completed" when something is checked off */}
        {hasItems && (
          <View style={styles.progressRow}>
            <Text style={styles.progress}>
              {doneCount} of {list.items.length} done
            </Text>
            {doneCount > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setShowClearConfirm(true)}
                hitSlop={10}
              >
                <Ionicons
                  name="trash-outline"
                  size={14}
                  color={colors.danger}
                />
                <Text style={styles.clearText}>Clear completed</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {hasItems && (
          <View style={styles.progressTrack}>
            <View
              style={[styles.progressFill, { width: `${progressPercent}%` }]}
            />
          </View>
        )}
      </View>

      {/* Sort and filter only make sense when the list has items */}
      {hasItems && (
        <>
          <View style={styles.controlsRow}>
            <Text style={styles.sectionLabel}>Items</Text>
            <TouchableOpacity
              style={styles.sortButton}
              onPress={toggleSort}
              hitSlop={10}
              accessibilityLabel="Change sort order"
            >
              <Ionicons name="swap-vertical" size={15} color={colors.primary} />
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
        </>
      )}

      <FlatList
        data={pageItems}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
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
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons
                name={EMPTY_ICONS[filter]}
                size={32}
                color={colors.primary}
              />
            </View>
            <Text style={styles.emptyText}>{EMPTY_MESSAGES[filter]}</Text>
          </View>
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
    // --- Header card ---
    headerCard: {
      backgroundColor: colors.glass,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
    },
    titleWrap: {
      flex: 1,
      marginRight: 12,
    },
    title: {
      fontSize: 20,
      fontWeight: "500",
      color: colors.text,
      marginTop: 3.5,
    },
    // Same width and font as the title, but invisible and out of the layout
    titleMeasure: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      opacity: 0,
      pointerEvents: "none",
    },
    titleToggle: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      gap: 2,
      marginTop: 6,
    },
    titleToggleText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.primary,
    },
    iconButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: `${colors.primary}1F`,
    },
    progressRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 12,
      marginBottom: 8,
    },
    progress: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.mutedText,
    },
    clearButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 999,
      backgroundColor: `${colors.danger}1A`,
    },
    clearText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.danger,
    },
    progressTrack: {
      height: 6,
      borderRadius: 3,
      overflow: "hidden",
      backgroundColor: `${colors.primary}26`,
    },
    progressFill: {
      height: "100%",
      borderRadius: 3,
      backgroundColor: colors.primary,
    },

    // --- Sort row ---
    controlsRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    sectionLabel: {
      fontSize: 13,
      fontWeight: "700",
      letterSpacing: 0.6,
      textTransform: "uppercase",
      color: colors.mutedText,
    },
    sortButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: 999,
      backgroundColor: `${colors.primary}1F`,
    },
    sortText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.primary,
    },

    // --- List and empty state ---
    listContent: {
      paddingBottom: 100, // space so the + button never covers the last item
    },
    emptyState: {
      alignItems: "center",
      marginTop: 48,
      paddingHorizontal: 24,
    },
    emptyIconCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: `${colors.primary}1F`,
    },
    emptyText: {
      textAlign: "center",
      color: colors.mutedText,
      marginTop: 16,
      fontSize: 16,
      lineHeight: 22,
    },
  });
}
