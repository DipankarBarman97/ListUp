// ONE popup with a text box, used everywhere we need the user to type something:
// new list, new item, edit item, rename list.
// The screen decides the title, the starting text and what happens on Save.
// The screen can also pass a validate function (for example, to block duplicate
// names). If it returns a message, the message is shown and Save is blocked.

import { ColorPalette } from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import GradientBox from "./GradientBox";

type Props = {
  visible: boolean; // true = show the popup
  title: string; // heading, e.g. "New list"
  placeholder?: string; // gray hint text in the box
  initialValue?: string; // text already in the box (used when editing)
  confirmLabel?: string; // text on the main button, e.g. "Add" or "Save"
  maxLength?: number; // most characters the user can type (default 50)
  validate?: (text: string) => string | null; // error message, or null if OK
  onSubmit: (text: string) => void; // called with the typed text
  onClose: () => void; // called when the popup should close
};

export default function InputModal({
  visible,
  title,
  placeholder = "",
  initialValue = "",
  confirmLabel = "Save",
  maxLength = 50,
  validate,
  onSubmit,
  onClose,
}: Props) {
  const { colors } = useTheme(); // the colors for the current mode
  const styles = makeStyles(colors);

  const [text, setText] = useState(initialValue);

  // Every time the popup opens, put the starting text back in the box
  useEffect(() => {
    if (visible) {
      setText(initialValue.slice(0, maxLength));
    }
  }, [visible, initialValue, maxLength]);

  // Check the text as the user types. Empty text is not an error here:
  // it is simply ignored when they press the main button.
  const trimmed = text.trim();
  const error = trimmed === "" ? null : (validate?.(trimmed) ?? null);

  function handleSubmit() {
    if (trimmed === "" || error !== null) return; // ignore empty or invalid input
    onSubmit(trimmed);
    onClose();
  }

  const isAtLimit = text.length >= maxLength;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose} // Android back button
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Tapping the dark area behind the box closes the popup */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={styles.box}>
          <Text style={styles.title}>{title}</Text>

          <TextInput
            style={[styles.input, error !== null && styles.inputError]}
            placeholder={placeholder}
            placeholderTextColor={colors.mutedText}
            value={text}
            onChangeText={setText}
            onSubmitEditing={handleSubmit}
            maxLength={maxLength}
            autoFocus
          />

          {/* Error message on the left, counter (e.g. "12/50") on the right */}
          <View style={styles.metaRow}>
            <Text style={styles.errorText}>{error ?? ""}</Text>
            <Text style={[styles.counter, isAtLimit && styles.counterAtLimit]}>
              {text.length}/{maxLength}
            </Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            {/* Main button: gradient inside a rounded, clipped wrapper */}
            <TouchableOpacity
              style={[
                styles.confirmButton,
                error !== null && styles.confirmDisabled,
              ]}
              onPress={handleSubmit}
              disabled={error !== null}
            >
              <GradientBox style={styles.confirmInner}>
                <Text style={styles.confirmText}>{confirmLabel}</Text>
              </GradientBox>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
      marginBottom: 14,
    },
    input: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      color: colors.text,
    },
    inputError: {
      borderColor: colors.danger,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      marginTop: 6,
    },
    errorText: {
      flex: 1,
      fontSize: 13,
      color: colors.danger,
      marginRight: 12,
    },
    counter: {
      fontSize: 13,
      color: colors.mutedText,
    },
    counterAtLimit: {
      color: colors.danger,
    },
    buttonRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginTop: 12,
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
    confirmDisabled: {
      opacity: 0.5,
    },
    confirmInner: {
      paddingVertical: 10,
      paddingHorizontal: 20,
    },
    confirmText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.white,
    },
  });
}
