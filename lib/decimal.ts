// Accepts Albanian-locale comma decimals ("0,12") as well as dots, so typing
// doesn't silently coerce to NaN before it ever reaches validation. Shared by
// every form field that takes a decimal quantity (parcel area, expense/
// harvest quantity, unit price, amount, revenue).
export function parseLocaleDecimal(value: string): number {
  return Number(value.replace(",", "."));
}
