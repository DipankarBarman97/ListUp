// ONE popup for yes/no questions, e.g. "Delete this list?".
// Looks like InputModal, but has a message instead of a text box.
// The screen decides the wording and what happens on confirm.

import { ColorPalette } from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import GradientBox from "./GradientBox";

type Props = {
  visible: boolean; // true = show the popup
  title: string; // heading, e.g. "Delete list?"
  message: string; // explanation under the heading
  confirmLabel?: string; // text on the main button, e.g. "Delete"
  cancelLabel?: string; // text on the other button
  destructive?: boolean; // true = red main button (for deleting things)
  onConfirm: () => void; // called when the user confirms
  onClose: () => void; // called when the popup should close
};

export default function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onClose,
}: Props) {
  const { colors } = useTheme(); // the colors for the current mode
  const styles = makeStyles(colors);

  function handleConfirm() {
    onConfirm();
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose} // Android back button
    >
      <View style={styles.overlay}>
        {/* Tapping the dark area behind the box closes the popup */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={styles.box}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
            >
              {/* Dangerous actions stay solid red. Everything else gets the gradient. */}
              {destructive ? (
                <View style={[styles.confirmInner, styles.confirmInnerDanger]}>
                  <Text style={styles.confirmText}>{confirmLabel}</Text>
                </View>
              ) : (
                <GradientBox style={styles.confirmInner}>
                  <Text style={styles.confirmText}>{confirmLabel}</Text>
                </GradientBox>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.4)",
      justifyContent: "center",
      padding: 24,
    },
    box: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 20,
    },
    title: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 8,
    },
    message: {
      fontSize: 16,
      color: colors.mutedText,
      lineHeight: 22,
    },
    buttonRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginTop: 20,
    },
    cancelButton: {
      paddingVertical: 10,
      paddingHorizontal: 16,
    },
    cancelText: {
      fontSize: 16,
      color: colors.mutedText,
    },
    confirmButton: {
      borderRadius: 8,
      overflow: "hidden", // keep the gradient inside the rounded corners
      marginLeft: 8,
    },
    confirmInner: {
      paddingVertical: 10,
      paddingHorizontal: 20,
    },
    confirmInnerDanger: {
      backgroundColor: colors.danger,
    },
    confirmText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.white,
    },
  });
}
