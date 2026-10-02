// The "shape" of our data. TypeScript uses these to warn us about mistakes.

// One thing inside a list, e.g. "Buy milk"
// dueDate, price and quantity are optional, so items saved before
// these fields existed still load without problems.
export type Item = {
  id: string;
  text: string;
  done: boolean;
  dueDate?: string; // "YYYY-MM-DD" (local date)
  price?: number; // price of ONE unit
  quantity?: number; // how many units (missing = 1)
};

// What the item popup gives back when the user saves
export type ItemInput = {
  text: string;
  dueDate?: string;
  price?: number;
  quantity?: number;
};

// A list, e.g. "Groceries", which holds many items
export type List = {
  id: string;
  title: string;
  items: Item[];
};
