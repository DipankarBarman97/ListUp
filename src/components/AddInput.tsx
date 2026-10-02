// A "+" button that opens the common InputModal.
// When the user taps Add in the popup, onAdd receives the typed text.
// Used on both screens: "New list" on Home, "Add item" on the list screen.

import { useState } from "react";
import FloatingButton from "./FloatingButton";
import InputModal from "./InputModal";

type Props = {
  title: string; // popup heading, e.g. "New list"
  placeholder: string; // gray hint text inside the popup's text box
  validate?: (text: string) => string | null;
  onAdd: (text: string) => void; // called with the typed text
};

export default function AddInput({
  title,
  placeholder,
  validate,
  onAdd,
}: Props) {
  // Is the popup open?
  const [visible, setVisible] = useState(false);

  return (
    <>
      <FloatingButton onPress={() => setVisible(true)} />

      <InputModal
        visible={visible}
        title={title}
        placeholder={placeholder}
        confirmLabel="Add"
        validate={validate}
        onSubmit={onAdd}
        onClose={() => setVisible(false)}
      />
    </>
  );
}
