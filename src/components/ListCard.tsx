// One list shown on the home screen: title, progress, and a delete button.

import { ColorPalette } from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";
import { List } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  list: List;
  onPress: () => void; // open the list
  onDelete: () => void; // ask to delete the list
};

export default function ListCard({ list, onPress, onDelete }: Props) {
  const { colors } = useTheme(); // the colors for the current mode
  const styles = makeStyles(colors);

  const doneCount = list.items.filter((item) => item.done).length;

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.main} onPress={onPress}>
        <Text style={styles.title}>{list.title}</Text>
        <Text style={styles.subtitle}>
          {doneCount} of {list.items.length} done
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onDelete} hitSlop={10}>
        <Ionicons name="trash-outline" size={22} color={colors.danger} />
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.glass,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      borderRadius: 10,
      padding: 16,
      marginBottom: 10,
    },
    main: {
      flex: 1,
    },
    title: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
    },
    subtitle: {
      fontSize: 14,
      color: colors.mutedText,
      marginTop: 4,
    },
  });
}
