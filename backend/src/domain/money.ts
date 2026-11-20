import { Decimal } from "decimal.js";

Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

export function money(value: string | number | Decimal): string {
  return new Decimal(value).toDecimalPlaces(2).toFixed(2);
}

export function add(a: string, b: string): string {
  return money(new Decimal(a).plus(b));
}

export function subtract(a: string, b: string): string {
  return money(new Decimal(a).minus(b));
}
