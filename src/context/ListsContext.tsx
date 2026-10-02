// This file keeps ALL our lists in one place and shares them with every screen.
// Any screen can call useLists() to read the lists or change them.

import { loadLists, saveLists } from "@/storage/storage";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { List } from "../types";

// Describes everything the context gives to the screens
type ListsContextType = {
  lists: List[];
  addList: (title: string) => void;
  deleteList: (listId: string) => void;
  renameList: (listId: string, title: string) => void;
  addItem: (listId: string, text: string) => void;
  toggleItem: (listId: string, itemId: string) => void;
  editItem: (listId: string, itemId: string, text: string) => void;
  deleteItem: (listId: string, itemId: string) => void;
  clearCompleted: (listId: string) => void;
};

const ListsContext = createContext<ListsContextType | null>(null);

// A simple way to make a unique id
function createId(): string {
  return Date.now().toString() + Math.random().toString(36).slice(2, 6);
}

export function ListsProvider({ children }: { children: ReactNode }) {
  const [lists, setLists] = useState<List[]>([]);
  // We only start saving AFTER the first load finishes.
  // Otherwise the empty starting list could overwrite our saved data.
  const [isLoaded, setIsLoaded] = useState(false);

  // LOAD once when the app opens
  useEffect(() => {
    loadLists().then((saved) => {
      setLists(saved);
      setIsLoaded(true);
    });
  }, []);

  // SAVE every time the lists change
  useEffect(() => {
    if (isLoaded) {
      saveLists(lists);
    }
  }, [lists, isLoaded]);

  // Helper: change ONE list and leave the others untouched
  function updateList(listId: string, change: (list: List) => List) {
    setLists((current) =>
      current.map((list) => (list.id === listId ? change(list) : list)),
    );
  }

  // ----- Functions for lists -----

  function addList(title: string) {
    const newList: List = { id: createId(), title, items: [] };
    setLists((current) => [...current, newList]);
  }

  function deleteList(listId: string) {
    setLists((current) => current.filter((list) => list.id !== listId));
  }

  function renameList(listId: string, title: string) {
    updateList(listId, (list) => ({ ...list, title }));
  }

  // ----- Functions for items inside a list -----

  function addItem(listId: string, text: string) {
    updateList(listId, (list) => ({
      ...list,
      items: [...list.items, { id: createId(), text, done: false }],
    }));
  }

  function toggleItem(listId: string, itemId: string) {
    updateList(listId, (list) => ({
      ...list,
      items: list.items.map((item) =>
        item.id === itemId ? { ...item, done: !item.done } : item,
      ),
    }));
  }

  function editItem(listId: string, itemId: string, text: string) {
    updateList(listId, (list) => ({
      ...list,
      items: list.items.map((item) =>
        item.id === itemId ? { ...item, text } : item,
      ),
    }));
  }

  function deleteItem(listId: string, itemId: string) {
    updateList(listId, (list) => ({
      ...list,
      items: list.items.filter((item) => item.id !== itemId),
    }));
  }

  function clearCompleted(listId: string) {
    updateList(listId, (list) => ({
      ...list,
      items: list.items.filter((item) => !item.done),
    }));
  }

  const value: ListsContextType = {
    lists,
    addList,
    deleteList,
    renameList,
    addItem,
    toggleItem,
    editItem,
    deleteItem,
    clearCompleted,
  };

  return (
    <ListsContext.Provider value={value}>{children}</ListsContext.Provider>
  );
}

// The hook screens use to get the lists and functions
export function useLists(): ListsContextType {
  const context = useContext(ListsContext);
  if (context === null) {
    throw new Error("useLists must be used inside <ListsProvider>");
  }
  return context;
}
