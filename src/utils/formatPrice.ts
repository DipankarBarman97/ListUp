// Helpers for prices. To change the currency, edit CURRENCY and LOCALE below.

import { Item } from "../types";

const CURRENCY = "INR";
const LOCALE = "en-IN";

// 1240 -> "₹1,240.00"
export function formatPrice(value: number): string {
  try {
    return new Intl.NumberFormat(LOCALE, {
      style: "currency",
      currency: CURRENCY,
    }).format(value);
  } catch {
    // Fallback if Intl is not available on the device
    return `₹${value.toFixed(2)}`;
  }
}

// Price x quantity for one item. Items without a price count as 0.
export function itemTotal(item: Item): number {
  if (item.price === undefined) return 0;
  return item.price * (item.quantity ?? 1);
}
