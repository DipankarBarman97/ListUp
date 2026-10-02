// The home screen: shows all your lists. Tap + to create a new one.

import Pagination, { PAGINATION_HEIGHT } from "@/components/Pagination";
import ScreenBackground from "@/components/ScreenBackground";
import { ColorPalette } from "@/constants/colors";
import { useLists } from "@/context/ListsContext";
import { useTheme } from "@/context/ThemeContext";
import { List } from "@/types";
import { sameName } from "@/utils/sameName";
import { Href, useRouter } from "expo-router";
import { useState } from "react";
import { FlatList, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ConfirmModal from "../components/ConfirmModal";
import FloatingButton from "../components/FloatingButton";
import InputModal from "../components/InputModal";
import ListCard from "../components/ListCard";

export default function HomeScreen() {
  const router = useRouter();
  const { lists, addList, deleteList } = useLists();
  const { colors } = useTheme(); // the colors for the current mode
  const styles = makeStyles(colors);

  // Is the "New list" popup open?
  const [showNewList, setShowNewList] = useState(false);

  // Which list is waiting to be deleted? null = no popup
  const [listToDelete, setListToDelete] = useState<List | null>(null);

  // Pagination
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);

  // Keep the page valid, e.g. after deleting the last item on the last page
  const totalPages = Math.max(1, Math.ceil(lists.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageLists = lists.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      <ScreenBackground />
      <FlatList
        data={pageLists}
        keyExtractor={(list) => list.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <ListCard
            list={item}
            onPress={() => router.push(`/list/${item.id}` as Href)}
            onDelete={() => setListToDelete(item)}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No lists yet. Tap the + button to create one.
          </Text>
        }
      />

      {/* Sticks to the bottom, outside the scrolling list */}
      <Pagination
        currentPage={safePage}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      <FloatingButton
        onPress={() => setShowNewList(true)}
        bottomOffset={totalPages > 1 ? PAGINATION_HEIGHT : 0}
      />

      {/* Popup 1: create a list */}
      <InputModal
        visible={showNewList}
        title="New list"
        placeholder="List name"
        confirmLabel="Create"
        validate={(text) =>
          lists.some((l) => sameName(l.title, text))
            ? "A list with this name already exists."
            : null
        }
        onSubmit={addList}
        onClose={() => setShowNewList(false)}
      />

      {/* Popup 2: ask before deleting (open when listToDelete is not null) */}
      <ConfirmModal
        visible={listToDelete !== null}
        title="Delete list?"
        message={
          listToDelete
            ? `"${listToDelete.title}" and its items will be removed.`
            : ""
        }
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (listToDelete) {
            deleteList(listToDelete.id);
          }
        }}
        onClose={() => setListToDelete(null)}
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
    listContent: {
      paddingBottom: 100, // space so the + button never covers the last list
    },
    emptyText: {
      textAlign: "center",
      color: colors.mutedText,
      marginTop: 40,
      fontSize: 16,
    },
  });
}
