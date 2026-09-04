const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const inrPrecise = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

export function formatCurrency(value?: number | null, precise = false) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return precise ? inrPrecise.format(value) : inr.format(value);
}

export function formatPct(value?: number | null, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${value > 0 ? "+" : ""}${value.toFixed(digits)}%`;
}

export function formatNumber(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 4 }).format(value);
}

export const ASSET_TYPE_LABELS: Record<string, string> = {
  stock: "Stocks",
  mf: "Mutual funds",
  gold: "Gold",
  debt: "Debt",
};

/** Accepts either a {label: value} map or an array of slices from the API. */
export function toSlices(
  input?: Record<string, number> | { label: string; value: number }[] | null,
): { label: string; value: number }[] {
  if (!input) return [];
  if (Array.isArray(input)) return input.filter((s) => Number(s.value) > 0);
  return Object.entries(input)
    .map(([label, value]) => ({ label, value: Number(value) }))
    .filter((s) => s.value > 0);
}
