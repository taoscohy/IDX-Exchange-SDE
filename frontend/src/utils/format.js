const numberFormat = new Intl.NumberFormat("en-US");
export const priceFormat = new Intl.NumberFormat("en-US", {
  style: "currency", currency: "USD", maximumFractionDigits: 0
});

export function formatNumber(value, formatter = numberFormat) {
  if ((typeof value !== "string" && typeof value !== "number") ||
      String(value).trim() === "" || !Number.isFinite(Number(value)) || Number(value) < 0) return null;
  return formatter.format(Number(value));
}
