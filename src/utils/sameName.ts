// True when two names are the same, ignoring capital letters and extra spaces.
// "Milk", "milk" and " MILK " all count as the same name.

export function sameName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}
