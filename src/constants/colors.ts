// Two color sets: one for light mode and one for dark mode.
// Both use the SAME names, so a component can write colors.card
// without caring which mode is on. Change a value once and the whole app updates.

export const lightColors = {
  background: "#F2F5F7",
  card: "#FFFFFF",
  primary: "#0A66C2",
  gradient: ["#0A66C2", "#378FE9"] as [string, string],
  text: "#1B2A2F",
  mutedText: "#6B7B80",
  doneText: "#9AA8AD",
  border: "#D9E1E4",
  danger: "#C0392B",
  white: "#FFFFFF",
  // Glass look: see-through white with a soft light edge
  glass: "rgba(255, 255, 255, 0.55)",
  glassBorder: "rgba(255, 255, 255, 0.85)",
  // A second color used for the soft shapes behind the glass
  accent: "#7C8CFF",
};

// The "shape" of a color set, so TypeScript warns us if the two sets ever differ
export type ColorPalette = typeof lightColors;

export const darkColors: ColorPalette = {
  background: "#0F1719",
  card: "#182226",
  primary: "#378FE9",
  gradient: ["#004182", "#0A66C2"],
  text: "#E6EEF0",
  mutedText: "#92A3A8",
  doneText: "#5E7077",
  border: "#2B3A3F",
  danger: "#E0584D",
  white: "#FFFFFF",
  // Glass look in dark mode: a faint white tint with a thin light edge
  glass: "rgba(255, 255, 255, 0.08)",
  glassBorder: "rgba(255, 255, 255, 0.18)",
  accent: "#5B4BD6",
};
