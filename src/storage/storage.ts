// All the code that talks to AsyncStorage is in this one file.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { List } from "../types";

// The "label" our data is saved under on the phone
const STORAGE_KEY = "listup-lists";

// Read the saved lists. Returns an empty array if nothing was saved yet.
export async function loadLists(): Promise<List[]> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved === null) {
      return [];
    }
    return JSON.parse(saved) as List[]; // text -> array
  } catch (error) {
    console.log("Could not load lists", error);
    return [];
  }
}

// Save the lists to the phone.
export async function saveLists(lists: List[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(lists)); // array -> text
  } catch (error) {
    console.log("Could not save lists", error);
  }
}
