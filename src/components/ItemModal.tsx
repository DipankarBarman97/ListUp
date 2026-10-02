// The popup for adding or editing ONE item.
// The title is required. Due date, price and quantity are OPTIONAL:
// the user taps a chip (Due date / Price / Qty) to add that field,
// and taps it again to remove it.
// InputModal is still used for simple one-box popups (new list, rename list).

import { ColorPalette } from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";
import { ItemInput } from "@/types";
import { formatDueDate, fromISODate, toISODate } from "@/utils/dates";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useRef, useState } from "react";
import {
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import GradientBox from "./GradientBox";

type Props = {
  visible: boolean; // true = show the popup
  title: string; // heading, e.g. "Add item"
  confirmLabel?: string; // text on the main button
  initial?: ItemInput; // values already filled in (used when editing)
  maxLength?: number; // most characters in the name (default 50)
  validate?: (text: string) => string | null; // error message, or null if OK
  onSubmit: (input: ItemInput) => void; // called with everything the user entered
  onClose: () => void; // called when the popup should close
};

// Keep only digits and ONE dot, e.g. "12.5.3a" -> "12.53"
function cleanPrice(value: string): string {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const [whole, ...rest] = cleaned.split(".");
  return rest.length > 0 ? `${whole}.${rest.join("")}` : whole;
}

export default function ItemModal({
  visible,
  title,
  confirmLabel = "Save",
  initial,
  maxLength = 50,
  validate,
  onSubmit,
  onClose,
}: Props) {
  const { colors, isDark } = useTheme(); // the colors for the current mode
  const styles = makeStyles(colors);

  const [text, setText] = useState("");

  // Which optional fields are switched on
  const [hasDate, setHasDate] = useState(false);
  const [hasPrice, setHasPrice] = useState(false);
  const [hasQuantity, setHasQuantity] = useState(false);

  // The values of the optional fields
  const [dueDate, setDueDate] = useState<string | undefined>(undefined);
  const [priceText, setPriceText] = useState("");
  const [quantityText, setQuantityText] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  // true only after the user switches Price / Qty on, so the new box gets focus.
  // (When editing, boxes that were already there must NOT steal focus from the name.)
  const [focusNew, setFocusNew] = useState(false);
  const nameRef = useRef<TextInput>(null);

  // true after the user pressed Save with an empty title,
  // so we can show "Title is required."
  const [triedSave, setTriedSave] = useState(false);

  // Every time the popup opens, put the starting values back.
  // A field is switched on only if the item already has a value for it.
  useEffect(() => {
    if (visible) {
      setText((initial?.text ?? "").slice(0, maxLength));
      setHasDate(initial?.dueDate !== undefined);
      setHasPrice(initial?.price !== undefined);
      setHasQuantity(initial?.quantity !== undefined);
      setDueDate(initial?.dueDate);
      setPriceText(initial?.price !== undefined ? String(initial.price) : "");
      setQuantityText(
        initial?.quantity !== undefined ? String(initial.quantity) : "",
      );
      setShowPicker(false);
      setFocusNew(false);
      setTriedSave(false);

      // autoFocus is unreliable inside an Android Modal, so focus by hand
      const timer = setTimeout(() => nameRef.current?.focus(), 150);
      return () => clearTimeout(timer);
    }
    return undefined;
    // Only run when the popup opens or closes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // ----- Switch the optional fields on / off -----
  // Switching a field off also clears its value.

  function toggleDate() {
    if (hasDate) {
      setHasDate(false);
      setDueDate(undefined);
      setShowPicker(false);
    } else {
      setHasDate(true);
      Keyboard.dismiss(); // so the keyboard does not cover the calendar
      setShowPicker(true); // open the calendar right away
    }
  }

  function togglePrice() {
    if (hasPrice) setPriceText("");
    else setFocusNew(true); // jump to the new box
    setHasPrice(!hasPrice);
  }

  function toggleQuantity() {
    if (hasQuantity) setQuantityText("");
    else setFocusNew(true); // jump to the new box
    setHasQuantity(!hasQuantity);
  }

  // ----- Check everything as the user types -----
  const trimmed = text.trim();
  const price = hasPrice && priceText !== "" ? Number(priceText) : undefined;
  const quantity =
    hasQuantity && quantityText !== "" ? Number(quantityText) : undefined;

  const priceInvalid =
    price !== undefined && (!Number.isFinite(price) || price < 0);
  const quantityInvalid =
    quantity !== undefined && (!Number.isInteger(quantity) || quantity < 1);

  // An empty title only becomes an error after the user tries to save
  const requiredError =
    triedSave && trimmed === "" ? "Title is required." : null;

  const nameError = trimmed === "" ? null : (validate?.(trimmed) ?? null);
  const error =
    nameError ??
    (priceInvalid
      ? "Enter a valid price."
      : quantityInvalid
        ? "Quantity must be 1 or more."
        : null);

  function handleSubmit() {
    if (trimmed === "") {
      setTriedSave(true); // show "Title is required."
      nameRef.current?.focus();
      return;
    }
    if (error !== null) return; // ignore invalid input
    onSubmit({
      text: trimmed,
      dueDate: hasDate ? dueDate : undefined,
      price,
      quantity,
    });
    onClose();
  }

  const isAtLimit = text.length >= maxLength;

  // One small toggle button, e.g. [ Price ]
  function renderChip(
    label: string,
    icon: keyof typeof Ionicons.glyphMap,
    active: boolean,
    onPress: () => void,
  ) {
    return (
      <TouchableOpacity
        style={[styles.chip, active && styles.chipActive]}
        onPress={onPress}
        accessibilityLabel={active ? `Remove ${label}` : `Add ${label}`}
        accessibilityState={{ selected: active }}
      >
        <Ionicons
          name={icon}
          size={16}
          color={active ? colors.white : colors.mutedText}
        />
        <Text style={[styles.chipText, active && styles.chipTextActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  }

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
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Tapping the dark area behind the box closes the popup */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={styles.box}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Text style={styles.title}>{title}</Text>

            {/* Title (required): red * next to the label */}
            <Text style={styles.label}>
              Title <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                (nameError !== null || requiredError !== null) &&
                  styles.inputError,
              ]}
              placeholder="Title"
              placeholderTextColor={colors.mutedText}
              value={text}
              onChangeText={setText}
              onSubmitEditing={handleSubmit}
              maxLength={maxLength}
              ref={nameRef}
            />

            {/* Error message on the left, counter (e.g. "12/50") on the right */}
            <View style={styles.metaRow}>
              <Text style={styles.errorText}>
                {error ?? requiredError ?? ""}
              </Text>
              <Text
                style={[styles.counter, isAtLimit && styles.counterAtLimit]}
              >
                {text.length}/{maxLength}
              </Text>
            </View>

            {/* Choose which extra details to add */}
            <View style={styles.chipRow}>
              {renderChip("Due date", "calendar-outline", hasDate, toggleDate)}
              {renderChip("Price", "pricetag-outline", hasPrice, togglePrice)}
              {renderChip("Qty", "cube-outline", hasQuantity, toggleQuantity)}
            </View>

            {/* Price and quantity, only the ones switched on */}
            {(hasPrice || hasQuantity) && (
              <View style={styles.pairRow}>
                {hasPrice && (
                  <TextInput
                    style={[
                      styles.input,
                      styles.priceInput,
                      priceInvalid && styles.inputError,
                    ]}
                    placeholder="Price"
                    placeholderTextColor={colors.mutedText}
                    value={priceText}
                    onChangeText={(value) => setPriceText(cleanPrice(value))}
                    keyboardType="decimal-pad"
                    autoFocus={focusNew}
                    maxLength={10}
                  />
                )}
                {hasQuantity && (
                  <TextInput
                    style={[
                      styles.input,
                      styles.quantityInput,
                      quantityInvalid && styles.inputError,
                    ]}
                    placeholder="Qty"
                    placeholderTextColor={colors.mutedText}
                    value={quantityText}
                    onChangeText={(value) =>
                      setQuantityText(value.replace(/[^0-9]/g, ""))
                    }
                    keyboardType="number-pad"
                    autoFocus={focusNew}
                    maxLength={4}
                  />
                )}
              </View>
            )}

            {/* Due date: tap to open the calendar */}
            {hasDate && (
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => {
                  Keyboard.dismiss();
                  setShowPicker((open) => !open);
                }}
                accessibilityLabel="Pick due date"
              >
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={colors.mutedText}
                />
                <Text
                  style={[
                    styles.dateText,
                    dueDate === undefined && styles.datePlaceholder,
                  ]}
                >
                  {dueDate !== undefined
                    ? formatDueDate(dueDate)
                    : "Pick a date"}
                </Text>
              </TouchableOpacity>
            )}

            {hasDate && showPicker && (
              <DateTimePicker
                value={dueDate ? fromISODate(dueDate) : new Date()}
                mode="date"
                themeVariant={isDark ? "dark" : "light"}
                onChange={(event, date) => {
                  // Android shows the picker as its own dialog, so close it after
                  if (Platform.OS === "android") setShowPicker(false);
                  if (event.type === "set" && date) {
                    setDueDate(toISODate(date));
                  }
                }}
              />
            )}

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
          </ScrollView>
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
      paddingHorizontal: 24,
      paddingVertical: 16,
    },
    box: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 20,
      flexShrink: 1, // shrink (and scroll) when the keyboard takes space
    },
    title: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 14,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.mutedText,
      marginBottom: 6,
    },
    required: {
      color: colors.danger,
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
      marginBottom: 6,
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
    chipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 4,
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    chipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chipText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.mutedText,
    },
    chipTextActive: {
      color: colors.white,
    },
    pairRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 10,
    },
    priceInput: {
      flex: 2,
    },
    quantityInput: {
      flex: 1,
    },
    dateButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginTop: 10,
    },
    dateText: {
      fontSize: 16,
      color: colors.text,
    },
    datePlaceholder: {
      color: colors.mutedText,
    },
    buttonRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginTop: 16,
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
