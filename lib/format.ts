// Shared display formatters — round for display only, keep full precision in
// whatever computed the number in the first place (e.g. the reports API).

export function formatEuro(amount: number): string {
  return `${amount.toLocaleString("sq-AL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`;
}

export function formatPercent(value: number): string {
  return `${value.toLocaleString("sq-AL", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}

export function formatQuantity(value: number): string {
  return value.toLocaleString("sq-AL", { maximumFractionDigits: 3 });
}
