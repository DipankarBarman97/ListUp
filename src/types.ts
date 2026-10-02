// The "shape" of our data. TypeScript uses these to warn us about mistakes.

// One thing inside a list, e.g. "Buy milk"
export type Item = {
  id: string;
  text: string;
  done: boolean;
};

// A list, e.g. "Groceries", which holds many items
export type List = {
  id: string;
  title: string;
  items: Item[];
};
