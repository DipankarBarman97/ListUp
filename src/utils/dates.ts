// Small helpers for due dates.
// Dates are stored as plain "YYYY-MM-DD" text (local date), so there are
// no time zone surprises and text comparison works for sorting.

// Date -> "2026-10-02"
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// "2026-10-02" -> Date (local midnight)
export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// True when the due date is before today
export function isOverdue(iso: string): boolean {
  return iso < toISODate(new Date());
}

// "Today", "Tomorrow", or e.g. "12 Oct 2026"
export function formatDueDate(iso: string): string {
  const today = new Date();
  if (iso === toISODate(today)) return "Today";

  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (iso === toISODate(tomorrow)) return "Tomorrow";

  return fromISODate(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
